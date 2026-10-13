import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Theme correction for the consent message Google renders outside the React
// tree - see the file header.
import './styles/consentMessage.css';
import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';
import { BrowserRouter } from 'react-router-dom';

import { store } from './app/store';
import { Provider } from 'react-redux';
import silenceProductionLogs from './utils/silenceProductionLogs';

// Before anything renders, so no module's import-time logging slips through.
silenceProductionLogs();

// Transparently handle ChunkLoadError when a new version is deployed on Vercel
window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (/Loading chunk [\d]+ failed/i.test(msg) || /Failed to fetch dynamically imported module/i.test(msg)) {
    const lastReload = sessionStorage.getItem('last_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 30000) {
      sessionStorage.setItem('last_chunk_reload', now.toString());
      window.location.reload();
    }
  }
});

const rootElement = document.getElementById('root');

// Create root (React 18's createRoot works for both initial render and hydration)
const root = ReactDOM.createRoot(rootElement);

// Render the app
// Note: React 18's createRoot will automatically hydrate if content exists
// This ensures compatibility with react-snap pre-rendering
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
