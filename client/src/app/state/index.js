import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentCountry: "",
  mode: "dark",
  isSidebarOpen: false,
  openModal: false,
  activeLink: "",
  foundOrlost: "",
  direction: "ltr",
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },

    setIsSidebarOpen: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setActiveLink: (state, action) => {
      const { active } = action.payload;
      state.activeLink = active;
    },
    setCurrentCountry: (state, action) => {
      const { currentCountry } = action.payload;
      state.currentCountry = currentCountry;
    },
    setFoundOrLost: (state, action) => {
      const { foundOrlost } = action.payload;
      state.foundOrlost = foundOrlost;
    },
    setOpenModal: (state) => {
      state.openModal = !state.openModal;
    },
  },
});

export const {
  setMode,
  setIsSidebarOpen,
  setActiveLink,
  setCurrentCountry,
  setFoundOrLost,
  setOpenModal,
} = globalSlice.actions;

export const selectIsSidebarOpen = (state) => state.global.isSidebarOpen;
export const selectActiveLink = (state) => state.global.activeLink;
export const selectCurrentCountry = (state) => state.global.currentCountry;
export const selectFoundOrLost = (state) => state.global.foundOrlost;
export const selectOpenModal = (state) => state.global.openModal;

export default globalSlice.reducer;
