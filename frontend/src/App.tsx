import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
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

import Header from './components/Header/Header';
import FloatingComponentsPanel from './components/FloatingComponentsPanel/FloatingComponentsPanel';
import CustomNode from './components/CustomNode/CustomNode';
import { ThemeProvider } from './contexts/ThemeContext';
import StackEdgeDrawer from './components/StackEdgeDrawer/StackEdgeDrawer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { NodeData, WorkflowData, ValidationError } from './types';
import { useWorkflowPersistence } from './hooks/useWorkflowPersistence';
import { useProjectExecution } from './hooks/useProjectExecution';
import { CheckpointAPI } from './services/checkpointApi';

const nodeTypes = { customNode: CustomNode };

const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge[] = [];

// State snapshot for undo/redo (excludes positions)
interface StateSnapshot {
  nodes: Node<NodeData>[];
  edges: Edge[];
  timestamp: number;
}

function FlowCanvas() {
  // Direct state management without complex history hooks
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  // Positions are kept separate and NOT included in undo/redo

  // Simple undo/redo with state snapshots (excluding positions)
  const [history, setHistory] = useState<{
    past: StateSnapshot[];
    future: StateSnapshot[];
  }>({ past: [], future: [] });

  // Flag to prevent saving to history during undo/redo operations
  const isUndoRedoInProgress = useRef(false);
  // Flag to prevent React Flow's onNodesChange from saving duplicate history
  const skipNextNodeChangeHistory = useRef(false);

  const reactFlowInstance = useReactFlow();

  // State
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [currentWorkflow] = useState<WorkflowData | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [validationErrors] = useState<ValidationError[]>([]);

  // Project execution
  const {
    executeProject,
    isExecuting,
  } = useProjectExecution();

  // Persistence hook
  const persistence = useWorkflowPersistence('default-workflow');

  // Initialize workflow data once on mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && reactFlowInstance) {
      hasInitialized.current = true;
      
      const initializeWorkflow = async () => {
        try {
          console.log('[App] Initializing workflow...');
          const checkpointData = await persistence.loadLatestCheckpoint();
          
          if (checkpointData) {
            console.log('[App] Loaded checkpoint data:', {
              nodes: checkpointData.nodes.length,
              edges: checkpointData.edges.length
            });
            
            // Add delete handlers to loaded nodes
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
            
            setNodes(nodesWithHandlers);
            setEdges(checkpointData.edges);
            setViewport(checkpointData.viewport);

            // Update ReactFlow viewport
            reactFlowInstance.setViewport(checkpointData.viewport);
          }
        } catch (error) {
          console.error('[App] Failed to initialize workflow:', error);
        }
      };

      initializeWorkflow();
    }
  }, [reactFlowInstance, persistence]);

  // Save to history
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

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (isUndoRedoInProgress.current) {
      console.log('⏸️ Skipping handleNodeDelete during undo/redo');
      return;
    }

    console.log('🗑️ Deleting node:', nodeId);
    
    saveToHistory(); // Save before deletion
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  }, [selectedNode, saveToHistory]);

  // Handle checkpoint restoration
  const handleRestoreCheckpoint = useCallback(async (checkpointId: string) => {
    try {
      console.log('[App] Restoring checkpoint:', checkpointId);
      
      // Save current state to history before restoring
      saveToHistory();
      
      const checkpoint = await CheckpointAPI.getCheckpoint('default-workflow', checkpointId);
      
      if (checkpoint) {
        const nodesWithHandlers = checkpoint.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onDelete: handleNodeDelete,
          }
        }));

        setNodes(nodesWithHandlers);
        setEdges(checkpoint.edges);
        setViewport(checkpoint.viewport);

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

  // Handle nodes change
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    console.log('📝 Nodes change:', changes);
    
    if (skipNextNodeChangeHistory.current) {
      skipNextNodeChangeHistory.current = false;
    } else {
      // Only save to history if it's not just a position change
      const hasNonPositionChange = changes.some(change => change.type !== 'position');
      if (hasNonPositionChange && !isUndoRedoInProgress.current) {
        saveToHistory();
      }
    }
    
    setNodes(nds => applyNodeChanges(changes, nds));
  }, [saveToHistory]);

  // Handle edges change
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    console.log('🔗 Edges change:', changes);
    if (!isUndoRedoInProgress.current) {
      saveToHistory();
    }
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [saveToHistory]);

  // Handle connection
  const onConnect = useCallback((connection: Connection) => {
    console.log('🔌 New connection:', connection);
    if (!isUndoRedoInProgress.current) {
      saveToHistory();
    }
    setEdges(eds => addEdge(connection, eds));
  }, [saveToHistory]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;

    console.log('⏪ Performing undo');
    isUndoRedoInProgress.current = true;

    const previous = history.past[history.past.length - 1];
    const current = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    };

    // Add handlers to restored nodes
    const nodesWithHandlers = previous.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDelete: handleNodeDelete,
      }
    }));

    setNodes(nodesWithHandlers);
    setEdges(previous.edges);

    setHistory(prev => ({
      past: prev.past.slice(0, -1),
      future: [current, ...prev.future.slice(0, 49)]
    }));

    setTimeout(() => {
      isUndoRedoInProgress.current = false;
    }, 100);
  }, [history.past, nodes, edges, handleNodeDelete]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;

    console.log('⏩ Performing redo');
    isUndoRedoInProgress.current = true;

    const next = history.future[0];
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

    setNodes(nodesWithHandlers);
    setEdges(next.edges);

    setHistory(prev => ({
      past: [...prev.past.slice(-49), current],
      future: prev.future.slice(1)
    }));

    setTimeout(() => {
      isUndoRedoInProgress.current = false;
    }, 100);
  }, [history.future, nodes, edges, handleNodeDelete]);

  // Save checkpoint
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

  // Auto-save toggle
  const handleAutoSaveToggle = useCallback(() => {
    setAutoSaveEnabled(!autoSaveEnabled);
    toast.success(`Auto-save ${!autoSaveEnabled ? 'enabled' : 'disabled'}`);
  }, [autoSaveEnabled]);

  // Run pipeline
  const handleRunPipeline = useCallback(async () => {
    if (isExecuting || nodes.length === 0) {
      toast.error('Cannot execute: workflow is empty or already running');
      return;
    }

    try {
      console.log('🚀 Executing workflow with nodes:', nodes);
      
      await executeProject(
        'default-workflow',
        'default-workflow', // workflowId
        nodes,
        edges,
        1, // priority
        5 // timeoutMinutes
      );

      toast.success('Workflow execution started');
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      toast.error('Failed to execute workflow');
    }
  }, [isExecuting, nodes, edges, executeProject]);

  // Open checkpoint modal
  const handleOpenCheckpointModal = useCallback(() => {
    // This would open a checkpoint modal - for now just save a checkpoint
    handleSaveCheckpoint();
  }, [handleSaveCheckpoint]);

  // Handle node drag from components panel
  const handleNodeDrag = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drop on canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = (event.target as Element).getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type || !reactFlowInstance) {
      return;
    }

    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const newNodeId = `${type}-${nodes.length + 1}`;
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

    console.log('🎯 Dropping new node:', newNode);
    saveToHistory();
    setNodes(nds => nds.concat(newNode));
  }, [reactFlowInstance, nodes, handleNodeDelete, saveToHistory]);

  // Update node data
  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    console.log('📝 Updating node data:', nodeId, newData);
    saveToHistory();
    setNodes(nds =>
      nds.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [saveToHistory]);

  // Focus node
  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && reactFlowInstance) {
      reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
      setSelectedNode(node);
    }
  }, [nodes, reactFlowInstance]);

  // Combine nodes with delete handlers
  const combinedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onDelete: handleNodeDelete,
    },
  }));

  // Update viewport when ReactFlow viewport changes

  // Debug log current state
  useEffect(() => {
    console.log('📊 State update:');
    console.log('  - Nodes:', nodes.length);
    console.log('  - Edges:', edges.length);
    console.log('  - History past:', history.past.length);
    console.log('  - History future:', history.future.length);
    console.log('  - Is saving:', persistence.isSaving);
  }, [nodes.length, edges.length, history.past.length, history.future.length, persistence.isSaving]);

  // Provide undo/redo button handlers to Header component
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 relative">
      <Toaster position="top-right" />

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

      <StackEdgeDrawer
        selectedNode={selectedNode}
        onNodeUpdate={updateNodeData}
        validationErrors={validationErrors}
        nodes={nodes}
        edges={edges}
        onFocusNode={focusNode}
        workflowId="default-workflow"
        onRestoreCheckpoint={handleRestoreCheckpoint}
      />

      <div className="flex flex-1 relative overflow-hidden flow-canvas">
        <FloatingComponentsPanel onNodeDrag={handleNodeDrag} />
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
              console.log('Node clicked, opening properties:', node);
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
            <Background color="#e5e7eb" className="dark:opacity-20" />
            <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <MiniMap
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              nodeColor="#3b82f6"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

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
