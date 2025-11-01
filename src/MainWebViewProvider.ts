import * as vscode from 'vscode';
import { getWebviewHtml } from './webview';
import { ToExtension, SearchResult, PathInfo, ListedGroup } from './shared/messages';
import { getOpenFiles } from './util/getOpenFiles';
import { performWorkspaceSearch } from './util/performWorkspaceSearch';
import { processDroppedUris, listFolderContents } from './util/collectorUtils';
import { openPath } from './util/vscodeUtils';

export class MainWebViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'main-view';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist')],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg: ToExtension) => {
      const settings = this._context.workspaceState.get('clineHelper.settings', {}) as {
        [key: string]: string;
      };

      if (msg.type === 'getOpenFiles') {
        const excludePatterns = (settings.openFilesExcludeText || '').split('\n').filter(Boolean);
        this.updateFileList(getOpenFiles(excludePatterns));
      } else if (msg.type === 'openFile') {
        openPath(msg.path, msg.fileType);
      } else if (msg.type === 'search') {
        const excludePatterns = (settings.searcherExcludeText || '').split('\n').filter(Boolean);
        const results = await performWorkspaceSearch(msg.query, msg.matchCase, excludePatterns);
        this.updateResults(results);
      } else if (msg.type === 'addDroppedPaths') {
        const pathInfos = await processDroppedUris(msg.uris);
        this.updateCollectedPaths(pathInfos);
      } else if (msg.type === 'listFolderContents') {
        const excludePatterns = (settings.collectorExcludeText || '').split('\n').filter(Boolean);
        const groupedResults = await listFolderContents(msg.paths, excludePatterns);
        this.updateListedPaths(groupedResults);
      } else if (msg.type === 'openInEditor') {
        vscode.commands.executeCommand('cline-helper.openInEditor');
      } else if (msg.type === 'getSettings') {
        this.loadAndSendSettings();
      } else if (msg.type === 'saveSettings') {
        this._context.workspaceState.update('clineHelper.settings', msg.settings);
      }
    });
  }

  public updateFileList(files: string[]) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'init',
        payload: { files },
      });
    }
  }

  public updateResults(results: SearchResult[]) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'searchResults',
        items: results,
      });
    }
  }

  public updateCollectedPaths(paths: PathInfo[]) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateCollectedPaths',
        paths: paths,
      });
    }
  }

  public updateListedPaths(groupedResults: ListedGroup[]) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateListedPaths',
        groupedResults: groupedResults,
      });
    }
  }

  public getHtml(webview: vscode.Webview): string {
    return getWebviewHtml(webview, this._extensionUri);
  }

  public showSettings() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'showSettings' });
    }
  }

  private loadAndSendSettings() {
    if (this._view) {
      const settings = this._context.workspaceState.get('clineHelper.settings', {});
      this._view.webview.postMessage({ type: 'loadSettings', settings });
    }
  }
}
