import { create } from 'zustand';
import { ToWebview } from '@shared/messages';
import { bus } from '../../platform/bus';

type State = {
  activeTabId: string;
};

type Actions = {
  setActiveTabId: (id: string) => void;
};

export const useAppStore = create<State & Actions>((set) => ({
  activeTabId: 'tab-1',
  setActiveTabId: (id) => set({ activeTabId: id }),
}));

bus.subscribe((message: ToWebview) => {
  if (message.type === 'loadState') {
    if (message.state.app) {
      useAppStore.setState(message.state.app);
    }
  }
});
