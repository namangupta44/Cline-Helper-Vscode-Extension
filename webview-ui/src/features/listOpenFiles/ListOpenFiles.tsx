import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useListStore } from './store';
import { vscode } from '../../platform/vscode';
import { MouseEvent } from 'react';
import { useSettingsStore } from '../settings/store';

export function ListOpenFiles() {
  const { files, clearFiles } = useListStore();
  const { isFullPathEnabled, isPrefixEnabled, prefixText } = useSettingsStore();

  const getDisplayPath = (file: { relativePath: string; fullPath: string }) => {
    const path = isFullPathEnabled ? file.fullPath : file.relativePath;
    return isPrefixEnabled ? `${prefixText}${path}` : path;
  };

  const handleOpenFile = (e: MouseEvent<HTMLSpanElement>, file: { relativePath: string }) => {
    if (e.metaKey) {
      vscode.postMessage({ type: 'openFile', path: file.relativePath, fileType: 'file' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files.map(getDisplayPath).join('\n'));
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
              <li key={file.relativePath}>
                <span
                  className="file-link"
                  onClick={(e) => handleOpenFile(e, file)}
                  draggable="false"
                >
                  {getDisplayPath(file)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
