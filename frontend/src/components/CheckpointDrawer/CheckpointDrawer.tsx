import { useCheckpoints } from '../../services/checkpointApi';

interface CheckpointDrawerProps {
  workflowId: string;
  onRestore: (checkpointId: string) => void;
}

export default function CheckpointDrawer({ workflowId, onRestore }: CheckpointDrawerProps) {
  const { 
    checkpoints, 
    stats,
    loading, 
    deleteCheckpoint, 
    restoreCheckpoint 
  } = useCheckpoints(workflowId);

  const handleRestore = async (checkpointId: string) => {
    try {
      const restoredData = await restoreCheckpoint(checkpointId);
      if (restoredData) {
        onRestore(checkpointId);
      }
    } catch (error) {
      console.error('Failed to restore checkpoint:', error);
    }
  };

  const handleDelete = async (checkpointId: string) => {
    if (window.confirm('Are you sure you want to delete this checkpoint?')) {
      await deleteCheckpoint(checkpointId);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading checkpoints…</div>;

  return (
    <div className="p-4">
      {stats && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="font-medium mb-1">Statistics</div>
          <div className="text-xs space-y-1">
            <div>Total: {stats.totalCheckpoints} checkpoints</div>
            {stats.averageNodes > 0 && (
              <div>Avg: {stats.averageNodes.toFixed(1)} nodes, {stats.averageEdges.toFixed(1)} edges</div>
            )}
          </div>
        </div>
      )}
      
      {checkpoints.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-sm">No checkpoints yet</div>
          <div className="text-xs mt-2">Create a checkpoint to save your current workflow state</div>
        </div>
      ) : (
        <div className="space-y-3">
          {checkpoints.map(cp => (
            <div key={cp._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="mb-2">
                <div className="font-medium text-gray-900 dark:text-white truncate">{cp.name}</div>
                {cp.description && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{cp.description}</div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div>{new Date(cp.createdAt).toLocaleDateString()}</div>
                <div>{cp.nodes.length}N • {cp.edges.length}E</div>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleRestore(cp._id)} 
                  className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Restore
                </button>
                <button 
                  onClick={() => handleDelete(cp._id)} 
                  className="px-3 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
