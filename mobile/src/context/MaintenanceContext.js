/**
 * Maintenance Context
 * Global "server is in maintenance mode" flag. The axios response interceptor
 * (app/api/apiService.js) has no state of its own - it registers a setter here on
 * mount and calls it whenever a request hits the 503 maintenanceMode payload (or
 * clears it on any subsequent successful response), so any screen's fetch anywhere
 * in the app can trip the same global overlay.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { setMaintenanceHandler } from '../app/api/apiService';

const MaintenanceContext = createContext();

const initialState = {
  isActive: false,
  message: '',
  estimatedReturn: '',
};

export const MaintenanceProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setMaintenanceHandler((payload) => {
      if (payload) {
        setState({
          isActive: true,
          message: payload.message || '',
          estimatedReturn: payload.estimatedReturn || '',
        });
      } else {
        setState((prev) => (prev.isActive ? initialState : prev));
      }
    });
    return () => setMaintenanceHandler(null);
  }, []);

  return <MaintenanceContext.Provider value={state}>{children}</MaintenanceContext.Provider>;
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};
