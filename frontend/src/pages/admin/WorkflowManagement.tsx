
export default function WorkflowManagement() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <input className="border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm w-64" placeholder="Search workflows" />
        <button className="bg-blue-600 text-white text-sm px-3 py-2 rounded">Create Workflow</button>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Owner</th>
              <th className="text-left p-2">Updated</th>
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
    </div>
  );
}


