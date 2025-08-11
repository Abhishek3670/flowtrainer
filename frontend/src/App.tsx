import React, { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';
import toast, { Toaster } from 'react-hot-toast';
import ValidationPanel from './components/ValidationPanel/ValidationPanel';
import { useExecutionStatus } from '../hooks/useExecutionStatus';
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
  const [showValidation, setShowValidation] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{ nodeId: string; message: string }[]>([]);
  const [currentExecution, setCurrentExecution] = useState<string | null>(null);

  // Restore auto-save preference
  useEffect(() => {
    const saved = localStorage.getItem('autosave_enabled');
    if (saved !== null) setAutoSaveEnabled(saved === 'true');
  }, []);

  // Persist auto-save toggle
  useEffect(() => {
    localStorage.setItem('autosave_enabled', autoSaveEnabled.toString());
  }, [autoSaveEnabled]);

  const handleAutoSaveToggle = useCallback(() => {
    setAutoSaveEnabled(prev => !prev);
  }, []);

  // User edit handlers
  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes(nds =>
      nds.map(n => (n.id === nodeId ? { ...n, data: { ...n.data!, ...newData } } : n))
    );
    setHasChanges(true);
  }, [setNodes]);

  const handleNodesChange: OnNodesChange = useCallback(
    changes => {
      onNodesChange(changes);
      setHasChanges(true);
    },
    [onNodesChange]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    changes => {
      onEdgesChange(changes);
      setHasChanges(true);
    },
    [onEdgesChange]
  );

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      setEdges(eds => addEdge(params, eds));
      setHasChanges(true);
    },
    [setEdges]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
      setHasChanges(true);
      if (selectedNode?.id === nodeId) setSelectedNode(null);
    },
    [setNodes, setEdges, selectedNode]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const position = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      const newNode: Node<NodeData> = {
        id: `${type}-${Date.now()}`,
        type: 'customNode',
        position,
        data: {
          label: type,
          status: 'empty',
          onDelete: handleNodeDelete,
          hasError: false,
        },
      };
      setNodes(nds => nds.concat(newNode));
      setHasChanges(true);
    },
    [setNodes, handleNodeDelete]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeDrag = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Pipeline execution handler
  const executePipeline = useCallback(async () => {
    if (!currentWorkflow?._id) return;
    setIsSaving(true);
    try {
      const exec = await workflowAPI.executeWorkflow(currentWorkflow._id);
      toast.success(`Pipeline queued (ID: ${exec.data?.executionId || 'unknown'})`, { icon: '🚀' });
      setCurrentExecution(exec.data?.executionId || null);
    } catch (err) {
      toast.error('Failed to start execution', { icon: '❌' });
    } finally {
      setIsSaving(false);
    }
  }, [currentWorkflow]);

  // Validation logic
  const validateWorkflow = useCallback(() => {
    console.log('Validating nodes:', nodes);

    const invalidNodes = nodes.filter(n => {
      if (!n.data) return false; // skip if no data
      const d = n.data;

      const isVideoNode =
        n.type === 'customNode' &&
        (n.id.startsWith('video-stream') ||
          (typeof d.label === 'string' && d.label.includes('Video Stream')));

      const hasFile =
        typeof d.selectedFile === 'string'
          ? (d.selectedFile as string).trim().length > 0
          : Boolean(d.selectedFile && (d.selectedFile.filename || d.selectedFile.originalName));

      const hasRtspUrl =
        typeof d.rtspUrl === 'string' ? d.rtspUrl.trim().length > 0 : false;

      const hasSource = hasFile || hasRtspUrl;

      return isVideoNode && !hasSource;
    });

    console.log('Invalid nodes found:', invalidNodes.map(n => n.id));

    const errors = invalidNodes.map(n => ({
      nodeId: n.id,
      message: 'Video Stream node requires a file or RTSP URL',
    }));

    return { isValid: errors.length === 0, errors };
  }, [nodes]);

  // Run with validation
  const handleRunPipeline = useCallback(() => {
    const { isValid, errors } = validateWorkflow();
    setValidationErrors(errors);
    setShowValidation(true);

    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: { ...(n.data ?? {}), hasError: errors.some(err => err.nodeId === n.id) },
      }))
    );

    if (!isValid) {
      console.warn('Pipeline blocked due to validation errors');
      return;
    }

    // clear errors and icons
    setShowValidation(false);
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        data: { ...(n.data ?? {}), hasError: false },
      }))
    );

    executePipeline();
  }, [validateWorkflow, setNodes, executePipeline]);

  // Focus node
  const focusNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node && reactFlowInstance) {
        reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5 });
      }
      setShowValidation(false);
    },
    [nodes, reactFlowInstance]
  );

  // Clear highlights on node change
  useEffect(() => {
    if (validationErrors.length > 0) {
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          data: { ...n.data!, hasError: false },
        }))
      );
      setValidationErrors([]);
    }
  }, [nodes, validationErrors, setNodes]);

  // Update node status from execution events
  const updateNodeStatus = useCallback(
    (nodeId: string, status: string) => {
      setNodes(nds =>
        nds.map(n =>
          n.id === nodeId ? { ...n, data: { ...n.data!, status: status as any } } : n
        )
      );
    },
    [setNodes]
  );

  // Hook to listen execution status updates via WebSocket
  useExecutionStatus(currentExecution, updateNodeStatus);

  // Load workflow effect
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const resp = await workflowAPI.getWorkflows({ limit: 1, status: 'draft' });
        if (resp?.data?.workflows?.length) {
          const wf = resp.data.workflows[0];
          setNodes(wf.nodes || []);
          setEdges(wf.edges || []);
          setCurrentWorkflow(wf);
          setLastSaved(new Date(wf.lastModified || wf.updatedAt || Date.now()));
        }
      } catch {
        // handle error or fallback if needed
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [setNodes, setEdges]);

  // Re-validate and update error flags real-time (debounced to optimize performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      const { errors } = validateWorkflow();

      setNodes(nds =>
        nds.map(n => ({
          ...n,
          data: {
            ...n.data!,
            hasError: errors.some(err => err.nodeId === n.id),
          },
        }))
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [nodes, validateWorkflow, setNodes]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async (ns: Node<NodeData>[], es: Edge[]) => {
      if (!ns.length) return;
      setIsSaving(true);
      try {
        const partial: Partial<WorkflowData> = {
          name: currentWorkflow?.name || 'Untitled',
          description: currentWorkflow?.description || '',
          nodes: ns,
          edges: es,
          viewport: { x: 0, y: 0, zoom: 1 },
          category: 'computer-vision',
        };
        const resp = currentWorkflow?._id
          ? await workflowAPI.updateWorkflow(currentWorkflow._id, partial)
          : await workflowAPI.createWorkflow(partial as Omit<WorkflowData, '_id'>);

        setCurrentWorkflow(resp?.data ?? null);
        setLastSaved(new Date());
      } catch {
        toast.error('Auto-save failed', { icon: '💾' });
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [currentWorkflow]
  );

  useEffect(() => {
    if (autoSaveEnabled && hasChanges && !isLoading) {
      debouncedSave(nodes, edges);
      setHasChanges(false);
    }
  }, [autoSaveEnabled, hasChanges, isLoading, debouncedSave, nodes, edges]);

  // Loading state display
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading FlowCraft</h2>
        </div>
      </div>
    );
  }

  const nodesWithDelete = nodes.map(n => ({
    ...n,
    data: { ...n.data!, onDelete: handleNodeDelete },
  }));

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />

      <Header
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={() => debouncedSave.flush()}
        workflowName={currentWorkflow?.name}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={handleAutoSaveToggle}
        onRun={handleRunPipeline}
      />

      <div className="flex flex-1 relative overflow-hidden flow-canvas">
        {showValidation && (
          <ValidationPanel
            errors={validationErrors}
            onClose={() => setShowValidation(false)}
            onFocusNode={focusNode}
          />
        )}
        <FloatingComponentsPanel onNodeDrag={handleNodeDrag} />
        <div className="flex-1 relative">
          <ReactFlow
            onInit={setReactFlowInstance}
            nodes={nodesWithDelete}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_event, node) => setSelectedNode(node)}
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
