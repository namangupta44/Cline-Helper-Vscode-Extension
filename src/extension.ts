import * as vscode from 'vscode';
import { ListOpenFilesWebViewProvider } from './listOpenFiles/ListOpenFilesWebViewProvider'; // Updated import path
import * as path from 'path'; // Needed for path operations
import * as fs from 'fs'; // Needed for reading HTML file

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "get-open-files" is now active!');

	// --- Feature A: List Open Files (Sidebar) ---
	const listOpenFilesProvider = new ListOpenFilesWebViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ListOpenFilesWebViewProvider.viewType, listOpenFilesProvider)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('get-open-files.listOpen', () => {
			const allTabs: vscode.Tab[] = vscode.window.tabGroups.all.flatMap(group => group.tabs);
			const filePaths: string[] = allTabs
				.map(tab => {
					if (tab.input instanceof vscode.TabInputText) {
						return vscode.workspace.asRelativePath(tab.input.uri, false);
					}
					return null;
				})
				.filter((path): path is string => path !== null);

			const prefixedFilePaths = filePaths.map(p => `@/${p}`);
			const fileListString = prefixedFilePaths.length > 0
				? prefixedFilePaths.join('\n')
				: "No open files found.";
			listOpenFilesProvider.updateFileList(fileListString);
		})
	);

	// --- Feature B: File Path Collector (Editor Tab) ---
	context.subscriptions.push(
		vscode.commands.registerCommand('get-open-files.openCollectorTab', () => {
			createCollectorPanel(context); // Use helper function
		})
	);

	// --- Feature C: Folder Content Lister (Editor Tab) ---
	context.subscriptions.push(
		vscode.commands.registerCommand('get-open-files.openFolderListerTab', () => {
			createFolderListerPanel(context); // Use helper function
		})
	);
}

// --- Helper Function for Collector Panel (Feature B) ---
function createCollectorPanel(context: vscode.ExtensionContext) {
	const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
	const panel = vscode.window.createWebviewPanel(
		'filePathCollector', 'File Path Collector', column || vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media', 'collector')],
			retainContextWhenHidden: true // Add this line
		}
	);

	const collectedPaths = new Set<string>();
	panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, 'collector');

	panel.webview.onDidReceiveMessage(
		message => {
			switch (message.command) {
				case 'addPaths':
					const uris: string[] = message.uris || [];
					uris.forEach(uriString => {
						try {
							const uri = vscode.Uri.parse(uriString);
							const relativePath = vscode.workspace.asRelativePath(uri, false);
							collectedPaths.add(`@/${relativePath}`);
						} catch (e) { console.error("Collector: Error parsing URI:", uriString, e); }
					});
					panel.webview.postMessage({ command: 'updateCollectorList', text: Array.from(collectedPaths).join('\n') });
					return;
				case 'copyPaths':
					const listToCopy = Array.from(collectedPaths).join('\n');
					if (listToCopy) {
						vscode.env.clipboard.writeText(listToCopy);
						vscode.window.showInformationMessage('Collected paths copied!');
					} else { vscode.window.showWarningMessage('No paths collected.'); }
							return;
						case 'clearCollectorList': // Added clear handler
							collectedPaths.clear();
							panel.webview.postMessage({ command: 'updateCollectorList', text: '' });
							return;
					}
				},
		undefined, context.subscriptions
	);
	panel.onDidDispose(() => { console.log('Collector panel disposed'); }, null, context.subscriptions);
}

