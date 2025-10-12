/**
 * System Settings API Usage Examples
 * 
 * This file demonstrates various ways to use the systemSettingsApiSlice hooks
 * DO NOT import this file - it's for reference only
 */

import { useGetSystemSettingsQuery, useUpdateMaintenanceModeMutation } from './systemSettingsApiSlice';

// ============================================================================
// EXAMPLE 1: Basic Query Usage
// ============================================================================

export function Example1_BasicQuery() {
  const { data, isLoading, error, refetch } = useGetSystemSettingsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const maintenanceMode = data?.data?.maintenanceMode;

  return (
    <div>
      <p>Maintenance Mode: {maintenanceMode?.isActive ? 'Active' : 'Inactive'}</p>
      <p>Message: {maintenanceMode?.message}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Toggle Maintenance Mode
// ============================================================================

export function Example2_ToggleMaintenance() {
  const { data } = useGetSystemSettingsQuery();
  const [updateMaintenance, { isLoading }] = useUpdateMaintenanceModeMutation();

  const handleToggle = async () => {
    try {
      // Empty object = toggle current state
      const result = await updateMaintenance({}).unwrap();
      console.log('Success:', result);
      alert('Maintenance mode toggled!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to toggle: ' + error.message);
    }
  };

  const isActive = data?.data?.maintenanceMode?.isActive;

  return (
    <button onClick={handleToggle} disabled={isLoading}>
      {isLoading ? 'Updating...' : isActive ? 'Disable' : 'Enable'} Maintenance
    </button>
  );
}

// ============================================================================
// EXAMPLE 3: Enable with Custom Message
// ============================================================================

export function Example3_EnableWithMessage() {
  const [updateMaintenance, { isLoading, error }] = useUpdateMaintenanceModeMutation();
  const [message, setMessage] = React.useState('');
  const [estimatedReturn, setEstimatedReturn] = React.useState('');

  const handleEnable = async () => {
    try {
      await updateMaintenance({
        isActive: true,
        message: message,
        estimatedReturn: estimatedReturn || 'soon'
      }).unwrap();
      
      alert('Maintenance mode enabled!');
      setMessage('');
      setEstimatedReturn('');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Maintenance message"
        maxLength={500}
      />
      <input
        value={estimatedReturn}
        onChange={(e) => setEstimatedReturn(e.target.value)}
        placeholder="Estimated return (e.g., 2 hours)"
      />
      <button onClick={handleEnable} disabled={isLoading || !message}>
        {isLoading ? 'Enabling...' : 'Enable Maintenance'}
      </button>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Disable Maintenance Mode
// ============================================================================

export function Example4_DisableMaintenance() {
  const [updateMaintenance, { isLoading }] = useUpdateMaintenanceModeMutation();

  const handleDisable = async () => {
    try {
      await updateMaintenance({ isActive: false }).unwrap();
      alert('Maintenance mode disabled!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <button onClick={handleDisable} disabled={isLoading}>
      {isLoading ? 'Disabling...' : 'Disable Maintenance'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 5: With Material-UI and Notifications
// ============================================================================

export function Example5_WithMaterialUI() {
  const { data, isLoading, error } = useGetSystemSettingsQuery();
  const [updateMaintenance] = useUpdateMaintenanceModeMutation();
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

  const handleToggle = async () => {
    try {
      const result = await updateMaintenance({}).unwrap();
      const status = result.data.maintenanceMode.isActive ? 'enabled' : 'disabled';
      setSnackbar({
        open: true,
        message: `Maintenance mode ${status} successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update maintenance mode',
        severity: 'error'
      });
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <>
      <Switch
        checked={data?.data?.maintenanceMode?.isActive || false}
        onChange={handleToggle}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}

// ============================================================================
// EXAMPLE 6: Polling for Updates
// ============================================================================

export function Example6_WithPolling() {
  // Poll every 30 seconds for updates
  const { data } = useGetSystemSettingsQuery(undefined, {
    pollingInterval: 30000, // 30 seconds
  });

  return (
    <div>
      <p>Status: {data?.data?.maintenanceMode?.isActive ? 'Active' : 'Inactive'}</p>
      <small>Auto-refreshes every 30 seconds</small>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Skip Query Until Needed
// ============================================================================

export function Example7_ConditionalQuery() {
  const [shouldFetch, setShouldFetch] = React.useState(false);
  
  const { data, isLoading } = useGetSystemSettingsQuery(undefined, {
    skip: !shouldFetch, // Don't fetch until shouldFetch is true
  });

  return (
    <div>
      <button onClick={() => setShouldFetch(true)}>
        Load Settings
      </button>
      {isLoading && <p>Loading...</p>}
      {data && <p>Status: {data.data.maintenanceMode.isActive ? 'Active' : 'Inactive'}</p>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Optimistic Updates
// ============================================================================

export function Example8_OptimisticUpdate() {
  const { data } = useGetSystemSettingsQuery();
  const [updateMaintenance] = useUpdateMaintenanceModeMutation();

  const handleToggle = async () => {
    const currentStatus = data?.data?.maintenanceMode?.isActive;
    
    // Immediately show new state in UI (optimistic update)
    // The actual update happens in the background
    
    try {
      await updateMaintenance({}).unwrap();
      // Success - UI already updated optimistically
    } catch (error) {
      // Error - RTK Query will automatically revert the optimistic update
      console.error('Failed:', error);
    }
  };

  return (
    <button onClick={handleToggle}>
      {data?.data?.maintenanceMode?.isActive ? 'Disable' : 'Enable'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 9: Error Handling with Retry
// ============================================================================

export function Example9_ErrorHandling() {
  const { data, isLoading, error, refetch } = useGetSystemSettingsQuery();
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    if (error && retryCount < 3) {
      // Auto-retry up to 3 times
      const timer = setTimeout(() => {
        console.log(`Retrying... Attempt ${retryCount + 1}`);
        refetch();
        setRetryCount(retryCount + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, refetch]);

  if (isLoading) return <div>Loading...</div>;
  
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <p>Retry attempts: {retryCount}/3</p>
        {retryCount >= 3 && (
          <button onClick={() => { setRetryCount(0); refetch(); }}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  return <div>Status: {data?.data?.maintenanceMode?.isActive ? 'Active' : 'Inactive'}</div>;
}

// ============================================================================
// EXAMPLE 10: Integration with Redux State
// ============================================================================

export function Example10_WithReduxState() {
  const { data } = useGetSystemSettingsQuery();
  const [updateMaintenance] = useUpdateMaintenanceModeMutation();
  
  // You can also dispatch to other Redux slices
  const dispatch = useDispatch();

  const handleToggle = async () => {
    try {
      const result = await updateMaintenance({}).unwrap();
      
      // Dispatch to other Redux slices if needed
      // dispatch(someOtherAction(result));
      
      // Or update local state
      // Or trigger other side effects
      
    } catch (error) {
      // Handle error
    }
  };

  return (
    <button onClick={handleToggle}>
      Toggle Maintenance
    </button>
  );
}

/**
 * BEST PRACTICES:
 * 
 * 1. Always handle loading states
 * 2. Always handle errors gracefully
 * 3. Use .unwrap() on mutations for try/catch error handling
 * 4. Use refetch() sparingly - RTK Query caches intelligently
 * 5. Use invalidatesTags for automatic cache updates
 * 6. Consider polling for real-time updates if needed
 * 7. Use skip option to control when queries run
 * 8. Provide user feedback for all actions
 * 9. Log errors for debugging
 * 10. Test error scenarios
 */

