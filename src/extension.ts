import * as vscode from 'vscode';
import { MainWebViewProvider } from './MainWebViewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "cline-helper" is now active!');

  const mainProvider = new MainWebViewProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MainWebViewProvider.viewType, mainProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('cline-helper.openSettings', () => {
      mainProvider.showSettings();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('cline-helper.openInEditor', () => {
      const panel = vscode.window.createWebviewPanel(
        'main-view-editor',
        'Cline Helper',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'dist'),
          ],
        }
      );
      panel.webview.html = mainProvider.getHtml(panel.webview);
      panel.webview.onDidReceiveMessage((msg) => {
        mainProvider.handleMessage(msg, panel.webview);
      });
    })
  );
}

export function deactivate() {}
