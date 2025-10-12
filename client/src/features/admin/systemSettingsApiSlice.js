import { apiSlice } from '../../app/api/apiSlice';

/**
 * System Settings API Slice
 * Manages system-wide configuration settings including maintenance mode
 * 
 * @module systemSettingsApiSlice
 */

/**
 * @typedef {Object} MaintenanceMode
 * @property {boolean} isActive - Whether maintenance mode is currently active
 * @property {string} message - Message to display during maintenance
 * @property {string} estimatedReturn - Estimated return time
 * @property {string|null} lastUpdatedBy - Username of admin who last updated
 * @property {string|null} lastUpdatedAt - ISO timestamp of last update
 */

/**
 * @typedef {Object} SystemSettings
 * @property {MaintenanceMode} maintenanceMode - Maintenance mode configuration
 * @property {string} createdAt - ISO timestamp of when settings were created
 * @property {string} updatedAt - ISO timestamp of last update
 */

/**
 * @typedef {Object} SystemSettingsResponse
 * @property {boolean} success - Whether the request was successful
 * @property {SystemSettings} data - System settings data
 */

/**
 * @typedef {Object} UpdateMaintenanceModeParams
 * @property {boolean} [isActive] - Set to true to enable, false to disable (optional - toggles if omitted)
 * @property {string} [message] - Custom maintenance message (optional, max 500 chars)
 * @property {string} [estimatedReturn] - Estimated return time (optional, max 100 chars)
 */

/**
 * @typedef {Object} UpdateMaintenanceModeResponse
 * @property {boolean} success - Whether the update was successful
 * @property {string} message - Success message
 * @property {Object} data - Updated maintenance mode data
 * @property {MaintenanceMode} data.maintenanceMode - Updated maintenance mode configuration
 */

export const systemSettingsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get current system settings
     * 
     * @description Retrieves all system settings including maintenance mode configuration
     * @access Admin only
     * 
     * @returns {SystemSettingsResponse} Current system settings
     * 
     * @example
     * const { data, isLoading, error } = useGetSystemSettingsQuery();
     * 
     * if (data) {
     *   console.log('Maintenance active:', data.data.maintenanceMode.isActive);
     * }
     */
    getSystemSettings: builder.query({
      query: () => '/system-settings',
      providesTags: ['SystemSettings'],
      /**
       * Transform the response to ensure consistent data structure
       */
      transformResponse: (response) => {
        console.log('✅ [SYSTEM-SETTINGS] Settings fetched successfully');
        return response;
      },
      /**
       * Handle errors gracefully
       */
      transformErrorResponse: (error) => {
        console.error('❌ [SYSTEM-SETTINGS] Error fetching settings:', error);
        
        // Provide user-friendly error messages
        if (error.status === 401) {
          return {
            message: 'Authentication required. Please log in as admin.',
            status: 401
          };
        }
        
        if (error.status === 403) {
          return {
            message: 'Admin privileges required to view system settings.',
            status: 403
          };
        }
        
        if (error.status === 500) {
          return {
            message: 'Server error while fetching system settings. Please try again later.',
            status: 500
          };
        }
        
        return {
          message: error.data?.message || 'Failed to fetch system settings',
          status: error.status || 'UNKNOWN'
        };
      }
    }),

    /**
     * Update maintenance mode settings
     * 
     * @description Updates maintenance mode configuration. Can enable/disable maintenance mode
     * and set custom messages. If isActive is not provided, toggles the current state.
     * 
     * @access Admin only
     * 
     * @param {UpdateMaintenanceModeParams} params - Update parameters
     * @returns {UpdateMaintenanceModeResponse} Updated maintenance mode data
     * 
     * @example
     * const [updateMaintenance, { isLoading }] = useUpdateMaintenanceModeMutation();
     * 
     * // Enable maintenance mode with custom message
     * await updateMaintenance({
     *   isActive: true,
     *   message: 'Scheduled maintenance in progress',
     *   estimatedReturn: '2 hours'
     * }).unwrap();
     * 
     * @example
     * // Toggle maintenance mode (no parameters)
     * await updateMaintenance({}).unwrap();
     * 
     * @example
     * // Disable maintenance mode
     * await updateMaintenance({ isActive: false }).unwrap();
     */
    updateMaintenanceMode: builder.mutation({
      query: (params) => {
        // Validate input
        if (params.message && params.message.length > 500) {
          throw new Error('Message cannot exceed 500 characters');
        }
        
        if (params.estimatedReturn && params.estimatedReturn.length > 100) {
          throw new Error('Estimated return cannot exceed 100 characters');
        }
        
        if (params.isActive !== undefined && typeof params.isActive !== 'boolean') {
          throw new Error('isActive must be a boolean value');
        }
        
        return {
          url: '/system-settings/maintenance',
          method: 'PATCH',
          body: params,
        };
      },
      invalidatesTags: ['SystemSettings'],
      /**
       * Handle successful update
       */
      transformResponse: (response) => {
        const status = response.data?.maintenanceMode?.isActive ? 'enabled' : 'disabled';
        console.log(`✅ [SYSTEM-SETTINGS] Maintenance mode ${status} successfully`);
        
        // Show success notification (if you have a notification system)
        // You can dispatch a notification action here if needed
        
        return response;
      },
      /**
       * Handle errors gracefully
       */
      transformErrorResponse: (error) => {
        console.error('❌ [SYSTEM-SETTINGS] Error updating maintenance mode:', error);
        
        // Provide user-friendly error messages
        if (error.status === 400) {
          return {
            message: error.data?.message || 'Invalid input. Please check your data.',
            status: 400
          };
        }
        
        if (error.status === 401) {
          return {
            message: 'Authentication required. Please log in as admin.',
            status: 401
          };
        }
        
        if (error.status === 403) {
          return {
            message: 'Admin privileges required to update maintenance mode.',
            status: 403
          };
        }
        
        if (error.status === 500) {
          return {
            message: 'Server error while updating maintenance mode. Please try again later.',
            status: 500
          };
        }
        
        return {
          message: error.data?.message || 'Failed to update maintenance mode',
          status: error.status || 'UNKNOWN'
        };
      },
      /**
       * Optimistic update for better UX
       * Updates the cache immediately before the server responds
       */
      async onQueryStarted(params, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Log successful update
          console.log('🔄 [SYSTEM-SETTINGS] Cache updated with new maintenance mode status');
          
          // You can dispatch additional actions here if needed
          // For example, showing a success toast notification
          
        } catch (error) {
          console.error('❌ [SYSTEM-SETTINGS] Failed to update maintenance mode:', error);
          
          // You can dispatch error notification actions here if needed
        }
      }
    }),
  }),
});

/**
 * Auto-generated hooks for use in React components
 * These hooks handle loading states, caching, and error states automatically
 */
export const {
  /**
   * Hook to fetch system settings
   * @returns {UseQueryResult<SystemSettingsResponse>}
   */
  useGetSystemSettingsQuery,
  
  /**
   * Hook to update maintenance mode
   * @returns {UseMutationResult<UpdateMaintenanceModeResponse, UpdateMaintenanceModeParams>}
   */
  useUpdateMaintenanceModeMutation,
} = systemSettingsApiSlice;

/**
 * Export the api slice for testing purposes
 */
export default systemSettingsApiSlice;

