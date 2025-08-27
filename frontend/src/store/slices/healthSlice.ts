// src/store/slices/healthSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HealthState, ConnectionStatus } from '../../types/health.types';
import { healthService } from '../../services/healthService';

const initialState: HealthState = {
  status: null,
  connectionStatus: {
    isConnected: false,
    connectionType: 'offline',
    reconnectAttempts: 0,
  },
  loading: false,
  error: null,
  lastPolled: null,
  pollingInterval: 30000, // 30 seconds
};

// Async thunk for health check
export const fetchHealthStatus = createAsyncThunk(
  'health/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await healthService.getHealthStatus();
      return status;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch health status');
    }
  }
);

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    updateConnectionStatus: (state, action: PayloadAction<Partial<ConnectionStatus>>) => {
      state.connectionStatus = { ...state.connectionStatus, ...action.payload };
    },
    setPollingInterval: (state, action: PayloadAction<number>) => {
      state.pollingInterval = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    incrementReconnectAttempts: (state) => {
      state.connectionStatus.reconnectAttempts += 1;
    },
    resetReconnectAttempts: (state) => {
      state.connectionStatus.reconnectAttempts = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHealthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
        state.lastPolled = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchHealthStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateConnectionStatus,
  setPollingInterval,
  clearError,
  incrementReconnectAttempts,
  resetReconnectAttempts,
} = healthSlice.actions;

export default healthSlice.reducer;