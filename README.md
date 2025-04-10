# Get Open Files, Path Collector & File Name Searcher Extension

This extension provides several tools for gathering file and folder paths within VS Code, accessible via the Activity Bar and editor tabs. All collected paths are prefixed with `@/`. It also includes a tool to search for files and folders by name.

## Features

### 1. List Open Files (Sidebar Panel)

*   **Access:** Click the list icon (`$(list-unordered)`) in the Activity Bar on the far left. This opens the "Open Files List" panel in the sidebar.
*   **Functionality:**
    *   Click the "Get Open File List" button.
    *   The text area below the button will be populated with a list of all currently open files in your editor, prefixed with `@/`.
    *   The list is copyable directly from the text area.
*   **Navigation:** This panel also contains a button to open the "File and Folder Collector" feature in an editor tab.

### 2. File and Folder Collector (Editor Tab)

*   **Access:**
    *   Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) and run "Open File and Folder Collector".
    *   Alternatively, click the "Open File & Folder Collector" button in the sidebar panel (Feature 1).
    *   **Functionality:**
    *   A new editor tab titled "File and Folder Collector" opens, displaying two sections side-by-side.
    *   **Left Section (Collect Paths):**
        *   Drag files and/or folders from VS Code's Explorer, your operating system, **or directly from an open editor tab** onto the "Drag files or folders here" area.
        *   The relative paths of the dropped items (prefixed with `@/`) are added to the "Collected Paths" text area below. Duplicates are automatically ignored.
        *   Click "Copy" to copy the collected list.
        *   Click "Clear" to reset the collected list.
    *   **Right Section (List Folder Contents):**
        *   Drag **folders** from VS Code's Explorer or your operating system onto the "Drag folders here to list contents" area. (Dropped files are ignored in this section).
        *   The extension recursively finds all files within the dropped folder(s), gets their relative paths (prefixed with `@/`), and adds them to the "Listed File Paths" text area below.
        *   If you drop multiple folders, the file lists from each drop are separated by a blank line.
        *   Duplicate file paths across *all* drops are ignored.
        *   Click "Copy" to copy the generated list.
        *   Click "Clear" to reset the listed paths.
*   **State:** The content of both text areas persists even if you switch tabs and come back.

### 3. File Name Searcher (Sidebar Panel)

*   **Access:** Click the list icon (`$(list-unordered)`) in the Activity Bar on the far left. This opens the "Open Files List" container in the sidebar, where the "File Name Searcher" view is located.
*   **Functionality:**
    *   Enter a part of a file or folder name into the input box. The search will begin automatically as you type (after a brief pause).
    *   Optionally, check the "Match Case" box for case-sensitive searching (default is case-insensitive). Changing this checkbox also triggers a new search.
    *   The text area below will be populated with the relative paths of all matching files and folders found within the workspace (excluding `node_modules` and `.git`).
    *   Results are prefixed with `@/` and separated into `--- Folders ---` and `--- Files ---` sections.
    *   Click the "Copy" button to copy the entire results list to your clipboard.
    *   Click the "Clear" button to clear the search input and results.

## Code Structure

The extension code is organized as follows:

*   `src/`: Contains the main TypeScript extension code.
    *   `extension.ts`: The main activation file. It registers commands, registers the sidebar webview providers, and contains the logic for creating and managing the editor tab webview panel (`createFileAndFolderCollectorPanel`).
    *   `listOpenFiles/`: Code specific to the "Open Files List" Sidebar Panel (Feature 1).
        *   `ListOpenFilesWebViewProvider.ts`: Implements `vscode.WebviewViewProvider`.
    *   `fileNameSearcher/`: Code specific to the "File Name Searcher" sidebar panel (Feature 3).
        *   `FileNameSearcherWebViewProvider.ts`: Implements `vscode.WebviewViewProvider`.
    *   `folderLister/`: (This directory is no longer used for the primary feature logic, but contains the `findFilesInDir` helper function called by `extension.ts`).
*   `media/`: Contains static assets (HTML, CSS, JS) used within the webviews.
    *   `listOpenFiles/`: Assets for the "Open Files List" Sidebar Panel (Feature 1).
        *   `list-open-files.css`
        *   `list-open-files.js`
    *   `fileAndFolderCollector/`: Assets for the combined Editor Tab (Feature 2).
        *   `fileAndFolderCollector.html`
        *   `fileAndFolderCollector.css`
        *   `fileAndFolderCollector.js`
    *   `fileNameSearcher/`: Assets for the "File Name Searcher" panel (Feature 3).
        *   `fileNameSearcher.html`
        *   `fileNameSearcher.css`
        *   `fileNameSearcher.js`
*   `package.json`: The extension manifest file. Defines commands, activation events, UI contributions (Activity Bar icon, sidebar view), etc.
*   `out/`: Compiled JavaScript output (generated via `npm run compile`).

## How It Works

*   **Sidebar (Webview Views):** Uses `WebviewViewProvider` implementations (`ListOpenFilesWebViewProvider`, `FileNameSearcherWebViewProvider`) registered for their respective view IDs in `package.json`. Providers generate HTML and handle message passing with their scripts.
*   **Editor Tab (Webview Panel):** Uses `vscode.window.createWebviewPanel` when the `get-open-files.openFileAndFolderCollector` command is run. The panel loads HTML from `media/fileAndFolderCollector/fileAndFolderCollector.html` and uses `fileAndFolderCollector.js` for UI logic and message passing with `extension.ts`.
*   **Communication:** Webview scripts use `acquireVsCodeApi().postMessage({...})` to send data/commands to the extension host (`extension.ts`). The extension host uses `panel.webview.postMessage({...})` or `provider._view.webview.postMessage({...})` to send data back to the webviews.
*   **State Persistence:** The "File and Folder Collector" editor tab uses `retainContextWhenHidden: true` during panel creation. The `fileAndFolderCollector.js` script uses `vscode.getState()` on load and `vscode.setState()` on update to persist the content of both text areas across tab switches.
*   **Folder Reading:** The `createFileAndFolderCollectorPanel` function in `extension.ts` uses the asynchronous `vscode.workspace.fs` API (`stat`, `readDirectory`) via the `findFilesInDir` helper function to recursively find files within dropped directories for the lister section.

**Enjoy!**
