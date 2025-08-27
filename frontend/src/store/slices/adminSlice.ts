import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { adminService, DbConnection, ModelConfig, SystemMetrics } from '../../services/adminService';

export type AdminState = {
  dbConnections: DbConnection[];
  models: ModelConfig[];
  systemStats: SystemMetrics | null;
  loading: boolean;
  error: string | null;
};

const initialState: AdminState = {
  dbConnections: [],
  models: [],
  systemStats: null,
  loading: false,
  error: null,
};

export const fetchDbConnections = createAsyncThunk('admin/fetchDbConnections', async () => {
  return await adminService.getDbConnections();
});
export const createDbConnection = createAsyncThunk('admin/createDbConnection', async (payload: Partial<DbConnection>) => {
  return await adminService.createDbConnection(payload);
});
export const updateDbConnection = createAsyncThunk('admin/updateDbConnection', async ({ id, payload }: { id: string; payload: Partial<DbConnection> }) => {
  return await adminService.updateDbConnection(id, payload);
});
export const deleteDbConnection = createAsyncThunk('admin/deleteDbConnection', async (id: string) => {
  await adminService.deleteDbConnection(id);
  return id;
});

export const fetchModels = createAsyncThunk('admin/fetchModels', async () => {
  return await adminService.getModels();
});
export const createModel = createAsyncThunk('admin/createModel', async (payload: Partial<ModelConfig>) => {
  return await adminService.createModel(payload);
});
export const updateModel = createAsyncThunk('admin/updateModel', async ({ id, payload }: { id: string; payload: Partial<ModelConfig> }) => {
  return await adminService.updateModel(id, payload);
});
export const deleteModel = createAsyncThunk('admin/deleteModel', async (id: string) => {
  await adminService.deleteModel(id);
  return id;
});

export const fetchSystemStats = createAsyncThunk('admin/fetchSystemStats', async () => {
  return await adminService.getSystemStats();
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDbConnections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDbConnections.fulfilled, (state, action: PayloadAction<DbConnection[]>) => {
        state.loading = false;
        state.dbConnections = action.payload;
      })
      .addCase(fetchDbConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch DB connections';
      })
      .addCase(createDbConnection.fulfilled, (state, action: PayloadAction<DbConnection>) => {
        state.dbConnections.push(action.payload);
      })
      .addCase(updateDbConnection.fulfilled, (state, action: PayloadAction<DbConnection>) => {
        state.dbConnections = state.dbConnections.map((c) => (c.id === action.payload.id ? action.payload : c));
      })
      .addCase(deleteDbConnection.fulfilled, (state, action: PayloadAction<string>) => {
        state.dbConnections = state.dbConnections.filter((c) => c.id !== action.payload);
      })
      .addCase(fetchModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModels.fulfilled, (state, action: PayloadAction<ModelConfig[]>) => {
        state.loading = false;
        state.models = action.payload;
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch models';
      })
      .addCase(createModel.fulfilled, (state, action: PayloadAction<ModelConfig>) => {
        state.models.push(action.payload);
      })
      .addCase(updateModel.fulfilled, (state, action: PayloadAction<ModelConfig>) => {
        state.models = state.models.map((m) => (m.id === action.payload.id ? action.payload : m));
      })
      .addCase(deleteModel.fulfilled, (state, action: PayloadAction<string>) => {
        state.models = state.models.filter((m) => m.id !== action.payload);
      })
      .addCase(fetchSystemStats.fulfilled, (state, action: PayloadAction<SystemMetrics>) => {
        state.systemStats = action.payload;
      });
  },
});

export default adminSlice.reducer;


