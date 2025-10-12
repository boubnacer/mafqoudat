import { createSlice } from '@reduxjs/toolkit';

/**
 * Maintenance Mode Redux Slice
 * Manages the maintenance mode state for the application
 */
const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState: {
    isActive: false,
    message: '',
    estimatedReturn: 'soon',
    detectedAt: null
  },
  reducers: {
    setMaintenanceMode: (state, action) => {
      state.isActive = action.payload.isActive;
      state.message = action.payload.message || '';
      state.estimatedReturn = action.payload.estimatedReturn || 'soon';
      state.detectedAt = action.payload.isActive ? new Date().toISOString() : null;
      
      // Log maintenance mode activation
      if (action.payload.isActive) {
        console.log('🔧 Maintenance mode activated:', {
          message: state.message,
          estimatedReturn: state.estimatedReturn,
          timestamp: state.detectedAt
        });
      } else {
        console.log('✅ Maintenance mode deactivated');
      }
    },
    clearMaintenanceMode: (state) => {
      state.isActive = false;
      state.message = '';
      state.estimatedReturn = 'soon';
      state.detectedAt = null;
      console.log('✅ Maintenance mode cleared');
    }
  }
});

export const { setMaintenanceMode, clearMaintenanceMode } = maintenanceSlice.actions;

// Selectors
export const selectMaintenanceMode = (state) => state.maintenance;
export const selectIsMaintenanceActive = (state) => state.maintenance.isActive;
export const selectMaintenanceMessage = (state) => state.maintenance.message;
export const selectMaintenanceEstimatedReturn = (state) => state.maintenance.estimatedReturn;
export const selectMaintenanceDetectedAt = (state) => state.maintenance.detectedAt;

export default maintenanceSlice.reducer;

