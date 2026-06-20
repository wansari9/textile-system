import React, { useState } from 'react';

export default function Quality() {
  const [checked, setChecked] = useState(0);
  const [faults, setFaults] = useState(0);

  const passRate = checked > 0 ? (((checked - faults) / checked) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-800">Quality Control</h1>
      <p className="text-gray-600">Enter total pieces checked and faults found for the day.</p>

      <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select className="mt-1 w-full p-2 border rounded-md">
              <option>Zara</option>
              <option>H&M</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pieces Checked</label>
              <input 
                type="number" 
                className="mt-1 w-full p-2 border rounded-md text-lg" 
                value={checked}
                onChange={e => setChecked(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 text-red-600">Total Faults</label>
              <input 
                type="number" 
                className="mt-1 w-full p-2 border border-red-300 rounded-md text-lg focus:ring-red-500 focus:border-red-500" 
                value={faults}
                onChange={e => setFaults(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded text-center border">
            <p className="text-sm text-gray-500 font-medium">Pass Rate</p>
            <p className={`text-4xl font-bold mt-1 ${Number(passRate) >= 95 ? 'text-green-600' : 'text-red-500'}`}>
              {passRate}%
            </p>
          </div>

          <div className="pt-4">
            <button type="button" className="w-full bg-blue-600 text-white p-2 rounded-md font-bold hover:bg-blue-700">
              Submit Quality Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}