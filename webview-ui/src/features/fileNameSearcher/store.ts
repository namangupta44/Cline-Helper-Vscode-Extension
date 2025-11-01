import { create } from 'zustand';
import { ToWebview } from '@shared/messages';
import { bus } from '../../platform/bus';

type SearchResult = {
  type: 'folder' | 'file';
  displayPath: string;
  relativePath: string;
  isOutside?: boolean;
};

type State = {
  searchTerm: string;
  matchCase: boolean;
  results: SearchResult[];
};

type Actions = {
  setSearchTerm: (term: string) => void;
  setMatchCase: (matchCase: boolean) => void;
  setResults: (results: SearchResult[]) => void;
};

export const useSearchStore = create<State & Actions>((set) => ({
  searchTerm: '',
  matchCase: false,
  results: [],
  setSearchTerm: (term) => set({ searchTerm: term }),
  setMatchCase: (matchCase) => set({ matchCase }),
  setResults: (results) => set({ results }),
}));

bus.subscribe((message: ToWebview) => {
  if (message.type === 'searchResults') {
    useSearchStore.getState().setResults(message.items as SearchResult[]);
  }
});
