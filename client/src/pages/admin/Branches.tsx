import React from 'react';
import ReportTable from '../../components/ReportTable';

export default function Branches() {
  const dummyBranches = [
    { branch: 'Branch North', target: 2000, actual: 1850, diff: -150 },
    { branch: 'Branch South', target: 1500, actual: 1600, diff: +100 },
  ];

  const columns = [
    { header: 'Branch Name', accessor: 'branch' },
    { header: 'Daily Target', accessor: 'target' },
    { header: 'Actual Produced', accessor: 'actual' },
    { header: 'Difference', accessor: 'diff' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Satellite Branches</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Add Entry</button>
      </div>

      <ReportTable 
        title={`Branch Summary - ${new Date().toLocaleDateString()}`}
        columns={columns}
        data={dummyBranches}
      />
    </div>
  );
}