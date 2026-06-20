import React from 'react';

export default function Lines() {
  const dummyLines = [
    { id: 1, name: 'Line 1', status: 'ACTIVE', currentProduct: 'T-Shirt Model A', target: 500 },
    { id: 2, name: 'Line 2', status: 'ACTIVE', currentProduct: 'Jeans Blue', target: 400 },
    { id: 3, name: 'Line 3', status: 'MAINTENANCE', currentProduct: 'None', target: 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Production Lines</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Assign Product</button>
      </div>

      <div className="bg-white shadow rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y border text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Line Name</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Current Product</th>
              <th className="px-4 py-3 font-medium text-gray-500">Daily Target</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dummyLines.map(line => (
              <tr key={line.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{line.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    line.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {line.status}
                  </span>
                </td>
                <td className="px-4 py-3">{line.currentProduct}</td>
                <td className="px-4 py-3">{line.target}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}