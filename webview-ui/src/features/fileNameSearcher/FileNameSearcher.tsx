import {
  VSCodeCheckbox,
  VSCodeTextField,
  VSCodeProgressRing,
} from '@vscode/webview-ui-toolkit/react';
import { useSearchStore } from './store';
import { vscode } from '../../platform/vscode';
import { useDebounce } from '../../hooks/useDebounce';
import { useEffect, useMemo } from 'react';

export function FileNameSearcher() {
  const { searchTerm, setSearchTerm, matchCase, setMatchCase, results, loading, setLoading } =
    useSearchStore();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setLoading(true);
    vscode.postMessage({ type: 'search', query: debouncedSearchTerm, matchCase });
  }, [debouncedSearchTerm, matchCase, setLoading]);

  const handleOpenFile = (path: string, type: 'file' | 'folder') => {
    vscode.postMessage({ type: 'openFile', path, fileType: type });
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
                      {result.displayPath}
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
                      {result.displayPath}
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
