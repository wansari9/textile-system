import React from 'react';

interface Column {
  header: string;
  accessor: string;
}

interface ReportTableProps {
  title: string;
  columns: Column[];
  data: any[];
}

export default function ReportTable({ title, columns, data }: ReportTableProps) {
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <button className="bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded hover:bg-blue-700">
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y border">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-4 text-center text-sm text-gray-500">
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-2 text-sm text-gray-800">
                      {row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}