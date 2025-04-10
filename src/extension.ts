import * as vscode from 'vscode';
import { ListOpenFilesWebViewProvider } from './listOpenFiles/ListOpenFilesWebViewProvider'; // Updated import path
import { FileNameSearcherWebViewProvider } from './fileNameSearcher/FileNameSearcherWebViewProvider'; // Import the new provider
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

	// --- Combined File and Folder Collector (Editor Tab) ---
	context.subscriptions.push(
		vscode.commands.registerCommand('get-open-files.openFileAndFolderCollector', () => {
			createFileAndFolderCollectorPanel(context); // Use new helper function
		})
	);

	// --- File Name Searcher (Sidebar) ---
	const fileNameSearcherProvider = new FileNameSearcherWebViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(FileNameSearcherWebViewProvider.viewType, fileNameSearcherProvider)
	);
	// Optional command to focus the view if needed elsewhere
	context.subscriptions.push(
		vscode.commands.registerCommand('fileNameSearcher.showView', () => {
			// This command doesn't strictly need to do anything if activation is via view ID,
			// but could be used to programmatically focus the view if desired.
			// For now, just log activation.
			console.log('fileNameSearcher.showView command activated');
		})
	);
}

// --- Helper Function for Combined File and Folder Collector Panel ---
function createFileAndFolderCollectorPanel(context: vscode.ExtensionContext) {
	const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
	const panel = vscode.window.createWebviewPanel(
		'fileAndFolderCollector', // Panel ID
		'File and Folder Collector', // Title
		column || vscode.ViewColumn.One,
		{
			enableScripts: true,
			// Update resource root to the new directory
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media', 'fileAndFolderCollector')],
			retainContextWhenHidden: true
		}
	);

	// State variables
	const collectedPaths = new Set<string>(); // For collector side (left)
	let folderListInputText = ""; // For folder list input (middle)
	let listedContent = ""; // For lister results (right)
	const listedUniquePaths = new Set<string>(); // Track unique paths in the output

	// Load the HTML
	panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, 'fileAndFolderCollector');

	// Helper function to process the folder list and update the lister output
	async function processAndListFolders(inputText: string) {
		folderListInputText = inputText; // Update state
		listedContent = ""; // Clear previous results
		listedUniquePaths.clear();
		let combinedNewPaths: string[] = [];
		let firstFolderProcessed = true;

		const lines = inputText.split('\n').map(line => line.trim()).filter(line => line);

		for (const line of lines) {
			let folderPath = line;
			if (folderPath.startsWith('@/')) {
				folderPath = folderPath.substring(2);
			}
			if (!folderPath) continue;

			let folderUri: vscode.Uri;
			try {
				// Resolve relative path. Assume it's relative to the workspace root if not absolute.
                // Note: This might need refinement if paths outside the workspace are common.
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (path.isAbsolute(folderPath)) {
                    folderUri = vscode.Uri.file(folderPath);
                } else if (workspaceFolders && workspaceFolders.length > 0) {
				    folderUri = vscode.Uri.joinPath(workspaceFolders[0].uri, folderPath);
                } else {
                    throw new Error("Cannot resolve relative path: No workspace folder open.");
                }

				const stats = await vscode.workspace.fs.stat(folderUri);
				if (stats.type !== vscode.FileType.Directory) {
					console.warn("Lister ignoring non-directory:", folderUri.fsPath);
                    panel.webview.postMessage({ command: 'processingError', detail: `${line} is not a directory.` });
					continue; // Skip non-directories
				}

				// Find files in this directory
				const filesInDir = await findFilesInDir(folderUri);
				const newPathsForThisFolder: string[] = [];

				filesInDir.forEach(fileUri => {
					const relativePath = vscode.workspace.asRelativePath(fileUri, false);
					const prefixedPath = `@/${relativePath}`;
					if (!listedUniquePaths.has(prefixedPath)) {
						listedUniquePaths.add(prefixedPath);
						newPathsForThisFolder.push(prefixedPath);
					}
				});

				if (newPathsForThisFolder.length > 0) {
					if (!firstFolderProcessed) {
						combinedNewPaths.push(''); // Add blank line separator before adding paths of subsequent folders
					}
					combinedNewPaths = combinedNewPaths.concat(newPathsForThisFolder);
					firstFolderProcessed = false;
				}

			} catch (e: any) {
				console.error("Lister: Error processing path:", line, e);
                panel.webview.postMessage({ command: 'processingError', detail: `Error processing ${line}: ${e.message}` });
			}
		}

		listedContent = combinedNewPaths.join('\n');
		panel.webview.postMessage({ command: 'updateListerList', text: listedContent });
	}

	// Handle messages from the webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				// --- Collector Side Logic (Left Section) ---
				case 'addPaths':
					{ // Use block scope for const
						const collectorUris: string[] = message.uris || [];
						collectorUris.forEach(uriString => {
							try {
								const uri = vscode.Uri.parse(uriString);
								const relativePath = vscode.workspace.asRelativePath(uri, false);
								collectedPaths.add(`@/${relativePath}`);
							} catch (e) { console.error("Collector: Error parsing URI:", uriString, e); }
						});
						panel.webview.postMessage({ command: 'updateCollectorList', text: Array.from(collectedPaths).join('\n') });
					}
					return;
				case 'copyCollectorPaths':
					{ // Use block scope for const
						const collectorListToCopy = Array.from(collectedPaths).join('\n');
						if (collectorListToCopy) {
							vscode.env.clipboard.writeText(collectorListToCopy);
							panel.webview.postMessage({ command: 'collectorCopySuccess' });
						} else { vscode.window.showWarningMessage('No paths collected.'); }
					}
					return;
				case 'clearCollectorList':
					collectedPaths.clear();
					panel.webview.postMessage({ command: 'updateCollectorList', text: '' });
					panel.webview.postMessage({ command: 'collectorClearSuccess' });
					return;

				// --- Folder List Input Logic (Middle Section) ---
				case 'addFoldersToListInput':
					{ // Use block scope for const/let
						const folderUris: string[] = message.uris || [];
						const addedPaths: string[] = [];
						for (const uriString of folderUris) {
							try {
								const uri = vscode.Uri.parse(uriString);
								// Check if it's a directory before adding to the input list
								const stats = await vscode.workspace.fs.stat(uri);
								if (stats.type === vscode.FileType.Directory) {
									const relativePath = vscode.workspace.asRelativePath(uri, false);
									addedPaths.push(`@/${relativePath}`);
								} else {
									console.warn("Ignoring non-directory dropped onto folder list:", uriString);
                                    panel.webview.postMessage({ command: 'processingError', detail: `${vscode.workspace.asRelativePath(uri, false)} is not a directory.` });
								}
							} catch (e) {
								console.error("Folder Input: Error parsing/statting URI:", uriString, e);
                                panel.webview.postMessage({ command: 'processingError', detail: `Error adding ${uriString}.` });
                            }
						}
						if (addedPaths.length > 0) {
							// Append to existing text, ensuring a newline if needed
							if (folderListInputText.length > 0 && !folderListInputText.endsWith('\n')) {
								folderListInputText += '\n';
							}
							folderListInputText += addedPaths.join('\n');
							panel.webview.postMessage({ command: 'updateFolderListInput', text: folderListInputText });
							// Trigger processing immediately after adding via drop
							await processAndListFolders(folderListInputText);
						}
					}
					return;
				case 'processFolderList':
					// Debounced in JS, process directly here
					await processAndListFolders(message.text);
					return;
				// case 'clearFolderListInput': // Removed - functionality merged into clearListerList
					// folderListInputText = "";
					// panel.webview.postMessage({ command: 'updateFolderListInput', text: '' });
					// listedContent = "";
					// listedUniquePaths.clear();
					// panel.webview.postMessage({ command: 'updateListerList', text: '' });
					// panel.webview.postMessage({ command: 'folderListClearSuccess' });
					// return;

				// --- Lister Results Logic (Right Section) ---
				case 'copyListerPaths':
					if (listedContent) {
						vscode.env.clipboard.writeText(listedContent);
						panel.webview.postMessage({ command: 'listerCopySuccess' });
					} else { vscode.window.showWarningMessage('No paths listed.'); }
					return;
				case 'clearListerList':
					// This command now clears BOTH the input list and the output list.
					folderListInputText = ""; // Clear input state
					listedContent = ""; // Clear output state
					listedUniquePaths.clear(); // Clear unique paths tracker
					panel.webview.postMessage({ command: 'updateFolderListInput', text: '' }); // Update input textarea
					panel.webview.postMessage({ command: 'updateListerList', text: '' }); // Update output textarea
					panel.webview.postMessage({ command: 'listerClearSuccess' }); // Send feedback for output clear
                    // Optionally send feedback for input clear as well, or keep it simple
                    // panel.webview.postMessage({ command: 'folderListClearSuccess' });
					return;
			}
		},
		undefined, context.subscriptions
	);

	// Send initial state if needed (though JS handles restore from vscode.getState)
	// panel.webview.postMessage({ command: 'updateCollectorList', text: Array.from(collectedPaths).join('\n') });
	// panel.webview.postMessage({ command: 'updateFolderListInput', text: folderListInputText });
	// panel.webview.postMessage({ command: 'updateListerList', text: listedContent });

	panel.onDidDispose(() => { console.log('File and Folder Collector panel disposed'); }, null, context.subscriptions);
}


// --- Recursive File Finder (Remains the same) ---
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
// Updated to handle the new combined feature name
function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri, featureName: 'fileAndFolderCollector'): string {
	const htmlPath = vscode.Uri.joinPath(extensionUri, 'media', featureName, `${featureName}.html`);
	const scriptPath = vscode.Uri.joinPath(extensionUri, 'media', featureName, `${featureName}.js`);
	const stylePath = vscode.Uri.joinPath(extensionUri, 'media', featureName, `${featureName}.css`);

	// Ensure URIs are generated correctly for the webview
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
