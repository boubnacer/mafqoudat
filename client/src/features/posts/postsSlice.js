import { createSlice } from "@reduxjs/toolkit";

export const postsSlice = createSlice({
  name: "posts",
  initialState: { editPostId: "", category: "", foundLost: "" },
  reducers: {
    getEditPostId: (state, action) => {
      const { editPostId } = action.payload;
      state.editPostId = editPostId;
    },
    sendFilters: (state, action) => {
      const { category, foundLost } = action.payload;
      state.category = category;
      state.foundLost = foundLost;
    },
  },
});

export const { getEditPostId, sendFilters } = postsSlice.actions;

export default postsSlice.reducer;

export const selectEditPostId = (state) => state.posts.editPostId;
export const selectCategory = (state) => state.posts.category;
export const selectFoundLost = (state) => state.posts.foundLost;
