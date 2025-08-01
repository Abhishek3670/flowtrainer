import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WorkflowState, Workflow, FlowNode, FlowEdge } from '../../types';
import { workflowService } from '../../services/workflowService';

const initialState: WorkflowState = {
  currentWorkflow: null,
  workflows: [],
  nodes: [],
  edges: [],
  selectedNode: null,
  loading: false,
  error: null,
  undoStack: [],
  redoStack: [],
};

// Async thunks
export const fetchWorkflows = createAsyncThunk(
  'workflow/fetchWorkflows',
  async (_, { rejectWithValue }) => {
    try {
      return await workflowService.getWorkflows();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch workflows');
    }
  }
);

export const fetchWorkflow = createAsyncThunk(
  'workflow/fetchWorkflow',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workflowService.getWorkflow(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch workflow');
    }
  }
);

export const createWorkflow = createAsyncThunk(
  'workflow/createWorkflow',
  async (workflowData: Partial<Workflow>, { rejectWithValue }) => {
    try {
      return await workflowService.createWorkflow(workflowData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create workflow');
    }
  }
);

export const updateWorkflow = createAsyncThunk(
  'workflow/updateWorkflow',
  async ({ id, data }: { id: string; data: Partial<Workflow> }, { rejectWithValue }) => {
    try {
      return await workflowService.updateWorkflow(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update workflow');
    }
  }
);

export const deleteWorkflow = createAsyncThunk(
  'workflow/deleteWorkflow',
  async (id: string, { rejectWithValue }) => {
    try {
      await workflowService.deleteWorkflow(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete workflow');
    }
  }
);

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    // Node operations
    addNode: (state, action: PayloadAction<FlowNode>) => {
      // Save current state to undo stack
      state.undoStack.push({ nodes: [...state.nodes], edges: [...state.edges] });
      state.redoStack = []; // Clear redo stack
      
      state.nodes.push(action.payload);
      if (state.currentWorkflow) {
        state.currentWorkflow.nodes = state.nodes;
      }
    },
    updateNode: (state, action: PayloadAction<FlowNode>) => {
      const index = state.nodes.findIndex(node => node.id === action.payload.id);
      if (index !== -1) {
        // Save current state to undo stack
        state.undoStack.push({ nodes: [...state.nodes], edges: [...state.edges] });
        state.redoStack = [];
        
        state.nodes[index] = action.payload;
        if (state.currentWorkflow) {
          state.currentWorkflow.nodes = state.nodes;
        }
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      // Save current state to undo stack
      state.undoStack.push({ nodes: [...state.nodes], edges: [...state.edges] });
      state.redoStack = [];
      
      state.nodes = state.nodes.filter(node => node.id !== action.payload);
      // Remove connected edges
      state.edges = state.edges.filter(edge => 
        edge.source !== action.payload && edge.target !== action.payload
      );
      
      if (state.currentWorkflow) {
        state.currentWorkflow.nodes = state.nodes;
        state.currentWorkflow.edges = state.edges;
      }
      
      // Clear selected node if it was removed
      if (state.selectedNode?.id === action.payload) {
        state.selectedNode = null;
      }
    },
    // Edge operations
    addEdge: (state, action: PayloadAction<FlowEdge>) => {
      // Save current state to undo stack
      state.undoStack.push({ nodes: [...state.nodes], edges: [...state.edges] });
      state.redoStack = [];
      
      state.edges.push(action.payload);
      if (state.currentWorkflow) {
        state.currentWorkflow.edges = state.edges;
      }
    },
    removeEdge: (state, action: PayloadAction<string>) => {
      // Save current state to undo stack
      state.undoStack.push({ nodes: [...state.nodes], edges: [...state.edges] });
      state.redoStack = [];
      
      state.edges = state.edges.filter(edge => edge.id !== action.payload);
      if (state.currentWorkflow) {
        state.currentWorkflow.edges = state.edges;
      }
    },
    // Selection
    setSelectedNode: (state, action: PayloadAction<FlowNode | null>) => {
      state.selectedNode = action.payload;
    },
    // Undo/Redo
    undo: (state) => {
      if (state.undoStack.length > 0) {
        const currentState = { nodes: [...state.nodes], edges: [...state.edges] };
        state.redoStack.push(currentState);
        
        const previousState = state.undoStack.pop()!;
        state.nodes = previousState.nodes;
        state.edges = previousState.edges;
        
        if (state.currentWorkflow) {
          state.currentWorkflow.nodes = state.nodes;
          state.currentWorkflow.edges = state.edges;
        }
      }
    },
    redo: (state) => {
      if (state.redoStack.length > 0) {
        const currentState = { nodes: [...state.nodes], edges: [...state.edges] };
        state.undoStack.push(currentState);
        
        const nextState = state.redoStack.pop()!;
        state.nodes = nextState.nodes;
        state.edges = nextState.edges;
        
        if (state.currentWorkflow) {
          state.currentWorkflow.nodes = state.nodes;
          state.currentWorkflow.edges = state.edges;
        }
      }
    },
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Set current workflow
    setCurrentWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.currentWorkflow = action.payload;
      if (action.payload) {
        state.nodes = action.payload.nodes || [];
        state.edges = action.payload.edges || [];
      } else {
        state.nodes = [];
        state.edges = [];
      }
      state.selectedNode = null;
      state.undoStack = [];
      state.redoStack = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch workflows
      .addCase(fetchWorkflows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows = action.payload;
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch workflow
      .addCase(fetchWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkflow = action.payload;
        state.nodes = action.payload.nodes || [];
        state.edges = action.payload.edges || [];
        state.undoStack = [];
        state.redoStack = [];
      })
      .addCase(fetchWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create workflow
      .addCase(createWorkflow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.loading = false;
        state.workflows.unshift(action.payload);
        state.currentWorkflow = action.payload;
        state.nodes = action.payload.nodes || [];
        state.edges = action.payload.edges || [];
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update workflow
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        const index = state.workflows.findIndex(w => w._id === action.payload._id);
        if (index !== -1) {
          state.workflows[index] = action.payload;
        }
        if (state.currentWorkflow?._id === action.payload._id) {
          state.currentWorkflow = action.payload;
        }
      })
      // Delete workflow
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter(w => w._id !== action.payload);
        if (state.currentWorkflow?._id === action.payload) {
          state.currentWorkflow = null;
          state.nodes = [];
          state.edges = [];
        }
      });
  },
});

export const {
  addNode,
  updateNode,
  removeNode,
  addEdge,
  removeEdge,
  setSelectedNode,
  undo,
  redo,
  clearError,
  setCurrentWorkflow,
} = workflowSlice.actions;

export default workflowSlice.reducer;
