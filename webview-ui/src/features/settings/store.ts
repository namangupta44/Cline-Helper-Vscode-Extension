import { create } from 'zustand';
import { ToWebview } from '@shared/messages';
import { bus } from '../../platform/bus';

type State = {
  isSettingsVisible: boolean;
  openFilesExcludeText: string;
  searcherExcludeText: string;
  collectorExcludeText: string;
  isPrefixEnabled: boolean;
  prefixText: string;
  isFullPathEnabled: boolean;
  isExcludeEnabled: boolean;
};

type Actions = {
  showSettings: () => void;
  hideSettings: () => void;
  setSettingsText: (
    key: 'openFilesExcludeText' | 'searcherExcludeText' | 'collectorExcludeText' | 'prefixText',
    text: string
  ) => void;
  setSettingsToggle: (
    key: 'isPrefixEnabled' | 'isFullPathEnabled' | 'isExcludeEnabled',
    value: boolean
  ) => void;
  loadSettings: (settings: { [key: string]: any }) => void;
};

export const useSettingsStore = create<State & Actions>((set) => ({
  isSettingsVisible: false,
  openFilesExcludeText: '',
  searcherExcludeText: '',
  collectorExcludeText: '',
  isPrefixEnabled: false,
  prefixText: '',
  isFullPathEnabled: false,
  isExcludeEnabled: true,
  showSettings: () => set({ isSettingsVisible: true }),
  hideSettings: () => set({ isSettingsVisible: false }),
  setSettingsText: (key, text) => set({ [key]: text }),
  setSettingsToggle: (key, value) => set({ [key]: value }),
  loadSettings: (settings) =>
    set({
      openFilesExcludeText: settings.openFilesExcludeText || '',
      searcherExcludeText: settings.searcherExcludeText || '',
      collectorExcludeText: settings.collectorExcludeText || '',
      isPrefixEnabled: settings.isPrefixEnabled || false,
      prefixText: settings.prefixText || '',
      isFullPathEnabled: settings.isFullPathEnabled || false,
      isExcludeEnabled: settings.isExcludeEnabled === false ? false : true,
    }),
}));

bus.subscribe((message: ToWebview) => {
  if (message.type === 'showSettings') {
    useSettingsStore.getState().showSettings();
  } else if (message.type === 'loadSettings') {
    useSettingsStore.getState().loadSettings(message.settings);
  }
});
