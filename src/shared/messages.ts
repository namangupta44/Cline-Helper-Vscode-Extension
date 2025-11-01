export type ToExtension =
  | { type: 'openFile'; path: string }
  | { type: 'search'; query: string };

export type SearchResult = {
  type: 'folder' | 'file';
  displayPath: string;
  relativePath: string;
  isOutside?: boolean;
};

export type ToWebview =
  | { type: 'init'; payload: { files: string[] } }
  | { type: 'searchResults'; items: SearchResult[] };
