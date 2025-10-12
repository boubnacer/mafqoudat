import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

import { store } from './app/store'
import { Provider } from 'react-redux'

// Load maintenance mode test utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/testMaintenanceMode');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
