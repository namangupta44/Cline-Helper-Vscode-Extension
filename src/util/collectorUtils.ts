import * as vscode from 'vscode';
import { PathInfo, ListedGroup } from '../shared/messages';

export async function processDroppedUris(
  uriStrings: string[],
  isFullPathEnabled = false
): Promise<PathInfo[]> {
  const pathInfos: PathInfo[] = [];
  for (const uriString of uriStrings) {
    try {
      const uri = vscode.Uri.parse(uriString);
      const relativePath = vscode.workspace.asRelativePath(uri, false);
      const stats = await vscode.workspace.fs.stat(uri);
      const type: 'file' | 'folder' =
        stats.type === vscode.FileType.Directory ? 'folder' : 'file';
      pathInfos.push({ relativePath, fullPath: uri.fsPath, type });
    } catch (e) {
      console.error(`Collector: Error parsing/statting URI: ${uriString}`, e);
    }
  }
  return pathInfos;
}

async function findFilesInDir(
  dirUri: vscode.Uri,
  excludePatterns: string[]
): Promise<{ relativePath: string; fullPath: string }[]> {
  const relativePathForExclusion = vscode.workspace.asRelativePath(dirUri, true);
  if (excludePatterns.some((p) => relativePathForExclusion.startsWith(p))) {
    return [];
  }

  let files: { relativePath: string; fullPath: string }[] = [];
  try {
    const entries = await vscode.workspace.fs.readDirectory(dirUri);
    for (const [name, type] of entries) {
      const entryUri = vscode.Uri.joinPath(dirUri, name);
      if (type === vscode.FileType.Directory) {
        files = files.concat(await findFilesInDir(entryUri, excludePatterns));
      } else if (type === vscode.FileType.File) {
        const relativePath = vscode.workspace.asRelativePath(entryUri, false);
        if (!excludePatterns.some((p) => relativePath.startsWith(p))) {
          files.push({ relativePath, fullPath: entryUri.fsPath });
        }
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dirUri.fsPath}:`, e);
  }
  return files;
}

export async function listFolderContents(
  folderPaths: string[],
  excludePatterns: string[] = [],
  isFullPathEnabled = false
): Promise<ListedGroup[]> {
  const listedPathsGrouped: ListedGroup[] = [];
  const listedUniquePaths = new Set<string>();

  for (const sourcePath of folderPaths) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      continue;
    }
    const folderUri = vscode.Uri.joinPath(workspaceFolders[0].uri, sourcePath);
    const currentGroupFiles: PathInfo[] = [];

    try {
      const stats = await vscode.workspace.fs.stat(folderUri);
      if (stats.type !== vscode.FileType.Directory) {
        continue;
      }

      const filesInDir = await findFilesInDir(folderUri, excludePatterns);

      filesInDir.forEach(({ relativePath, fullPath }) => {
        if (!listedUniquePaths.has(relativePath)) {
          listedUniquePaths.add(relativePath);
          currentGroupFiles.push({
            relativePath,
            fullPath,
            type: 'file',
          });
        }
      });

      if (currentGroupFiles.length > 0) {
        listedPathsGrouped.push({ source: sourcePath, files: currentGroupFiles });
      }
    } catch (e) {
      console.error(`Lister: Error processing path: ${sourcePath}`, e);
    }
  }
  return listedPathsGrouped;
}
