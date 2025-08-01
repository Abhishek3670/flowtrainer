import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  WhiteboardState, 
  WhiteboardObject, 
  CanvasState, 
  Comment, 
  Template,
  WhiteboardObjectType 
} from '../../types';
import { workflowService } from '../../services/workflowService';

const initialCanvasState: CanvasState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  tool: 'select',
  objects: [],
  selectedObjectIds: [],
  clipboard: []
};

const initialState: WhiteboardState = {
  currentWorkflow: null,
  workflows: [],
  selectedNode: null,
  loading: false,
  error: null,
  undoStack: [],
  redoStack: [],
  canvas: initialCanvasState,
  comments: [],
  templates: []
};

// Async thunks
export const fetchWhiteboard = createAsyncThunk(
  'whiteboard/fetchWhiteboard',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workflowService.getWorkflow(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch whiteboard');
    }
  }
);

export const saveWhiteboard = createAsyncThunk(
  'whiteboard/saveWhiteboard',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await workflowService.updateWorkflow(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to save whiteboard');
    }
  }
);

const whiteboardSlice = createSlice({
  name: 'whiteboard',
  initialState,
  reducers: {
    // Canvas operations
    setZoom: (state, action: PayloadAction<number>) => {
      state.canvas.zoom = Math.max(0.1, Math.min(5, action.payload));
    },
    
    setPan: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.canvas.pan = action.payload;
    },
    
    setTool: (state, action: PayloadAction<string>) => {
      state.canvas.tool = action.payload;
    },
    
    // Object operations
    addObject: (state, action: PayloadAction<WhiteboardObject>) => {
      // Save current state to undo stack
      state.undoStack.push({ 
        canvas: JSON.parse(JSON.stringify(state.canvas))
      });
      state.redoStack = [];
      
      state.canvas.objects.push(action.payload);
    },
    
    updateObject: (state, action: PayloadAction<WhiteboardObject>) => {
      const index = state.canvas.objects.findIndex(obj => obj.id === action.payload.id);
      if (index !== -1) {
        // Save current state to undo stack
        state.undoStack.push({ 
          canvas: JSON.parse(JSON.stringify(state.canvas))
        });
        state.redoStack = [];
        
        state.canvas.objects[index] = action.payload;
      }
    },
    
    removeObject: (state, action: PayloadAction<string>) => {
      // Save current state to undo stack
      state.undoStack.push({ 
        canvas: JSON.parse(JSON.stringify(state.canvas))
      });
      state.redoStack = [];
      
      state.canvas.objects = state.canvas.objects.filter(obj => obj.id !== action.payload);
      state.canvas.selectedObjectIds = state.canvas.selectedObjectIds.filter(id => id !== action.payload);
    },
    
    duplicateObjects: (state, action: PayloadAction<string[]>) => {
      const objectsToDuplicate = state.canvas.objects.filter(obj => 
        action.payload.includes(obj.id)
      );
      
      // Save current state to undo stack
      state.undoStack.push({ 
        canvas: JSON.parse(JSON.stringify(state.canvas))
      });
      state.redoStack = [];
      
      const duplicatedObjects = objectsToDuplicate.map(obj => ({
        ...obj,
        id: `${obj.id}_copy_${Date.now()}`,
        position: {
          x: obj.position.x + 20,
          y: obj.position.y + 20
        },
        selected: false
      }));
      
      state.canvas.objects.push(...duplicatedObjects);
      state.canvas.selectedObjectIds = duplicatedObjects.map(obj => obj.id);
    },
    
    // Selection operations
    selectObject: (state, action: PayloadAction<string>) => {
      state.canvas.selectedObjectIds = [action.payload];
      // Update selected property on objects
      state.canvas.objects.forEach(obj => {
        obj.selected = obj.id === action.payload;
      });
    },
    
    selectMultipleObjects: (state, action: PayloadAction<string[]>) => {
      state.canvas.selectedObjectIds = action.payload;
      // Update selected property on objects
      state.canvas.objects.forEach(obj => {
        obj.selected = action.payload.includes(obj.id);
      });
    },
    
    clearSelection: (state) => {
      state.canvas.selectedObjectIds = [];
      state.canvas.objects.forEach(obj => {
        obj.selected = false;
      });
    },
    
    // Clipboard operations
    copyToClipboard: (state) => {
      const selectedObjects = state.canvas.objects.filter(obj => 
        state.canvas.selectedObjectIds.includes(obj.id)
      );
      state.canvas.clipboard = selectedObjects.map(obj => ({
        ...obj,
        selected: false
      }));
    },
    
    pasteFromClipboard: (state, action: PayloadAction<{ x: number; y: number }>) => {
      if (state.canvas.clipboard.length === 0) return;
      
      // Save current state to undo stack
      state.undoStack.push({ 
        canvas: JSON.parse(JSON.stringify(state.canvas))
      });
      state.redoStack = [];
      
      const pastedObjects = state.canvas.clipboard.map(obj => ({
        ...obj,
        id: `${obj.id}_paste_${Date.now()}`,
        position: {
          x: action.payload.x,
          y: action.payload.y
        },
        selected: false
      }));
      
      state.canvas.objects.push(...pastedObjects);
      state.canvas.selectedObjectIds = pastedObjects.map(obj => obj.id);
    },
    
    // Layer operations
    bringToFront: (state, action: PayloadAction<string>) => {
      const obj = state.canvas.objects.find(o => o.id === action.payload);
      if (obj) {
        const maxZIndex = Math.max(...state.canvas.objects.map(o => o.zIndex || 0));
        obj.zIndex = maxZIndex + 1;
      }
    },
    
    sendToBack: (state, action: PayloadAction<string>) => {
      const obj = state.canvas.objects.find(o => o.id === action.payload);
      if (obj) {
        const minZIndex = Math.min(...state.canvas.objects.map(o => o.zIndex || 0));
        obj.zIndex = minZIndex - 1;
      }
    },
    
    // Undo/Redo operations
    undo: (state) => {
      if (state.undoStack.length > 0) {
        const currentCanvas = JSON.parse(JSON.stringify(state.canvas));
        state.redoStack.push({ canvas: currentCanvas });
        
        const previousState = state.undoStack.pop()!;
        state.canvas = previousState.canvas;
      }
    },
    
    redo: (state) => {
      if (state.redoStack.length > 0) {
        const currentCanvas = JSON.parse(JSON.stringify(state.canvas));
        state.undoStack.push({ canvas: currentCanvas });
        
        const nextState = state.redoStack.pop()!;
        state.canvas = nextState.canvas;
      }
    },
    
    // Comments
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload);
    },
    
    updateComment: (state, action: PayloadAction<Comment>) => {
      const index = state.comments.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.comments[index] = action.payload;
      }
    },
    
    removeComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(c => c.id !== action.payload);
    },
    
    // Templates
    addTemplate: (state, action: PayloadAction<Template>) => {
      state.templates.push(action.payload);
    },
    
    removeTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(t => t.id !== action.payload);
    },
    
    // Utility
    clearError: (state) => {
      state.error = null;
    },
    
    resetCanvas: (state) => {
      state.canvas = initialCanvasState;
      state.comments = [];
      state.undoStack = [];
      state.redoStack = [];
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch whiteboard
      .addCase(fetchWhiteboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWhiteboard.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkflow = action.payload;
        // Convert legacy nodes to whiteboard objects if needed
        if (action.payload.nodes) {
          const objects = action.payload.nodes.map(node => ({
            id: node.id,
            type: node.type as unknown as WhiteboardObjectType,
            position: node.position,
            size: { width: 200, height: 100 }, // Default size
            data: node.data,
            selected: node.selected || false
          }));
          state.canvas.objects = objects;
        }
        state.undoStack = [];
        state.redoStack = [];
      })
      .addCase(fetchWhiteboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Save whiteboard
      .addCase(saveWhiteboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveWhiteboard.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkflow = action.payload;
      })
      .addCase(saveWhiteboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  setZoom,
  setPan,
  setTool,
  addObject,
  updateObject,
  removeObject,
  duplicateObjects,
  selectObject,
  selectMultipleObjects,
  clearSelection,
  copyToClipboard,
  pasteFromClipboard,
  bringToFront,
  sendToBack,
  undo,
  redo,
  addComment,
  updateComment,
  removeComment,
  addTemplate,
  removeTemplate,
  clearError,
  resetCanvas
} = whiteboardSlice.actions;

export default whiteboardSlice.reducer;
