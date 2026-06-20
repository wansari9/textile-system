import React from 'react';

export default function ProcessStages() {
  const products = ['T-Shirt Model A', 'Jeans Blue'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Process Stages</h1>
          <p className="text-gray-600 mt-1">Log Cutting, Packing, and Ironing totals.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 shadow-sm">
          Save All
        </button>
      </div>

      <div className="bg-white shadow rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y border text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">Cutting</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">Ironing</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">Packing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((prod, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{prod}</td>
                <td className="px-4 py-3 text-center">
                  <input type="number" className="w-20 p-1 border rounded text-center" placeholder="0" />
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="number" className="w-20 p-1 border rounded text-center" placeholder="0" />
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="number" className="w-20 p-1 border rounded text-center" placeholder="0" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}