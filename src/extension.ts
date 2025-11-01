import * as vscode from 'vscode';
import { MainWebViewProvider } from './MainWebViewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "cline-helper" is now active!');

  const mainProvider = new MainWebViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MainWebViewProvider.viewType, mainProvider)
  );
}

export function deactivate() {}
