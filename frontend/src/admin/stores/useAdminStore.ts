import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, SystemConfig, Model, DatabaseMetrics } from '../types';

interface AdminState {
  // User management
  users: User[];
  selectedUser: User | null;
  userLoading: boolean;
  userError: string | null;
  
  // System configuration
  systemConfigs: SystemConfig[];
  selectedConfig: SystemConfig | null;
  configLoading: boolean;
  configError: string | null;
  
  // Models
  models: Model[];
  selectedModel: Model | null;
  modelsLoading: boolean;
  modelsError: string | null;
  
  // Database
  dbMetrics: DatabaseMetrics | null;
  dbLoading: boolean;
  dbError: string | null;
  
  // Actions
  setUsers: (users: User[]) => void;
  setSelectedUser: (user: User | null) => void;
  setUserLoading: (loading: boolean) => void;
  setUserError: (error: string | null) => void;
  
  setSystemConfigs: (configs: SystemConfig[]) => void;
  setSelectedConfig: (config: SystemConfig | null) => void;
  setConfigLoading: (loading: boolean) => void;
  setConfigError: (error: string | null) => void;
  
  setModels: (models: Model[]) => void;
  setSelectedModel: (model: Model | null) => void;
  setModelsLoading: (loading: boolean) => void;
  setModelsError: (error: string | null) => void;
  
  setDbMetrics: (metrics: DatabaseMetrics | null) => void;
  setDbLoading: (loading: boolean) => void;
  setDbError: (error: string | null) => void;
  
  // Reset state
  reset: () => void;
}

const useAdminStore = create<AdminState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        users: [],
        selectedUser: null,
        userLoading: false,
        userError: null,
        
        systemConfigs: [],
        selectedConfig: null,
        configLoading: false,
        configError: null,
        
        models: [],
        selectedModel: null,
        modelsLoading: false,
        modelsError: null,
        
        dbMetrics: null,
        dbLoading: false,
        dbError: null,
        
        // Actions
        setUsers: (users) => set({ users }),
        setSelectedUser: (user) => set({ selectedUser: user }),
        setUserLoading: (loading) => set({ userLoading: loading }),
        setUserError: (error) => set({ userError: error }),
        
        setSystemConfigs: (configs) => set({ systemConfigs: configs }),
        setSelectedConfig: (config) => set({ selectedConfig: config }),
        setConfigLoading: (loading) => set({ configLoading: loading }),
        setConfigError: (error) => set({ configError: error }),
        
        setModels: (models) => set({ models }),
        setSelectedModel: (model) => set({ selectedModel: model }),
        setModelsLoading: (loading) => set({ modelsLoading: loading }),
        setModelsError: (error) => set({ modelsError: error }),
        
        setDbMetrics: (metrics) => set({ dbMetrics: metrics }),
        setDbLoading: (loading) => set({ dbLoading: loading }),
        setDbError: (error) => set({ dbError: error }),
        
        // Reset the entire store to initial state
        reset: () => set({
          users: [],
          selectedUser: null,
          userLoading: false,
          userError: null,
          systemConfigs: [],
          selectedConfig: null,
          configLoading: false,
          configError: null,
          models: [],
          selectedModel: null,
          modelsLoading: false,
          modelsError: null,
          dbMetrics: null,
          dbLoading: false,
          dbError: null,
        }),
      }),
      {
        name: 'admin-storage', // name of the item in the storage (must be unique)
        // We can specify which parts of the state to persist
        partialize: (state) => ({
          // Only persist these parts of the state
          users: state.users,
          systemConfigs: state.systemConfigs,
          models: state.models,
          dbMetrics: state.dbMetrics,
        }),
      }
    ),
    {
      name: 'admin-store-devtools',
    }
  )
);

export default useAdminStore;
