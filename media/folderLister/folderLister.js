// This script runs in the Folder Lister webview panel
(function () {
    const vscode = acquireVsCodeApi();
    const dropZone = document.getElementById('drop-zone-lister'); // Updated ID
    const listedPathsTextArea = document.getElementById('listed-paths'); // Updated ID
    const copyButton = document.getElementById('copy-lister-button'); // Updated ID
    const clearButton = document.getElementById('clear-lister-button'); // Get clear button

    // --- State Handling ---
    const previousState = vscode.getState();
    if (previousState && previousState.listedText) { // Use different state key
        listedPathsTextArea.value = previousState.listedText;
    }

    function saveState() {
        vscode.setState({ listedText: listedPathsTextArea.value }); // Use different state key
    }

    // --- Drag and Drop Handling ---

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('drag-over');

        if (event.dataTransfer) {
            const uriList = event.dataTransfer.getData('text/uri-list');
            if (uriList) {
                const uris = uriList.split('\n')
                                    .map(uri => uri.trim())
                                    .filter(uri => uri && !uri.startsWith('#'));
                if (uris.length > 0) {
                    // Send folder URIs to the extension host for processing
                    vscode.postMessage({ command: 'addFolderPaths', uris: uris }); // Updated command
                }
            } else {
                console.warn("Could not get 'text/uri-list'. Drag data:", event.dataTransfer.items);
            }
        }
    });

    // --- Button Handling ---

    copyButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'copyListedPaths' }); // Updated command
    });

    clearButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'clearListerList' });
        // State will be saved when the update message comes back
    });

    // --- Message Handling (from Extension Host) ---

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateListerContent': // Updated command
                listedPathsTextArea.value = message.text;
                saveState(); // Save state whenever the list is updated
                break;
        }
    });

}());
