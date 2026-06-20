import React from 'react';
import HourlyGrid from '../../components/HourlyGrid';

export default function HourlyEntry() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hourly Production Entry</h1>
          <p className="text-gray-600 mt-1">Log production quanties on an hourly basis.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 shadow-sm">
          Save All Data
        </button>
      </div>

      <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
        <HourlyGrid />
      </div>
    </div>
  );
}