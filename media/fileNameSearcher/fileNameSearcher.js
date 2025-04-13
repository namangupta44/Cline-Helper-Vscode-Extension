// @ts-ignore because vscode-webview-ui-toolkit is not available in this context
// @ts-ignore because vscode-webview-ui-toolkit is not available in this context
const vscode = acquireVsCodeApi();

const searchInput = document.getElementById('search-input');
const matchCaseCheckbox = document.getElementById('match-case-checkbox'); // Get checkbox
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

copyButton.addEventListener('click', () => {
    // Reconstruct the text content from the divs inside resultsArea
    const lines = [];
    const resultNodes = resultsArea.querySelectorAll('div'); // Get all divs inside
    resultNodes.forEach(node => lines.push(node.textContent));
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
function renderResults(data) {
    resultsArea.innerHTML = ''; // Clear previous results
    if (!data || (!data.folders?.length && !data.files?.length)) {
        // Handle null, empty or "not found" message case
        if (data?.files?.[0]?.path) { // Check if there's a message like "No results"
             const msgDiv = document.createElement('div');
             msgDiv.textContent = data.files[0].path;
             resultsArea.appendChild(msgDiv);
        }
        return; // Nothing more to render
    }

    const fragment = document.createDocumentFragment();
    let hasContent = false;

    // Render Folders
    if (data.folders && data.folders.length > 0) {
        const folderHeader = document.createElement('div');
        folderHeader.textContent = '--- Folders ---';
        fragment.appendChild(folderHeader);
        data.folders.forEach(folderPath => {
            const div = document.createElement('div');
            div.textContent = folderPath;
            fragment.appendChild(div);
        });
        hasContent = true;
    }

    // Render Files
    if (data.files && data.files.length > 0) {
        if (hasContent) { // Add separator line if folders were present
            const separator = document.createElement('div');
            // separator.textContent = ''; // Or use an empty div for spacing
            fragment.appendChild(separator);
        }
        const fileHeader = document.createElement('div');
        fileHeader.textContent = '--- Files ---';
        fragment.appendChild(fileHeader);
        data.files.forEach(file => {
            const div = document.createElement('div');
            div.textContent = file.path;
            if (file.isOutside) {
                div.classList.add('outside-file'); // Apply highlighting class
            }
            fragment.appendChild(div);
        });
    }

    resultsArea.appendChild(fragment);
}


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
