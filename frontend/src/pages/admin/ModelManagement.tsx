// src/pages/admin/ModelManagement.tsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModels } from '../../store/slices/adminSlice';
import { AppDispatch, RootState } from '../../store';

export default function ModelManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { models, loading, error } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    dispatch(fetchModels());
  }, [dispatch]);

  if (loading) return <p>Loading models...</p>;
  if (error) return <p className="text-red-600">Error loading models: {error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Model Management</h2>
      {models.length === 0 ? (
        <p>No models configured</p>
      ) : (
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Name</th>
              <th className="border border-gray-300 px-4 py-2">Version</th>
              <th className="border border-gray-300 px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model.id}>
                <td className="border border-gray-300 px-4 py-2">{model.name}</td>
                <td className="border border-gray-300 px-4 py-2">{model.version || '-'}</td>
                <td className="border border-gray-300 px-4 py-2">{model.updatedAt || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


