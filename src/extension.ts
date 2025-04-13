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
			localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media', 'fileAndFolderCollector')],
			retainContextWhenHidden: true
		}
	);

	// State variables
	interface PathInfo { path: string; type: 'file' | 'folder'; }
	interface ListedGroup { source: string; files: PathInfo[]; }
	let collectedPaths: PathInfo[] = [];
	let folderInputText: string = ''; // State for the folder input textarea
	let listedPathsGrouped: ListedGroup[] = [];
	let revealCollectorState = false;
	let revealListerState = false;
	const listedUniquePaths = new Set<string>(); // Used during processing

	// Load the HTML
	panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri, 'fileAndFolderCollector');

	// Helper to resolve relative path (@/...) to a full URI
	function resolvePrefixedPath(prefixedPath: string): vscode.Uri | null {
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
		return null;
	}

	// Helper function to process the folder list (reads from folderInputText state)
	async function processAndListFolders() {
		listedPathsGrouped = []; // Clear previous grouped results
		listedUniquePaths.clear(); // Clear unique tracker for this run

		// Parse paths from the text area content
		const lines = folderInputText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
		const uniqueInputPaths = [...new Set(lines)]; // Deduplicate input lines

		for (const sourcePath of uniqueInputPaths) {
			// const sourcePath = folderInfo.path; // e.g., @/src/myFolder - No longer needed
			let folderUri = resolvePrefixedPath(sourcePath);

			if (!folderUri) {
				console.warn("Lister: Could not resolve folder path:", sourcePath);
				panel.webview.postMessage({ command: 'processingError', detail: `Could not resolve ${sourcePath}` });
				continue;
			}

			const currentGroupFiles: PathInfo[] = [];

			try {
				const stats = await vscode.workspace.fs.stat(folderUri);
				if (stats.type !== vscode.FileType.Directory) {
					console.warn("Lister ignoring non-directory found in input list:", folderUri.fsPath);
					panel.webview.postMessage({ command: 'processingError', detail: `${sourcePath} is not a directory.` });
					continue;
				}

				const filesInDir = await findFilesInDir(folderUri);

				filesInDir.forEach(fileUri => {
					const relativePath = vscode.workspace.asRelativePath(fileUri, false);
					const prefixedPath = `@/${relativePath}`;
					if (!listedUniquePaths.has(prefixedPath)) {
						listedUniquePaths.add(prefixedPath);
						currentGroupFiles.push({ path: prefixedPath, type: 'file' });
					}
				});

				if (currentGroupFiles.length > 0) {
					listedPathsGrouped.push({ source: sourcePath, files: currentGroupFiles });
				}

			} catch (e: any) {
				console.error("Lister: Error processing path:", sourcePath, e);
				panel.webview.postMessage({ command: 'processingError', detail: `Error processing ${sourcePath}: ${e.message}` });
			}
		}
		// Send the grouped list
		panel.webview.postMessage({ command: 'updateListerList', groupedPaths: listedPathsGrouped });
	}

	// Handle messages from the webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				// --- Collector Side Logic ---
				case 'addPaths':
					{
						const collectorUris: string[] = message.uris || [];
						const currentPathsSet = new Set(collectedPaths.map(p => p.path));
						let itemsAdded = false;
						for (const uriString of collectorUris) {
							try {
								const uri = vscode.Uri.parse(uriString);
								const relativePath = vscode.workspace.asRelativePath(uri, false);
								const prefixedPath = `@/${relativePath}`;
								if (!currentPathsSet.has(prefixedPath)) {
									const stats = await vscode.workspace.fs.stat(uri);
									const type: 'file' | 'folder' = (stats.type === vscode.FileType.Directory) ? 'folder' : 'file';
									collectedPaths.push({ path: prefixedPath, type: type });
									currentPathsSet.add(prefixedPath);
									itemsAdded = true;
								}
							} catch (e) { console.error("Collector: Error parsing/statting URI:", uriString, e); panel.webview.postMessage({ command: 'processingError', detail: `Error adding ${uriString}.` }); }
						}
						if (itemsAdded) { panel.webview.postMessage({ command: 'updateCollectorList', paths: collectedPaths }); }
					}
					return;
				case 'clearCollectorList':
					collectedPaths = [];
					panel.webview.postMessage({ command: 'updateCollectorList', paths: [] });
					return;

				// --- Folder List Input Logic ---
				case 'addFoldersToTextarea': // Renamed command
					{
						const folderUris: string[] = message.uris || [];
						const addedPaths: string[] = [];
						const currentInputLines = new Set(folderInputText.split('\n').map(l => l.trim()).filter(l => l.length > 0));

						for (const uriString of folderUris) {
							try {
								const uri = vscode.Uri.parse(uriString);
								const stats = await vscode.workspace.fs.stat(uri);
								if (stats.type === vscode.FileType.Directory) {
									const relativePath = vscode.workspace.asRelativePath(uri, false);
									const prefixedPath = `@/${relativePath}`;
									// Only add if not already present in the textarea
									if (!currentInputLines.has(prefixedPath)) {
										addedPaths.push(prefixedPath);
										currentInputLines.add(prefixedPath); // Add to set to prevent duplicates within the same drop
									}
								} else { console.warn("Ignoring non-directory dropped onto folder list:", uriString); panel.webview.postMessage({ command: 'processingError', detail: `${vscode.workspace.asRelativePath(uri, false)} is not a directory.` }); }
							} catch (e) { console.error("Folder Input: Error parsing/statting URI:", uriString, e); panel.webview.postMessage({ command: 'processingError', detail: `Error adding ${uriString}.` }); }
						}

						if (addedPaths.length > 0) {
							// Append new paths to the existing text, ensuring a newline if needed
							const separator = folderInputText.trim().length > 0 ? '\n' : '';
							folderInputText += separator + addedPaths.join('\n');
							// Send the full updated text back to the webview
							panel.webview.postMessage({ command: 'updateFolderListInput', text: folderInputText });
							// Trigger processing immediately
							await processAndListFolders();
						}
					}
					return;
				case 'processFolderListText': // New command for manual input
					folderInputText = message.text || '';
					await processAndListFolders(); // Process the new text
					// No need to send back updateFolderListInput, webview already has the text
					return;

				// --- Lister Results Logic ---
				case 'clearListerList':
					// Clears folder input text, lister output state, and unique tracker
					folderInputText = ''; // Clear text state
					listedPathsGrouped = [];
					listedUniquePaths.clear();
					panel.webview.postMessage({ command: 'updateFolderListInput', text: '' }); // Update input textarea
					panel.webview.postMessage({ command: 'updateListerList', groupedPaths: [] }); // Update output div
					return;

				// --- Common Handlers ---
				case 'setRevealState':
					if (message.section === 'collector') { revealCollectorState = message.state ?? false; }
					else if (message.section === 'lister') { revealListerState = message.state ?? false; }
					return;
				case 'openPath':
					{
						const { path: prefixedPath, type, reveal } = message;
						const targetUri = resolvePrefixedPath(prefixedPath);
						if (targetUri) {
							try {
								if (type === 'file') {
									await vscode.commands.executeCommand('vscode.open', targetUri, { preview: false });
									if (reveal) { await vscode.commands.executeCommand('revealInExplorer', targetUri); }
								} else if (type === 'folder') {
									await vscode.commands.executeCommand('revealInExplorer', targetUri);
								}
							} catch (err) { console.error(`Error opening ${type} ${prefixedPath}:`, err); vscode.window.showErrorMessage(`Could not open ${type}: ${prefixedPath}`); }
						} else { console.warn(`Could not resolve path: ${prefixedPath}`); vscode.window.showWarningMessage(`Could not resolve path: ${prefixedPath}`); }
					}
					return;
				case 'copyToClipboard':
					{
						const textToCopy = message.text;
						const feedbackCommand = message.feedbackCommand;
						if (textToCopy) {
							await vscode.env.clipboard.writeText(textToCopy);
							if (feedbackCommand) { panel.webview.postMessage({ command: feedbackCommand }); }
						} else { vscode.window.showWarningMessage('Nothing to copy.'); }
					}
					return;
			}
		},
		undefined, context.subscriptions
	);

	// Send initial state
	panel.webview.postMessage({ command: 'updateCollectorList', paths: collectedPaths });
	panel.webview.postMessage({ command: 'updateFolderListInput', text: folderInputText }); // Send initial folder input text
	panel.webview.postMessage({ command: 'updateListerList', groupedPaths: listedPathsGrouped });

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
