import { create } from 'zustand';
import { ToWebview } from '@shared/messages';
import { bus } from '../../platform/bus';

type FileInfo = {
  relativePath: string;
  fullPath: string;
};

type State = {
  files: FileInfo[];
  organizedFiles: FileInfo[];
  loading: boolean;
  isOrganized: boolean;
};

type Actions = {
  setFiles: (files: FileInfo[]) => void;
  clearFiles: () => void;
  setOrganized: (isOrganized: boolean) => void;
};

export const useListStore = create<State & Actions>((set) => ({
  files: [],
  organizedFiles: [],
  loading: false,
  isOrganized: false,
  setFiles: (files) =>
    set({
      files,
      organizedFiles: [...files].sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    }),
  clearFiles: () => set({ files: [], organizedFiles: [] }),
  setOrganized: (isOrganized) => set({ isOrganized }),
}));

// Listen for messages from the extension
bus.subscribe((message: ToWebview) => {
  if (message.type === 'init') {
    useListStore.getState().setFiles(message.payload.files);
  } else if (message.type === 'loadState') {
    if (message.state.list) {
      const { files, isOrganized } = message.state.list;
      useListStore.setState({
        files,
        isOrganized,
        organizedFiles: [...files].sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
      });
    }
  }
});
