import React from 'react';
import ReactDOM from 'react-dom/client';
import { FileAndFolderCollector } from './features/fileAndFolderCollector/FileAndFolderCollector';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FileAndFolderCollector />
  </React.StrictMode>
);
