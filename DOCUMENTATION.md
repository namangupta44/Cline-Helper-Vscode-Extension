# Cline Helper Extension: The Ultimate User Guide

Welcome to the Cline Helper extension! This guide is designed to be your comprehensive resource for understanding and using every feature of this powerful tool. We'll explore every button, every view, and every interaction so you know exactly what to expect.

## Getting Started: Accessing the Extension

First, you need to open the **Cline Helper** sidebar. You can find its icon in the VS Code activity bar on the left side of your screen. The icon is a simple unordered list symbol: `$(list-unordered)`.

Clicking this icon will reveal the main interface, which is neatly organized into three tabs: **OPEN FILES**, **SEARCHER**, and **COLLECTOR**.

---

## The Main Interface: An Overview

### The "Open in Editor" Button

Located at the top right of the sidebar is the **Open in Editor** button.

*   **What it's for**: If you feel the sidebar is too narrow for your work, especially when dealing with long lists of files in the **COLLECTOR** tab, this button is for you.
*   **How it works**: Clicking it will launch the entire Cline Helper interface in a new, full-sized editor tab. This gives you a much larger, more comfortable space to view and interact with the extension's features. All functionality remains the same.

### The Three Core Tabs

The extension is built around three powerful utilities, each accessible via its own tab. Let's dive into each one.

---

## 1. The "OPEN FILES" Tab

This feature provides a simple but essential utility: it gives you a clear, manageable list of all the files you currently have open.

### User Interface and Interaction

*   **`Get Open Files` Button**: This is the main action button for this tab. When you click it, the extension will immediately scan all your open editor tabs and display their file paths in the results area below.
*   **The Results List**:
    *   This is a read-only text area that shows the relative paths of your open files, with each file on a new line.
    *   **How to interact**: You can select and copy text from this box as you would with any other text.
    *   **Quick Navigation**: To jump to any file in the list, simply hold down the `Ctrl` key (or `Cmd` on a Mac) and click on its path. The extension will instantly switch focus to that file's tab in your editor.
*   **`Copy` Button**: A convenient one-click button to copy the entire list of file paths to your clipboard. This is perfect for creating documentation, sharing context with a colleague, or using the list in another application.
*   **`Clear` Button**: This button will instantly wipe the results list, allowing you to start fresh.

---

## 2. The "SEARCHER" Tab

The Searcher is a dynamic and intelligent tool for finding files and folders anywhere in your current workspace.

### User Interface and Interaction

*   **Search Input Field**: This is where you type your query. The search is performed in real-time; as you type, the results below will automatically update. There's no need to press Enter.
*   **`Match Case` Checkbox**: By default, the search is case-insensitive (e.g., `api` will find `API`). If you need a precise, case-sensitive search, simply check this box. The results will update immediately to reflect this change.
*   **The Results View**: This is where the magic happens. The results are not just a flat list; they are intelligently categorized:
    *   **Folders**: Any folders whose names contain your search term are listed first, under a "Folders" heading.
    *   **Files**: Below the folders, you'll find all the matching files under a "Files" heading.
    *   **Interaction**: Just like with the Open Files list, you can hold `Ctrl` (or `Cmd` on Mac) and click on any item. Clicking a file will open it, while clicking a folder will highlight and reveal it in the VS Code Explorer sidebar.
*   **Special Highlighting: "Outside Files"**:
    *   You may notice some file paths are displayed in a different color (usually red). This is a unique and powerful feature that identifies a file as being **"outside"** of the folders that were also found by your search.
    *   **Example**: Imagine you search for `Button`. The search finds a folder named `Button` and a file named `Button.stories.tsx` inside another folder. The `Button.stories.tsx` file would be highlighted in red, instantly telling you it's related but not part of the main `Button` component folder. This is excellent for discovering related files and understanding your codebase structure.

---

## 3. The "COLLECTOR" Tab

The Collector is the most advanced feature, designed for gathering, managing, and processing lists of file and folder paths. It is split into two distinct panels that can be used independently or together.

### Left Panel: "Collect File/Folder Paths"

This panel is your personal scratchpad for creating lists of file and folder paths.

*   **The Drop Zone**: The primary way to add items is to **drag and drop** them. You can select one or multiple files and folders from your VS Code Explorer and drop them directly onto the "Drag files or folders here" area. Their paths will be added to the results list below.
*   **The Results List**: This area displays all the paths you've collected. You can open any file or folder by holding `Ctrl` (or `Cmd` on Mac) and clicking on its path.
*   **Action Buttons**:
    *   **`Copy`**: Copies the complete list of collected paths to your clipboard.
    *   **`Clear`**: Empties the list of collected paths.

### Right Panel: "List Folder Contents"

This panel is a powerful utility for recursively finding all files within one or more folders.

*   **The Drop Zone and Text Area**: You have two ways to specify which folders to process:
    1.  **Drag and Drop**: Drag folders from the Explorer onto the drop zone.
    2.  **Manual Entry**: Type or paste the relative paths of folders directly into the text area below the drop zone. Make sure to put each path on a new line.
*   **The Results List**: This area updates automatically as you modify the folder list in the text area. For each folder you've provided, the extension will find every single file inside it (and inside all of its sub-folders) and display them.
    *   **Clear Grouping**: The results are neatly grouped under the path of the source folder they belong to, making it very easy to see which files came from where.
*   **Action Buttons**:
    *   **`Copy`**: Copies the entire list of the generated file paths (from all folder groups) to your clipboard.
    *   **`Clear`**: Clears both the list of folders in the text area and the entire results list below it.

We hope this detailed guide empowers you to use the Cline Helper extension to its full potential. Happy coding!
