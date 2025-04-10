// @ts-ignore because vscode-webview-ui-toolkit is not available in this context
const vscode = acquireVsCodeApi();

const searchInput = document.getElementById('search-input');
const matchCaseCheckbox = document.getElementById('match-case-checkbox'); // Get checkbox
const searchButton = document.getElementById('search-button');
const clearButton = document.getElementById('clear-button');
const resultsArea = document.getElementById('results-area');
const copyButton = document.getElementById('copy-button');

// --- Event Listeners ---

searchButton.addEventListener('click', () => {
    const searchTerm = searchInput.value;
    if (searchTerm) {
        vscode.postMessage({
            command: 'search',
            term: searchTerm,
            matchCase: matchCaseCheckbox.checked // Send checkbox state
        });
    }
});

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

// Allow searching by pressing Enter in the input field
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission if it were in a form
        searchButton.click(); // Trigger the search button click
    }
});


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
