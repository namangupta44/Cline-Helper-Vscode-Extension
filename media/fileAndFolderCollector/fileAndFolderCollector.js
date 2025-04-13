// This script runs in the combined File and Folder Collector webview panel
(function () {
    const vscode = acquireVsCodeApi();

    // --- Get DOM Elements ---
    // Collector elements
    const dropZoneCollector = document.getElementById('drop-zone-collector');
    const collectedPathsDiv = document.getElementById('collected-paths'); // Changed
    const revealCollectorCheckbox = document.getElementById('reveal-file-checkbox-collector'); // Added
    const copyCollectorButton = document.getElementById('copy-collector-button');
    const clearCollectorButton = document.getElementById('clear-collector-button');
    const collectorFeedback = document.getElementById('collector-feedback');

    // Folder List Input elements (Middle Section)
    const dropZoneFolderListInput = document.getElementById('drop-zone-folder-list-input');
    const folderListInput = document.getElementById('folder-list-input'); // Changed from div to textarea
    // Removed clearFolderListButton and folderListFeedback variables

    // Lister elements (Right Section)
    // const dropZoneLister = document.getElementById('drop-zone-lister'); // Removed
    const listedPathsDiv = document.getElementById('listed-paths'); // Changed
    const revealListerCheckbox = document.getElementById('reveal-file-checkbox-lister'); // Added
    const copyListerButton = document.getElementById('copy-lister-button');
    const clearListerButton = document.getElementById('clear-lister-button');
    const listerFeedback = document.getElementById('lister-feedback');

    // --- General Variables ---
    let feedbackTimeout; // To manage clearing feedback for all areas
    let processFolderListTextTimeout; // Renamed debounce timeout for clarity
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
    // Restore state - Folder input is now text
    const previousState = vscode.getState() || {
        collectedPaths: [],     // Expecting array of { path: string, type: 'file'|'folder' }
        folderInputText: '',    // Expecting string for the textarea
        listedPathsGrouped: [], // Expecting array of { source: string, files: [{ path: string, type: 'file' }] }
        revealCollector: false,
        revealLister: false
    };
    // Render restored paths/text
    renderPaths(collectedPathsDiv, previousState.collectedPaths || []);
    folderListInput.value = previousState.folderInputText || ''; // Restore textarea content
    renderListedPathsGrouped(listedPathsDiv, previousState.listedPathsGrouped || []); // Render grouped lister paths
    // Restore checkbox states
    revealCollectorCheckbox.checked = previousState.revealCollector ?? false;
    revealListerCheckbox.checked = previousState.revealLister ?? false;

    // Function to save state - Saves folder input text
    function saveState() {
        // Extract path data from the DOM to save
        const collectedPathsData = extractPathsFromDiv(collectedPathsDiv);
        // Note: Saving listedPathsGrouped might be complex if derived from DOM.
        // It's better if the extension sends the canonical grouped data on update,
        // and we just save *that* data structure when it arrives (or on clear).
        // For now, we'll save what's extractable, but rely on extension updates.
        const listedPathsData = extractPathsFromDiv(listedPathsDiv); // Still extract flat list for potential partial restore

        vscode.setState({
            collectedPaths: collectedPathsData,
            folderInputText: folderListInput.value, // Save textarea content
            // listedPathsGrouped: ??? // Ideally save the structure received from extension
            listedPaths: listedPathsData, // Save flat list as fallback
            revealCollector: revealCollectorCheckbox.checked,
            revealLister: revealListerCheckbox.checked
        });
    }

    // Helper to extract path data from rendered divs (used for collector and lister results)
    function extractPathsFromDiv(container) {
        const paths = [];
        container.querySelectorAll('.clickable-path').forEach(div => {
            paths.push({
                path: div.dataset.path,
                type: div.dataset.type
            });
        });
        return paths;
    }

    // --- Path Rendering Function (for Collector and Lister results) ---
    function renderPaths(containerElement, pathsData) {
        containerElement.innerHTML = ''; // Clear previous content
        if (!pathsData || pathsData.length === 0) {
            return; // Nothing to render
        }

        const fragment = document.createDocumentFragment();
        pathsData.forEach(item => {
            if (!item || !item.path) return; // Skip invalid items

            const div = document.createElement('div');
            div.textContent = item.path; // Display the path text
            div.classList.add('clickable-path');
            div.dataset.path = item.path; // Store full path
            // Ensure type is stored, default to 'file' if missing
            div.dataset.type = item.type || 'file';

            fragment.appendChild(div);
        });
        containerElement.appendChild(fragment);
    }

    // --- Path Rendering Function for Grouped Lister Data ---
    function renderListedPathsGrouped(containerElement, groupedData) {
        containerElement.innerHTML = ''; // Clear previous content
        if (!groupedData || groupedData.length === 0) {
            return; // Nothing to render
        }

        const fragment = document.createDocumentFragment();
        groupedData.forEach((group, index) => {
            // Add separator before the second group onwards
            if (index > 0) {
                const separator = document.createElement('div');
                separator.style.height = '0.5em'; // Creates a visual gap like a blank line
                fragment.appendChild(separator);
            }

            // Render files within the group
            if (group.files && group.files.length > 0) {
                group.files.forEach(item => {
                    if (!item || !item.path) return; // Skip invalid items

                    const div = document.createElement('div');
                    div.textContent = item.path; // Display the path text
                    div.classList.add('clickable-path');
                    div.dataset.path = item.path; // Store full path
                    div.dataset.type = item.type || 'file'; // Store type

                    fragment.appendChild(div);
                });
            }
        });
        containerElement.appendChild(fragment);
    }

    // Initial processing is now handled by restoring state and rendering
    // Send initial checkbox states and folder text to extension
    vscode.postMessage({ command: 'setRevealState', section: 'collector', state: revealCollectorCheckbox.checked });
    vscode.postMessage({ command: 'setRevealState', section: 'lister', state: revealListerCheckbox.checked });
    // Send initial folder text to extension for processing if not empty
    if (folderListInput.value.trim()) {
        vscode.postMessage({ command: 'processFolderListText', text: folderListInput.value });
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
                    const uris = uriList.split('\r\n') // Use \r\n for Windows URI lists
                                        .map(uri => uri.trim())
                                        .filter(uri => uri && !uri.startsWith('#') && uri.startsWith('file:///')); // Filter out empty lines/comments and ensure they are file URIs
                    if (uris.length > 0) {
                        // Send URIs to the extension to get path and type info
                        vscode.postMessage({ command: commandToSend, uris: uris });
                    } else {
                        console.warn("URI list was empty or contained non-file URIs after filtering.");
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

    // Setup for Folder List Input Drop Zone (Middle Section) - Appends to textarea
    setupDropZone(dropZoneFolderListInput, 'addFoldersToTextarea'); // Changed command

    // Setup for Lister Drop Zone (Right Section) - REMOVED

    // --- Button Handling ---

    // Collector Buttons & Checkbox
    copyCollectorButton.addEventListener('click', () => {
        const textToCopy = extractPathsFromDiv(collectedPathsDiv).map(p => p.path).join('\n');
        vscode.postMessage({ command: 'copyToClipboard', text: textToCopy, feedbackCommand: 'collectorCopySuccess' });
    });
    clearCollectorButton.addEventListener('click', () => {
        collectedPathsDiv.innerHTML = ''; // Clear UI
        vscode.postMessage({ command: 'clearCollectorList' }); // Tell extension to clear its state
        saveState(); // Save cleared state
    });
    revealCollectorCheckbox.addEventListener('change', () => {
        vscode.postMessage({ command: 'setRevealState', section: 'collector', state: revealCollectorCheckbox.checked });
        saveState();
    });

    // Folder List Input Textarea & Clear Button (Middle Section)
    folderListInput.addEventListener('input', () => {
        // Debounce sending the text to the extension
        clearTimeout(processFolderListTextTimeout);
        processFolderListTextTimeout = setTimeout(() => {
            vscode.postMessage({ command: 'processFolderListText', text: folderListInput.value });
            saveState(); // Save state after sending
        }, DEBOUNCE_DELAY);
    });

    // Removed clearFolderListButton event listener

    // Lister Buttons & Checkbox (Right Section)
    copyListerButton.addEventListener('click', () => {
        const textToCopy = extractPathsFromDiv(listedPathsDiv).map(p => p.path).join('\n');
        vscode.postMessage({ command: 'copyToClipboard', text: textToCopy, feedbackCommand: 'listerCopySuccess' });
    });
    clearListerButton.addEventListener('click', () => {
        // Clear both the lister results and the folder input list
        listedPathsDiv.innerHTML = ''; // Clear lister UI
        folderListInput.value = ''; // Clear folder input UI
        vscode.postMessage({ command: 'clearListerList' }); // Tell extension to clear lister state
        vscode.postMessage({ command: 'processFolderListText', text: '' }); // Tell extension to process empty folder list
        saveState(); // Save cleared state for both
    });
    revealListerCheckbox.addEventListener('change', () => {
        vscode.postMessage({ command: 'setRevealState', section: 'lister', state: revealListerCheckbox.checked });
        saveState();
    });

    // --- Click Listener for Opening Paths ---
    function handlePathClick(event) {
        // Check for Ctrl key (or Cmd key on Mac)
        if (!event.ctrlKey && !event.metaKey) {
            return;
        }

        const targetElement = event.target;
        // Check if the clicked element is one of our clickable paths
        if (targetElement.classList.contains('clickable-path')) {
            event.preventDefault(); // Prevent any default browser action
            const relativePath = targetElement.dataset.path;
            const type = targetElement.dataset.type; // 'file' or 'folder'
            const section = targetElement.closest('.results-display').dataset.section; // 'collector', 'lister', or 'folderInput'

            if (relativePath && type && section) {
                let reveal = false;
                // Determine reveal state based on section
                if (type === 'file') { // Only files use the reveal checkbox
                     reveal = (section === 'collector') ? revealCollectorCheckbox.checked : revealListerCheckbox.checked;
                }

                // Folders (type 'folder') are always revealed, files depend on checkbox
                vscode.postMessage({
                    command: 'openPath',
                    path: relativePath,
                    type: type,
                    reveal: (type === 'folder') ? true : reveal // Force reveal for folders
                });
            }
        }
    }

    collectedPathsDiv.addEventListener('click', handlePathClick);
    listedPathsDiv.addEventListener('click', handlePathClick);
    // folderListInputDiv.addEventListener('click', handlePathClick); // Removed listener from old div

    // --- Message Handling (from Extension Host) ---

    // --- Message Handling (from Extension Host) ---

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            // List Updates (Expecting structured data now)
            case 'updateCollectorList':
                renderPaths(collectedPathsDiv, message.paths || []);
                saveState(); // Save after update
                break;
            case 'updateFolderListInput': // Now updates the textarea value
                folderListInput.value = message.text || ''; // Set textarea content
                saveState(); // Save after update
                // Processing is triggered by the extension after receiving the text
                break;
            case 'updateListerList': // Expects grouped data
                renderListedPathsGrouped(listedPathsDiv, message.groupedPaths || []);
                // TODO: How to save grouped state effectively? Maybe store the received message.groupedPaths?
                // For now, saveState() will save the flat representation from the DOM as a fallback.
                saveState();
                break;

            // Feedback Messages
            // Feedback Messages (Triggered by copyToClipboard response or clear actions)
            case 'collectorCopySuccess':
                showFeedback(collectorFeedback, 'Collected paths copied!');
                break;
            case 'collectorClearSuccess': // Can be triggered by extension if needed, or just rely on UI feedback
                showFeedback(collectorFeedback, 'Collected list cleared.');
                break;
            // Removed folderListClearSuccess case
            case 'listerCopySuccess':
                showFeedback(listerFeedback, 'Listed paths copied!');
                break;
            case 'listerClearSuccess': // Can be triggered by extension if needed
                showFeedback(listerFeedback, 'Listed paths cleared.');
                break;
            case 'processingError': // Generic error feedback for folder listing
                 // Decide where to show processing errors now. Maybe listerFeedback?
                 showFeedback(listerFeedback, `Error: ${message.detail}`); // Changed to listerFeedback
                 break;
            // Potentially add feedback for path opening errors if needed
            // Add more specific error feedback cases if needed
        }
    });

}());
