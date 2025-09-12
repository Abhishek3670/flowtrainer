// src/pages/admin/DbConnections.tsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDbConnections } from '../../store/slices/adminSlice';
import { AppDispatch, RootState } from '../../store';
import Pagination from '../../components/Shared/Pagination';
import SearchInput from '../../components/Shared/SearchInput';

export default function DbConnections() {
  const dispatch = useDispatch<AppDispatch>();
  // Extend state to include total count for pagination
  const { dbConnections, loading, error, totalCount } = useSelector((state: RootState) => state.admin);

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20; // Items per page

  useEffect(() => {
    dispatch(fetchDbConnections({ page, limit, q: searchQuery }));
  }, [dispatch, page, searchQuery]);

  const totalPages = Math.ceil((totalCount || 0) / limit);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Database Connections</h2>

      <SearchInput onSearch={setSearchQuery} />

      {loading && <p>Loading database connections...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          {dbConnections.length === 0 ? (
            <p>No database connections found</p>
          ) : (
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Name</th>
                  <th className="border border-gray-300 px-4 py-2">Type</th>
                  <th className="border border-gray-300 px-4 py-2">Host</th>
                </tr>
              </thead>
              <tbody>
                {dbConnections.map(conn => (
                  <tr key={conn.id}>
                    <td className="border border-gray-300 px-4 py-2">{conn.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{conn.type}</td>
                    <td className="border border-gray-300 px-4 py-2">{conn.host}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
