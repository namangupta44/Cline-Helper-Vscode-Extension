import { ToExtension } from '@shared/messages';

export const vscode = (window as any).__vscode__ as {
  postMessage: (msg: ToExtension) => void;
  getState: () => unknown;
  setState: (s: unknown) => void;
};
