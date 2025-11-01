import { ToWebview } from '@shared/messages';

// A simple event bus for decoupling message listening from components
type Listener = (message: ToWebview) => void;
const listeners: Set<Listener> = new Set();

window.addEventListener('message', (event) => {
  const message = event.data as ToWebview;
  listeners.forEach(listener => listener(message));
});

export const bus = {
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener); // Unsubscribe function
  },
};
