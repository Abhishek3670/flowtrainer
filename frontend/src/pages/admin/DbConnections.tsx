import { useState } from 'react';

export default function DbConnections() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">Manage database connections</div>
        <button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white text-sm px-3 py-2 rounded">Add Connection</button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Host</th>
              <th className="text-left p-2 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">
            <tr>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
              <td className="p-2">-</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <button className="text-blue-600">Edit</button>
                  <button className="text-red-600">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Add Connection</div>
            <div className="space-y-2">
              <input className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm w-full" placeholder="Name" />
              <input className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm w-full" placeholder="Type" />
              <input className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm w-full" placeholder="Host" />
              <input className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm w-full" placeholder="Port" />
              <input className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm w-full" placeholder="Username" />
              <input className="border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm w-full" placeholder="Password" type="password" />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 text-sm" onClick={() => setIsOpen(false)}>Cancel</button>
              <button className="bg-blue-600 text-white text-sm px-3 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


