import * as vscode from 'vscode';

export function getWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  viewName: 'listOpenFiles' | 'fileNameSearcher' | 'fileAndFolderCollector'
) {
  const nonce = getNonce();
  const uri = (p: string) =>
    webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist', p));

  const scriptUri = uri(`assets/${viewName}.js`);
  const styleUri = uri('assets/globals.css');

  return /* html */ `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   img-src ${webview.cspSource} data: blob:;
                   style-src ${webview.cspSource} 'nonce-${nonce}';
                   script-src 'nonce-${nonce}';
                   font-src ${webview.cspSource};" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link nonce="${nonce}" rel="stylesheet" href="${styleUri}">
        <title>${viewName}</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}">
          window.__vscode__ = acquireVsCodeApi();
        </script>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
