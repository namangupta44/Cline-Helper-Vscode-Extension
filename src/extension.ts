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

	// State variables for both sides
	const collectedPaths = new Set<string>(); // For collector side
	let listedContent = ""; // For lister side (full string)
	const listedUniquePaths = new Set<string>(); // For lister side (unique paths)

	// Load the new combined HTML
	panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, 'fileAndFolderCollector');

	// Handle messages from the webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				// --- Collector Side Logic ---
				case 'addPaths':
					const collectorUris: string[] = message.uris || [];
					collectorUris.forEach(uriString => {
						try {
							const uri = vscode.Uri.parse(uriString);
							const relativePath = vscode.workspace.asRelativePath(uri, false);
							collectedPaths.add(`@/${relativePath}`);
						} catch (e) { console.error("Collector: Error parsing URI:", uriString, e); }
					});
					panel.webview.postMessage({ command: 'updateCollectorList', text: Array.from(collectedPaths).join('\n') });
					return;
				case 'copyCollectorPaths':
					const collectorListToCopy = Array.from(collectedPaths).join('\n');
					if (collectorListToCopy) {
						vscode.env.clipboard.writeText(collectorListToCopy);
						// vscode.window.showInformationMessage('Collected paths copied!'); // Replaced by webview feedback
						panel.webview.postMessage({ command: 'collectorCopySuccess' }); // Send feedback
					} else { vscode.window.showWarningMessage('No paths collected.'); }
					return;
				case 'clearCollectorList':
					collectedPaths.clear();
					panel.webview.postMessage({ command: 'updateCollectorList', text: '' });
					panel.webview.postMessage({ command: 'collectorClearSuccess' }); // Send feedback
					return;

				// --- Lister Side Logic ---
				case 'addFolderPaths':
					const folderUris: string[] = message.uris || [];
					let addedNewContentForThisDrop = false;

					for (const uriString of folderUris) {
						try {
							const folderUri = vscode.Uri.parse(uriString);
							const stats = await vscode.workspace.fs.stat(folderUri);

							if (stats.type === vscode.FileType.Directory) {
								const filesInDir = await findFilesInDir(folderUri); // Use existing helper
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
									if (listedContent !== "") { // Add separator if content exists
										listedContent += '\n\n'; // Add blank line separator
									}
									listedContent += newPathsForThisFolder.join('\n');
									addedNewContentForThisDrop = true;
								}
							} else {
								console.log("Lister ignoring non-directory:", uriString);
							}
						} catch (e) { console.error("Lister: Error processing URI:", uriString, e); }
					}

					if (addedNewContentForThisDrop) {
						// Use the new command name for updating the lister text area
						panel.webview.postMessage({ command: 'updateListerList', text: listedContent });
					}
					return;

				case 'copyListerPaths':
					if (listedContent) {
						vscode.env.clipboard.writeText(listedContent);
						// vscode.window.showInformationMessage('Listed paths copied!'); // Replaced by webview feedback
						panel.webview.postMessage({ command: 'listerCopySuccess' }); // Send feedback
					} else { vscode.window.showWarningMessage('No paths listed.'); }
					return;
				case 'clearListerList':
					listedUniquePaths.clear();
					listedContent = "";
					panel.webview.postMessage({ command: 'updateListerList', text: '' });
					panel.webview.postMessage({ command: 'listerClearSuccess' }); // Send feedback
					return;
			}
		},
		undefined, context.subscriptions
	);

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
