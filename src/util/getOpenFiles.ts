import * as vscode from 'vscode';

export function getOpenFiles(): string[] {
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
    .map((uri) => vscode.workspace.asRelativePath(uri));
}
