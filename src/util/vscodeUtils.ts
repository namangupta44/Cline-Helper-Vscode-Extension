import * as vscode from 'vscode';

export async function openPath(relativePath: string, type: 'file' | 'folder') {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('Cannot open path: No workspace is open.');
    return;
  }

  const targetUri = vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);

  try {
    if (type === 'file') {
      const doc = await vscode.workspace.openTextDocument(targetUri);
      await vscode.window.showTextDocument(doc, { preview: false });
    } else if (type === 'folder') {
      // There's no direct 'open folder' command, but revealing it in the explorer is the standard
      await vscode.commands.executeCommand('revealInExplorer', targetUri);
    }
  } catch (err: any) {
    console.error(`Error opening ${type} ${relativePath}:`, err);
    vscode.window.showErrorMessage(`Could not open ${type}: ${err.message}`);
  }
}
