import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import workflowSlice from './slices/workflowSlice';
import uiSlice from './slices/uiSlice';
import whiteboardSlice from './slices/whiteboardSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    workflow: workflowSlice,
    ui: uiSlice,
    whiteboard: whiteboardSlice,
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
