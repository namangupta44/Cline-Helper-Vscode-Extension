// This script runs in the combined File and Folder Collector webview panel
(function () {
    const vscode = acquireVsCodeApi();

    // --- Get DOM Elements ---
    // Collector elements
    const dropZoneCollector = document.getElementById('drop-zone-collector');
    const collectedPathsTextArea = document.getElementById('collected-paths');
    const copyCollectorButton = document.getElementById('copy-collector-button');
    const clearCollectorButton = document.getElementById('clear-collector-button');
    const collectorFeedback = document.getElementById('collector-feedback');

    // Folder List Input elements (Middle Section)
    const dropZoneFolderListInput = document.getElementById('drop-zone-folder-list-input');
    const folderListInputTextArea = document.getElementById('folder-list-input');
    // const clearFolderListButton = document.getElementById('clear-folder-list-button'); // Removed
    const folderListFeedback = document.getElementById('folder-list-feedback');

    // Lister elements (Right Section)
    // const dropZoneLister = document.getElementById('drop-zone-lister'); // Removed
    const listedPathsTextArea = document.getElementById('listed-paths');
    const copyListerButton = document.getElementById('copy-lister-button');
    const clearListerButton = document.getElementById('clear-lister-button');
    const listerFeedback = document.getElementById('lister-feedback');

    // --- General Variables ---
    let feedbackTimeout; // To manage clearing feedback for all areas
    let processListTimeout; // To debounce processing folder list input
    const DEBOUNCE_DELAY = 500; // milliseconds

    // --- Feedback Function (handles multiple timeouts) ---
    const feedbackTimeouts = {}; // Store timeouts per element ID
    function showFeedback(element, message) {
        const elementId = element.id;
        if (feedbackTimeouts[elementId]) {
            clearTimeout(feedbackTimeouts[elementId]); // Clear existing timeout for this specific element
        }
        element.textContent = message;
        element.classList.add('visible');

        feedbackTimeouts[elementId] = setTimeout(() => {
            element.classList.remove('visible');
            // Optionally clear text after fade out:
            // setTimeout(() => { element.textContent = ''; }, 300); // Match CSS transition duration
        }, 2500); // Show feedback for 2.5 seconds
    }


    // --- State Handling ---
    // Restore state
    const previousState = vscode.getState() || { collectedText: '', folderListInputText: '', listedText: '' };
    collectedPathsTextArea.value = previousState.collectedText;
    folderListInputTextArea.value = previousState.folderListInputText; // Restore middle section
    listedPathsTextArea.value = previousState.listedText;

    // Function to save state
    function saveState() {
        vscode.setState({
            collectedText: collectedPathsTextArea.value,
            folderListInputText: folderListInputTextArea.value, // Save middle section
            listedText: listedPathsTextArea.value
        });
    }

    // Initial processing if there's restored text in the folder list input
    if (folderListInputTextArea.value.trim()) {
        vscode.postMessage({ command: 'processFolderList', text: folderListInputTextArea.value });
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

    // Setup for Collector Drop Zone (Left Section)
    setupDropZone(dropZoneCollector, 'addPaths');

    // Setup for Folder List Input Drop Zone (Middle Section)
    setupDropZone(dropZoneFolderListInput, 'addFoldersToListInput');

    // Setup for Lister Drop Zone (Right Section) - REMOVED
    // setupDropZone(dropZoneLister, 'addFolderPaths');

    // --- Button Handling ---

    // Collector Buttons
    copyCollectorButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'copyCollectorPaths' }); // Unique command
    });
    clearCollectorButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'clearCollectorList' }); // Unique command
        // State saved on update message
    });

    // Folder List Input Buttons (Middle Section) - Listener Removed
    // clearFolderListButton.addEventListener('click', () => { ... });

    // Folder List Input Textarea Listener (Middle Section)
    folderListInputTextArea.addEventListener('input', () => {
        clearTimeout(processListTimeout); // Clear previous debounce timeout
        processListTimeout = setTimeout(() => {
            const text = folderListInputTextArea.value;
            vscode.postMessage({ command: 'processFolderList', text: text });
            saveState(); // Save state on manual input change after debounce
        }, DEBOUNCE_DELAY);
    });


    // Lister Buttons (Right Section)
    copyListerButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'copyListerPaths' }); // Command remains the same
    });
    clearListerButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'clearListerList' }); // Command remains the same
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
            case 'updateFolderListInput': // New case for middle section textarea
                folderListInputTextArea.value = message.text;
                saveState();
                // Optionally trigger processing if needed, though usually done by drop/input
                // if (message.triggerProcess) {
                //     vscode.postMessage({ command: 'processFolderList', text: message.text });
                // }
                break;
            case 'updateListerList': // Right section textarea
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
            case 'folderListClearSuccess': // Feedback for middle section clear
                showFeedback(folderListFeedback, 'Folder list cleared.');
                break;
            case 'listerCopySuccess':
                showFeedback(listerFeedback, 'Listed paths copied!');
                break;
            case 'listerClearSuccess':
                showFeedback(listerFeedback, 'Listed paths cleared.');
                break;
            case 'processingError': // Generic error feedback
                 showFeedback(folderListFeedback, `Error: ${message.detail}`);
                 break;
            // Add more specific error feedback cases if needed
        }
    });

}());
