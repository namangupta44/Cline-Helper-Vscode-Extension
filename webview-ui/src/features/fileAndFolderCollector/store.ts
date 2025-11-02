import { create } from 'zustand';
import { ToWebview, PathInfo, ListedGroup } from '@shared/messages';
import { bus } from '../../platform/bus';
import { useSettingsStore } from '../settings/store';

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
    useCollectorStore.getState().addCollectedPaths(message.paths);
  } else if (message.type === 'updateListedPaths') {
    useCollectorStore.getState().setListedPathsGrouped(message.groupedResults);
  } else if (message.type === 'loadState') {
    if (message.state.collector) {
      useCollectorStore.setState(message.state.collector);
    }
  } else if (message.type === 'appendToListerInput') {
    const { isPrefixEnabled, prefixText } = useSettingsStore.getState();
    const collectorState = useCollectorStore.getState();

    const pathsToAppend = isPrefixEnabled
      ? message.paths.map((p) => `${prefixText}${p}`)
      : message.paths;

    const currentText = collectorState.folderInputText.trim();
    const newText =
      currentText.length > 0
        ? `${currentText}\n${pathsToAppend.join('\n')}`
        : pathsToAppend.join('\n');

    collectorState.setFolderInputText(newText);
  }
});
