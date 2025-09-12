// src/pages/admin/AdminDashboard.tsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSystemStats } from '../../store/slices/adminSlice';
import type { RootState, AppDispatch } from '../../store';

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { systemStats, loading, error } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    dispatch(fetchSystemStats());
  }, [dispatch]);

  if (loading) return <p>Loading system stats...</p>;
  if (error) return <p className="text-red-600">Error loading stats: {error}</p>;

  return (
    <div className="p-6 grid grid-cols-4 gap-6">
      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold">Total Users</h3>
        <p>{systemStats?.userCount ?? '-'}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold">Total Workflows</h3>
        <p>{systemStats?.workflowCount ?? '-'}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold">DB Connections</h3>
        <p>{systemStats?.dbConnectionCount ?? '-'}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="font-semibold">Models</h3>
        <p>{systemStats?.modelCount ?? '-'}</p>
      </div>
    </div>
  );
}
