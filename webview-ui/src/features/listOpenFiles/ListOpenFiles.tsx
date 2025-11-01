import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useListStore } from './store';
import { vscode } from '../../platform/vscode';

export function ListOpenFiles() {
  const files = useListStore((state) => state.files);

  const handleOpenFile = (file: string) => {
    vscode.postMessage({ type: 'openFile', path: file });
  };

  return (
    <main>
      <h1>Open Files</h1>
      <VSCodeButton onClick={() => vscode.postMessage({ type: 'search', query: '' })}>
        Get Open Files
      </VSCodeButton>
      <section className="results-container">
        {files.length === 0 ? (
          <p>No open files found.</p>
        ) : (
          <ul>
            {files.map((file) => (
              <li key={file}>
                <a href="#" onClick={() => handleOpenFile(file)}>
                  {file}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
