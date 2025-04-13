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

        // Helper to resolve relative path (@/...) to a full URI
        const resolvePrefixedPath = (prefixedPath: string): vscode.Uri | null => {
            if (!prefixedPath || !prefixedPath.startsWith('@/')) {
                return null;
            }
            const relativePath = prefixedPath.substring(2);
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                try {
                    return vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);
                } catch (e) {
                    console.error(`Error resolving path ${relativePath}:`, e);
                    return null;
                }
            }
            return null; // Cannot resolve without a workspace folder
        };

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
                    // Text is now sent from the webview
                    const textToCopy = message.text || this.lastFileList; // Fallback to stored list if text not sent
                    if (textToCopy) {
                        vscode.env.clipboard.writeText(textToCopy);
                        // Optional: Send feedback to webview
                        // webviewView.webview.postMessage({ command: 'copySuccess' });
                    } else {
                        vscode.window.showWarningMessage('No list content to copy.');
                    }
                    return;
                case 'clearList':
                    this.lastFileList = ''; // Clear the stored state
                    // Webview clears its own UI, just need to clear state here
                    // webviewView.webview.postMessage({ command: 'updateList', text: '' });
                    // Optional: Send feedback to webview if needed
                    // webviewView.webview.postMessage({ command: 'clearSuccess' });
                    return;
                case 'focusOpenFile':
                    const prefixedPath = message.path;
                    const targetUri = resolvePrefixedPath(prefixedPath);
                    if (targetUri) {
                        try {
                            // Attempt to open the URI. If it's already open, this should focus it.
                            // Using preview: false ensures it doesn't open in a temporary preview tab.
                            vscode.commands.executeCommand('vscode.open', targetUri, { preview: false });
                        } catch (err) {
                            console.error(`Error focusing file ${prefixedPath}:`, err);
                            vscode.window.showErrorMessage(`Could not focus file: ${prefixedPath}`);
                        }
                    } else {
                        console.warn(`Could not resolve path for focusing: ${prefixedPath}`);
                        vscode.window.showWarningMessage(`Could not resolve path: ${prefixedPath}`);
                    }
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
                <!-- Changed textarea to div, added Ctrl+Click hint -->
                <h3>Open Files: (Ctrl+Click to focus)</h3>
                <div id="file-list" class="results-display"></div>
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
