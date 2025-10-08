/**
 * Global State Initializer
 * Ensures globalState is always present in localStorage
 */

/**
 * Default globalState structure
 */
export const DEFAULT_GLOBAL_STATE = {
  currentCountry: null,
  mode: "light",
  isSidebarOpen: false,
  openModal: false,
  activeLink: "",
  foundOrlost: "",
  direction: "ltr",
  categoryFilter: "all"
};

/**
 * Check if globalState exists in localStorage
 * @returns {boolean}
 */
export const globalStateExists = () => {
  const globalState = localStorage.getItem('globalState');
  return globalState !== null && globalState !== undefined && globalState !== '';
};

/**
 * Get globalState from localStorage, or return default
 * @returns {Object}
 */
export const getGlobalState = () => {
  try {
    const globalState = localStorage.getItem('globalState');
    
    if (!globalState) {
      return { ...DEFAULT_GLOBAL_STATE };
    }
    
    const parsed = JSON.parse(globalState);
    
    // Ensure all required properties exist
    return {
      ...DEFAULT_GLOBAL_STATE,
      ...parsed
    };
  } catch (error) {
    console.error('Error parsing globalState:', error);
    return { ...DEFAULT_GLOBAL_STATE };
  }
};

/**
 * Initialize globalState in localStorage
 * @param {Object} options - Initialization options
 * @returns {Object} - The initialized state
 */
export const initializeGlobalState = (options = {}) => {
  const {
    currentCountry = null,
    mode = null,
    preserveExisting = true
  } = options;
  
  let state;
  
  if (preserveExisting && globalStateExists()) {
    // Get existing state and merge with defaults
    state = getGlobalState();
    
    // Override specific values if provided
    if (currentCountry !== null) {
      state.currentCountry = currentCountry;
    }
    if (mode !== null) {
      state.mode = mode;
    }
  } else {
    // Create new state
    state = {
      ...DEFAULT_GLOBAL_STATE,
      currentCountry: currentCountry || DEFAULT_GLOBAL_STATE.currentCountry,
      mode: mode || localStorage.getItem('theme') || DEFAULT_GLOBAL_STATE.mode
    };
  }
  
  // Save to localStorage
  localStorage.setItem('globalState', JSON.stringify(state));
  
  return state;
};

/**
 * Ensure globalState exists with user's country
 * Called during login to set user's country in globalState
 * @param {Object} userData - User data with country
 * @returns {Object} - The updated state
 */
export const ensureGlobalStateWithUserCountry = (userData) => {
  if (!userData) {
    console.warn('ensureGlobalStateWithUserCountry: No user data provided');
    return initializeGlobalState();
  }
  
  const userCountry = userData.country || userData.Country;
  
  if (!userCountry) {
    console.warn('ensureGlobalStateWithUserCountry: User has no country');
    return initializeGlobalState();
  }
  
  // Initialize or update globalState with user's country
  const state = initializeGlobalState({
    currentCountry: userCountry,
    preserveExisting: true
  });
  
  console.log('GlobalState initialized with user country:', userCountry);
  
  return state;
};

/**
 * Repair globalState if it's corrupted or missing required fields
 * @returns {Object} - The repaired state
 */
export const repairGlobalState = () => {
  const state = getGlobalState();
  
  // Ensure all default keys exist
  const repairedState = {
    ...DEFAULT_GLOBAL_STATE,
    ...state
  };
  
  // Save repaired state
  localStorage.setItem('globalState', JSON.stringify(repairedState));
  
  return repairedState;
};

/**
 * Update a specific field in globalState
 * @param {string} key - The key to update
 * @param {*} value - The new value
 * @returns {Object} - The updated state
 */
export const updateGlobalStateField = (key, value) => {
  const state = getGlobalState();
  state[key] = value;
  localStorage.setItem('globalState', JSON.stringify(state));
  return state;
};

/**
 * Force globalState to always exist - main function to call on app startup
 * @returns {Object} - The guaranteed state
 */
export const ensureGlobalStateAlwaysExists = () => {
  if (!globalStateExists()) {
    console.log('GlobalState not found - initializing...');
    return initializeGlobalState();
  }
  
  // Verify structure is valid
  try {
    const state = getGlobalState();
    
    // Check if all required keys exist
    const hasAllKeys = Object.keys(DEFAULT_GLOBAL_STATE).every(key => key in state);
    
    if (!hasAllKeys) {
      console.log('GlobalState missing keys - repairing...');
      return repairGlobalState();
    }
    
    return state;
  } catch (error) {
    console.error('GlobalState validation failed - reinitializing:', error);
    return initializeGlobalState({ preserveExisting: false });
  }
};

export default {
  DEFAULT_GLOBAL_STATE,
  globalStateExists,
  getGlobalState,
  initializeGlobalState,
  ensureGlobalStateWithUserCountry,
  repairGlobalState,
  updateGlobalStateField,
  ensureGlobalStateAlwaysExists
};

