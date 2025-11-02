import { create } from 'zustand';
import { ToWebview, PathInfo, ListedGroup } from '@shared/messages';
import { bus } from '../../platform/bus';

type State = {
  collectedPaths: PathInfo[];
  folderInputText: string;
  listedPathsGrouped: ListedGroup[];
};

type Actions = {
  setCollectedPaths: (paths: PathInfo[]) => void;
  addCollectedPaths: (paths: PathInfo[]) => void;
  setFolderInputText: (text: string) => void;
  appendToFolderInput: (paths: string[]) => void;
  setListedPathsGrouped: (groups: ListedGroup[]) => void;
  clearCollector: () => void;
  clearLister: () => void;
};

export const useCollectorStore = create<State & Actions>((set) => ({
  collectedPaths: [],
  folderInputText: '',
  listedPathsGrouped: [],
  setCollectedPaths: (paths) => set({ collectedPaths: paths }),
  addCollectedPaths: (paths) =>
    set((state) => ({ collectedPaths: [...state.collectedPaths, ...paths] })),
  setFolderInputText: (text) => set({ folderInputText: text }),
  appendToFolderInput: (paths) =>
    set((state) => {
      const currentText = state.folderInputText.trim();
      const newText =
        currentText.length > 0
          ? `${currentText}\n${paths.join('\n')}`
          : paths.join('\n');
      return { folderInputText: newText };
    }),
  setListedPathsGrouped: (groups) => set({ listedPathsGrouped: groups }),
  clearCollector: () => set({ collectedPaths: [] }),
  clearLister: () => set({ folderInputText: '', listedPathsGrouped: [] }),
}));

bus.subscribe((message: ToWebview) => {
  if (message.type === 'updateCollectedPaths') {
    useCollectorStore.getState().addCollectedPaths(message.paths);
  } else if (message.type === 'updateListedPaths') {
    useCollectorStore.getState().setListedPathsGrouped(message.groupedResults);
  } else if (message.type === 'appendToListerInput') {
    useCollectorStore.getState().appendToFolderInput(message.paths);
  }
});
