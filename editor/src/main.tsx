import React from 'react';
import ReactDOM from 'react-dom/client';
import '@indxsearch/systm/styles.css';
import './theme.css';
import './app.css';
import App from './App';

// The Electron wrapper serves the editor over pixl://; the browser build keeps its normal chrome.
if (location.protocol === 'pixl:') document.documentElement.classList.add('desktop');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
