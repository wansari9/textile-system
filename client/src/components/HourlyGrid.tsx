import React from 'react';

export default function HourlyGrid() {
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Line</th>
            {[...Array(12)].map((_, i) => (
              <th key={i} className="px-4 py-2 border-b text-center text-sm font-semibold text-gray-700">Hr {i + 1}</th>
            ))}
            <th className="px-4 py-2 border-b text-center text-sm font-semibold text-gray-700">Total</th>
          </tr>
        </thead>
        <tbody>
          {/* Placeholder Row */}
          <tr>
            <td className="px-4 py-3 border-b text-sm text-gray-800 font-medium">Line A</td>
            {[...Array(12)].map((_, i) => (
              <td key={i} className="px-4 py-3 border-b text-center">
                <input 
                  type="number" 
                  className="w-16 p-1 border rounded text-center text-sm" 
                  placeholder="0" 
                  disabled={i < 4} /* Example: past hours read-only */
                />
              </td>
            ))}
            <td className="px-4 py-3 border-b text-center font-bold">0</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}