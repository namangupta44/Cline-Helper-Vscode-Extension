declare module '@vscode/webview-ui-toolkit/react' {
  import * as React from 'react';

  export const VSCodeButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
    appearance?: 'primary' | 'secondary' | 'icon';
    disabled?: boolean;
  }>;

  export const VSCodeCheckbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
    checked?: boolean;
    disabled?: boolean;
  }>;

  export const VSCodeDivider: React.FC<React.HTMLAttributes<HTMLDivElement>>;

  export const VSCodeTextField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    readonly?: boolean;
  }>;

  export const VSCodePanels: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const VSCodePanelTab: React.FC<React.HTMLAttributes<HTMLDivElement> & { id: string }>;
  export const VSCodePanelView: React.FC<React.HTMLAttributes<HTMLDivElement> & { id: string }>;
}
