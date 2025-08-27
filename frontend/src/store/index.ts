// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
// import authSlice from './slices/authSlice';
// import workflowSlice from './slices/workflowSlice';
// import uiSlice from './slices/uiSlice';
import healthSlice from './slices/healthSlice'; 
    // auth: authSlice,
    // workflow: workflowSlice,
    // ui: uiSlice,
export const store = configureStore({
  reducer: {

    health: healthSlice, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;