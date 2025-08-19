import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, NodeChange, EdgeChange, Connection, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { NodeData } from '../types';
import { useWorkflowPersistence } from './useWorkflowPersistence';

interface WorkflowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}

interface UseWorkflowResult {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  checkpoints: any[];
  createCheckpoint: (name?: string, description?: string) => Promise<void>;
  restoreCheckpoint: (checkpoint: any) => Promise<void>;
  deleteCheckpoint: (checkpointId: string) => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const useWorkflow = (workflowId: string = 'default-workflow'): UseWorkflowResult => {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  
  // History for undo/redo
  const [history, setHistory] = useState<WorkflowState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Mock checkpoints for now - replace with actual checkpoint management
  const [checkpoints] = useState<any[]>([]);
  
  const persistence = useWorkflowPersistence(workflowId);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const state = await persistence.loadLatestCheckpoint();
        if (state) {
          setNodes(state.nodes);
          setEdges(state.edges);
          setViewport(state.viewport);
          addToHistory({ nodes: state.nodes, edges: state.edges, viewport: state.viewport });
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [persistence]);

  const addToHistory = useCallback((state: WorkflowState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      // Keep only last 50 states
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => {
      const newNodes = applyNodeChanges(changes, nds);
      const newState = { nodes: newNodes, edges, viewport };
      addToHistory(newState);
      return newNodes;
    });
  }, [edges, viewport, addToHistory]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => {
      const newEdges = applyEdgeChanges(changes, eds);
      const newState = { nodes, edges: newEdges, viewport };
      addToHistory(newState);
      return newEdges;
    });
  }, [nodes, viewport, addToHistory]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => {
      const newEdges = addEdge(connection, eds);
      const newState = { nodes, edges: newEdges, viewport };
      addToHistory(newState);
      return newEdges;
    });
  }, [nodes, viewport, addToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setViewport(prevState.viewport);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setViewport(nextState.viewport);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  const createCheckpoint = useCallback(async (name?: string, description?: string) => {
    const state = { nodes, edges, viewport };
    await persistence.saveCheckpoint(state, name, description);
  }, [nodes, edges, viewport, persistence]);

  const restoreCheckpoint = useCallback(async (checkpoint: any) => {
    // Implementation would load checkpoint data
    console.log('Restoring checkpoint:', checkpoint);
  }, []);

  const deleteCheckpoint = useCallback(async (checkpointId: string) => {
    // Implementation would delete checkpoint
    console.log('Deleting checkpoint:', checkpointId);
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    checkpoints,
    createCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
    isLoading: persistence.isLoading,
    isSaving: persistence.isSaving,
    setNodes,
    setEdges,
  };
};
