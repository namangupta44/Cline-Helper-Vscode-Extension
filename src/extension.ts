import * as vscode from 'vscode';
import { ListOpenFilesWebViewProvider } from './listOpenFiles/ListOpenFilesWebViewProvider';
import { FileNameSearcherWebViewProvider } from './fileNameSearcher/FileNameSearcherWebViewProvider';
import { ToExtension } from './shared/messages';
import { getWebviewHtml } from './webview';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "cline-helper" is now active!');

  // --- List Open Files (Sidebar) ---
  const listOpenFilesProvider = new ListOpenFilesWebViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ListOpenFilesWebViewProvider.viewType,
      listOpenFilesProvider
    )
  );

  // --- File Name Searcher (Sidebar) ---
  const fileNameSearcherProvider = new FileNameSearcherWebViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      FileNameSearcherWebViewProvider.viewType,
      fileNameSearcherProvider
    )
  );

  // --- File and Folder Collector (Editor Tab) ---
  context.subscriptions.push(
    vscode.commands.registerCommand('get-open-files.openFileAndFolderCollector', () => {
      createFileAndFolderCollectorPanel(context);
    })
  );
}

function createFileAndFolderCollectorPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'fileAndFolderCollector',
    'File and Folder Collector',
    vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'dist')],
    }
  );

  panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, 'fileAndFolderCollector');

  panel.webview.onDidReceiveMessage(async (msg: ToExtension) => {
    // Handle messages from the webview
  });
}


export function deactivate() {}
