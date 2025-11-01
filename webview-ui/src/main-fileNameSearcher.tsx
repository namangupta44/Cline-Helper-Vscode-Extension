import React from 'react';
import ReactDOM from 'react-dom/client';
import { FileNameSearcher } from './features/fileNameSearcher/FileNameSearcher';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FileNameSearcher />
  </React.StrictMode>
);
