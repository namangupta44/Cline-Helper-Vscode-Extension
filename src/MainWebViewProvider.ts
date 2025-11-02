import * as vscode from 'vscode';
import { getWebviewHtml } from './webview';
import { ToExtension } from './shared/messages';
import { WebviewMessageHandler } from './WebviewMessageHandler';

export class MainWebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'main-view';

  private _view?: vscode.WebviewView;
  private _handler?: WebviewMessageHandler;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

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

    webviewView.webview.html = this.getHtml(webviewView.webview);

    this._handler = new WebviewMessageHandler(this._context, webviewView.webview, true);

    webviewView.webview.onDidReceiveMessage((msg: ToExtension) => {
      this._handler?.handleMessage(msg);
    });
  }

  public getHtml(webview: vscode.Webview): string {
    return getWebviewHtml(webview, this._extensionUri);
  }

  public showSettings() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'showSettings' });
    }
  }
}
