import * as vscode from 'vscode';
import * as path from 'path';

export class FileNameSearcherWebViewProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'fileNameSearcher.view';

    private _view?: vscode.WebviewView;
    private readonly _extensionUri: vscode.Uri;
    private lastSearchTerm: string = '';
    private lastMatchCase: boolean = false;
    // Store structured results instead of a single string
    private lastSearchData: { folders: string[], files: { path: string, isOutside: boolean }[] } | null = null;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Remove state restoration from here

        // Add listener for visibility changes
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                // Restore previous state when view becomes visible again
                webviewView.webview.postMessage({
                    command: 'restoreState',
                    term: this.lastSearchTerm,
                    matchCase: this.lastMatchCase,
                    results: this.lastSearchData // Send structured data
                });
            }
        });

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'search':
                    const searchTerm = message.term;
                    const matchCase = message.matchCase ?? false; // Default to false if not provided
                    // Store the search term and match case state immediately
                    this.lastSearchTerm = searchTerm;
                    this.lastMatchCase = matchCase;
                    // Perform the search (this will update lastResults internally)
                    await this.performSearch(searchTerm, matchCase);
                    // No need to check if searchTerm is empty here, performSearch handles it
                    return;
                case 'copy':
                    const textToCopy = message.text;
                    if (textToCopy) {
                        await vscode.env.clipboard.writeText(textToCopy);
                        webviewView.webview.postMessage({ command: 'copySuccess' });
                    }
                    return;
                case 'clearSearch': // Handle message from webview clear button
                    this.lastSearchTerm = '';
                    this.lastMatchCase = false;
                    this.lastSearchData = null; // Clear structured data
                    // Optional: Clear view immediately if desired
                    // webviewView.webview.postMessage({ command: 'updateResults', results: null });
                    return;
            }
        });
    }

    private async performSearch(term: string, matchCase: boolean) {
        // Update state variables even before the search starts
        this.lastSearchTerm = term;
        this.lastMatchCase = matchCase;

        if (!this._view) { return; } // View not ready

        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            this.lastSearchData = { folders: [], files: [{ path: "No workspace open.", isOutside: false }] };
            this._view.webview.postMessage({ command: 'updateResults', results: this.lastSearchData });
            return;
        }

        // If search term is empty, clear results and state
        if (!term) {
            this.lastSearchData = null; // Clear results
            this._view.webview.postMessage({ command: 'updateResults', results: this.lastSearchData });
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri; // Use the first workspace folder
        const foundFoldersPaths: string[] = []; // Store full paths for comparison
        const foundFilesPaths: string[] = [];   // Store full paths for comparison
        const excludePatterns = ['**/node_modules/**', '**/.git/**']; // Add more if needed

        try {
            // Find all matching entries first
            await this.findMatchingEntriesRecursive(workspaceRoot, term, matchCase, foundFoldersPaths, foundFilesPaths, excludePatterns);

            // Format paths and determine if files are outside folders
            const formattedFolders = foundFoldersPaths.map(p => `@/${p.replace(/\\/g, '/')}`);
            const formattedFiles = foundFilesPaths.map(filePath => {
                const formattedPath = `@/${filePath.replace(/\\/g, '/')}`;
                // Check if the file path starts with any of the found folder paths + separator
                const isOutside = !foundFoldersPaths.some(folderPath =>
                    filePath.startsWith(folderPath + path.sep) || filePath.startsWith(folderPath + '/') // Handle both separators
                );
                return { path: formattedPath, isOutside: isOutside };
            });

            // Prepare structured data for the webview
            const searchData: { folders: string[], files: { path: string, isOutside: boolean }[] } = {
                folders: formattedFolders,
                files: formattedFiles
            };

            // Add a message if nothing was found
            if (searchData.folders.length === 0 && searchData.files.length === 0) {
                 searchData.files.push({ path: "No matching files or folders found.", isOutside: false });
            }

            this.lastSearchData = searchData; // Store the structured results
            this._view.webview.postMessage({ command: 'updateResults', results: this.lastSearchData });

        } catch (error) {
            console.error("Error during file search:", error);
            vscode.window.showErrorMessage(`Error searching files: ${error}`);
            this.lastSearchData = { folders: [], files: [{ path: "Error during search.", isOutside: false }] }; // Store error state
            this._view.webview.postMessage({ command: 'updateResults', results: this.lastSearchData });
        }
    }

    private async findMatchingEntriesRecursive(
        dirUri: vscode.Uri,
        term: string,
        matchCase: boolean,
        foundFolders: string[],
        foundFiles: string[],
        excludePatterns: string[]
    ): Promise<void> {

        // Simple exclusion check (can be improved with glob matching libraries if needed)
        const relativePathForExclusion = vscode.workspace.asRelativePath(dirUri, true);
        if (excludePatterns.some(pattern => this.simpleGlobMatch(relativePathForExclusion, pattern))) {
            // console.log(`Excluding: ${relativePathForExclusion}`);
            return;
        }

        let entries: [string, vscode.FileType][] = [];
        try {
            entries = await vscode.workspace.fs.readDirectory(dirUri);
        } catch (e) {
            // Ignore errors reading directories (e.g., permission denied)
            // console.warn(`Could not read directory: ${dirUri.fsPath}`, e);
            return;
        }

        for (const [name, type] of entries) {
            const entryUri = vscode.Uri.joinPath(dirUri, name);
            const relativePath = vscode.workspace.asRelativePath(entryUri, false);

            // Check if the current entry should be excluded
             const relativePathForExclusionCheck = vscode.workspace.asRelativePath(entryUri, true);
             if (excludePatterns.some(pattern => this.simpleGlobMatch(relativePathForExclusionCheck, pattern))) {
                // console.log(`Excluding entry: ${relativePathForExclusionCheck}`);
                 continue;
             }


            const nameToCheck = matchCase ? name : name.toLowerCase();
            const termToCheck = matchCase ? term : term.toLowerCase();
            const nameMatches = nameToCheck.includes(termToCheck);

            if (type === vscode.FileType.Directory) {
                if (nameMatches) {
                    foundFolders.push(relativePath);
                }
                // Recurse into subdirectory
                await this.findMatchingEntriesRecursive(entryUri, term, matchCase, foundFolders, foundFiles, excludePatterns);
            } else if (type === vscode.FileType.File) {
                if (nameMatches) {
                    foundFiles.push(relativePath);
                }
            }
        }
    }

    // Basic glob matching for exclusion (adjust as needed for more complex patterns)
    private simpleGlobMatch(pathStr: string, pattern: string): boolean {
        if (pattern.startsWith('**/') && pattern.endsWith('/**')) {
            // Match directory name anywhere
            const dirName = pattern.substring(3, pattern.length - 3);
            return pathStr.includes(`/${dirName}/`) || pathStr.startsWith(`${dirName}/`) || pathStr.endsWith(`/${dirName}`);
        }
         if (pattern.startsWith('**/')) {
             // Match anything ending with the pattern part
             const endPart = pattern.substring(3);
             return pathStr.endsWith(endPart);
         }
        // Add more basic cases if needed, or use a library like 'minimatch'
        return false;
    }


    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'fileNameSearcher', 'fileNameSearcher.js'));
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'fileNameSearcher', 'fileNameSearcher.css'));
        const nonce = getNonce();

        // Using the same HTML structure, but the JS interaction changes slightly
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesUri}" rel="stylesheet">
				<title>File Name Searcher</title>
			</head>
			<body>
                <div class="container">
                    <input type="text" id="search-input" placeholder="Enter filename part...">
                    <label style="display: flex; align-items: center; gap: 5px; margin-top: 5px;">
                        <input type="checkbox" id="match-case-checkbox"> Match Case
                    </label>
                    <!-- Clear button moved below -->

                    <div id="results-container">
                        <h3>Results:</h3>
                        <div id="results-area" class="results-display"></div> <!-- Changed textarea to div -->
                        <div class="button-group"> <!-- New button group -->
                            <button id="copy-button">Copy</button>
                            <button id="clear-button">Clear</button>
                        </div>
                    </div>
                </div>
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
