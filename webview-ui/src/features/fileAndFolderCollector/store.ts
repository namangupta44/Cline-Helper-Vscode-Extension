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
  setListedPathsGrouped: (groups) => set({ listedPathsGrouped: groups }),
  clearCollector: () => set({ collectedPaths: [] }),
  clearLister: () => set({ folderInputText: '', listedPathsGrouped: [] }),
}));

bus.subscribe((message: ToWebview) => {
  if (message.type === 'updateCollectedPaths') {
    useCollectorStore.getState().setCollectedPaths(message.paths);
  } else if (message.type === 'updateListedPaths') {
    useCollectorStore.getState().setListedPathsGrouped(message.groupedResults);
  }
});
