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

    // Feedback elements
    const collectorFeedback = document.getElementById('collector-feedback');
    const listerFeedback = document.getElementById('lister-feedback');
    let feedbackTimeout; // To manage clearing feedback

    // --- Feedback Function ---
    function showFeedback(element, message) {
        clearTimeout(feedbackTimeout); // Clear any existing timeout
        element.textContent = message;
        element.classList.add('visible');

        feedbackTimeout = setTimeout(() => {
            element.classList.remove('visible');
            // Optionally clear text after fade out:
            // setTimeout(() => { element.textContent = ''; }, 300); // Match CSS transition duration
        }, 2500); // Show feedback for 2.5 seconds
    }


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
                let uriList = null;
                // Prioritize the VS Code specific type for editor tab drags
                if (event.dataTransfer.types.includes('application/vnd.code.uri-list')) {
                    uriList = event.dataTransfer.getData('application/vnd.code.uri-list');
                    console.log("Processing 'application/vnd.code.uri-list'");
                }
                // Fallback to the standard type for file/folder drags from explorer/OS
                else if (event.dataTransfer.types.includes('text/uri-list')) {
                    uriList = event.dataTransfer.getData('text/uri-list');
                    console.log("Processing 'text/uri-list'");
                }

                if (uriList) {
                    const uris = uriList.split('\n')
                                        .map(uri => uri.trim())
                                        .filter(uri => uri && !uri.startsWith('#')); // Filter out empty lines/comments
                    if (uris.length > 0) {
                        vscode.postMessage({ command: commandToSend, uris: uris });
                    } else {
                        console.warn("URI list was empty after filtering.");
                    }
                } else {
                    console.warn("Could not find 'application/vnd.code.uri-list' or 'text/uri-list' in dataTransfer types:", event.dataTransfer.types);
                }
            } else {
                console.warn("No dataTransfer object found in drop event.");
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
            // List Updates
            case 'updateCollectorList':
                collectedPathsTextArea.value = message.text;
                saveState();
                break;
            case 'updateListerList':
                listedPathsTextArea.value = message.text;
                saveState();
                break;

            // Feedback Messages
            case 'collectorCopySuccess':
                showFeedback(collectorFeedback, 'Collected paths copied!');
                break;
            case 'collectorClearSuccess':
                showFeedback(collectorFeedback, 'Collected list cleared.');
                break;
            case 'listerCopySuccess':
                showFeedback(listerFeedback, 'Listed paths copied!');
                break;
            case 'listerClearSuccess':
                showFeedback(listerFeedback, 'Listed paths cleared.');
                break;
            // Add cases for potential error feedback if needed
        }
    });

}());
