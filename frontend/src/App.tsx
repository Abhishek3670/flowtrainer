import React, { useState, useCallback, useEffect } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

import Header from './components/Header/Header';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import FloatingComponentsPanel from './components/FloatingComponentsPanel/FloatingComponentsPanel';
import CustomNode from './components/CustomNode/CustomNode';
import { ThemeProvider } from './contexts/ThemeContext';
import { workflowAPI, WorkflowData } from './services/workflowApi';

const nodeTypes = {
  customNode: CustomNode,
};

// Empty initial state - we'll load from API
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(false);
  
  // Workflow state
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-load most recent workflow on page load
  useEffect(() => {
    const loadLatestWorkflow = async () => {
      try {
        setIsLoading(true);
        console.log('Loading most recent workflow...');
        
        const response = await workflowAPI.getWorkflows({ 
          limit: 1, 
          status: 'draft' 
        });
        
        if (response.data?.workflows && response.data.workflows.length > 0) {
          const workflow = response.data.workflows[0];
          console.log('Loaded workflow:', workflow.name);
          console.log('Full workflow object:', workflow);
          console.log('Workflow nodes:', workflow.nodes); 
          console.log('Workflow edges:', workflow.edges);
          
          // Restore canvas state
          console.log('Setting nodes to:', workflow.nodes || []); // 👈 Add this
          console.log('Setting edges to:', workflow.edges || []); // 👈 Add this

          // Restore canvas state
          setNodes(workflow.nodes || []);
          setEdges(workflow.edges || []);
          setCurrentWorkflow(workflow);
          setLastSaved(new Date(workflow.lastModified || workflow.updatedAt || Date.now())) ;
        } else {
          console.log('No existing workflows found - starting fresh');
          await createDefaultWorkflow();
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
        // If loading fails, create a default workflow
        await createDefaultWorkflow();
      } finally {
        setIsLoading(false);
      }
    };

    loadLatestWorkflow();
  }, [setNodes, setEdges]);

  // Create a default workflow for new users
  const createDefaultWorkflow = async () => {
    try {
      const defaultWorkflow = {
        name: 'My First ML Pipeline',
        description: 'Object detection workflow with CCTV stream',
        nodes: [
          {
            id: 'video-stream-1',
            type: 'customNode',
            data: { label: '📹 Video Stream' },
            position: { x: 200, y: 100 },
          },
          {
            id: 'frame-extractor-1',
            type: 'customNode', 
            data: { label: '🖼️ Frame Extractor' },
            position: { x: 200, y: 220 },
          },
          {
            id: 'object-detection-1',
            type: 'customNode',
            data: { label: '🎯 Object Detection' },
            position: { x: 200, y: 340 },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'video-stream-1', target: 'frame-extractor-1', animated: true },
          { id: 'e2-3', source: 'frame-extractor-1', target: 'object-detection-1', animated: true },
        ],
        viewport: { x: 0, y: 0, zoom: 1 },
        category: 'computer-vision' as const,
        tags: ['cctv', 'object-detection', 'ml']
      };

      const response = await workflowAPI.createWorkflow(defaultWorkflow);
      if (response.data) {
        setNodes(defaultWorkflow.nodes);
        setEdges(defaultWorkflow.edges);
        setCurrentWorkflow(response.data);
        setLastSaved(new Date());
        console.log('Created default workflow');
      }
    } catch (error) {
      console.error('Failed to create default workflow:', error);
      // Fallback to local-only nodes if API fails
      const fallbackNodes: Node[] = [
        {
          id: 'video-stream-1',
          type: 'customNode',
          data: { label: '📹 Video Stream' },
          position: { x: 200, y: 100 },
        }
      ];
      setNodes(fallbackNodes);
    }
  };

  // Auto-save workflow (debounced)
  const saveWorkflow = useCallback(async (workflowData?: Partial<WorkflowData>) => {
    // Don't save if we're still loading or if there are no nodes
    if (isLoading || (nodes.length === 0 && !workflowData)) {
      return;
    }

    try {
      setIsSaving(true);
      
      const workflowToSave: Partial<WorkflowData> = {
        name: currentWorkflow?.name || 'Untitled Workflow',
        description: currentWorkflow?.description || 'Auto-saved ML pipeline',
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 },
        category: 'computer-vision',
        ...workflowData
      };

      let savedWorkflow;
      if (currentWorkflow?._id) {
        // Update existing workflow
        const response = await workflowAPI.updateWorkflow(currentWorkflow._id, workflowToSave);
        savedWorkflow = response.data;
      } else {
        // Create new workflow
        const response = await workflowAPI.createWorkflow(workflowToSave as Omit<WorkflowData, '_id'>);
        savedWorkflow = response.data;
      }

      setCurrentWorkflow(savedWorkflow!);
      setLastSaved(new Date());
      console.log('Workflow auto-saved successfully');
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentWorkflow, nodes, edges, isLoading]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading && (nodes.length > 0 || edges.length > 0)) {
        saveWorkflow();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [nodes, edges, saveWorkflow, isLoading]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle deleting nodes
  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  // Update all nodes to include delete handler
  const nodesWithDelete = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onDelete: handleNodeDelete
    }
  }));

  // Handle dropping nodes from floating panel
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'customNode',
        position,
        data: { 
          label: `${type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          onDelete: handleNodeDelete
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, handleNodeDelete]
  );

  const handleNodeDrag = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading FlowCraft
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Restoring your latest workflow...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={() => saveWorkflow()}
        workflowName={currentWorkflow?.name}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <FloatingComponentsPanel onNodeDrag={handleNodeDrag} />
        
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodesWithDelete}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
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
