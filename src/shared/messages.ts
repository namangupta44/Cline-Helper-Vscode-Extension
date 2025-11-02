export type PathInfo = {
  path: string;
  type: 'file' | 'folder';
};

export type ListedGroup = {
  source: string;
  files: PathInfo[];
};

export type ToExtension =
  | { type: 'openFile'; path: string; fileType: 'file' | 'folder' }
  | { type: 'search'; query: string; matchCase: boolean }
  | { type: 'getOpenFiles' }
  | { type: 'addDroppedPaths'; uris: string[] }
  | { type: 'addDroppedFoldersForLister'; uris: string[] }
  | { type: 'listFolderContents'; paths: string[] }
  | { type: 'openInEditor' }
  | { type: 'getSettings' }
  | { type: 'saveSettings'; settings: { [key: string]: string } };

export type SearchResult = {
  type: 'folder' | 'file';
  displayPath: string;
  relativePath: string;
  isOutside?: boolean;
};

export type ToWebview =
  | { type: 'init'; payload: { files: string[] } }
  | { type: 'searchResults'; items: SearchResult[] }
  | { type: 'updateCollectedPaths'; paths: PathInfo[] }
  | { type: 'appendToListerInput'; paths: string[] }
  | { type: 'updateListedPaths'; groupedResults: ListedGroup[] }
  | { type: 'showSettings' }
  | { type: 'loadSettings'; settings: { [key: string]: string } };
