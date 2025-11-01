import { VSCodeCheckbox, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { useSearchStore } from './store';
import { vscode } from '../../platform/vscode';
import { useDebounce } from '../../hooks/useDebounce';
import { useEffect } from 'react';

export function FileNameSearcher() {
  const { searchTerm, setSearchTerm, matchCase, setMatchCase, results } = useSearchStore();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    vscode.postMessage({ type: 'search', query: debouncedSearchTerm });
  }, [debouncedSearchTerm]);

  const handleOpenFile = (path: string) => {
    vscode.postMessage({ type: 'openFile', path });
  };

  return (
    <main>
      <h1>File Name Searcher</h1>
      <div className="search-container">
        <VSCodeTextField
          value={searchTerm}
          onInput={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Enter filename part..."
        />
        <VSCodeCheckbox
          checked={matchCase}
          onChange={(e: any) => setMatchCase(e.target.checked)}
        >
          Match Case
        </VSCodeCheckbox>
      </div>
      <section className="results-container">
        {results.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <ul>
            {results.map((result) => (
              <li key={result.relativePath}>
                <a href="#" onClick={() => handleOpenFile(result.relativePath)}>
                  {result.displayPath}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
