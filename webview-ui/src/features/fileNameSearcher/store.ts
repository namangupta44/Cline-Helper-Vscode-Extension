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
  loading: boolean;
};

type Actions = {
  setSearchTerm: (term: string) => void;
  setMatchCase: (matchCase: boolean) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
};

export const useSearchStore = create<State & Actions>((set) => ({
  searchTerm: '',
  matchCase: false,
  results: [],
  loading: false,
  setSearchTerm: (term) => set({ searchTerm: term }),
  setMatchCase: (matchCase) => set({ matchCase }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ loading }),
}));

bus.subscribe((message: ToWebview) => {
  if (message.type === 'searchResults') {
    useSearchStore.getState().setResults(message.items as SearchResult[]);
    useSearchStore.getState().setLoading(false);
  }
});
