import { create } from 'zustand';
import { ToWebview } from '@shared/messages';
import { bus } from '../../platform/bus';

type PathInfo = {
  path: string;
  type: 'file' | 'folder';
};

type ListedGroup = {
  source: string;
  files: PathInfo[];
};

type State = {
  collectedPaths: PathInfo[];
  folderInputText: string;
  listedPathsGrouped: ListedGroup[];
};

type Actions = {
  setCollectedPaths: (paths: PathInfo[]) => void;
  setFolderInputText: (text: string) => void;
  setListedPathsGrouped: (groups: ListedGroup[]) => void;
};

export const useCollectorStore = create<State & Actions>((set) => ({
  collectedPaths: [],
  folderInputText: '',
  listedPathsGrouped: [],
  setCollectedPaths: (paths) => set({ collectedPaths: paths }),
  setFolderInputText: (text) => set({ folderInputText: text }),
  setListedPathsGrouped: (groups) => set({ listedPathsGrouped: groups }),
}));

// This store will need more complex message handling,
// which will be added as the component is built.
bus.subscribe((_message: ToWebview) => {
  // Placeholder for now
});
