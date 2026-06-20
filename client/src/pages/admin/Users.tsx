import React from 'react';

export default function Users() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Add User</button>
      </div>
      <div className="bg-white p-4 shadow rounded-lg border">
        <p className="text-gray-600">List of supervisors/admins. Assign production line, reset passwords.</p>
      </div>
    </div>
  );
}