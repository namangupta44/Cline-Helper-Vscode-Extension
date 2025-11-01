import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useListStore } from './store';
import { vscode } from '../../platform/vscode';
import { MouseEvent } from 'react';

export function ListOpenFiles() {
  const { files, clearFiles } = useListStore();

  const handleOpenFile = (e: MouseEvent<HTMLSpanElement>, file: string) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      vscode.postMessage({ type: 'openFile', path: file });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files.join('\n'));
  };

  return (
    <main>
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
                  onClick={(e) => handleOpenFile(e, file)}
                  style={{ cursor: 'pointer' }}
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
