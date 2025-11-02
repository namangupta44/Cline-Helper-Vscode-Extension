# Cline Helper Extension: The Ultimate User Guide

Welcome to the Cline Helper extension! This guide is designed to be your comprehensive resource for understanding and using every feature of this powerful tool. We'll explore every button, every view, and every interaction so you know exactly what to expect.

## Getting Started: Accessing the Extension

First, you need to open the **Cline Helper** sidebar. You can find its icon in the VS Code activity bar on the left side of your screen. The icon is a simple unordered list symbol: `$(list-unordered)`.

Clicking this icon will reveal the main interface, which is neatly organized into three tabs: **COLLECTOR**, **SEARCHER**, and **OPEN FILES**.

---

## The Main Interface: An Overview

### Header Buttons

Located at the top right of the sidebar are two important buttons:

*   **Settings (`$(gear)`)**: This opens a comprehensive settings panel where you can customize the behavior of all features. We'll cover this in detail in the next section.
*   **Open in Editor (`$(multiple-windows)`)**: If you feel the sidebar is too narrow for your work, this button will launch the entire Cline Helper interface in a new, full-sized editor tab. This gives you a much larger, more comfortable space to view and interact with the extension's features.

---

## The Settings Panel

Clicking the **Settings** (`$(gear)`) button opens a modal window with two tabs: **GENERAL** and **EXCLUDE**.

### The "GENERAL" Tab

This tab controls how file and folder paths are displayed throughout the extension.

*   **`Show Full Path` Checkbox**: When checked, all features will display the full, absolute path for files and folders (e.g., `/Users/your-name/project/src/component.js`). When unchecked, it will show the path relative to your workspace root (e.g., `src/component.js`).
*   **`Add Prefix` Checkbox and Text Field**: This allows you to add a custom string to the beginning of every path displayed.
    *   Check the **`Add Prefix`** box to enable the feature.
    *   Enter your desired text (e.g., `file:`, `context: `) into the text field. This is useful for formatting lists of files for prompts or documentation.

### The "EXCLUDE" Tab

This tab gives you powerful control to filter out unwanted files and folders from the results of each feature, using `.gitignore`-style patterns.

*   **`Enable Exclude Filters` Checkbox**: This is the master switch. If this is unchecked, all exclude patterns are ignored.
*   **Exclude from COLLECTOR**: Enter patterns here to exclude files from the "List Folder Contents" panel.
*   **Exclude from SEARCHER**: Enter patterns here to exclude files and folders from the "File Name Searcher" results.
*   **Exclude from OPEN FILES**: Enter patterns here to hide certain files from the "Open Files" list.

---

## The Three Core Tabs

The extension is built around three powerful utilities, each accessible via its own tab.

### 1. The "COLLECTOR" Tab

The Collector is the most advanced feature, designed for gathering, managing, and processing lists of file and folder paths. It is split into two distinct panels.

#### Left Panel: "Collect File/Folder Paths"

This panel is your personal scratchpad for creating lists of paths.

*   **The Drop Zone**: **Drag and drop** files and folders from your VS Code Explorer directly onto this area to add their paths to the list below.
*   **Action Buttons**: `Copy` the collected list or `Clear` it.

#### Right Panel: "List Folder Contents"

This panel recursively finds all files within one or more folders.

*   **The Drop Zone and Text Area**: Drag folders onto the drop zone, or type/paste their relative paths into the text area below (one path per line).
*   **The Results List**: This area automatically updates, showing every file found within the specified folders. The results are grouped by the source folder.
*   **Action Buttons**: `Copy` the generated list of files or `Clear` both the input and the results.

### 2. The "SEARCHER" Tab

The Searcher is a dynamic tool for finding files and folders anywhere in your current workspace.

### User Interface and Interaction

*   **Search Input Field**: Type your query here. The results update in real-time as you type.
*   **`Match Case` Checkbox**: Check this for a case-sensitive search.
*   **The Results View**: Results are categorized into "Folders" and "Files". You can `Ctrl/Cmd + Click` any item to open it or reveal it in the Explorer.
*   **"Outside Files" Highlighting**: Some file paths may appear in red. This indicates the file is **"outside"** of the primary folders found in the same search. For example, searching for `Button` might find a `Button` folder and a `Button.stories.tsx` file in a different directory. The story file would be highlighted, helping you discover related files.

### 3. The "OPEN FILES" Tab

This tab provides a simple utility: it gives you a clear list of all the files you currently have open in your editor.

### User Interface and Interaction

*   **`Get Open Files` Button**: Click this to scan your open tabs and display their paths in the results area.
*   **The Results List**: A read-only list of your open files. You can `Ctrl/Cmd + Click` a path to jump directly to that file.
*   **`Copy` Button**: Copies the entire list to your clipboard.
*   **`Clear` Button**: Wipes the results list.

We hope this detailed guide empowers you to use the Cline Helper extension to its full potential. Happy coding!
