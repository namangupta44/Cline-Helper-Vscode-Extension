import {
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView,
} from '@vscode/webview-ui-toolkit/react';
import { useEffect } from 'react';
import { ListOpenFiles } from './features/listOpenFiles/ListOpenFiles';
import { FileNameSearcher } from './features/fileNameSearcher/FileNameSearcher';
import { FileAndFolderCollector } from './features/fileAndFolderCollector/FileAndFolderCollector';
import { Settings } from './features/settings/Settings';
import { vscode } from './platform/vscode';
import { useCollectorStore } from './features/fileAndFolderCollector/store';
import { useSearchStore } from './features/fileNameSearcher/store';
import { useListStore } from './features/listOpenFiles/store';

function App() {
  const collectorState = useCollectorStore();
  const searcherState = useSearchStore();
  const listState = useListStore();

  useEffect(() => {
    vscode.postMessage({ type: 'getSettings' });
    vscode.postMessage({ type: 'getState' });
  }, []);

  useEffect(() => {
    const state = {
      collector: {
        collectedPaths: collectorState.collectedPaths,
        folderInputText: collectorState.folderInputText,
        listedPathsGrouped: collectorState.listedPathsGrouped,
      },
      searcher: {
        searchTerm: searcherState.searchTerm,
        matchCase: searcherState.matchCase,
        results: searcherState.results,
      },
      list: {
        files: listState.files,
      },
    };
    vscode.postMessage({ type: 'saveState', state });
  }, [collectorState, searcherState, listState]);

  return (
    <main>
      <VSCodePanels>
        <VSCodePanelTab id="tab-1">COLLECTOR</VSCodePanelTab>
        <VSCodePanelTab id="tab-2">SEARCHER</VSCodePanelTab>
        <VSCodePanelTab id="tab-3">OPEN FILES</VSCodePanelTab>
        <VSCodePanelView id="view-1">
          <FileAndFolderCollector />
        </VSCodePanelView>
        <VSCodePanelView id="view-2">
          <FileNameSearcher />
        </VSCodePanelView>
        <VSCodePanelView id="view-3">
          <ListOpenFiles />
        </VSCodePanelView>
      </VSCodePanels>
      <Settings />
    </main>
  );
}

export default App;
