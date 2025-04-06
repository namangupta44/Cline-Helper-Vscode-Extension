// This script runs in the Collector webview panel
(function () {
    const vscode = acquireVsCodeApi();
    const dropZone = document.getElementById('drop-zone');
    const collectedPathsTextArea = document.getElementById('collected-paths');
    const copyButton = document.getElementById('copy-button');
    const clearButton = document.getElementById('clear-collector-button');

    // --- State Handling ---
    // Try to restore state when the script loads (e.g., after tab becomes visible again)
    const previousState = vscode.getState();
    if (previousState && previousState.collectedText) {
        collectedPathsTextArea.value = previousState.collectedText;
    }

    // Function to save state
    function saveState() {
        vscode.setState({ collectedText: collectedPathsTextArea.value });
    }

    // --- Drag and Drop Handling ---

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessary to allow drop
        event.stopPropagation();
        dropZone.classList.add('drag-over'); // Add highlight class
    });

    dropZone.addEventListener('dragleave', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('drag-over'); // Remove highlight class
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('drag-over');

        if (event.dataTransfer) {
            // Try to get the standard 'text/uri-list' first
            const uriList = event.dataTransfer.getData('text/uri-list');
            if (uriList) {
                // Split by lines and filter out empty ones or comments
                const uris = uriList.split('\n')
                                    .map(uri => uri.trim())
                                    .filter(uri => uri && !uri.startsWith('#'));
                if (uris.length > 0) {
                    vscode.postMessage({ command: 'addPaths', uris: uris });
                }
            } else {
                // Fallback or alternative methods might be needed depending on OS/source
                console.warn("Could not get 'text/uri-list'. Drag data:", event.dataTransfer.items);
                // Potentially iterate through event.dataTransfer.items if needed
            }
        }
    });

    // --- Button Handling ---

    copyButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'copyPaths' });
    });

    clearButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'clearCollectorList' });
        // State will be saved when the update message comes back
    });

    // --- Message Handling (from Extension Host) ---

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateCollectorList':
                collectedPathsTextArea.value = message.text;
                saveState(); // Save state whenever the list is updated
                break;
        }
    });

}());
