import {
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView,
  VSCodeButton,
} from '@vscode/webview-ui-toolkit/react';
import { ListOpenFiles } from './features/listOpenFiles/ListOpenFiles';
import { FileNameSearcher } from './features/fileNameSearcher/FileNameSearcher';
import { FileAndFolderCollector } from './features/fileAndFolderCollector/FileAndFolderCollector';
import { vscode } from './platform/vscode';

function App() {
  const handleOpenInEditor = () => {
    vscode.postMessage({ type: 'openInEditor' });
  };

  return (
    <main>
      <header className="app-header">
        <VSCodeButton onClick={handleOpenInEditor} appearance="secondary">
          Open in Editor
        </VSCodeButton>
      </header>
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
    </main>
  );
}

export default App;
