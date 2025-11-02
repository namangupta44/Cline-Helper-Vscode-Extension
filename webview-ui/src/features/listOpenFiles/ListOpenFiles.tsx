import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useListStore } from './store';
import { vscode } from '../../platform/vscode';
import { MouseEvent } from 'react';

export function ListOpenFiles() {
  const { files, clearFiles } = useListStore();

  const handleOpenFile = (e: MouseEvent<HTMLSpanElement>, file: string) => {
    if (e.metaKey) {
      vscode.postMessage({ type: 'openFile', path: file, fileType: 'file' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files.join('\n'));
  };

  return (
    <main className="openfiles-container">
      <h1>Open Files</h1>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <VSCodeButton onClick={() => vscode.postMessage({ type: 'getOpenFiles' })}>
          Get Open Files
        </VSCodeButton>
        <VSCodeButton onClick={handleCopy} disabled={files.length === 0}>
          Copy
        </VSCodeButton>
        <VSCodeButton onClick={clearFiles} disabled={files.length === 0}>
          Clear
        </VSCodeButton>
      </div>
      <section className="results-container">
        {files.length === 0 ? (
          <p>No open files found.</p>
        ) : (
          <ul>
            {files.map((file) => (
              <li key={file}>
                <span
                  className="file-link"
                  onClick={(e) => handleOpenFile(e, file)}
                  draggable="false"
                >
                  {file}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
