import { VSCodeButton, VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react';
import { useListStore } from './store';
import { vscode } from '../../platform/vscode';
import { MouseEvent } from 'react';
import { useSettingsStore } from '../settings/store';

export function ListOpenFiles() {
  const { files, organizedFiles, isOrganized, setOrganized, clearFiles } = useListStore();
  const { isFullPathEnabled, isPrefixEnabled, prefixText } = useSettingsStore();

  const filesToDisplay = isOrganized ? organizedFiles : files;

  const getDisplayPath = (file: { relativePath: string; fullPath: string }) => {
    const path = isFullPathEnabled ? file.fullPath : file.relativePath;
    return isPrefixEnabled ? `${prefixText}${path}` : path;
  };

  const handleOpenFile = (e: MouseEvent<HTMLSpanElement>, file: { relativePath: string }) => {
    if (e.metaKey || e.ctrlKey) {
      vscode.postMessage({ type: 'openFile', path: file.relativePath, fileType: 'file' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(filesToDisplay.map(getDisplayPath).join('\n'));
  };

  return (
    <main className="openfiles-container">
      <h1>Open Files</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <VSCodeButton
            onClick={() => vscode.postMessage({ type: 'getOpenFiles' })}
            style={{ whiteSpace: 'nowrap' }}
          >
            Get Open Files
          </VSCodeButton>
          <VSCodeButton onClick={handleCopy} disabled={filesToDisplay.length === 0}>
            Copy
          </VSCodeButton>
          <VSCodeButton onClick={clearFiles} disabled={filesToDisplay.length === 0}>
            Clear
          </VSCodeButton>
        </div>
        <div>
          <VSCodeCheckbox
            checked={isOrganized}
            onChange={(e: any) => setOrganized(e.target.checked)}
          >
            Organized
          </VSCodeCheckbox>
        </div>
      </div>
      <section className="results-container">
        {filesToDisplay.length === 0 ? (
          <p>No open files found.</p>
        ) : (
          <ul>
            {filesToDisplay.map((file) => (
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
