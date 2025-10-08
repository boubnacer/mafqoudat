/**
 * Tests for globalStateInitializer
 * Run these tests to verify globalState is always initialized correctly
 */

import {
  DEFAULT_GLOBAL_STATE,
  globalStateExists,
  getGlobalState,
  initializeGlobalState,
  ensureGlobalStateWithUserCountry,
  repairGlobalState,
  ensureGlobalStateAlwaysExists
} from '../globalStateInitializer';

describe('globalStateInitializer', () => {
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });
  
  describe('globalStateExists', () => {
    test('should return false when globalState does not exist', () => {
      expect(globalStateExists()).toBe(false);
    });
    
    test('should return true when globalState exists', () => {
      localStorage.setItem('globalState', JSON.stringify(DEFAULT_GLOBAL_STATE));
      expect(globalStateExists()).toBe(true);
    });
  });
  
  describe('getGlobalState', () => {
    test('should return default state when nothing in localStorage', () => {
      const state = getGlobalState();
      expect(state).toEqual(DEFAULT_GLOBAL_STATE);
    });
    
    test('should return saved state from localStorage', () => {
      const savedState = { ...DEFAULT_GLOBAL_STATE, currentCountry: 'Morocco' };
      localStorage.setItem('globalState', JSON.stringify(savedState));
      
      const state = getGlobalState();
      expect(state.currentCountry).toBe('Morocco');
    });
    
    test('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('globalState', '{invalid json}');
      
      const state = getGlobalState();
      expect(state).toEqual(DEFAULT_GLOBAL_STATE);
    });
    
    test('should merge with defaults if properties missing', () => {
      localStorage.setItem('globalState', JSON.stringify({ currentCountry: 'Morocco' }));
      
      const state = getGlobalState();
      expect(state.currentCountry).toBe('Morocco');
      expect(state.mode).toBe('light'); // Should have default
      expect(state.categoryFilter).toBe('all'); // Should have default
    });
  });
  
  describe('initializeGlobalState', () => {
    test('should create new globalState when none exists', () => {
      const state = initializeGlobalState();
      
      expect(globalStateExists()).toBe(true);
      expect(state).toEqual(DEFAULT_GLOBAL_STATE);
    });
    
    test('should set currentCountry when provided', () => {
      const state = initializeGlobalState({ currentCountry: 'Morocco' });
      
      expect(state.currentCountry).toBe('Morocco');
      expect(localStorage.getItem('globalState')).toContain('Morocco');
    });
    
    test('should preserve existing state when preserveExisting is true', () => {
      localStorage.setItem('globalState', JSON.stringify({ 
        ...DEFAULT_GLOBAL_STATE, 
        currentCountry: 'Morocco' 
      }));
      
      const state = initializeGlobalState({ 
        currentCountry: 'Egypt',
        preserveExisting: true 
      });
      
      expect(state.currentCountry).toBe('Egypt'); // Should update
    });
    
    test('should override existing state when preserveExisting is false', () => {
      localStorage.setItem('globalState', JSON.stringify({ 
        ...DEFAULT_GLOBAL_STATE, 
        currentCountry: 'Morocco',
        mode: 'dark'
      }));
      
      const state = initializeGlobalState({ 
        preserveExisting: false 
      });
      
      expect(state.currentCountry).toBe(null); // Should reset to default
      expect(state.mode).toBe('light'); // Should reset to default
    });
  });
  
  describe('ensureGlobalStateWithUserCountry', () => {
    test('should initialize globalState with user country', () => {
      const userData = { country: 'Morocco', username: 'test' };
      
      const state = ensureGlobalStateWithUserCountry(userData);
      
      expect(state.currentCountry).toBe('Morocco');
      expect(globalStateExists()).toBe(true);
    });
    
    test('should handle user with Country (capital C)', () => {
      const userData = { Country: 'Egypt', username: 'test' };
      
      const state = ensureGlobalStateWithUserCountry(userData);
      
      expect(state.currentCountry).toBe('Egypt');
    });
    
    test('should handle user with no country', () => {
      const userData = { username: 'test' };
      
      const state = ensureGlobalStateWithUserCountry(userData);
      
      expect(state).toBeDefined();
      expect(globalStateExists()).toBe(true);
    });
    
    test('should handle null user data', () => {
      const state = ensureGlobalStateWithUserCountry(null);
      
      expect(state).toBeDefined();
      expect(globalStateExists()).toBe(true);
    });
  });
  
  describe('repairGlobalState', () => {
    test('should add missing properties', () => {
      localStorage.setItem('globalState', JSON.stringify({ 
        currentCountry: 'Morocco' 
      }));
      
      const state = repairGlobalState();
      
      expect(state.currentCountry).toBe('Morocco'); // Preserved
      expect(state.mode).toBe('light'); // Added
      expect(state.categoryFilter).toBe('all'); // Added
    });
    
    test('should handle completely corrupted state', () => {
      localStorage.setItem('globalState', 'not-json');
      
      const state = repairGlobalState();
      
      expect(state).toEqual(DEFAULT_GLOBAL_STATE);
    });
  });
  
  describe('ensureGlobalStateAlwaysExists', () => {
    test('should create globalState when it does not exist', () => {
      const state = ensureGlobalStateAlwaysExists();
      
      expect(globalStateExists()).toBe(true);
      expect(state).toEqual(DEFAULT_GLOBAL_STATE);
    });
    
    test('should return existing valid globalState', () => {
      const existing = { ...DEFAULT_GLOBAL_STATE, currentCountry: 'Morocco' };
      localStorage.setItem('globalState', JSON.stringify(existing));
      
      const state = ensureGlobalStateAlwaysExists();
      
      expect(state.currentCountry).toBe('Morocco');
    });
    
    test('should repair globalState with missing keys', () => {
      localStorage.setItem('globalState', JSON.stringify({ 
        currentCountry: 'Morocco',
        mode: 'dark'
        // Missing other properties
      }));
      
      const state = ensureGlobalStateAlwaysExists();
      
      expect(state.currentCountry).toBe('Morocco');
      expect(state.mode).toBe('dark');
      expect(state.categoryFilter).toBe('all'); // Should be added
      expect(state.isSidebarOpen).toBe(false); // Should be added
    });
    
    test('should handle corrupted JSON', () => {
      localStorage.setItem('globalState', '{bad: json}');
      
      const state = ensureGlobalStateAlwaysExists();
      
      expect(state).toEqual(DEFAULT_GLOBAL_STATE);
      expect(globalStateExists()).toBe(true);
    });
  });
  
  describe('Integration tests', () => {
    test('Full flow: fresh user -> login -> refresh', () => {
      // Step 1: Fresh user visit
      let state = ensureGlobalStateAlwaysExists();
      expect(state.currentCountry).toBe(null);
      
      // Step 2: User logs in
      const userData = { country: 'Morocco', username: 'testuser' };
      state = ensureGlobalStateWithUserCountry(userData);
      expect(state.currentCountry).toBe('Morocco');
      
      // Step 3: Page refresh (localStorage persists)
      state = ensureGlobalStateAlwaysExists();
      expect(state.currentCountry).toBe('Morocco'); // Should persist
    });
    
    test('Handles localStorage corruption during session', () => {
      // Initialize properly
      initializeGlobalState({ currentCountry: 'Morocco' });
      
      // Simulate corruption
      localStorage.setItem('globalState', 'corrupted');
      
      // Should auto-repair
      const state = ensureGlobalStateAlwaysExists();
      expect(state).toEqual(DEFAULT_GLOBAL_STATE);
      expect(globalStateExists()).toBe(true);
    });
  });
});

