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
  | { type: 'listFolderContents'; paths: string[] }
  | { type: 'openInEditor' };

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
  | { type: 'updateListedPaths'; groupedResults: ListedGroup[] };
