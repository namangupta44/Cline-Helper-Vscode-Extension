import * as vscode from 'vscode';

// Renamed class
export class ListOpenFilesWebViewProvider implements vscode.WebviewViewProvider {

    // Updated viewType
    public static readonly viewType = 'list-open-files-view';

    private _view?: vscode.WebviewView;
    private lastFileList: string = ''; // To store the last known list

    constructor(
        private readonly _extensionUri: vscode.Uri
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Remove state restoration from here

        // Add listener for visibility changes
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                // Restore the last known list when the view becomes visible again
                webviewView.webview.postMessage({ command: 'updateList', text: this.lastFileList });
            }
        });

        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'getOpenFiles': // Renamed command for clarity
                    // Use the new command name
                    vscode.commands.executeCommand('get-open-files.listOpen');
                    return;
                case 'openCombinedCollector': // New message command from the single button
                    // Execute the new combined command
                    vscode.commands.executeCommand('get-open-files.openFileAndFolderCollector');
                    return;
                case 'copyList':
                    if (this.lastFileList) {
                        vscode.env.clipboard.writeText(this.lastFileList);
                        // Optional: Send feedback to webview
                        // webviewView.webview.postMessage({ command: 'copySuccess' });
                    }
                    return;
                case 'clearList':
                    this.lastFileList = ''; // Clear the stored state
                    // Update the webview immediately
                    webviewView.webview.postMessage({ command: 'updateList', text: '' });
                    // Optional: Send feedback to webview
                    // webviewView.webview.postMessage({ command: 'clearSuccess' });
                    return;
            }
        });
    }

    public updateFileList(fileList: string) {
        this.lastFileList = fileList; // Store the list before sending
        if (this._view) {
            this._view.webview.postMessage({ command: 'updateList', text: this.lastFileList });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Updated paths
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'listOpenFiles', 'list-open-files.js'));
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'listOpenFiles', 'list-open-files.css'));
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${stylesUri}" rel="stylesheet">
                <title>Open Files List</title> <!-- Updated title -->
            </head>
            <body>
                <button id="get-files-button">Get Open File List</button> <!-- Updated text -->
                <textarea id="file-list" rows="8" readonly></textarea> <!-- Reduced rows slightly -->
                <div class="button-group"> <!-- Add button group -->
                    <button id="copy-list-button">Copy</button>
                    <button id="clear-list-button">Clear</button>
                </div>
                <hr>
                <button id="open-combined-button">Open File & Folder Collector</button> <!-- Single combined button -->

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
