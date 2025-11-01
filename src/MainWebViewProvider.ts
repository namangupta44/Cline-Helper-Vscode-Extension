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

  constructor(private readonly _extensionUri: vscode.Uri) {}

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
      if (msg.type === 'getOpenFiles') {
        this.updateFileList(getOpenFiles());
      } else if (msg.type === 'openFile') {
        openPath(msg.path, msg.fileType);
      } else if (msg.type === 'search') {
        const results = await performWorkspaceSearch(msg.query, msg.matchCase);
        this.updateResults(results);
      } else if (msg.type === 'addDroppedPaths') {
        const pathInfos = await processDroppedUris(msg.uris);
        // In a real app, you'd likely merge this with existing collected paths
        this.updateCollectedPaths(pathInfos);
      } else if (msg.type === 'listFolderContents') {
        const groupedResults = await listFolderContents(msg.paths);
        this.updateListedPaths(groupedResults);
      } else if (msg.type === 'openInEditor') {
        vscode.commands.executeCommand('cline-helper.openInEditor');
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
}
