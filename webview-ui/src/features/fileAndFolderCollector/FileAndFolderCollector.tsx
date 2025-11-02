import { useCollectorStore } from './store';
import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import { vscode } from '../../platform/vscode';
import React, { DragEvent, useState, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useEffect } from 'react';
import { useSettingsStore } from '../settings/store';
import { PathInfo } from '@shared/messages';

const DropZone: React.FC<{
  onDrop: (uris: string[]) => void;
  children: React.ReactNode;
}> = ({ onDrop, children }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!e.dataTransfer) {
      return;
    }

    const uris: string[] = [];
    const uriList = e.dataTransfer.getData('text/uri-list');

    if (uriList) {
      uris.push(...uriList.split('\n').map((u) => u.trim()).filter(Boolean));
    } else if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'string') {
          const data = await new Promise<string>((resolve) => item.getAsString(resolve));
          if (data.startsWith('file://') || data.startsWith('vscode-remote://')) {
            uris.push(...data.split('\n').map((u) => u.trim()).filter(Boolean));
          }
        }
      }
    }

    if (uris.length > 0) {
      onDrop(uris);
    }
  };

  return (
    <div
      className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};

export function FileAndFolderCollector() {
  const {
    collectedPaths,
    folderInputText,
    listedPathsGrouped,
    setFolderInputText,
    clearCollector,
    clearLister,
  } = useCollectorStore();
  const { isFullPathEnabled, isPrefixEnabled, prefixText } = useSettingsStore();

  const debouncedFolderInput = useDebounce(folderInputText, 500);

  useEffect(() => {
    const paths = debouncedFolderInput.split('\n').filter(Boolean);
    vscode.postMessage({ type: 'listFolderContents', paths });
  }, [debouncedFolderInput]);

  const handleDropCollector = useCallback((uris: string[]) => {
    vscode.postMessage({ type: 'addDroppedPaths', uris });
  }, []);

  const handleDropLister = useCallback((uris: string[]) => {
    vscode.postMessage({ type: 'addDroppedFoldersForLister', uris });
  }, []);

  const getDisplayPath = (p: PathInfo) => {
    const path = isFullPathEnabled ? p.fullPath : p.relativePath;
    return isPrefixEnabled ? `${prefixText}${path}` : path;
  };

  const handleOpenFile = (path: string, type: 'file' | 'folder') => {
    vscode.postMessage({ type: 'openFile', path, fileType: type });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="collector-container">
      <section className="panel">
        <h2>Collect File/Folder Paths</h2>
        <DropZone onDrop={handleDropCollector}>
          <p>Drag files or folders here</p>
        </DropZone>
        <h3>Collected Paths:</h3>
        <div className="results-display">
          {collectedPaths.map((p) => (
            <div
              key={p.relativePath}
              className="file-link"
              onClick={() => handleOpenFile(p.relativePath, p.type)}
            >
              {getDisplayPath(p)}
            </div>
          ))}
        </div>
        <div className="button-group">
          <VSCodeButton
            onClick={() => handleCopy(collectedPaths.map(getDisplayPath).join('\n'))}
            disabled={collectedPaths.length === 0}
          >
            Copy
          </VSCodeButton>
          <VSCodeButton onClick={clearCollector} disabled={collectedPaths.length === 0}>
            Clear
          </VSCodeButton>
        </div>
      </section>
      <section className="panel">
        <h2>List Folder Contents</h2>
        <DropZone onDrop={handleDropLister}>
          <p>Drag folders here, or paste paths below</p>
        </DropZone>
        <h3>Folders to List:</h3>
        <VSCodeTextArea
          value={folderInputText}
          onInput={(e: any) => setFolderInputText(e.target.value)}
          placeholder="Enter folder paths here..."
          rows={5}
        />
        <h3>Listed File Paths:</h3>
        <div className="results-display">
          {listedPathsGrouped.map((group, groupIndex) => (
            <React.Fragment key={group.source}>
              {group.files.map((f) => (
                <div
                  key={f.relativePath}
                  className="file-link"
                  onClick={() => handleOpenFile(f.relativePath, 'file')}
                >
                  {getDisplayPath(f)}
                </div>
              ))}
              {groupIndex < listedPathsGrouped.length - 1 && <div style={{ height: '1em' }} />}
            </React.Fragment>
          ))}
        </div>
        <div className="button-group">
          <VSCodeButton
            onClick={() =>
              handleCopy(
                listedPathsGrouped
                  .map((g) => g.files.map(getDisplayPath).join('\n'))
                  .join('\n\n')
              )
            }
            disabled={listedPathsGrouped.length === 0}
          >
            Copy
          </VSCodeButton>
          <VSCodeButton onClick={clearLister} disabled={listedPathsGrouped.length === 0 && folderInputText.length === 0}>
            Clear
          </VSCodeButton>
        </div>
      </section>
    </main>
  );
}
