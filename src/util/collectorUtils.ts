import * as vscode from 'vscode';
import { PathInfo, ListedGroup } from '../shared/messages';

export async function processDroppedUris(uriStrings: string[]): Promise<PathInfo[]> {
  const pathInfos: PathInfo[] = [];
  for (const uriString of uriStrings) {
    try {
      const uri = vscode.Uri.parse(uriString);
      const relativePath = vscode.workspace.asRelativePath(uri, false);
      const stats = await vscode.workspace.fs.stat(uri);
      const type: 'file' | 'folder' =
        stats.type === vscode.FileType.Directory ? 'folder' : 'file';
      pathInfos.push({ path: relativePath, type });
    } catch (e) {
      console.error(`Collector: Error parsing/statting URI: ${uriString}`, e);
    }
  }
  return pathInfos;
}

async function findFilesInDir(dirUri: vscode.Uri): Promise<vscode.Uri[]> {
  let files: vscode.Uri[] = [];
  try {
    const entries = await vscode.workspace.fs.readDirectory(dirUri);
    for (const [name, type] of entries) {
      const entryUri = vscode.Uri.joinPath(dirUri, name);
      if (type === vscode.FileType.Directory) {
        files = files.concat(await findFilesInDir(entryUri));
      } else if (type === vscode.FileType.File) {
        files.push(entryUri);
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dirUri.fsPath}:`, e);
  }
  return files;
}

export async function listFolderContents(folderPaths: string[]): Promise<ListedGroup[]> {
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

      const filesInDir = await findFilesInDir(folderUri);

      filesInDir.forEach((fileUri) => {
        const relativePath = vscode.workspace.asRelativePath(fileUri, false);
        if (!listedUniquePaths.has(relativePath)) {
          listedUniquePaths.add(relativePath);
          currentGroupFiles.push({ path: relativePath, type: 'file' });
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
