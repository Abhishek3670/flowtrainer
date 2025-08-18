/**
 * FlowCraft Main Application Component
 * 
 * This is the core application component that manages the workflow canvas,
 * node interactions, undo/redo functionality, and project execution.
 * 
 * Key Features:
 * - Interactive workflow canvas with drag & drop
 * - Real-time node and edge management
 * - Undo/redo with state snapshots
 * - Checkpoint system for workflow persistence
 * - Project execution and monitoring
 * - Auto-save functionality
 * 
 * Architecture:
 * - Uses React Flow for canvas rendering
 * - Implements custom state management for complex workflows
 * - Integrates with backend APIs for persistence and execution
 * - Supports real-time collaboration via WebSocket
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import ExecutionLogs from './components/ExecutionLogs/ExecutionLogs';
import ReactFlow, {
  ReactFlowProvider,
  Connection,
  Edge,
  Node,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Core application components
import Header from './components/Header/Header';
import FloatingComponentsPanel from './components/FloatingComponentsPanel/FloatingComponentsPanel';
import CustomNode from './components/CustomNode/CustomNode';
import { ThemeProvider } from './contexts/ThemeContext';
import StackEdgeDrawer from './components/StackEdgeDrawer/StackEdgeDrawer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Types and interfaces
import { NodeData, WorkflowData, ValidationError } from './types';

// Custom hooks for business logic
import { useWorkflowPersistence } from './hooks/useWorkflowPersistence';
import { useProjectExecution } from './hooks/useProjectExecution';
import { CheckpointAPI } from './services/checkpointApi';

// Register custom node types for React Flow
const nodeTypes = { customNode: CustomNode };

// Initial state for the workflow canvas
const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge[] = [];

/**
 * State snapshot interface for undo/redo functionality
 * Excludes position data to prevent unnecessary history entries
 */
interface StateSnapshot {
  nodes: Node<NodeData>[];
  edges: Edge[];
  timestamp: number;
}

/**
 * FlowCanvas Component
 * 
 * Main canvas component that handles all workflow interactions.
 * Manages nodes, edges, viewport, and provides undo/redo functionality.
 */
