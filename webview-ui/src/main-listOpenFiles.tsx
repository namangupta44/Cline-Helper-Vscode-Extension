import React from 'react';
import ReactDOM from 'react-dom/client';
import { ListOpenFiles } from './features/listOpenFiles/ListOpenFiles';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ListOpenFiles />
  </React.StrictMode>
);
