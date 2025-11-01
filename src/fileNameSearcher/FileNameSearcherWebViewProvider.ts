import * as vscode from 'vscode';
import { getWebviewHtml } from '../webview';
import { ToExtension, SearchResult } from '../shared/messages';

export class FileNameSearcherWebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'fileNameSearcher.view';

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
      'fileNameSearcher'
    );

    webviewView.webview.onDidReceiveMessage(async (msg: ToExtension) => {
      // Handle messages
    });
  }

  public updateResults(results: SearchResult[]) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'searchResults',
        items: results,
      });
    }
  }
}
