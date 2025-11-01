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

function App() {
  useEffect(() => {
    vscode.postMessage({ type: 'getSettings' });
  }, []);

  return (
    <main>
      <VSCodePanels>
        <VSCodePanelTab id="tab-1">OPEN FILES</VSCodePanelTab>
        <VSCodePanelTab id="tab-2">SEARCHER</VSCodePanelTab>
        <VSCodePanelTab id="tab-3">COLLECTOR</VSCodePanelTab>
        <VSCodePanelView id="view-1">
          <ListOpenFiles />
        </VSCodePanelView>
        <VSCodePanelView id="view-2">
          <FileNameSearcher />
        </VSCodePanelView>
        <VSCodePanelView id="view-3">
          <FileAndFolderCollector />
        </VSCodePanelView>
      </VSCodePanels>
      <Settings />
    </main>
  );
}

export default App;
