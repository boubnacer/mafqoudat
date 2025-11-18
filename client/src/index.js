import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

import { store } from './app/store'
import { Provider } from 'react-redux'

const rootElement = document.getElementById('root');

// Check if react-snap has pre-rendered the page
const isPreRendered = rootElement.hasChildNodes();

// Create root (React 18's createRoot works for both initial render and hydration)
const root = ReactDOM.createRoot(rootElement);

// Render the app
// Note: React 18's createRoot will automatically hydrate if content exists
// This ensures compatibility with react-snap pre-rendering
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
