// This script will be run within the webview panel for listing open files
(function () {
    const vscode = acquireVsCodeApi();

    const getFilesButton = document.getElementById('get-files-button');
    const fileListDiv = document.getElementById('file-list'); // Changed from textarea to div
    const openCombinedButton = document.getElementById('open-combined-button');
    const copyListButton = document.getElementById('copy-list-button');
    const clearListButton = document.getElementById('clear-list-button');

    // Handle "Get Open File List" button click
    getFilesButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'getOpenFiles' // Updated command name
        });
    });

    // Handle "Open File & Folder Collector" button click
    openCombinedButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'openCombinedCollector' // Send the new command
        });
    });

    // Handle "Copy" button click - Extract text from divs
    copyListButton.addEventListener('click', () => {
        const lines = [];
        fileListDiv.querySelectorAll('.clickable-path').forEach(div => {
            lines.push(div.textContent);
        });
        const textToCopy = lines.join('\n');
        if (textToCopy) {
            // Send text to extension for copying (reusing copyList command for simplicity, but sending text now)
            vscode.postMessage({
                command: 'copyList', // Keep command name, but behavior in extension might adapt
                text: textToCopy
            });
        }
    });

    // Handle "Clear" button click - Clear the div
    clearListButton.addEventListener('click', () => {
        fileListDiv.innerHTML = ''; // Clear UI immediately
        vscode.postMessage({
            command: 'clearList' // Tell extension to clear its state
        });
    });

    // --- Click Listener for Focusing Files ---
    fileListDiv.addEventListener('click', (event) => {
        // Check for Ctrl key (or Cmd key on Mac)
        if (!event.ctrlKey && !event.metaKey) {
            return;
        }

        const targetElement = event.target;
        // Check if the clicked element is one of our clickable paths
        if (targetElement.classList.contains('clickable-path')) {
            event.preventDefault(); // Prevent any default browser action
            const path = targetElement.dataset.path;

            if (path) {
                vscode.postMessage({
                    command: 'focusOpenFile',
                    path: path // Send the path (e.g., @/...)
                });
            }
        }
    });


    // Handle messages received from the extension host
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateList':
                fileListDiv.innerHTML = ''; // Clear previous results
                const fileListText = message.text || "";
                const paths = fileListText.split('\n').filter(p => p.trim() !== ''); // Split and remove empty lines

                if (paths.length === 0 || (paths.length === 1 && paths[0] === "No open files found.")) {
                    const noFilesDiv = document.createElement('div');
                    noFilesDiv.textContent = "No open files found.";
                    fileListDiv.appendChild(noFilesDiv);
                } else {
                    const fragment = document.createDocumentFragment();
                    paths.forEach(path => {
                        const div = document.createElement('div');
                        div.textContent = path;
                        div.classList.add('clickable-path');
                        div.dataset.path = path; // Store the path with @/ prefix
                        fragment.appendChild(div);
                    });
                    fileListDiv.appendChild(fragment);
                }
                break;
             // Add cases for copy/clear feedback if desired from extension
             // case 'copySuccess': showFeedback(...)
             // case 'clearSuccess': showFeedback(...)
        }
    });
}());
