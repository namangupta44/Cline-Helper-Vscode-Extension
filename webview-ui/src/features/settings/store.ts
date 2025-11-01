import { create } from 'zustand';
import { ToWebview } from '@shared/messages';
import { bus } from '../../platform/bus';

type State = {
  isSettingsVisible: boolean;
  openFilesExcludeText: string;
  searcherExcludeText: string;
  collectorExcludeText: string;
};

type Actions = {
  showSettings: () => void;
  hideSettings: () => void;
  setSettingsText: (
    key: 'openFilesExcludeText' | 'searcherExcludeText' | 'collectorExcludeText',
    text: string
  ) => void;
  loadSettings: (settings: { [key: string]: string }) => void;
};

export const useSettingsStore = create<State & Actions>((set) => ({
  isSettingsVisible: false,
  openFilesExcludeText: '',
  searcherExcludeText: '',
  collectorExcludeText: '',
  showSettings: () => set({ isSettingsVisible: true }),
  hideSettings: () => set({ isSettingsVisible: false }),
  setSettingsText: (key, text) => set({ [key]: text }),
  loadSettings: (settings) =>
    set({
      openFilesExcludeText: settings.openFilesExcludeText || '',
      searcherExcludeText: settings.searcherExcludeText || '',
      collectorExcludeText: settings.collectorExcludeText || '',
    }),
}));

bus.subscribe((message: ToWebview) => {
  if (message.type === 'showSettings') {
    useSettingsStore.getState().showSettings();
  } else if (message.type === 'loadSettings') {
    useSettingsStore.getState().loadSettings(message.settings);
  }
});
