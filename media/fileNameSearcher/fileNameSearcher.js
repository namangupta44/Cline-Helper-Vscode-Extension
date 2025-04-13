// @ts-ignore because vscode-webview-ui-toolkit is not available in this context
// @ts-ignore because vscode-webview-ui-toolkit is not available in this context
const vscode = acquireVsCodeApi();

const searchInput = document.getElementById('search-input');
const matchCaseCheckbox = document.getElementById('match-case-checkbox');
const revealFileCheckbox = document.getElementById('reveal-file-checkbox'); // Get reveal checkbox
// const searchButton = document.getElementById('search-button'); // Removed
const clearButton = document.getElementById('clear-button');
const resultsArea = document.getElementById('results-area'); // Now a div
const copyButton = document.getElementById('copy-button');

// --- Debounce Function ---
let debounceTimer;
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// --- Search Function ---
function performSearch() {
    const searchTerm = searchInput.value;
    // Trigger search even if the term is empty, allowing the backend to clear results or show all
    vscode.postMessage({
        command: 'search',
        term: searchTerm,
        matchCase: matchCaseCheckbox.checked // Send checkbox state
    });
}

// Debounced search trigger
const debouncedSearch = debounce(performSearch, 300); // 300ms delay

// --- Event Listeners ---

searchInput.addEventListener('input', debouncedSearch); // Trigger search on input change
matchCaseCheckbox.addEventListener('change', performSearch); // Trigger search immediately on checkbox change
revealFileCheckbox.addEventListener('change', () => {
    // Notify provider about the state change
    vscode.postMessage({
        command: 'setRevealState',
        state: revealFileCheckbox.checked
    });
});

copyButton.addEventListener('click', () => {
    // Reconstruct the text content from the clickable divs inside resultsArea
    const lines = [];
    // Select only the divs that represent actual results (have data-path)
    const resultNodes = resultsArea.querySelectorAll('div[data-path]');
    let currentType = null;
    resultNodes.forEach(node => {
        const nodeType = node.dataset.type;
        // Add headers if type changes
        if (nodeType !== currentType) {
            if (currentType !== null) lines.push(''); // Add blank line between sections
            lines.push(`--- ${nodeType === 'folder' ? 'Folders' : 'Files'} ---`);
            currentType = nodeType;
        }
        lines.push(node.textContent);
    });
    const textToCopy = lines.join('\n');

    if (textToCopy) {
        vscode.postMessage({
            command: 'copy',
            text: textToCopy
        });
    }
});

clearButton.addEventListener('click', () => {
    searchInput.value = '';
    resultsArea.innerHTML = ''; // Clear the div content
    matchCaseCheckbox.checked = false; // Also reset checkbox
    // Notify the backend provider that the state has been cleared
    vscode.postMessage({ command: 'clearSearch' });
    // Trigger a search with empty term to clear results in backend state as well
    performSearch();
});

// Allow searching by pressing Enter in the input field - REMOVED
// searchInput.addEventListener('keypress', (event) => {
//     if (event.key === 'Enter') {
//         event.preventDefault(); // Prevent default form submission if it were in a form
//         searchButton.click(); // Trigger the search button click - REMOVED
//     }
// });


// --- Message Handling ---

// --- Render Results Function ---
function renderResults(results) { // Expects the unified results array
    resultsArea.innerHTML = ''; // Clear previous results
    if (!results || results.length === 0) {
        return; // Nothing to render
    }

    const fragment = document.createDocumentFragment();
    let currentType = null;

    results.forEach(item => {
        // Add headers if type changes or it's the first item
        if (item.type !== currentType) {
            if (currentType !== null) {
                 // Add blank line div between sections if needed (optional)
                 // const separator = document.createElement('div');
                 // fragment.appendChild(separator);
            }
            const headerDiv = document.createElement('div');
            // Use displayPath for messages like "No results found"
            headerDiv.textContent = item.relativePath === '' ? item.displayPath : `--- ${item.type === 'folder' ? 'Folders' : 'Files'} ---`;
            // Don't make headers clickable
            fragment.appendChild(headerDiv);
            currentType = item.type;
        }

         // Don't render clickable div for messages
         if (item.relativePath === '') {
             return;
         }

        // Create clickable div for actual results
        const div = document.createElement('div');
        div.textContent = item.displayPath;
        div.classList.add('clickable-path'); // Add class for styling and click handling
        div.dataset.path = item.relativePath; // Store relative path
        div.dataset.type = item.type;         // Store type

        if (item.type === 'file' && item.isOutside) {
            div.classList.add('outside-file'); // Apply highlighting class
        }
        fragment.appendChild(div);
    });

    resultsArea.appendChild(fragment);
}


// --- Click Listener for Opening Paths ---
resultsArea.addEventListener('click', (event) => {
    // Check if Ctrl key (or Cmd key on Mac) was pressed
    if (!event.ctrlKey && !event.metaKey) {
        return;
    }

    const targetElement = event.target;
    // Check if the clicked element is one of our clickable paths
    if (targetElement.classList.contains('clickable-path')) {
        event.preventDefault(); // Prevent any default browser action
        const relativePath = targetElement.dataset.path;
        const type = targetElement.dataset.type;

        if (relativePath && type) {
            const messagePayload = {
                command: 'openPath',
                relativePath: relativePath,
                type: type
            };
            // Include reveal state only for files
            if (type === 'file') {
                messagePayload.reveal = revealFileCheckbox.checked;
            }
            vscode.postMessage(messagePayload);
        }
    }
});


// --- Message Handling ---

window.addEventListener('message', event => {
    const message = event.data; // The JSON data sent from the extension

    switch (message.command) {
        case 'updateResults':
            renderResults(message.results); // Use the render function
            break;
        case 'restoreState':
            searchInput.value = message.term || '';
            matchCaseCheckbox.checked = message.matchCase || false;
            revealFileCheckbox.checked = message.revealState || false; // Restore reveal checkbox state
            renderResults(message.results); // Use the render function for results
            break;
        // Add other cases if needed for feedback, e.g., copy confirmation
        case 'copySuccess':
            // Maybe show a temporary confirmation message
            console.log('Copied to clipboard!');
            break;
    }
});

// Request initial state when the webview loads (optional, but good practice)
// vscode.postMessage({ command: 'requestInitialState' }); // Provider now sends it automatically on resolve
