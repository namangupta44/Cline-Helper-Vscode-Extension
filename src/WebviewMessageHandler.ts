import * as vscode from 'vscode';
import { ToExtension } from './shared/messages';
import { getOpenFiles } from './util/getOpenFiles';
import { performWorkspaceSearch } from './util/performWorkspaceSearch';
import { processDroppedUris, listFolderContents } from './util/collectorUtils';
import { openPath } from './util/vscodeUtils';

export class WebviewMessageHandler {
  private state: { [key: string]: any } = {};

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _webview: vscode.Webview,
    private readonly _persistState: boolean
  ) {
    if (this._persistState) {
      this.state = this._context.workspaceState.get('clineHelper.state', {});
    }
  }

  public async handleMessage(msg: ToExtension) {
    const settings = this._context.workspaceState.get('clineHelper.settings', {}) as {
      [key: string]: any;
    };

    if (msg.type === 'getOpenFiles') {
      const excludePatterns = (settings.openFilesExcludeText || '').split('\n').filter(Boolean);
      const files = getOpenFiles(excludePatterns, settings.isFullPathEnabled);
      this._webview.postMessage({ type: 'init', payload: { files } });
    } else if (msg.type === 'openFile') {
      openPath(msg.path, msg.fileType);
    } else if (msg.type === 'search') {
      const excludePatterns = (settings.searcherExcludeText || '').split('\n').filter(Boolean);
      const results = await performWorkspaceSearch(
        msg.query,
        msg.matchCase,
        excludePatterns,
        settings.isFullPathEnabled
      );
      this._webview.postMessage({ type: 'searchResults', items: results });
    } else if (msg.type === 'addDroppedPaths') {
      const pathInfos = await processDroppedUris(msg.uris, settings.isFullPathEnabled);
      this._webview.postMessage({ type: 'updateCollectedPaths', paths: pathInfos });
    } else if (msg.type === 'addDroppedFoldersForLister') {
      const pathInfos = await processDroppedUris(msg.uris, settings.isFullPathEnabled);
      const folderPaths = pathInfos.filter((p) => p.type === 'folder').map((p) => p.relativePath);
      if (folderPaths.length > 0) {
        this._webview.postMessage({ type: 'appendToListerInput', paths: folderPaths });
      }
    } else if (msg.type === 'listFolderContents') {
      const excludePatterns = (settings.collectorExcludeText || '').split('\n').filter(Boolean);
      const groupedResults = await listFolderContents(
        msg.paths,
        excludePatterns,
        settings.isFullPathEnabled
      );
      this._webview.postMessage({ type: 'updateListedPaths', groupedResults });
    } else if (msg.type === 'openInEditor') {
      vscode.commands.executeCommand('cline-helper.openInEditor');
    } else if (msg.type === 'getSettings') {
      const settings = this._context.workspaceState.get('clineHelper.settings', {});
      this._webview.postMessage({ type: 'loadSettings', settings });
    } else if (msg.type === 'saveSettings') {
      this._context.workspaceState.update('clineHelper.settings', msg.settings);
    } else if (msg.type === 'getState') {
      this._webview.postMessage({ type: 'loadState', state: this.state });
    } else if (msg.type === 'saveState') {
      this.state = msg.state;
      if (this._persistState) {
        this._context.workspaceState.update('clineHelper.state', this.state);
      }
    }
  }
}
