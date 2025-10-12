/**
 * Maintenance Mode Testing Utilities
 * Development-only utilities for testing maintenance mode display
 */

import { store } from '../app/store';
import { setMaintenanceMode, clearMaintenanceMode } from '../app/state/maintenanceSlice';

/**
 * Enable test maintenance mode
 * Shows the maintenance mode screen with test data
 */
export const enableTestMaintenanceMode = () => {
  console.log('🔧 [TEST] Enabling test maintenance mode...');
  store.dispatch(setMaintenanceMode({
    isActive: true,
    message: "Test maintenance mode - This is a test message for development",
    estimatedReturn: "In a few moments (test)"
  }));
  console.log('✅ [TEST] Test maintenance mode enabled');
};

/**
 * Disable test maintenance mode
 * Hides the maintenance mode screen
 */
export const disableTestMaintenanceMode = () => {
  console.log('✅ [TEST] Disabling test maintenance mode...');
  store.dispatch(clearMaintenanceMode());
  console.log('✅ [TEST] Test maintenance mode disabled');
};

/**
 * Toggle test maintenance mode
 */
export const toggleTestMaintenanceMode = () => {
  const currentState = store.getState().maintenance;
  if (currentState.isActive) {
    disableTestMaintenanceMode();
  } else {
    enableTestMaintenanceMode();
  }
};

/**
 * Get current maintenance mode state
 */
export const getMaintenanceState = () => {
  const state = store.getState().maintenance;
  console.log('Current maintenance state:', state);
  return state;
};

// Make available in browser console for testing (development only)
if (process.env.NODE_ENV === 'development') {
  window.enableTestMaintenanceMode = enableTestMaintenanceMode;
  window.disableTestMaintenanceMode = disableTestMaintenanceMode;
  window.toggleTestMaintenanceMode = toggleTestMaintenanceMode;
  window.getMaintenanceState = getMaintenanceState;
  
  console.log('%c🔧 Maintenance Mode Testing Utilities Loaded', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
  console.log('%cAvailable commands:', 'color: #2196F3; font-weight: bold;');
  console.log('%c  • enableTestMaintenanceMode()', 'color: #666;');
  console.log('%c  • disableTestMaintenanceMode()', 'color: #666;');
  console.log('%c  • toggleTestMaintenanceMode()', 'color: #666;');
  console.log('%c  • getMaintenanceState()', 'color: #666;');
}

export default {
  enableTestMaintenanceMode,
  disableTestMaintenanceMode,
  toggleTestMaintenanceMode,
  getMaintenanceState
};

