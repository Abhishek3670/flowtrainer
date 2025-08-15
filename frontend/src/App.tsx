import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useProjectExecution } from './hooks/useProjectExecution';
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
import StackEdgeDrawer from './components/StackEdgeDrawer/StackEdgeDrawer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

import { NodeData, ValidationError } from './types';
import { useWorkflowPersistence } from './hooks/useWorkflowPersistence';

const nodeTypes = { customNode: CustomNode };
const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge[] = [];

function FlowCanvas() {
  // Workflow persistence
  const persistence = useWorkflowPersistence('default-workflow');
  const projectId = 'default-project'; // Fixed project ID for now

  // Project execution hook
  const {
    running,
    generatePlan,
    execute,
  } = useProjectExecution(projectId);

  // React Flow instance
  const reactFlowInstance = useReactFlow();

  // Canvas state
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);

  // Undo/Redo history excluding positions
  interface StateSnapshot { nodes: Node<NodeData>[]; edges: Edge[]; timestamp: number; }
  const [history, setHistory] = useState<{ past: StateSnapshot[]; future: StateSnapshot[]; }>({ past: [], future: [] });
  const isUndoRedoInProgress = useRef(false);
  const skipNextNodeChangeHistory = useRef(false);

  // Auto-save toggle
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  // Initialization
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && reactFlowInstance) {
      hasInitialized.current = true;
      (async () => {
        const ckpt = await persistence.loadLatestCheckpoint();
        if (ckpt) {
          const withHandlers = ckpt.nodes.map(n => ({
            ...n,
            data: { ...n.data, onDelete: (_: string) => {/* bound later */} },
          }));
          setNodes(withHandlers);
          setEdges(ckpt.edges);
          setViewport(ckpt.viewport);
          const pos: Record<string, { x: number; y: number }> = {};
          withHandlers.forEach(n => { pos[n.id] = n.position; });
          setNodePositions(pos);
          setTimeout(() => reactFlowInstance.setViewport(ckpt.viewport), 100);
        }
      })();
    }
  }, [reactFlowInstance, persistence]);

  // Snapshot helpers
  const createSnapshot = useCallback(() => ({
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
    timestamp: Date.now(),
  }), [nodes, edges]);

  const saveToHistory = useCallback(() => {
    if (isUndoRedoInProgress.current) return;
    const snap = createSnapshot();
    setHistory(h => ({ past: [...h.past, snap], future: [] }));
  }, [createSnapshot]);

  // Node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (isUndoRedoInProgress.current) return;
    saveToHistory();
    setNodes(ns => ns.filter(n => n.id !== nodeId));
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(sel => (sel?.id === nodeId ? null : sel));
  }, [saveToHistory]);

  // Update node data
  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...newData }} : n));
  }, []);

  // Handle node changes (position vs structural)
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    if (isUndoRedoInProgress.current) return;
    const posChanges = changes.filter(c => c.type === 'position');
    const otherChanges = changes.filter(c => c.type !== 'position');
    if (posChanges.length) {
      setNodePositions(p => {
        const copy = {...p};
        posChanges.forEach(c => {
          if (c.type === 'position' && c.position) copy[c.id] = c.position;
        });
        return copy;
      });
    }
    if (otherChanges.length) {
      if (skipNextNodeChangeHistory.current) {
        skipNextNodeChangeHistory.current = false;
      } else {
        const structural = otherChanges.some(c => c.type === 'add' || c.type === 'remove');
        if (structural) saveToHistory();
      }
      setNodes(ns => applyNodeChanges(otherChanges, ns));
    }
  }, [saveToHistory]);

  // Handle edge changes
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (isUndoRedoInProgress.current) return;
    const structural = changes.some(c => c.type === 'add' || c.type === 'remove');
    if (structural) saveToHistory();
    setEdges(es => applyEdgeChanges(changes, es));
  }, [saveToHistory]);

  // Handle new connections
  const onConnect = useCallback((params: Edge | Connection) => {
    if (isUndoRedoInProgress.current) return;
    saveToHistory();
    const newEdge: Edge = { id: `e-${params.source}-${params.target}-${Date.now()}`, ...params } as Edge;
    setEdges(es => [...es, newEdge]);
  }, [saveToHistory]);

  // Handle drop
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (isUndoRedoInProgress.current) return;
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstance) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const pos = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    const id = `${type}-${Date.now()}`;
    const newNode: Node<NodeData> = {
      id,
      type: 'customNode',
      position: pos,
      data: { nodeType: type, label: type, status: 'empty', onDelete: handleNodeDelete, hasError: false },
    };
    saveToHistory();
    skipNextNodeChangeHistory.current = true;
    setNodes(ns => [...ns, newNode]);
    setNodePositions(p => ({ ...p, [id]: pos }));
    setSelectedNode(newNode);
    setTimeout(() => { if (nodes.length === 0) reactFlowInstance.fitView({ padding: 0.1 }); }, 10);
  }, [reactFlowInstance, handleNodeDelete, nodes.length, saveToHistory]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (!history.past.length) return;
    isUndoRedoInProgress.current = true;
    const prev = history.past[history.past.length - 1];
    const currSnap = createSnapshot();
    setNodes(prev.nodes.map(n => ({ ...n, data: { ...n.data, onDelete: handleNodeDelete }})));
    setEdges(prev.edges);
    setHistory(h => ({ past: h.past.slice(0, -1), future: [currSnap, ...h.future] }));
    setTimeout(() => { isUndoRedoInProgress.current = false; }, 100);
  }, [history.past, createSnapshot, handleNodeDelete]);

  const handleRedo = useCallback(() => {
    if (!history.future.length) return;
    isUndoRedoInProgress.current = true;
    const next = history.future[0];
    const currSnap = createSnapshot();
    setNodes(next.nodes.map(n => ({ ...n, data: { ...n.data, onDelete: handleNodeDelete }})));
    setEdges(next.edges);
    setHistory(h => ({ past: [...h.past, currSnap], future: h.future.slice(1) }));
    setTimeout(() => { isUndoRedoInProgress.current = false; }, 100);
  }, [history.future, createSnapshot, handleNodeDelete]);

  // Run pipeline
  const handleRunPipeline = useCallback(async () => {
    try {
      await generatePlan('default-workflow', nodes, edges);
      await execute();
      toast.success('Pipeline execution started');
    } catch {
      toast.error('Pipeline execution failed');
    }
  }, [generatePlan, execute, nodes, edges]);

  // Auto-save
  useEffect(() => {
    if (autoSaveEnabled && nodes.length) {
      const t = setTimeout(() => persistence.saveAutoCheckpoint({ nodes, edges, viewport }), 10000);
      return () => clearTimeout(t);
    }
  }, [autoSaveEnabled, nodes, edges, viewport, persistence]);

  // Combined nodes with positions and delete handler
  const combinedNodes = nodes.map(n => ({
    ...n,
    position: nodePositions[n.id] || n.position,
    data: { ...n.data, onDelete: handleNodeDelete },
  }));

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />

      <Header
        isSaving={persistence.isSaving}
        lastSaved={persistence.lastCheckpoint?.createdAt ? new Date(persistence.lastCheckpoint.createdAt) : null}
        onSave={() => persistence.saveCheckpoint({ nodes, edges, viewport })}
        workflowName="ML Workflow"
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={() => setAutoSaveEnabled(v => !v)}
        onRun={handleRunPipeline}
        disableRun={!nodes.length || running}
        onUndo={handleUndo}
        onRedo={handleRedo}
        disableUndo={!history.past.length}
        disableRedo={!history.future.length}
        onOpenCheckpointModal={async () => {
          const name = prompt('Checkpoint name:', `Checkpoint ${new Date().toLocaleTimeString()}`);
          if (name) await persistence.saveCheckpoint({ nodes, edges, viewport }, name, '');
        }}
      />

      <StackEdgeDrawer
        selectedNode={selectedNode}
        onNodeUpdate={updateNodeData}
        validationErrors={[] as ValidationError[]}
        nodes={nodes}
        edges={edges}
        onFocusNode={id => reactFlowInstance?.fitView({ nodes: [reactFlowInstance.getNode(id)!], padding: 0.2 })}
        workflowId={projectId}
        onRestoreCheckpoint={async _cpId => {
          // Fixed to use existing method
          const ckpt = await persistence.loadLatestCheckpoint();
          if (ckpt) {
            setNodes(ckpt.nodes);
            setEdges(ckpt.edges);
            setViewport(ckpt.viewport);
          }
          toast.success('Checkpoint restored');
        }}
      />

      <div className="flex flex-1">
        <FloatingComponentsPanel onNodeDrag={(e, t) => e.dataTransfer.setData('application/reactflow', t)} />
        <div className="flex-1">
          <ReactFlow
            nodes={combinedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_e, n) => setSelectedNode(n)}
            onPaneClick={() => setSelectedNode(null)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            className="bg-white dark:bg-gray-800"
          >
            <Background />
            <Controls />
            <MiniMap nodeColor="#3b82f6" />
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
