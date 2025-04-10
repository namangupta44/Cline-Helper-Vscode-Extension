// @ts-ignore because vscode-webview-ui-toolkit is not available in this context
// @ts-ignore because vscode-webview-ui-toolkit is not available in this context
const vscode = acquireVsCodeApi();

const searchInput = document.getElementById('search-input');
const matchCaseCheckbox = document.getElementById('match-case-checkbox'); // Get checkbox
// const searchButton = document.getElementById('search-button'); // Removed
const clearButton = document.getElementById('clear-button');
const resultsArea = document.getElementById('results-area');
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
    const results = resultsArea.value;
    if (results) {
        vscode.postMessage({
            command: 'copy',
            text: results
        });
    }
});

clearButton.addEventListener('click', () => {
    searchInput.value = '';
    resultsArea.value = '';
    // Optionally, send a message to backend if needed, but likely not required for clear
    // vscode.postMessage({ command: 'clear' });
});

// Allow searching by pressing Enter in the input field - REMOVED
// searchInput.addEventListener('keypress', (event) => {
//     if (event.key === 'Enter') {
//         event.preventDefault(); // Prevent default form submission if it were in a form
//         searchButton.click(); // Trigger the search button click - REMOVED
//     }
// });


// --- Message Handling ---

window.addEventListener('message', event => {
    const message = event.data; // The JSON data sent from the extension

    switch (message.command) {
        case 'updateResults':
            // Results are now expected as a pre-formatted string
            resultsArea.value = message.results;
            break;
        // Add other cases if needed for feedback, e.g., copy confirmation
        case 'copySuccess':
            // Maybe show a temporary confirmation message
            console.log('Copied to clipboard!');
            break;
    }
});
