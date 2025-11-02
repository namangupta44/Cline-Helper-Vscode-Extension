import {
  VSCodeButton,
  VSCodeCheckbox,
  VSCodeTextArea,
  VSCodeTextField,
} from '@vscode/webview-ui-toolkit/react';
import { useSettingsStore } from './store';
import { vscode } from '../../platform/vscode';

export function Settings() {
  const {
    isSettingsVisible,
    hideSettings,
    openFilesExcludeText,
    searcherExcludeText,
    collectorExcludeText,
    isPrefixEnabled,
    prefixText,
    isFullPathEnabled,
    setSettingsText,
    setSettingsToggle,
  } = useSettingsStore();

  if (!isSettingsVisible) {
    return null;
  }

  const handleSave = () => {
    vscode.postMessage({
      type: 'saveSettings',
      settings: {
        openFilesExcludeText,
        searcherExcludeText,
        collectorExcludeText,
        isPrefixEnabled,
        prefixText,
        isFullPathEnabled,
      },
    });
    hideSettings();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <h2>Settings</h2>
        <div className="button-group">
          <VSCodeButton onClick={handleSave}>Save & Close</VSCodeButton>
          <VSCodeButton appearance="secondary" onClick={hideSettings}>
            Cancel
          </VSCodeButton>
        </div>
        <section>
          <h3>General</h3>
          <VSCodeCheckbox
            checked={isFullPathEnabled}
            onChange={(e: any) => setSettingsToggle('isFullPathEnabled', e.target.checked)}
          >
            Show Full Path
          </VSCodeCheckbox>
          <div className="prefix-container">
            <VSCodeCheckbox
              checked={isPrefixEnabled}
              onChange={(e: any) => setSettingsToggle('isPrefixEnabled', e.target.checked)}
            >
              Add Prefix
            </VSCodeCheckbox>
            <VSCodeTextField
              value={prefixText}
              onInput={(e: any) => setSettingsText('prefixText', e.target.value)}
              placeholder="Enter prefix..."
              disabled={!isPrefixEnabled}
            />
          </div>
        </section>
        <section>
          <h3>Exclude from COLLECTOR</h3>
          <VSCodeTextArea
            value={collectorExcludeText}
            onInput={(e: any) => setSettingsText('collectorExcludeText', e.target.value)}
            placeholder="Enter folder paths to exclude (one per line)..."
            rows={5}
          />
        </section>
        <section>
          <h3>Exclude from SEARCHER</h3>
          <VSCodeTextArea
            value={searcherExcludeText}
            onInput={(e: any) => setSettingsText('searcherExcludeText', e.target.value)}
            placeholder="Enter folder paths to exclude (one per line)..."
            rows={5}
          />
        </section>
        <section>
          <h3>Exclude from OPEN FILES</h3>
          <VSCodeTextArea
            value={openFilesExcludeText}
            onInput={(e: any) => setSettingsText('openFilesExcludeText', e.target.value)}
            placeholder="Enter folder paths to exclude (one per line)..."
            rows={5}
          />
        </section>
      </div>
    </div>
  );
}
