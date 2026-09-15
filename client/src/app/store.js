import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/dist/query"; // remove /dist // helpfull for cashing
import { apiSlice } from "./api/apiSlice";
import authReducer from "../features/auth/authSlice";
import postsReducer from "../features/posts/postsSlice";
import dashReducer from "../features/dashboard/dashSlice";
import globalReducer from "./state/index";
import maintenanceReducer from "./state/maintenanceSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    posts: postsReducer,
    dash: dashReducer,
    global: globalReducer,
    maintenance: maintenanceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  // Unconditionally true exposed state.auth.token (the live access token) to
  // Redux DevTools in production too - anyone with the extension installed
  // could read a signed-in visitor's Bearer token straight out of the store.
  devTools: process.env.NODE_ENV !== 'production',
});

setupListeners(store.dispatch);
