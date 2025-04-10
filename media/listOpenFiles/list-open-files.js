// This script will be run within the webview panel for listing open files
(function () {
    const vscode = acquireVsCodeApi();

    const getFilesButton = document.getElementById('get-files-button');
    const fileListTextArea = document.getElementById('file-list');
    const openCombinedButton = document.getElementById('open-combined-button'); // Get the new combined button
    const copyListButton = document.getElementById('copy-list-button'); // Get copy button
    const clearListButton = document.getElementById('clear-list-button'); // Get clear button

    // Handle "Get Open File List" button click
    getFilesButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'getOpenFiles' // Updated command name
        });
    });

    // Handle "Open File & Folder Collector" button click
    openCombinedButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'openCombinedCollector' // Send the new command
        });
    });

    // Handle "Copy" button click
    copyListButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'copyList'
        });
    });

    // Handle "Clear" button click
    clearListButton.addEventListener('click', () => {
        // Optionally clear the textarea immediately for responsiveness
        // fileListTextArea.value = '';
        vscode.postMessage({
            command: 'clearList'
        });
    });


    // Handle messages received from the extension host
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateList':
                fileListTextArea.value = message.text;
                break;
        }
    });
}());
