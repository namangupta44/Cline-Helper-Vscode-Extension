// This script runs in the combined File and Folder Collector webview panel
(function () {
    const vscode = acquireVsCodeApi();

    // --- Get DOM Elements ---
    // Collector elements
    const dropZoneCollector = document.getElementById('drop-zone-collector');
    const collectedPathsTextArea = document.getElementById('collected-paths');
    const copyCollectorButton = document.getElementById('copy-collector-button');
    const clearCollectorButton = document.getElementById('clear-collector-button');

    // Lister elements
    const dropZoneLister = document.getElementById('drop-zone-lister');
    const listedPathsTextArea = document.getElementById('listed-paths');
    const copyListerButton = document.getElementById('copy-lister-button');
    const clearListerButton = document.getElementById('clear-lister-button');

    // --- State Handling ---
    // Restore state
    const previousState = vscode.getState() || { collectedText: '', listedText: '' };
    collectedPathsTextArea.value = previousState.collectedText;
    listedPathsTextArea.value = previousState.listedText;

    // Function to save state
    function saveState() {
        vscode.setState({
            collectedText: collectedPathsTextArea.value,
            listedText: listedPathsTextArea.value
        });
    }

    // --- Drag and Drop Handling ---

    function setupDropZone(dropZone, commandToSend) {
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
                const uriList = event.dataTransfer.getData('text/uri-list');
                if (uriList) {
                    const uris = uriList.split('\n')
                                        .map(uri => uri.trim())
                                        .filter(uri => uri && !uri.startsWith('#'));
                    if (uris.length > 0) {
                        vscode.postMessage({ command: commandToSend, uris: uris });
                    }
                } else {
                    console.warn("Could not get 'text/uri-list'. Drag data:", event.dataTransfer.items);
                }
            }
        });
    }

    // Setup for Collector Drop Zone
    setupDropZone(dropZoneCollector, 'addPaths'); // Command for collector

    // Setup for Lister Drop Zone
    setupDropZone(dropZoneLister, 'addFolderPaths'); // Command for lister

    // --- Button Handling ---

    // Collector Buttons
    copyCollectorButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'copyCollectorPaths' }); // Unique command
    });
    clearCollectorButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'clearCollectorList' }); // Unique command
        // State saved on update message
    });

    // Lister Buttons
    copyListerButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'copyListerPaths' }); // Unique command
    });
    clearListerButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'clearListerList' }); // Unique command
        // State saved on update message
    });

    // --- Message Handling (from Extension Host) ---

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateCollectorList':
                collectedPathsTextArea.value = message.text;
                saveState(); // Save state whenever the list is updated
                break;
            case 'updateListerList': // Use distinct command for lister
                listedPathsTextArea.value = message.text;
                saveState(); // Save state whenever the list is updated
                break;
        }
    });

}());
