import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types';

// Safe theme detection for SSR
const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const stored = localStorage.getItem('theme');
  if (stored) return stored === 'dark';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const initialState: UIState = {
  isDarkMode: getInitialTheme(),
  sidebarCollapsed: false,
  selectedNodeId: null,
  propertiesPanelOpen: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
      
      // Update document class
      if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      localStorage.setItem('theme', action.payload ? 'dark' : 'light');
      
      // Update document class
      if (action.payload) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setSelectedNodeId: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
      state.propertiesPanelOpen = action.payload !== null;
    },
    togglePropertiesPanel: (state) => {
      state.propertiesPanelOpen = !state.propertiesPanelOpen;
    },
    setPropertiesPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.propertiesPanelOpen = action.payload;
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSidebar,
  setSidebarCollapsed,
  setSelectedNodeId,
  togglePropertiesPanel,
  setPropertiesPanelOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
