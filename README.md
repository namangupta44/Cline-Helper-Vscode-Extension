# Get Open Files & Path Collector Extension

This extension provides several tools for gathering file and folder paths within VS Code, accessible via the Activity Bar and editor tabs. All collected paths are prefixed with `@/`.

## Features

### 1. List Open Files (Sidebar Panel)

*   **Access:** Click the list icon (`$(list-unordered)`) in the Activity Bar on the far left. This opens the "Open Files List" panel in the sidebar.
*   **Functionality:**
    *   Click the "Get Open File List" button.
    *   The text area below the button will be populated with a list of all currently open files in your editor, prefixed with `@/`.
    *   The list is copyable directly from the text area.
*   **Navigation:** This panel also contains buttons to open the other two features ("File Path Collector" and "Folder Content Lister") in separate editor tabs.

### 2. File Path Collector (Editor Tab)

*   **Access:**
    *   Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) and run "Open File Path Collector".
    *   Alternatively, click the "Open File Collector Tab" button in the sidebar panel (Feature 1).
*   **Functionality:**
    *   A new editor tab titled "File Path Collector" opens.
    *   Drag files and/or folders from VS Code's Explorer or your operating system onto the designated "Drag files or folders here" area.
    *   The relative paths of the dropped items (prefixed with `@/`) are added to the text area below. Duplicates are automatically ignored.
    *   Click the "Copy Collected Paths" button to copy the entire list to your clipboard.
    *   Click the "Clear List" button to reset the collected paths in this tab.
*   **State:** The collected list persists even if you switch tabs and come back.

### 3. Folder Content Lister (Editor Tab)

*   **Access:**
    *   Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) and run "Open Folder Content Lister".
    *   Alternatively, click the "Open Folder Lister Tab" button in the sidebar panel (Feature 1).
*   **Functionality:**
    *   A new editor tab titled "Folder Content Lister" opens.
    *   Drag **folders** from VS Code's Explorer or your operating system onto the designated "Drag folders here..." area. (Dropped files are currently ignored by this feature).
    *   The extension recursively finds all files within the dropped folder(s), gets their relative paths (prefixed with `@/`), and adds them to the text area below.
    *   If you drop multiple folders, the file lists from each drop are separated by a blank line in the text area.
    *   Duplicate file paths across *all* drops are ignored (a file will only appear once in the final list).
    *   Click the "Copy Listed Paths" button to copy the entire generated list (including separators) to your clipboard.
    *   Click the "Clear List" button to reset the listed paths in this tab.
*   **State:** The listed content persists even if you switch tabs and come back.

## Code Structure

The extension code is organized as follows:

*   `src/`: Contains the main TypeScript extension code.
    *   `extension.ts`: The main activation file. It registers commands, registers the sidebar webview provider, and contains the logic for creating and managing the editor tab webview panels (Collector and Lister).
    *   `listOpenFiles/`: Code specific to the Sidebar Panel (Feature A).
        *   `ListOpenFilesWebViewProvider.ts`: Implements `vscode.WebviewViewProvider` to manage the sidebar panel's content and communication.
    *   `collector/`: (Currently empty, logic is in `extension.ts`'s `createCollectorPanel` function).
    *   `folderLister/`: (Currently empty, logic is in `extension.ts`'s `createFolderListerPanel` function).
*   `media/`: Contains static assets (HTML, CSS, JS) used within the webviews.
    *   `listOpenFiles/`: Assets for the Sidebar Panel (Feature A).
        *   `list-open-files.html` (Not present, HTML generated in provider)
        *   `list-open-files.css`
        *   `list-open-files.js`
    *   `collector/`: Assets for the File Path Collector tab (Feature B).
        *   `collector.html`
        *   `collector.css`
        *   `collector.js`
    *   `folderLister/`: Assets for the Folder Content Lister tab (Feature C).
        *   `folderLister.html`
        *   `folderLister.css`
        *   `folderLister.js`
*   `package.json`: The extension manifest file. Defines commands, activation events, UI contributions (Activity Bar icon, sidebar view), etc.
*   `out/`: Compiled JavaScript output (generated via `npm run compile`).

## How It Works

*   **Sidebar (Webview View):** Uses a `WebviewViewProvider` registered for the `list-open-files-view` ID defined in `package.json`. The provider generates HTML and handles message passing (`postMessage`, `onDidReceiveMessage`) with its corresponding script (`list-open-files.js`).
*   **Editor Tabs (Webview Panels):** Uses `vscode.window.createWebviewPanel` when the corresponding commands are run. Each panel loads HTML from the `media` folder and uses its specific JS file (`collector.js` or `folderLister.js`) for UI logic and message passing with `extension.ts`.
*   **Communication:** Webview scripts use `acquireVsCodeApi().postMessage({...})` to send data/commands to the extension host (`extension.ts`). The extension host uses `panel.webview.postMessage({...})` or `provider._view.webview.postMessage({...})` to send data back to the webviews.
*   **State Persistence:** The editor tabs (`collector`, `folderLister`) use `retainContextWhenHidden: true` during panel creation to request that VS Code keep the webview alive. The webview scripts (`collector.js`, `folderLister.js`) use `vscode.getState()` on load and `vscode.setState()` on update to persist the text area content across tab switches.
*   **Folder Reading:** The Folder Content Lister uses the asynchronous `vscode.workspace.fs` API (`stat`, `readDirectory`) to recursively find files within dropped directories.

**Enjoy!**
