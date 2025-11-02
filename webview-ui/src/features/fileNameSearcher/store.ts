import { create } from 'zustand';
import { ToWebview, SearchResult } from '@shared/messages';
import { bus } from '../../platform/bus';

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
  clearSearch: () => void;
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
  clearSearch: () => set({ searchTerm: '', results: [] }),
}));

bus.subscribe((message: ToWebview) => {
  if (message.type === 'searchResults') {
    useSearchStore.getState().setResults(message.items as SearchResult[]);
    useSearchStore.getState().setLoading(false);
  } else if (message.type === 'loadState') {
    if (message.state.searcher) {
      useSearchStore.setState(message.state.searcher);
    }
  }
});
