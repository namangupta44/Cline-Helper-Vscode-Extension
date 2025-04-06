// This script will be run within the webview panel for listing open files
(function () {
    const vscode = acquireVsCodeApi();

    const getFilesButton = document.getElementById('get-files-button');
    const fileListTextArea = document.getElementById('file-list');
    const openCollectorButton = document.getElementById('open-collector-button');
    const openListerButton = document.getElementById('open-lister-button'); // Get the third button

    // Handle "Get Open File List" button click
    getFilesButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'getOpenFiles' // Updated command name
        });
    });

    // Handle "Open Collector Tab" button click
    openCollectorButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'openCollector'
        });
    });

    // Handle "Open Folder Lister Tab" button click
    openListerButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'openFolderLister' // Command to open the folder lister tab
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
