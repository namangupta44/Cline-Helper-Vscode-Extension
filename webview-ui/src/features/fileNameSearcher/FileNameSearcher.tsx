import {
  VSCodeButton,
  VSCodeCheckbox,
  VSCodeTextField,
  VSCodeProgressRing,
} from '@vscode/webview-ui-toolkit/react';
import { useSearchStore } from './store';
import { vscode } from '../../platform/vscode';
import { useDebounce } from '../../hooks/useDebounce';
import { useEffect, useMemo } from 'react';
import { useSettingsStore } from '../settings/store';
import { SearchResult } from '@shared/messages';

export function FileNameSearcher() {
  const {
    searchTerm,
    setSearchTerm,
    matchCase,
    setMatchCase,
    results,
    loading,
    setLoading,
    clearSearch,
  } = useSearchStore();
  const { isFullPathEnabled, isPrefixEnabled, prefixText } = useSettingsStore();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setLoading(true);
    vscode.postMessage({ type: 'search', query: debouncedSearchTerm, matchCase });
  }, [debouncedSearchTerm, matchCase, setLoading]);

  const getDisplayPath = (r: SearchResult) => {
    const path = isFullPathEnabled ? r.fullPath : r.relativePath;
    return isPrefixEnabled ? `${prefixText}${path}` : path;
  };

  const handleOpenFile = (path: string, type: 'file' | 'folder') => {
    vscode.postMessage({ type: 'openFile', path, fileType: type });
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (folders.length > 0) {
      textToCopy += 'Folders\n';
      textToCopy += folders.map(getDisplayPath).join('\n');
    }
    if (files.length > 0) {
      if (textToCopy.length > 0) {
        textToCopy += '\n\n';
      }
      textToCopy += 'Files\n';
      textToCopy += files.map(getDisplayPath).join('\n');
    }
    navigator.clipboard.writeText(textToCopy);
  };

  const { folders, files } = useMemo(() => {
    const folders = results.filter((r) => r.type === 'folder');
    const files = results.filter((r) => r.type === 'file');
    return { folders, files };
  }, [results]);

  return (
    <main className="searcher-container">
      <h1>File Name Searcher</h1>
      <div className="search-container">
        <VSCodeTextField
          value={searchTerm}
          onInput={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Enter filename part..."
        />
        <VSCodeCheckbox checked={matchCase} onChange={(e: any) => setMatchCase(e.target.checked)}>
          Match Case
        </VSCodeCheckbox>
        <div className="button-group">
          <VSCodeButton onClick={handleCopy} disabled={results.length === 0}>
            Copy
          </VSCodeButton>
          <VSCodeButton
            onClick={clearSearch}
            disabled={results.length === 0 && searchTerm.length === 0}
          >
            Clear
          </VSCodeButton>
        </div>
      </div>
      <section className="results-container">
        {loading ? (
          <div className="loading-container">
            <VSCodeProgressRing />
          </div>
        ) : results.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <ul>
            {folders.length > 0 && (
              <>
                <li className="result-heading">Folders</li>
                {folders.map((result) => (
                  <li key={result.relativePath}>
                    <a
                      href="#"
                      className="file-link"
                      onClick={() => handleOpenFile(result.relativePath, 'folder')}
                    >
                      {getDisplayPath(result)}
                    </a>
                  </li>
                ))}
              </>
            )}
            {files.length > 0 && (
              <>
                <li className="result-heading">Files</li>
                {files.map((result) => (
                  <li key={result.relativePath}>
                    <a
                      href="#"
                      className={`file-link ${result.isOutside ? 'outside-file' : ''}`}
                      onClick={() => handleOpenFile(result.relativePath, 'file')}
                    >
                      {getDisplayPath(result)}
                    </a>
                  </li>
                ))}
              </>
            )}
          </ul>
        )}
      </section>
    </main>
  );
}