// --- Helper Function for Folder Lister Panel (Feature C) ---
function createFolderListerPanel(context: vscode.ExtensionContext) {
	const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
	const panel = vscode.window.createWebviewPanel(
		'folderContentLister', 'Folder Content Lister', column || vscode.ViewColumn.One,
		{
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media', 'folderLister')],
			retainContextWhenHidden: true // Add this line
		}
	);

	let collectedContent = ""; // Store the full string including separators
	const uniquePaths = new Set<string>(); // Track unique paths across all drops

	panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, 'folderLister');

	panel.webview.onDidReceiveMessage(
		async message => { // Make handler async
			switch (message.command) {
				case 'addFolderPaths':
					const folderUris: string[] = message.uris || [];
					let addedNewContentForThisDrop = false;

					for (const uriString of folderUris) {
						try {
							const folderUri = vscode.Uri.parse(uriString);
							const stats = await vscode.workspace.fs.stat(folderUri);

							if (stats.type === vscode.FileType.Directory) {
								const filesInDir = await findFilesInDir(folderUri); // Recursive find
								const newPathsForThisFolder: string[] = [];

								filesInDir.forEach(fileUri => {
									const relativePath = vscode.workspace.asRelativePath(fileUri, false);
									const prefixedPath = `@/${relativePath}`;
									if (!uniquePaths.has(prefixedPath)) {
										uniquePaths.add(prefixedPath);
										newPathsForThisFolder.push(prefixedPath);
									}
								});

								if (newPathsForThisFolder.length > 0) {
									if (collectedContent !== "") { // Add separator if content exists
										collectedContent += '\n\n'; // Add blank line separator
									}
									collectedContent += newPathsForThisFolder.join('\n');
									addedNewContentForThisDrop = true;
								}
							} else {
								// Handle dropped files like the collector (optional, or ignore)
								// For now, we only process directories in this panel
								console.log("Folder Lister ignoring non-directory:", uriString);
							}
						} catch (e) { console.error("Folder Lister: Error processing URI:", uriString, e); }
					}

					// Send full updated list back only if new content was added
					if (addedNewContentForThisDrop) {
						panel.webview.postMessage({ command: 'updateListerContent', text: collectedContent });
					}
					return;

				case 'copyListedPaths':
					if (collectedContent) {
						vscode.env.clipboard.writeText(collectedContent);
						vscode.window.showInformationMessage('Listed paths copied!');
					} else { vscode.window.showWarningMessage('No paths listed.'); }
							return;
						case 'clearListerList': // Added clear handler
							uniquePaths.clear();
							collectedContent = "";
							panel.webview.postMessage({ command: 'updateListerContent', text: '' });
							return;
					}
				},
		undefined, context.subscriptions
	);
	panel.onDidDispose(() => { console.log('Folder Lister panel disposed'); }, null, context.subscriptions);
}

// --- Recursive File Finder ---
async function findFilesInDir(dirUri: vscode.Uri): Promise<vscode.Uri[]> {
    let files: vscode.Uri[] = [];
    try {
        const entries = await vscode.workspace.fs.readDirectory(dirUri);
        for (const [name, type] of entries) {
            const entryUri = vscode.Uri.joinPath(dirUri, name);
            if (type === vscode.FileType.Directory) {
                files = files.concat(await findFilesInDir(entryUri)); // Recurse
            } else if (type === vscode.FileType.File) {
                files.push(entryUri);
            }
        }
    } catch (e) {
        console.error(`Error reading directory ${dirUri.fsPath}:`, e);
        vscode.window.showErrorMessage(`Error reading directory: ${dirUri.fsPath}`);
    }
    return files;
}


// --- Generic Helper function to get HTML for Webview Panels ---
function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri, featureName: 'collector' | 'folderLister'): string {
	const htmlPath = vscode.Uri.joinPath(extensionUri, 'media', featureName, `${featureName}.html`);
	const scriptPath = vscode.Uri.joinPath(extensionUri, 'media', featureName, `${featureName}.js`);
	const stylePath = vscode.Uri.joinPath(extensionUri, 'media', featureName, `${featureName}.css`);

	const scriptUri = webview.asWebviewUri(scriptPath);
	const styleUri = webview.asWebviewUri(stylePath);
	const nonce = getNonce();

	try {
		let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
		htmlContent = htmlContent.replace(/\${styleUri}/g, styleUri.toString()); // Use regex for global replace
		htmlContent = htmlContent.replace(/\${scriptUri}/g, scriptUri.toString());
		htmlContent = htmlContent.replace(/\${nonce}/g, nonce);
		htmlContent = htmlContent.replace(/\${webview\.cspSource}/g, webview.cspSource);
		return htmlContent;
	} catch (e) {
		console.error(`Error reading ${featureName} HTML file:`, e);
		return `<html><body>Error loading ${featureName} view.</body></html>`;
	}
}

// Helper function to generate a random nonce string
function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// This method is called when your extension is deactivated
export function deactivate() {}
