import * as vscode from 'vscode';
import { getWebviewHtml } from '../webview';
import { ToExtension } from '../shared/messages';
import { getOpenFiles } from '../util/getOpenFiles';

export class ListOpenFilesWebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'list-open-files-view';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist')],
    };

    webviewView.webview.html = getWebviewHtml(
      webviewView.webview,
      this._extensionUri,
      'listOpenFiles'
    );

    webviewView.webview.onDidReceiveMessage(async (msg: ToExtension) => {
      if (msg.type === 'getOpenFiles') {
        this.updateFileList(getOpenFiles());
      } else if (msg.type === 'openFile') {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
          const workspaceRoot = workspaceFolders[0].uri;
          const fileUri = vscode.Uri.joinPath(workspaceRoot, msg.path);
          const doc = await vscode.workspace.openTextDocument(fileUri);
          await vscode.window.showTextDocument(doc, { preview: false });
        }
      }
    });
  }

  public updateFileList(files: string[]) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'init',
        payload: { files },
      });
    }
  }
}
