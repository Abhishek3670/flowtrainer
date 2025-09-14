// frontend/src/store/slices/adminSlice.ts - COMPLETE IMPLEMENTATION
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { adminService, DbConnection, ModelConfig, SystemMetrics } from '../../services/adminService';
import { User, CreateUserDto, UpdateUserDto } from '../../types/user';

export interface AdminState {
  // System Stats
  systemStats: SystemMetrics | null;
  
  // Database Connections
  dbConnections: DbConnection[];
  
  // Models
  models: ModelConfig[];
  
  // Users
  users: User[];
  currentUser: User | null;
  usersLoading: boolean;
  usersError: string | null;
  
  // Common
  loading: boolean;
  error: string | null;
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    search?: string;
    role?: string;
    status?: string;
  };
}

const initialState: AdminState = {
  // System Stats
  systemStats: null,
  
  // Database Connections
  dbConnections: [],
  
  // Models
  models: [],
  
  // Users
  users: [],
  currentUser: null,
  usersLoading: false,
  usersError: null,
  
  // Common
  loading: false,
  error: null,
  totalCount: 0,
  pagination: {
    page: 1,
    limit: 20,
    totalPages: 0,
    search: '',
    role: '',
    status: ''
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

// User Management Thunks
export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { admin } = getState() as { admin: AdminState };
      const { page, limit, search, role, status } = admin.pagination;
      
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status }),
      };
      
      return await adminService.getUsers(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const createUser = createAsyncThunk(
  'admin/createUser',
  async (userData: CreateUserDto, { rejectWithValue }) => {
    try {
      return await adminService.createUser(userData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ id, userData }: { id: string; userData: UpdateUserDto }, { rejectWithValue }) => {
    try {
      return await adminService.updateUser(id, userData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (id: string, { rejectWithValue }) => {
    try {
      await adminService.deleteUser(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
      state.usersError = null;
    },
    setPagination(state, action: PayloadAction<Partial<AdminState['pagination']>>) {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setUserSearch(state, action: PayloadAction<string>) {
      state.pagination.search = action.payload;
      state.pagination.page = 1; // Reset to first page on new search
    },
    setUserRoleFilter(state, action: PayloadAction<string>) {
      state.pagination.role = action.payload;
      state.pagination.page = 1;
    },
    setUserStatusFilter(state, action: PayloadAction<string>) {
      state.pagination.status = action.payload;
      state.pagination.page = 1;
    },
    resetUserFilters(state) {
      state.pagination.search = '';
      state.pagination.role = '';
      state.pagination.status = '';
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    // System Stats
    builder.addCase(fetchSystemStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSystemStats.fulfilled, (state, action) => {
      state.loading = false;
      state.systemStats = action.payload;
    });
    builder.addCase(fetchSystemStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Database Connections
    builder.addCase(fetchDbConnections.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDbConnections.fulfilled, (state, action) => {
      state.loading = false;
      state.dbConnections = action.payload.connections;
      state.totalCount = action.payload.totalCount;
      state.pagination.totalPages = Math.ceil(
        action.payload.totalCount / state.pagination.limit
      );
    });
    builder.addCase(fetchDbConnections.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // User Management
    builder.addCase(fetchUsers.pending, (state) => {
      state.usersLoading = true;
      state.usersError = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.usersLoading = false;
      state.users = action.payload.data;
      state.totalCount = action.payload.total;
      state.pagination = {
        ...state.pagination,
        page: action.payload.page,
        totalPages: action.payload.totalPages,
      };
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.usersLoading = false;
      state.usersError = action.payload as string;
    });

    builder.addCase(createUser.fulfilled, (state, action) => {
      state.users = [action.payload, ...state.users];
      state.totalCount += 1;
    });

    builder.addCase(updateUser.fulfilled, (state, action) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload };
      }
    });

    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.users = state.users.filter(user => user.id !== action.payload);
      state.totalCount = Math.max(0, state.totalCount - 1);
    });

    // Models
    builder.addCase(fetchModels.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchModels.fulfilled, (state, action) => {
      state.loading = false;
      state.models = action.payload;
    });
    builder.addCase(fetchModels.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  clearError, 
  setPagination, 
  setUserSearch, 
  setUserRoleFilter, 
  setUserStatusFilter, 
  resetUserFilters 
} = adminSlice.actions;
export default adminSlice.reducer;
