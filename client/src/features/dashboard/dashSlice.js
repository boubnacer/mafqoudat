import { createSlice } from "@reduxjs/toolkit";

export const dashSlice = createSlice({
  name: "dash",
  initialState: { isSidebarOpen: false },
  reducers: {
    toggleSidebar: (state, action) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
  },
});

export const { toggleSidebar } = dashSlice.actions;

export default dashSlice.reducer;

export const selectIsSidebarOpen = (state) => state.dash.isSidebarOpen;
