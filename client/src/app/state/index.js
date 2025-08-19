import { createSlice } from "@reduxjs/toolkit";

// Get initial state from localStorage
const getInitialState = () => {
  const savedState = localStorage.getItem('globalState');
  console.log('Redux: Loading saved state from localStorage:', savedState);
  
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState);
      console.log('Redux: Parsed state:', parsedState);
      return parsedState;
    } catch (error) {
      console.error('Error parsing saved global state:', error);
    }
  }
  
  console.log('Redux: No saved state found, using default state');
  return {
    currentCountry: "",
    mode: "dark",
    isSidebarOpen: false,
    openModal: false,
    activeLink: "",
    foundOrlost: "",
    direction: "ltr",
    categoryFilter: "all", // Add category filter state
  };
};

export const globalSlice = createSlice({
  name: "global",
  initialState: getInitialState(),
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      // Save to localStorage
      localStorage.setItem('globalState', JSON.stringify(state));
    },

    setIsSidebarOpen: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
      // Save to localStorage
      localStorage.setItem('globalState', JSON.stringify(state));
    },
    setActiveLink: (state, action) => {
      const { active } = action.payload;
      state.activeLink = active;
      // Save to localStorage
      localStorage.setItem('globalState', JSON.stringify(state));
    },
    setCurrentCountry: (state, action) => {
      const { currentCountry } = action.payload;
      console.log('Redux: Setting currentCountry:', currentCountry);
      state.currentCountry = currentCountry;
      // Save to localStorage
      localStorage.setItem('globalState', JSON.stringify(state));
      console.log('Redux: Saved state to localStorage:', JSON.stringify(state));
    },
    setFoundOrLost: (state, action) => {
      const { foundOrlost } = action.payload;
      state.foundOrlost = foundOrlost;
      // Save to localStorage
      localStorage.setItem('globalState', JSON.stringify(state));
    },
    setCategoryFilter: (state, action) => {
      const { categoryFilter } = action.payload;
      state.categoryFilter = categoryFilter;
      // Save to localStorage
      localStorage.setItem('globalState', JSON.stringify(state));
    },
    setOpenModal: (state) => {
      state.openModal = !state.openModal;
      // Save to localStorage
      localStorage.setItem('globalState', JSON.stringify(state));
    },
  },
});

export const {
  setMode,
  setIsSidebarOpen,
  setActiveLink,
  setCurrentCountry,
  setFoundOrLost,
  setCategoryFilter,
  setOpenModal,
} = globalSlice.actions;

export const selectIsSidebarOpen = (state) => state.global.isSidebarOpen;
export const selectActiveLink = (state) => state.global.activeLink;
export const selectCurrentCountry = (state) => state.global.currentCountry;
export const selectFoundOrLost = (state) => state.global.foundOrlost;
export const selectCategoryFilter = (state) => state.global.categoryFilter;
export const selectOpenModal = (state) => state.global.openModal;

export default globalSlice.reducer;
