import * as vscode from 'vscode';
import * as path from 'path';
import ignore from 'ignore';
import { SearchResult } from '../shared/messages';

async function findMatchingEntriesRecursive(
  dirUri: vscode.Uri,
  term: string,
  matchCase: boolean,
  foundFolders: { relativePath: string; fullPath: string }[],
  foundFiles: { relativePath: string; fullPath: string }[],
  ig: ReturnType<typeof ignore>
): Promise<void> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(dirUri);
  if (!workspaceFolder) {
    return;
  }
  const relativePathForExclusion = path.relative(workspaceFolder.uri.fsPath, dirUri.fsPath);

  if (relativePathForExclusion && ig.ignores(relativePathForExclusion)) {
    return;
  }

  let entries: [string, vscode.FileType][] = [];
  try {
    entries = await vscode.workspace.fs.readDirectory(dirUri);
  } catch (e) {
    return;
  }

  for (const [name, type] of entries) {
    const entryUri = vscode.Uri.joinPath(dirUri, name);
    const relativePath = vscode.workspace.asRelativePath(entryUri, false);

    if (ig.ignores(relativePath)) {
      continue;
    }

    const nameToCheck = matchCase ? name : name.toLowerCase();
    const termToCheck = matchCase ? term : term.toLowerCase();
    const nameMatches = nameToCheck.includes(termToCheck);

    if (type === vscode.FileType.Directory) {
      if (nameMatches) {
        foundFolders.push({ relativePath, fullPath: entryUri.fsPath });
      }
      await findMatchingEntriesRecursive(entryUri, term, matchCase, foundFolders, foundFiles, ig);
    } else if (type === vscode.FileType.File) {
      if (nameMatches) {
        foundFiles.push({ relativePath, fullPath: entryUri.fsPath });
      }
    }
  }
}

export async function performWorkspaceSearch(
  term: string,
  matchCase: boolean,
  additionalExclude: string[] = [],
  isFullPathEnabled = false
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    results.push({
      type: 'file',
      displayPath: 'No workspace open.',
      relativePath: '',
      fullPath: '',
      isOutside: false,
    });
    return results;
  }

  if (!term) {
    return [];
  }

  const foundFoldersPaths: { relativePath: string; fullPath: string }[] = [];
  const foundFilesPaths: { relativePath: string; fullPath: string }[] = [];
  const baseExclude = ['**/node_modules/**', '**/.git/**'];
  const excludePatterns = [...baseExclude, ...additionalExclude];
  const ig = ignore().add(excludePatterns);

  try {
    for (const folder of vscode.workspace.workspaceFolders) {
      await findMatchingEntriesRecursive(
        folder.uri,
        term,
        matchCase,
        foundFoldersPaths,
        foundFilesPaths,
        ig
      );
    }

    foundFoldersPaths.forEach(({ relativePath, fullPath }) => {
      results.push({
        type: 'folder',
        displayPath: isFullPathEnabled ? fullPath : `${relativePath.replace(/\\/g, '/')}`,
        relativePath: relativePath,
        fullPath: fullPath,
      });
    });

    foundFilesPaths.forEach(({ relativePath, fullPath }) => {
      const isOutside = !foundFoldersPaths.some(
        (folder) =>
          relativePath.startsWith(folder.relativePath + path.sep) ||
          relativePath.startsWith(folder.relativePath + '/')
      );
      results.push({
        type: 'file',
        displayPath: isFullPathEnabled ? fullPath : `${relativePath.replace(/\\/g, '/')}`,
        relativePath: relativePath,
        fullPath: fullPath,
        isOutside: isOutside,
      });
    });

    results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.displayPath.localeCompare(b.displayPath);
    });

    if (results.length === 0) {
      results.push({
        type: 'file',
        displayPath: 'No matching files or folders found.',
        relativePath: '',
        fullPath: '',
        isOutside: false,
      });
    }

    return results;
  } catch (error: any) {
    console.error('Error during file search:', error);
    vscode.window.showErrorMessage(`Error searching files: ${error.message}`);
    return [
      {
        type: 'file',
        displayPath: 'Error during search.',
        relativePath: '',
        fullPath: '',
        isOutside: false,
      },
    ];
  }
}