function FlowCanvas() {
  // ===== CORE STATE MANAGEMENT =====

  // Canvas state - nodes and edges that make up the workflow
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Viewport state for canvas positioning and zoom
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  // ===== UNDO/REDO SYSTEM =====

  // History management for undo/redo operations
  // Positions are kept separate and NOT included in undo/redo to prevent clutter
  const [history, setHistory] = useState<{
    past: StateSnapshot[];
    future: StateSnapshot[];
  }>({ past: [], future: [] });

  // Flags to prevent saving to history during undo/redo operations
  const isUndoRedoInProgress = useRef(false);

  // Flag to prevent React Flow's onNodesChange from saving duplicate history
  // This is needed because React Flow fires position changes separately
  const skipNextNodeChangeHistory = useRef(false);

  // React Flow instance for canvas operations
  const reactFlowInstance = useReactFlow();

  // ===== APPLICATION STATE =====

  // Currently selected node for editing
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);

  // Current workflow data (loaded from backend)
  const [currentWorkflow] = useState<WorkflowData | null>(null);

  // Auto-save configuration
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  // Validation errors for workflow nodes
  const [validationErrors] = useState<ValidationError[]>([]);

  // ===== PROJECT EXECUTION =====

  // Project execution state and controls
  const projectId = 'default-project';
  const workflowId = 'default-workflow';
  const {
    status,
    loading: execLoading,
    running,
    error,
    logs,
    isStreaming,
    executeProject,
    retryExecution,
    clearLogs,
  } = useProjectExecution(projectId);

  // ===== PERSISTENCE =====

  // Workflow persistence hook for saving/loading checkpoints
  const persistence = useWorkflowPersistence(workflowId);

  // ===== INITIALIZATION =====

  // Flag to ensure workflow is only initialized once
  const hasInitialized = useRef(false);

  // Initialize workflow data on component mount
  useEffect(() => {
    if (!hasInitialized.current && reactFlowInstance) {
      hasInitialized.current = true;

      const initializeWorkflow = async () => {
        try {
          console.log('[App] Initializing workflow...');

          // Load the latest checkpoint to restore workflow state
          const checkpointData = await persistence.loadLatestCheckpoint();

          if (checkpointData) {
            console.log('[App] Loaded checkpoint data:', {
              nodes: checkpointData.nodes.length,
              edges: checkpointData.edges.length
            });

            // Add delete handlers to loaded nodes
            // This ensures all restored nodes have proper event handlers
            const nodesWithHandlers = checkpointData.nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                onDelete: (nodeId: string) => {
                  console.log("Delete requested for node:", nodeId);
                  handleNodeDelete(nodeId);
                },
              }
            }));

            // Restore the workflow state from checkpoint
            setNodes(nodesWithHandlers);
            setEdges(checkpointData.edges);
            setViewport(checkpointData.viewport);

            // Update ReactFlow viewport to match restored state
            reactFlowInstance.setViewport(checkpointData.viewport);
          }
        } catch (error) {
          console.error('[App] Failed to initialize workflow:', error);
        }
      };

      initializeWorkflow();
    }
  }, [reactFlowInstance, persistence]);

  // ===== HISTORY MANAGEMENT =====

  /**
   * Save current state to history for undo/redo functionality
   * Excludes position changes to prevent history clutter
   */
  const saveToHistory = useCallback(() => {
    if (isUndoRedoInProgress.current) return;

    const snapshot: StateSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    };

    setHistory(prev => ({
      past: [...prev.past.slice(-49), snapshot], // Keep last 50 states
      future: [] // Clear future when new action is performed
    }));
  }, [nodes, edges]);

  // ===== NODE OPERATIONS =====

  /**
   * Handle node deletion from the workflow
   * Removes the node and all connected edges
   */
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (isUndoRedoInProgress.current) {
      console.log('⏸️ Skipping handleNodeDelete during undo/redo');
      return;
    }

    console.log('🗑️ Deleting node:', nodeId);

    // Save current state before deletion for undo capability
    saveToHistory();

    // Remove the node and all edges connected to it
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));

    // Clear selection if deleted node was selected
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  }, [selectedNode, saveToHistory]);

  // ===== CHECKPOINT MANAGEMENT =====

  /**
   * Restore workflow state from a specific checkpoint
   * Saves current state to history before restoration
   */
  const handleRestoreCheckpoint = useCallback(async (checkpointId: string) => {
    try {
      console.log('[App] Restoring checkpoint:', checkpointId);

      // Save current state to history before restoring
      // This allows users to undo the restoration if needed
      saveToHistory();

      // Fetch checkpoint data from the backend
      const checkpoint = await CheckpointAPI.getCheckpoint(workflowId, checkpointId);

      if (checkpoint) {
        // Add delete handlers to restored nodes
        const nodesWithHandlers = checkpoint.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onDelete: handleNodeDelete,
          }
        }));

        // Restore the workflow state
        setNodes(nodesWithHandlers);
        setEdges(checkpoint.edges);
        setViewport(checkpoint.viewport);

        // Update ReactFlow viewport to match restored state
        if (reactFlowInstance) {
          reactFlowInstance.setViewport(checkpoint.viewport);
        }

        toast.success(`Checkpoint "${checkpoint.name}" restored`);
      }
    } catch (error) {
      console.error('[App] Failed to restore checkpoint:', error);
      toast.error('Failed to restore checkpoint');
    }
  }, [saveToHistory, handleNodeDelete, reactFlowInstance]);

  // ===== REACT FLOW EVENT HANDLERS =====

  /**
   * Handle node changes from React Flow
   * Filters out position-only changes to prevent unnecessary history entries
   */
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    console.log('📝 Nodes change:', changes);

    if (skipNextNodeChangeHistory.current) {
      skipNextNodeChangeHistory.current = false;
    } else {
      // Only save to history if it's not just a position change
      // Position changes are frequent and don't need to be in undo history
      const hasNonPositionChange = changes.some(change => change.type !== 'position');
      if (hasNonPositionChange && !isUndoRedoInProgress.current) {
        saveToHistory();
      }
    }

    setNodes(nds => applyNodeChanges(changes, nds));
  }, [saveToHistory]);

  /**
   * Handle edge changes from React Flow
   * Saves to history for all edge modifications
   */
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    console.log('🔗 Edges change:', changes);
    if (!isUndoRedoInProgress.current) {
      saveToHistory();
    }
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [saveToHistory]);

  /**
   * Handle new connections between nodes
   * Creates new edges when nodes are connected
   */
  const onConnect = useCallback((connection: Connection) => {
    console.log('🔌 New connection:', connection);
    if (!isUndoRedoInProgress.current) {
      saveToHistory();
    }
    setEdges(eds => addEdge(connection, eds));
  }, [saveToHistory]);

  // ===== UNDO/REDO FUNCTIONALITY =====

  /**
   * Undo the last action by restoring previous state
   * Excludes position changes from history to prevent clutter
   */
  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;

    console.log('⏪ Performing undo');
    isUndoRedoInProgress.current = true;

    // Get the previous state from history
    const previous = history.past[history.past.length - 1];

    // Save current state for potential redo
    const current = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    };

    // Add handlers to restored nodes to ensure they're functional
    const nodesWithHandlers = previous.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDelete: handleNodeDelete,
      }
    }));

    // Restore the previous state
    setNodes(nodesWithHandlers);
    setEdges(previous.edges);

    // Update history - move current state to future, remove previous from past
    setHistory(prev => ({
      past: prev.past.slice(0, -1),
      future: [current, ...prev.future.slice(0, 49)]
    }));

    // Reset the undo/redo flag after a short delay
    setTimeout(() => {
      isUndoRedoInProgress.current = false;
    }, 100);
  }, [history.past, nodes, edges, handleNodeDelete]);

  /**
   * Redo the last undone action
   * Restores state from the future history
   */
  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;

    console.log('⏩ Performing redo');
    isUndoRedoInProgress.current = true;

    // Get the next state from future history
    const next = history.future[0];

    // Save current state for potential undo
    const current = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    };

    // Add handlers to restored nodes
    const nodesWithHandlers = next.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDelete: handleNodeDelete,
      }
    }));

    // Restore the next state
    setNodes(nodesWithHandlers);
    setEdges(next.edges);

    // Update history - move current state to past, remove next from future
    setHistory(prev => ({
      past: [...prev.past.slice(-49), current],
      future: prev.future.slice(1)
    }));

    // Reset the undo/redo flag after a short delay
    setTimeout(() => {
      isUndoRedoInProgress.current = false;
    }, 100);
  }, [history.future, nodes, edges, handleNodeDelete]);

  // ===== CHECKPOINT & WORKFLOW MANAGEMENT =====

  /**
   * Save current workflow state as a checkpoint
   * Allows users to restore to this point later
   */
  const handleSaveCheckpoint = useCallback(async (name?: string, description?: string) => {
    try {
      const currentState = { nodes, edges, viewport };
      await persistence.saveCheckpoint(currentState, name, description);
      toast.success('Checkpoint saved successfully');
    } catch (error) {
      console.error('[App] Failed to save checkpoint:', error);
      toast.error('Failed to save checkpoint');
    }
  }, [nodes, edges, viewport, persistence]);

  /**
   * Toggle auto-save functionality on/off
   * Provides user feedback when toggling
   */
  const handleAutoSaveToggle = useCallback(() => {
    setAutoSaveEnabled(!autoSaveEnabled);
    toast.success(`Auto-save ${!autoSaveEnabled ? 'enabled' : 'disabled'}`);
  }, [autoSaveEnabled]);

  // ===== WORKFLOW EXECUTION =====

  /**
   * Execute the current workflow
   * Validates workflow state and starts execution
   */
  const handleRunPipeline = useCallback(async () => {
    if (running || nodes.length === 0) {
      toast.error('Cannot execute: workflow is empty or already running');
      return;
    }

    try {
      console.log('🚀 Executing workflow with nodes:', nodes);

      // Start workflow execution with current nodes and edges
      await executeProject(
        projectId,
        nodes,
        edges,
        1 // priority
      );

      toast.success('Workflow execution started');
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      toast.error('Failed to execute workflow');
    }
  }, [running, nodes, edges, executeProject, projectId]);

  /**
   * Open checkpoint modal for workflow management
   * Currently just saves a checkpoint, but could be expanded
   */
  const handleOpenCheckpointModal = useCallback(() => {
    // This would open a checkpoint modal - for now just save a checkpoint
    handleSaveCheckpoint();
  }, [handleSaveCheckpoint]);

  // ===== DRAG & DROP FUNCTIONALITY =====

  /**
   * Handle node drag from components panel
   * Sets up drag data for React Flow compatibility
   */
  const handleNodeDrag = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  /**
   * Handle drag over canvas
   * Prepares canvas for drop operation
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle node drop on canvas
   * Creates new nodes at drop location with proper positioning
   */
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    // Get canvas bounds for position calculation
    const reactFlowBounds = (event.target as Element).getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type || !reactFlowInstance) {
      return;
    }

    // Calculate position relative to canvas
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    // Create unique ID for new node
    const newNodeId = `${type}-${nodes.length + 1}`;

    // Create new node with proper configuration
    const newNode: Node<NodeData> = {
      id: newNodeId,
      type: 'customNode',
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        type,
        onDelete: handleNodeDelete,
      },
    };

    // Save to history and add new node
    saveToHistory();
    setNodes(nds => nds.concat(newNode));
  }, [reactFlowInstance, nodes, handleNodeDelete, saveToHistory]);

  // ===== UTILITY FUNCTIONS =====

  /**
   * Update node data with new properties
   * Triggers history save for undo capability
   */
  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    saveToHistory();
    setNodes(nds =>
      nds.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [saveToHistory]);

  /**
   * Focus on a specific node in the canvas
   * Centers viewport on the node and sets it as selected
   */
  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && reactFlowInstance) {
      reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
      setSelectedNode(node);
    }
  }, [nodes, reactFlowInstance]);

  // ===== STATE PREPARATION =====

  // Combine nodes with delete handlers for consistent functionality
  // This ensures all nodes have proper event handlers
  const combinedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onDelete: handleNodeDelete,
    },
  }));

  // ===== DEBUGGING & MONITORING =====

  // Debug log current state for development
  useEffect(() => {
    console.log('📊 State update:');
    console.log('  - Nodes:', nodes.length);
    console.log('  - Edges:', edges.length);
    console.log('  - History past:', history.past.length);
    console.log('  - History future:', history.future.length);
    console.log('  - Is saving:', persistence.isSaving);
  }, [nodes.length, edges.length, history.past.length, history.future.length, persistence.isSaving]);

  // ===== RENDER SECTION =====

  // Provide undo/redo button handlers to Header component
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Toast notifications for user feedback */}
      <Toaster position="top-right" />

      {/* Main application header with controls */}
      <Header
        isSaving={persistence.isSaving}
        lastSaved={persistence.lastCheckpoint ? new Date(persistence.lastCheckpoint.createdAt) : null}
        onSave={() => handleSaveCheckpoint()}
        workflowName={currentWorkflow?.name}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={handleAutoSaveToggle}
        onRun={handleRunPipeline}
        disableRun={nodes.length === 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        disableUndo={history.past.length === 0}
        disableRedo={history.future.length === 0}
        onOpenCheckpointModal={handleOpenCheckpointModal}
      />

      {/* Right sidebar for node properties and checkpoint management */}
      <StackEdgeDrawer
        projectId={projectId}
        logs={logs}
        isStreaming={isStreaming}
        error={error}
        executeProject={executeProject}
        retryExecution={retryExecution}
        clearLogs={clearLogs}
        selectedNode={selectedNode}
        validationErrors={validationErrors}
        nodes={nodes}
        edges={edges}
        onFocusNode={focusNode}
        workflowId={workflowId}
        onRestoreCheckpoint={handleRestoreCheckpoint} 
        onNodeUpdate={updateNodeData}
      />

      {/* Main workflow canvas area */}
      <div className="flex flex-1 relative overflow-hidden flow-canvas">
        {/* Left sidebar with available components */}
        <FloatingComponentsPanel onNodeDrag={handleNodeDrag} />

        {/* React Flow canvas container */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={combinedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_event, node) => {
              setSelectedNode(node);
            }}
            onPaneClick={() => setSelectedNode(null)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            className="bg-white dark:bg-gray-800"
            minZoom={0.1}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            {/* Canvas background and controls */}
            <Background color="#e5e7eb" className="dark:opacity-20" />
            <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <MiniMap
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              nodeColor="#3b82f6"
            />
          </ReactFlow>
        </div>

        {/* Execution logs panel - shown when workflow is running or has logs */}
        {(true || logs.length > 0) && (
          <div className="h-80 border-t border-gray-200 dark:border-gray-700">
            <ExecutionLogs
              logs={logs}
              isStreaming={isStreaming}
              error={error}
              onRetry={retryExecution}
              onClear={clearLogs}
              projectId={projectId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main App Component
 * 
 * Root component that wraps the entire application with necessary providers
 * and error boundaries. This component sets up the application context
 * and renders the main FlowCanvas component.
 * 
 * Provider Hierarchy:
 * - ErrorBoundary: Catches and handles React errors gracefully
 * - ThemeProvider: Manages application theme (light/dark mode)
 * - ReactFlowProvider: Provides React Flow context for canvas operations
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
