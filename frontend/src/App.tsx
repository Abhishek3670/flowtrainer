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
} from 'reactflow';
import 'reactflow/dist/style.css';

import Header from './components/Header/Header';
import FloatingComponentsPanel from './components/FloatingComponentsPanel/FloatingComponentsPanel';
import CustomNode from './components/CustomNode/CustomNode';
import CheckpointModal from './components/CheckpointModal/CheckpointModal';
import { ThemeProvider } from './contexts/ThemeContext';
import StackEdgeDrawer from './components/StackEdgeDrawer/StackEdgeDrawer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { NodeData, WorkflowData, ValidationError } from './types';
import { useCheckpoints } from './services/checkpointApi';

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
  // Positions are kept separate and NOT included in undo/redo
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Simple undo/redo with state snapshots (excluding positions)
  const [history, setHistory] = useState<{
    past: StateSnapshot[];
    future: StateSnapshot[];
  }>({ past: [], future: [] });

  // UI state
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [validationErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [currentWorkflow] = useState<WorkflowData | null>(null);

  // Checkpoint state
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  
  // Mock workflow ID - in a real app this would come from routing/props
  const workflowId = 'default-workflow';
  
  // Checkpoint hook
  const {
    createCheckpoint,
    createAutoCheckpoint,
    restoreCheckpoint,
    refresh: refreshCheckpoints
  } = useCheckpoints(workflowId);

  const reactFlowInstance = useReactFlow();

  // Debounced save functionality
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const debouncedSave = {
    flush: () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      performSave();
    }
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
      
      // Auto-create checkpoint if enabled and there are significant changes
      if (autoSaveEnabled && (nodes.length > 0 || edges.length > 0)) {
        try {
          const viewport = reactFlowInstance.getViewport();
          await createAutoCheckpoint({
            nodes,
            edges,
            viewport
          });
        } catch (error) {
          console.error('Failed to create auto-checkpoint:', error);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  // Create snapshot of current state (excluding positions)
  const createSnapshot = useCallback((): StateSnapshot => ({
    nodes: [...nodes],
    edges: [...edges],
    timestamp: Date.now(),
  }), [nodes, edges]);

  // Add snapshot to history when state changes (excluding position-only changes)
  const saveToHistory = useCallback(() => {
    const snapshot = createSnapshot();
    
    setHistory(prev => ({
      past: [...prev.past, snapshot].slice(-50), // Keep last 50 snapshots
      future: [] // Clear future when new changes are made
    }));
    
    console.log('💾 Snapshot saved to history');
  }, [createSnapshot]);

  // Handle node changes (separate position from other changes)
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    const positionChanges = changes.filter(change => change.type === 'position');
    const otherChanges = changes.filter(change => change.type !== 'position');
    
    // Handle position changes separately (don't save to history)
    positionChanges.forEach(change => {
      if (change.type === 'position' && change.position) {
        setNodePositions(prev => ({
          ...prev,
          [change.id]: change.position!
        }));
      }
    });
    
    // Handle other changes (save to history)
    if (otherChanges.length > 0) {
      saveToHistory();
      setNodes(nds => applyNodeChanges(otherChanges, nds));
    }
  }, [saveToHistory]);

  // Handle edge changes (always save to history)
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    saveToHistory();
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [saveToHistory]);

  // Handle connections (save to history)
  const onConnect = useCallback((connection: Connection) => {
    // Ensure source and target are strings
    if (!connection.source || !connection.target) {
      console.warn('Invalid connection - source or target is null');
      return;
    }
    
    saveToHistory();
    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };
    setEdges(eds => [...eds, newEdge]);
  }, [saveToHistory]);

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    saveToHistory();
    setNodes(nds => nds.filter(node => node.id !== nodeId));
    setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    
    // Also remove from positions
    setNodePositions(prev => {
      const updated = { ...prev };
      delete updated[nodeId];
      return updated;
    });
  }, [saveToHistory]);

  // Handle drag and drop from floating panel
  const handleFloatingPanelDrag = useCallback((event: React.DragEvent, nodeType: string) => {
    // This is for the floating panel drag handler - we'll implement the drop in onDrop
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // Drag and drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node<NodeData> = {
      id: `${nodeType}-${Date.now()}`,
      type: 'customNode',
      position,
      data: {
        type: nodeType as any,
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        onDelete: handleNodeDelete,
        config: {},
      },
    };
    
    saveToHistory();
    setNodes(nds => [...nds, newNode]);
  }, [reactFlowInstance, handleNodeDelete, saveToHistory]);

  // Focus on a specific node
  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const position = nodePositions[nodeId] || node.position || { x: 0, y: 0 };
      reactFlowInstance.setCenter(position.x + 100, position.y + 50, { zoom: 1.2 });
    }
  }, [nodes, nodePositions, reactFlowInstance]);

  // Update node data
  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    saveToHistory();
    setNodes(nds => nds.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    ));
  }, [saveToHistory]);

  // Auto-save toggle
  const handleAutoSaveToggle = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
  };

  // Run pipeline
  const handleRunPipeline = () => {
    toast.success('Pipeline started successfully!');
  };

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    setHistory({
      past: newPast,
      future: [createSnapshot(), ...history.future]
    });
    
    // Apply the previous state (positions are preserved)
    setTimeout(() => {
      setNodes(previous.nodes);
      setEdges(previous.edges);
      console.log('↩️ Undo completed (positions preserved)');
    }, 100);
  }, [history.past, history.future, createSnapshot]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    setHistory({
      past: [...history.past, createSnapshot()],
      future: newFuture
    });
    
    // Apply the next state (positions are preserved)
    setTimeout(() => {
      setNodes(next.nodes);
      setEdges(next.edges);
      console.log('↪️ Redo completed (positions preserved)');
    }, 100);
  }, [history.future, history.past, createSnapshot]);

  // Checkpoint handlers
  const handleCreateCheckpoint = async (name: string, description: string) => {
    try {
      const viewport = reactFlowInstance.getViewport();
      await createCheckpoint({
        name,
        description,
        nodes,
        edges,
        viewport,
        metadata: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          createdFrom: 'manual'
        }
      });
      toast.success('Checkpoint created successfully!');
      refreshCheckpoints();
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
      toast.error('Failed to create checkpoint');
    }
  };

  const handleRestoreCheckpoint = async (checkpointId: string) => {
    try {
      const restoredData = await restoreCheckpoint(checkpointId);
      if (restoredData) {
        // Save current state to history before restoring
        saveToHistory();
        
        // Apply the restored state
        setNodes(restoredData.nodes);
        setEdges(restoredData.edges);
        
        // Apply viewport if available
        if (restoredData.viewport) {
          reactFlowInstance.setViewport(restoredData.viewport);
        }
        
        // Update positions
        const newPositions: Record<string, { x: number; y: number }> = {};
        restoredData.nodes.forEach(node => {
          if (node.position) {
            newPositions[node.id] = node.position;
          }
        });
        setNodePositions(newPositions);
        
        toast.success('Checkpoint restored successfully!');
      }
    } catch (error) {
      console.error('Failed to restore checkpoint:', error);
      toast.error('Failed to restore checkpoint');
    }
  };

  // Combine nodes with current positions
  const combinedNodes = nodes.map(node => ({
    ...node,
    position: nodePositions[node.id] || node.position || { x: 0, y: 0 },
    data: {
      ...node.data,
      onDelete: handleNodeDelete,
    },
  }));

  // Debug log current state
  useEffect(() => {
    console.log('📊 State update:');
    console.log('  - Nodes:', nodes.length);
    console.log('  - Edges:', edges.length);
    console.log('  - History past:', history.past.length);
    console.log('  - History future:', history.future.length);
  }, [nodes.length, edges.length, history.past.length, history.future.length]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 relative">
      <Toaster position="top-right" />

      <Header
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={() => debouncedSave.flush()}
        workflowName={currentWorkflow?.name}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={handleAutoSaveToggle}
        onRun={handleRunPipeline}
        disableRun={nodes.length === 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        disableUndo={history.past.length === 0}
        disableRedo={history.future.length === 0}
        onOpenCheckpointModal={() => setIsCheckpointModalOpen(true)}
      />

      <StackEdgeDrawer
        selectedNode={selectedNode}
        onNodeUpdate={updateNodeData}
        validationErrors={validationErrors}
        nodes={nodes}
        edges={edges}
        onFocusNode={focusNode}
        workflowId={workflowId}
        onRestoreCheckpoint={handleRestoreCheckpoint}
      />

      <div className="flex flex-1 relative overflow-hidden flow-canvas">
        <FloatingComponentsPanel onNodeDrag={handleFloatingPanelDrag} />
        
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

      {/* Checkpoint Modal */}
      <CheckpointModal
        isOpen={isCheckpointModalOpen}
        onClose={() => setIsCheckpointModalOpen(false)}
        onCreate={handleCreateCheckpoint}
      />
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
