import { create } from 'zustand';
import { ToWebview } from '@shared/messages';
import { bus } from '../../platform/bus';

type FileInfo = {
  relativePath: string;
  fullPath: string;
};

type State = {
  files: FileInfo[];
  loading: boolean;
};

type Actions = {
  setFiles: (files: FileInfo[]) => void;
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
  } else if (message.type === 'loadState') {
    if (message.state.list) {
      useListStore.setState(message.state.list);
    }
  }
});
