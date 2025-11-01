import { create } from 'zustand';
import { ToWebview } from '@shared/messages';
import { bus } from '../../platform/bus';

type State = {
  files: string[];
  loading: boolean;
};

type Actions = {
  setFiles: (files: string[]) => void;
  clearFiles: () => void;
};

export const useListStore = create<State & Actions>((set) => ({
  files: [],
  loading: false,
  setFiles: (files) => set({ files }),
  clearFiles: () => set({ files: [] }),
}));

// Listen for messages from the extension
bus.subscribe((message: ToWebview) => {
  if (message.type === 'init') {
    useListStore.getState().setFiles(message.payload.files);
  }
});
