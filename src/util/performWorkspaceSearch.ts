import * as vscode from 'vscode';
import * as path from 'path';
import { SearchResult } from '../shared/messages';

async function findMatchingEntriesRecursive(
  dirUri: vscode.Uri,
  term: string,
  matchCase: boolean,
  foundFolders: string[],
  foundFiles: string[],
  excludePatterns: string[]
): Promise<void> {
  const relativePathForExclusion = vscode.workspace.asRelativePath(dirUri, true);
  if (excludePatterns.some((pattern) => simpleGlobMatch(relativePathForExclusion, pattern))) {
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

    const relativePathForExclusionCheck = vscode.workspace.asRelativePath(entryUri, true);
    if (
      excludePatterns.some((pattern) => simpleGlobMatch(relativePathForExclusionCheck, pattern))
    ) {
      continue;
    }

    const nameToCheck = matchCase ? name : name.toLowerCase();
    const termToCheck = matchCase ? term : term.toLowerCase();
    const nameMatches = nameToCheck.includes(termToCheck);

    if (type === vscode.FileType.Directory) {
      if (nameMatches) {
        foundFolders.push(relativePath);
      }
      await findMatchingEntriesRecursive(
        entryUri,
        term,
        matchCase,
        foundFolders,
        foundFiles,
        excludePatterns
      );
    } else if (type === vscode.FileType.File) {
      if (nameMatches) {
        foundFiles.push(relativePath);
      }
    }
  }
}

function simpleGlobMatch(pathStr: string, pattern: string): boolean {
  if (pattern.startsWith('**/') && pattern.endsWith('/**')) {
    const dirName = pattern.substring(3, pattern.length - 3);
    return (
      pathStr.includes(`/${dirName}/`) ||
      pathStr.startsWith(`${dirName}/`) ||
      pathStr.endsWith(`/${dirName}`)
    );
  }
  if (pattern.startsWith('**/')) {
    const endPart = pattern.substring(3);
    return pathStr.endsWith(endPart);
  }
  return false;
}

export async function performWorkspaceSearch(
  term: string,
  matchCase: boolean,
  additionalExclude: string[] = []
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    results.push({
      type: 'file',
      displayPath: 'No workspace open.',
      relativePath: '',
      isOutside: false,
    });
    return results;
  }

  if (!term) {
    return [];
  }

  const foundFoldersPaths: string[] = [];
  const foundFilesPaths: string[] = [];
  const baseExclude = ['**/node_modules/**', '**/.git/**'];
  const excludePatterns = [
    ...baseExclude,
    ...additionalExclude.map((p) => `**/${p}/**`),
  ];

  try {
    for (const folder of vscode.workspace.workspaceFolders) {
      await findMatchingEntriesRecursive(
        folder.uri,
        term,
        matchCase,
        foundFoldersPaths,
        foundFilesPaths,
        excludePatterns
      );
    }

    foundFoldersPaths.forEach((relativePath) => {
      results.push({
        type: 'folder',
        displayPath: `${relativePath.replace(/\\/g, '/')}`,
        relativePath: relativePath,
      });
    });

    foundFilesPaths.forEach((relativePath) => {
      const isOutside = !foundFoldersPaths.some(
        (folderPath) =>
          relativePath.startsWith(folderPath + path.sep) || relativePath.startsWith(folderPath + '/')
      );
      results.push({
        type: 'file',
        displayPath: `${relativePath.replace(/\\/g, '/')}`,
        relativePath: relativePath,
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
        isOutside: false,
      },
    ];
  }
}
