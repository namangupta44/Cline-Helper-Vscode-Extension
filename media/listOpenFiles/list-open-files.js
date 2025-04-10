// This script will be run within the webview panel for listing open files
(function () {
    const vscode = acquireVsCodeApi();

    const getFilesButton = document.getElementById('get-files-button');
    const fileListTextArea = document.getElementById('file-list');
    const openCombinedButton = document.getElementById('open-combined-button'); // Get the new combined button

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
