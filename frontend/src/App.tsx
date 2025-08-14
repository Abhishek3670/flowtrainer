import React, { useState, useCallback, useEffect } from 'react';
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

import { useHistory } from './hooks';

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

function FlowCanvas() {
  // Use history hook for structural changes only (add/remove nodes, not positions)
  const {
    state: historyNodes,
    set: setHistoryNodes,
    undo: undoNodes,
    redo: redoNodes,
    canUndo: canUndoNodes,
    canRedo: canRedoNodes,
  } = useHistory<Node<NodeData>[]>(initialNodes);

  const {
    state: edges,
    set: setEdges,
    undo: undoEdges,
    redo: redoEdges,
    canUndo: canUndoEdges,
    canRedo: canRedoEdges,
  } = useHistory<Edge[]>(initialEdges);

  // Separate state for node positions (not tracked in history)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  const reactFlowInstance = useReactFlow();

  // State
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [currentWorkflow] = useState<WorkflowData | null>(null);
  const [isSaving] = useState(false);
  const [lastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [validationErrors] = useState<ValidationError[]>([]);

  // Clean up positions for nodes that no longer exist
  useEffect(() => {
    const currentNodeIds = new Set(historyNodes.map(n => n.id));
    setNodePositions(prev => {
      const cleaned: Record<string, { x: number; y: number }> = {};
      Object.keys(prev).forEach(nodeId => {
        if (currentNodeIds.has(nodeId)) {
          cleaned[nodeId] = prev[nodeId];
        }
      });
      return cleaned;
    });
  }, [historyNodes]);

  // Persist auto-save toggle
  useEffect(() => {
    localStorage.setItem('autosave_enabled', autoSaveEnabled.toString());
  }, [autoSaveEnabled]);

  const handleAutoSaveToggle = useCallback(() => {
    setAutoSaveEnabled(prev => !prev);
  }, []);

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

  // Update node data helper - this should be tracked in history
  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<NodeData>) => {
      setHistoryNodes(draft => {
        const node = draft.find(n => n.id === nodeId);
        if (node) node.data = { ...node.data!, ...newData };
      });
    },
    [setHistoryNodes]
  );

  // Handle node changes - separate position changes from structural changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Separate position changes from other changes
      const positionChanges = changes.filter(change => change.type === 'position');
      const otherChanges = changes.filter(change => change.type !== 'position');
      
      // Handle position changes (not tracked in history)
      if (positionChanges.length > 0) {
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
        setHistoryNodes(draft => applyNodeChanges(otherChanges, draft));
      }
    },
    [setHistoryNodes]
  );

  // Handle edge changes using React Flow's built-in functions
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(draft => applyEdgeChanges(changes, draft));
    },
    [setEdges]
  );

  // Creating a new connection (edge)
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
      } as Edge;
      
      setEdges(draft => {
        draft.push(newEdge);
      });
    },
    [setEdges]
  );

  // Delete node and its edges
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setHistoryNodes(draft => draft.filter(n => n.id !== nodeId));
      setEdges(draft => draft.filter(e => e.source !== nodeId && e.target !== nodeId));
      if (selectedNode?.id === nodeId) setSelectedNode(null);
    },
    [setHistoryNodes, setEdges, selectedNode]
  );

  // Handle dropping new nodes on canvas - this should be tracked in history
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

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

      // Add node with history tracking
      setHistoryNodes(draft => {
        draft.push(newNode);
      });
      
      // Also track its initial position
      setNodePositions(prev => ({
        ...prev,
        [nodeId]: position
      }));
      
      setSelectedNode(newNode);

      // Fit view if this is the first node
      setTimeout(() => {
        if (historyNodes.length === 0) {
          reactFlowInstance.fitView({ padding: 0.1 });
        }
      }, 10);
    },
    [reactFlowInstance, setHistoryNodes, handleNodeDelete, historyNodes.length]
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
      const combinedNodes = historyNodes.map(node => ({
        ...node,
        position: nodePositions[node.id] || node.position || { x: 0, y: 0 }
      }));
      const node = combinedNodes.find(n => n.id === nodeId);
      if (node && reactFlowInstance) {
        reactFlowInstance.fitView({ nodes: [node], padding: 0.2, duration: 800 });
      }
    },
    [historyNodes, nodePositions, reactFlowInstance]
  );

  // Combined undo/redo handlers
  const handleUndo = useCallback(() => {
    // Undo both nodes and edges, but prioritize the one with more history
    let undoPerformed = false;
    if (canUndoNodes) {
      undoNodes();
      undoPerformed = true;
    }
    if (canUndoEdges) {
      undoEdges();
      undoPerformed = true;
    }
    if (!undoPerformed) {
      console.log('Nothing to undo');
    }
  }, [canUndoNodes, canUndoEdges, undoNodes, undoEdges]);

  const handleRedo = useCallback(() => {
    // Redo both nodes and edges, but prioritize the one with more future
    let redoPerformed = false;
    if (canRedoNodes) {
      redoNodes();
      redoPerformed = true;
    }
    if (canRedoEdges) {
      redoEdges();
      redoPerformed = true;
    }
    if (!redoPerformed) {
      console.log('Nothing to redo');
    }
  }, [canRedoNodes, canRedoEdges, redoNodes, redoEdges]);

  // Combine history nodes with current positions
  const combinedNodes = historyNodes.map(node => ({
    ...node,
    position: nodePositions[node.id] || node.position || { x: 0, y: 0 },
    data: {
      ...node.data,
      onDelete: handleNodeDelete,
    },
  }));

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
        disableRun={historyNodes.length === 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        disableUndo={!(canUndoNodes || canUndoEdges)}
        disableRedo={!(canRedoNodes || canRedoEdges)}
      />

      <StackEdgeDrawer
        selectedNode={selectedNode}
        onNodeUpdate={updateNodeData}
        validationErrors={validationErrors}
        nodes={historyNodes}
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
