import { createSlice } from "@reduxjs/toolkit";
import { ensureGlobalStateAlwaysExists } from "../../utils/globalStateInitializer";

// Get initial state from localStorage, ensuring it ALWAYS exists
const getInitialState = () => {
  // Ensure globalState exists in localStorage first
  const state = ensureGlobalStateAlwaysExists();
  
  // Return the guaranteed state
  return state;
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
      state.currentCountry = currentCountry;
      // Save to localStorage
      localStorage.setItem('globalState', JSON.stringify(state));
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

export const selectMode = (state) => state.global.mode;
export const selectIsSidebarOpen = (state) => state.global.isSidebarOpen;
export const selectActiveLink = (state) => state.global.activeLink;
export const selectCurrentCountry = (state) => state.global.currentCountry;
export const selectFoundOrLost = (state) => state.global.foundOrlost;
export const selectCategoryFilter = (state) => state.global.categoryFilter;
export const selectOpenModal = (state) => state.global.openModal;

export default globalSlice.reducer;
