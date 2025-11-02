import * as vscode from 'vscode';
import ignore from 'ignore';

export function getOpenFiles(
  excludePatterns: string[] = [],
  isFullPathEnabled = false
): { relativePath: string; fullPath: string }[] {
  const ig = ignore().add(excludePatterns);
  const tabs: vscode.Uri[] = [];
  for (const tabGroup of vscode.window.tabGroups.all) {
    for (const tab of tabGroup.tabs) {
      if (tab.input instanceof vscode.TabInputText) {
        tabs.push(tab.input.uri);
      }
    }
  }
  return tabs
    .filter((uri) => uri.scheme === 'file' || uri.scheme === 'untitled')
    .map((uri) => {
      const relativePath = vscode.workspace.asRelativePath(uri);
      return {
        relativePath,
        fullPath: uri.fsPath,
      };
    })
    .filter((path) => !ig.ignores(path.relativePath));
}
