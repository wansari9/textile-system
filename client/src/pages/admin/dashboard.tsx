import React from 'react';
import LineCard from '../../components/LineCard';

export default function Dashboard() {
  const dummyLines = [
    { id: 1, lineName: 'Line 1', productName: 'T-Shirt Model A', customerName: 'Zara', actual: 450, target: 500, defects: 5, status: 'ACTIVE' as const },
    { id: 2, lineName: 'Line 2', productName: 'Jeans Blue', customerName: 'H&M', actual: 300, target: 400, defects: 12, status: 'ACTIVE' as const },
    { id: 3, lineName: 'Line 3', productName: 'Jacket X', customerName: 'Levis', actual: 0, target: 0, defects: 0, status: 'MAINTENANCE' as const },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Live production tracking for {new Date().toLocaleDateString()}</p>
        </div>
        <button className="bg-white border rounded shadow-sm px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Manual Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Total Produced</p>
          <p className="text-2xl font-bold text-gray-800">750</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Total Target</p>
          <p className="text-2xl font-bold text-gray-800">900</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Factory Efficiency</p>
          <p className="text-2xl font-bold text-green-600">83%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Active Lines</p>
          <p className="text-2xl font-bold text-blue-600">2 / 3</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Production Lines</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyLines.map(line => (
          <LineCard 
            key={line.id}
            lineName={line.lineName}
            productName={line.productName}
            customerName={line.customerName}
            actual={line.actual}
            target={line.target}
            defects={line.defects}
            status={line.status}
          />
        ))}
      </div>
    </div>
  );
}