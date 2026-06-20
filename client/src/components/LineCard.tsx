import React from 'react';
import ProgressBar from './ProgressBar';

interface LineCardProps {
  lineName: string;
  productName: string;
  customerName: string;
  actual: number;
  target: number;
  defects: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export default function LineCard({ lineName, productName, customerName, actual, target, defects, status }: LineCardProps) {
  const statusColors = {
    ACTIVE: 'bg-green-500',
    MAINTENANCE: 'bg-yellow-500',
    INACTIVE: 'bg-gray-400'
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {lineName}
          <span className={`w-3 h-3 rounded-full ${statusColors[status]}`} title={status}></span>
        </h3>
        <span className="text-sm font-medium text-gray-500">{customerName}</span>
      </div>
      <div className="text-sm text-gray-600 font-medium truncate">{productName}</div>
      <ProgressBar actual={actual} target={target} />
      <div className="text-xs text-red-500 font-medium">Defects: {defects}</div>
    </div>
  );
}