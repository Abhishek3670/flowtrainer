import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  MiniMap,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Header from './components/Header/Header';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import FloatingComponentsPanel from './components/FloatingComponentsPanel/FloatingComponentsPanel';
import CustomNode from './components/CustomNode/CustomNode';
import { ThemeProvider } from './contexts/ThemeContext';
import { workflowAPI, WorkflowData, NodeData } from './services/workflowApi';

const nodeTypes = { customNode: CustomNode };
const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge[] = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(false);

  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('autosave_enabled');
    if (saved !== null) setAutoSaveEnabled(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('autosave_enabled', autoSaveEnabled.toString());
  }, [autoSaveEnabled]);

  const handleAutoSaveToggle = useCallback(() => {
    setAutoSaveEnabled(prev => !prev);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes(nds =>
      nds.map(node =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
    setHasChanges(true);
  }, [setNodes]);

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    setHasChanges(true);
  }, [onNodesChange]);

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    setHasChanges(true);
  }, [onEdgesChange]);

  const onConnect = useCallback((params: Edge | Connection) => {
    setEdges(eds => addEdge(params, eds));
    setHasChanges(true);
  }, [setEdges]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    const newNode: Node<NodeData> = {
      id: `${type}-${Date.now()}`,
      type: 'customNode',
      position,
      data: {
        label: `${type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        status: 'empty',
        onDelete: handleNodeDelete
      },
    };

    setNodes(nds => nds.concat(newNode));
    setHasChanges(true);
  }, [setNodes]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(node => node.id !== nodeId));
    setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    setHasChanges(true);
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  }, [setNodes, setEdges, selectedNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeDrag = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  useEffect(() => {
    const loadLatestWorkflow = async () => {
      try {
        setIsLoading(true);
        const response = await workflowAPI.getWorkflows({ limit: 1, status: 'draft' });
        if (response.data?.workflows && response.data.workflows.length > 0) {
          const workflow = response.data.workflows[0];
          setNodes(workflow.nodes || []);
          setEdges(workflow.edges || []);
          setCurrentWorkflow(workflow);
          setLastSaved(new Date(workflow.lastModified || workflow.updatedAt || Date.now()));
        } else {
          await createDefaultWorkflow();
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
        await createDefaultWorkflow();
      } finally {
        setIsLoading(false);
      }
    };
    loadLatestWorkflow();
  }, [setNodes, setEdges]);

  const createDefaultWorkflow = async () => {
    try {
      const defaultWorkflow: Omit<WorkflowData, '_id'> = {
        name: 'My First ML Pipeline',
        description: 'Object detection workflow with CCTV stream',
        nodes: [
          { id: 'video-stream-1', type: 'customNode', data: { label: '📹 Video Stream', status: 'empty' }, position: { x: 200, y: 100 } },
          { id: 'frame-extractor-1', type: 'customNode', data: { label: '🖼️ Frame Extractor', status: 'empty' }, position: { x: 200, y: 220 } },
          { id: 'object-detection-1', type: 'customNode', data: { label: '🎯 Object Detection', status: 'empty' }, position: { x: 200, y: 340 } },
        ],
        edges: [
          { id: 'e1-2', source: 'video-stream-1', target: 'frame-extractor-1', animated: true },
          { id: 'e2-3', source: 'frame-extractor-1', target: 'object-detection-1', animated: true },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
        category: 'computer-vision',
        tags: ['cctv', 'object-detection', 'ml'],
      };
      const response = await workflowAPI.createWorkflow(defaultWorkflow);
      if (response.data) {
        setNodes(defaultWorkflow.nodes);
        setEdges(defaultWorkflow.edges);
        setCurrentWorkflow(response.data);
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to create default workflow:', error);
      setNodes([
        {
          id: 'video-stream-1',
          type: 'customNode',
          data: { label: '📹 Video Stream', status: 'empty' },
          position: { x: 200, y: 100 },
        },
      ]);
    }
  };

  // === Debounced Save ===
  const debouncedSave = useCallback(debounce(async (nodesToSave: Node<NodeData>[], edgesToSave: Edge[]) => {
    if (nodesToSave.length === 0) return;
    try {
      setIsSaving(true);
      const workflowToSave: Partial<WorkflowData> = {
        name: currentWorkflow?.name || 'Untitled Workflow',
        description: currentWorkflow?.description || 'Auto-saved ML pipeline',
        nodes: nodesToSave,
        edges: edgesToSave,
        viewport: { x: 0, y: 0, zoom: 1 },
        category: 'computer-vision',
      };

      let savedWorkflow;
      if (currentWorkflow?._id) {
        const response = await workflowAPI.updateWorkflow(currentWorkflow._id, workflowToSave);
        savedWorkflow = response.data;
      } else {
        const response = await workflowAPI.createWorkflow(workflowToSave as Omit<WorkflowData, '_id'>);
        savedWorkflow = response.data;
      }

      setCurrentWorkflow(savedWorkflow!);
      setLastSaved(new Date());
    } catch (err) {
      console.error('❌ Auto-save failed', err);
    } finally {
      setIsSaving(false);
    }
  }, 1000), [currentWorkflow]);

  useEffect(() => {
    if (autoSaveEnabled && hasChanges && !isLoading) {
      debouncedSave(nodes, edges);
      setHasChanges(false);
    }
  }, [autoSaveEnabled, hasChanges, isLoading, debouncedSave, nodes, edges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
  }, []);

  const nodesWithDelete = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onDelete: handleNodeDelete,
    },
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading FlowCraft</h2>
          <p className="text-gray-600 dark:text-gray-400">Restoring your latest workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={() => debouncedSave.flush()}
        workflowName={currentWorkflow?.name}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={handleAutoSaveToggle}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <FloatingComponentsPanel onNodeDrag={handleNodeDrag} />
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodesWithDelete}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            className="bg-white dark:bg-gray-800"
          >
            <Background color="#e5e7eb" className="dark:opacity-20" />
            <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <MiniMap
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              nodeColor="#3b82f6"
            />
          </ReactFlow>
        </div>
        <PropertiesPanel
          selectedNode={selectedNode}
          collapsed={propertiesPanelCollapsed}
          onToggle={() => setPropertiesPanelCollapsed(!propertiesPanelCollapsed)}
          onNodeUpdate={updateNodeData}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
