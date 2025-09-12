// frontend/src/store/slices/adminSlice.ts - COMPLETE IMPLEMENTATION
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { adminService, DbConnection, ModelConfig, SystemMetrics } from '../../services/adminService';

export interface AdminState {
  dbConnections: DbConnection[];
  models: ModelConfig[];
  systemStats: SystemMetrics | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

const initialState: AdminState = {
  dbConnections: [],
  models: [],
  systemStats: null,
  loading: false,
  error: null,
  totalCount: 0,
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 0,
  },
};

// Async Thunks
export const fetchSystemStats = createAsyncThunk(
  'admin/fetchSystemStats',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getSystemStats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch system stats');
    }
  }
);

export const fetchDbConnections = createAsyncThunk(
  'admin/fetchDbConnections',
  async (params: { page: number; limit: number; q?: string }, { rejectWithValue }) => {
    try {
      return await adminService.getDbConnections(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch connections');
    }
  }
);

export const fetchModels = createAsyncThunk(
  'admin/fetchModels',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getModels();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch models');
    }
  }
);

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // System Stats
    builder
      .addCase(fetchSystemStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemStats.fulfilled, (state, action) => {
        state.loading = false;
        state.systemStats = action.payload;
      })
      .addCase(fetchSystemStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    // DB Connections
    builder
      .addCase(fetchDbConnections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDbConnections.fulfilled, (state, action) => {
        state.loading = false;
        state.dbConnections = action.payload.connections;
        state.totalCount = action.payload.totalCount;
        state.pagination.totalPages = Math.ceil(action.payload.totalCount / state.pagination.limit);
      })
      .addCase(fetchDbConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    // Models
    builder
      .addCase(fetchModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setPagination } = adminSlice.actions;
export default adminSlice.reducer;
