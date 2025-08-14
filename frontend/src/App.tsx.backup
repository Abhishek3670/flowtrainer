import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
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
import { ThemeProvider } from './contexts/ThemeContext';
import StackEdgeDrawer from './components/StackEdgeDrawer/StackEdgeDrawer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { NodeData, WorkflowData, ValidationError } from './types';

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

  // Flag to prevent saving to history during undo/redo operations
  const isUndoRedoInProgress = useRef(false);
  // Flag to prevent React Flow's onNodesChange from saving duplicate history
  const skipNextNodeChangeHistory = useRef(false);

  const reactFlowInstance = useReactFlow();

  // State
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [currentWorkflow] = useState<WorkflowData | null>(null);
  const [isSaving] = useState(false);
  const [lastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [validationErrors] = useState<ValidationError[]>([]);

  const handleAutoSaveToggle = useCallback(() => {
    setAutoSaveEnabled(prev => !prev);
  }, []);

  // Helper to create a snapshot of current state (EXCLUDING positions)
  const createSnapshot = useCallback((): StateSnapshot => {
    return {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now()
    };
  }, [nodes, edges]);

  // Helper to save current state to history before making changes
  const saveToHistory = useCallback(() => {
    if (isUndoRedoInProgress.current) {
      console.log('⏸️ Skipping saveToHistory during undo/redo');
      return;
    }

    const snapshot = createSnapshot();
    console.log('💾 Saving snapshot:', { nodes: snapshot.nodes.length, edges: snapshot.edges.length });
    
    setHistory(prev => ({
      past: [...prev.past, snapshot],
      future: [] // Clear future when new operation is performed
    }));
  }, [createSnapshot]);

  // Clean up positions for nodes that no longer exist
  useEffect(() => {
    const currentNodeIds = new Set(nodes.map(n => n.id));
    setNodePositions(prev => {
      const cleaned: Record<string, { x: number; y: number }> = {};
      Object.keys(prev).forEach(nodeId => {
        if (currentNodeIds.has(nodeId)) {
          cleaned[nodeId] = prev[nodeId];
        }
      });
      return cleaned;
    });
  }, [nodes]);

  // Placeholder save function
  const debouncedSave = {
    flush: () => {
      console.log('Save functionality not implemented yet');
    }
  };

  // Placeholder run pipeline function
  const handleRunPipeline = useCallback(() => {
    console.log('Run pipeline functionality not implemented yet');
  }, []);

  // Update node data helper
  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<NodeData>) => {
      if (isUndoRedoInProgress.current) {
        console.log('⏸️ Skipping updateNodeData during undo/redo');
        return;
      }

      console.log('🔧 Updating node data:', nodeId, newData);
      setNodes(prev => prev.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      ));
      // Note: We're not saving to history for minor updates
    },
    []
  );

  // Handle node changes - separate position changes from structural changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isUndoRedoInProgress.current) {
        console.log('⏸️ Skipping handleNodesChange during undo/redo');
        return;
      }

      console.log('🔄 Node changes:', changes);
      
      // Separate position changes from other changes
      const positionChanges = changes.filter(change => change.type === 'position');
      const otherChanges = changes.filter(change => change.type !== 'position');
      
      // Handle position changes (not tracked in history)
      if (positionChanges.length > 0) {
        console.log('📍 Position changes (not tracked in undo/redo):', positionChanges);
        setNodePositions(prev => {
          const newPositions = { ...prev };
          positionChanges.forEach(change => {
            if (change.type === 'position' && change.position) {
              newPositions[change.id] = change.position;
            }
          });
          return newPositions;
        });
      }
      
      // Handle structural changes (tracked in history)
      if (otherChanges.length > 0) {
        console.log('🏗️ Structural changes (tracked in history):', otherChanges);
        
        // Check if this is from onDrop and we should skip history saving
        if (skipNextNodeChangeHistory.current) {
          console.log('⏭️ Skipping history save for React Flow follow-up after manual node creation');
          skipNextNodeChangeHistory.current = false;
        } else {
          // Check if this is a real structural change that should be tracked
          const hasAddChanges = otherChanges.some(change => change.type === 'add');
          const hasRemoveChanges = otherChanges.some(change => change.type === 'remove');
          
          if (hasAddChanges || hasRemoveChanges) {
            console.log('📝 Real structural change, saving to history');
            saveToHistory();
          } else {
            console.log('📝 Non-structural change (select, etc.), not saving to history');
          }
        }
        
        setNodes(prev => applyNodeChanges(otherChanges, prev));
      }
    },
    [saveToHistory]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isUndoRedoInProgress.current) {
        console.log('⏸️ Skipping handleEdgesChange during undo/redo');
        return;
      }

      console.log('🔗 Edge changes:', changes);
      const hasStructuralChanges = changes.some(change => 
        change.type === 'add' || change.type === 'remove'
      );
      
      if (hasStructuralChanges) {
        console.log('🏗️ Edge structural changes, saving to history');
        saveToHistory();
      } else {
        console.log('📝 Edge non-structural changes, not saving to history');
      }
      
      setEdges(prev => applyEdgeChanges(changes, prev));
    },
    [saveToHistory]
  );

  // Creating a new connection (edge)
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      if (isUndoRedoInProgress.current) {
        console.log('⏸️ Skipping onConnect during undo/redo');
        return;
      }

      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
      } as Edge;
      
      console.log('🔗 Creating new edge:', newEdge);
      
      saveToHistory(); // Save before adding edge
      setEdges(prev => [...prev, newEdge]);
    },
    [saveToHistory]
  );

  // Delete node and its edges
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      if (isUndoRedoInProgress.current) {
        console.log('⏸️ Skipping handleNodeDelete during undo/redo');
        return;
      }

      console.log('🗑️ Deleting node:', nodeId);
      
      saveToHistory(); // Save before deletion
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
      
      if (selectedNode?.id === nodeId) setSelectedNode(null);
    },
    [selectedNode, saveToHistory]
  );

  // Handle dropping new nodes on canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (isUndoRedoInProgress.current) {
        console.log('⏸️ Skipping onDrop during undo/redo');
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) {
        console.warn('No node type found in drag data or reactFlowInstance not available');
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Ensure position is valid
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        console.error('Invalid position calculated for new node');
        return;
      }

      const nodeId = `${type}-${Date.now()}`;
      const newNode: Node<NodeData> = {
        id: nodeId,
        type: 'customNode',
        position: {
          x: position.x,
          y: position.y,
        },
        data: {
          nodeType: type,
          label: type.replace('-', ' '),
          status: 'empty',
          onDelete: handleNodeDelete,
          hasError: false,
        },
      };

      console.log('➕ Creating new node:', newNode);

      // Save current state BEFORE adding the new node
      saveToHistory();
      
      // Set flag to prevent the React Flow onNodesChange from saving duplicate history
      skipNextNodeChangeHistory.current = true;
      
      // Add the node
      setNodes(prev => [...prev, newNode]);
      
      // Track position separately (not in history)
      setNodePositions(prev => ({
        ...prev,
        [nodeId]: position
      }));
      
      setSelectedNode(newNode);

      // Fit view if this is the first node
      setTimeout(() => {
        if (nodes.length === 0) {
          reactFlowInstance.fitView({ padding: 0.1 });
        }
      }, 10);
    },
    [reactFlowInstance, handleNodeDelete, nodes.length, saveToHistory]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeDrag = useCallback(
    (event: React.DragEvent, nodeType: string) => {
      console.log('Node drag started:', nodeType);
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const focusNode = useCallback(
    (nodeId: string) => {
      const combinedNodes = nodes.map(node => ({
        ...node,
        position: nodePositions[node.id] || node.position || { x: 0, y: 0 }
      }));
      const node = combinedNodes.find(n => n.id === nodeId);
      if (node && reactFlowInstance) {
        reactFlowInstance.fitView({ nodes: [node], padding: 0.2, duration: 800 });
      }
    },
    [nodes, nodePositions, reactFlowInstance]
  );

  // Simple undo/redo handlers
  const handleUndo = useCallback(() => {
    console.log('🔄 UNDO requested');
    console.log('History past entries:', history.past.length);
    console.log('Current state:', { nodes: nodes.length, edges: edges.length });
    
    if (history.past.length === 0) {
      console.log('❌ Nothing to undo');
      return;
    }

    // Set flag to prevent React Flow from interfering
    isUndoRedoInProgress.current = true;

    const currentSnapshot = createSnapshot();
    const previousSnapshot = history.past[history.past.length - 1];
    
    console.log('🔙 Restoring snapshot:', { 
      nodes: previousSnapshot.nodes.length, 
      edges: previousSnapshot.edges.length 
    });

    // Restore the previous state (EXCLUDING positions)
    setNodes(previousSnapshot.nodes);
    setEdges(previousSnapshot.edges);
    // NOTE: nodePositions are NOT restored - they keep their current values

    // Update history
    setHistory(prev => ({
      past: prev.past.slice(0, -1),
      future: [currentSnapshot, ...prev.future]
    }));
    
    // Clear flag after React processes the changes
    setTimeout(() => {
      isUndoRedoInProgress.current = false;
      console.log('✅ Undo completed (positions preserved)');
    }, 100);
    
  }, [history.past, nodes.length, edges.length, createSnapshot]);

  const handleRedo = useCallback(() => {
    console.log('🔄 REDO requested');
    console.log('History future entries:', history.future.length);
    
    if (history.future.length === 0) {
      console.log('❌ Nothing to redo');
      return;
    }

    // Set flag to prevent React Flow from interfering
    isUndoRedoInProgress.current = true;

    const currentSnapshot = createSnapshot();
    const nextSnapshot = history.future[0];
    
    console.log('🔜 Restoring snapshot:', { 
      nodes: nextSnapshot.nodes.length, 
      edges: nextSnapshot.edges.length 
    });

    // Restore the next state (EXCLUDING positions)
    setNodes(nextSnapshot.nodes);
    setEdges(nextSnapshot.edges);
    // NOTE: nodePositions are NOT restored - they keep their current values

    // Update history
    setHistory(prev => ({
      past: [...prev.past, currentSnapshot],
      future: prev.future.slice(1)
    }));
    
    // Clear flag after React processes the changes
    setTimeout(() => {
      isUndoRedoInProgress.current = false;
      console.log('✅ Redo completed (positions preserved)');
    }, 100);
    
  }, [history.future, createSnapshot]);

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

  // Provide undo/redo button handlers to Header component
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
      />

      <StackEdgeDrawer
        selectedNode={selectedNode}
        onNodeUpdate={updateNodeData}
        validationErrors={validationErrors}
        nodes={nodes}
        edges={edges}
        onFocusNode={focusNode}
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
