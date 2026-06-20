import React, { useState } from 'react';

export default function Customers() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const dummyCustomers = [
    { 
      id: 1, name: 'Zara', contact: 'John Doe', phone: '123-456-7890', 
      products: [
        { id: 101, name: 'T-Shirt Model A', style: 'TS-01', target: 500, status: 'ACTIVE' },
        { id: 102, name: 'T-Shirt Model B', style: 'TS-02', target: 300, status: 'PENDING' }
      ]
    },
    { 
      id: 2, name: 'H&M', contact: 'Jane Smith', phone: '098-765-4321',
      products: [
        { id: 201, name: 'Jeans Blue', style: 'JB-11', target: 400, status: 'ACTIVE' }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Customers & Products</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Add Customer</button>
      </div>

      <div className="bg-white shadow rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y border text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 w-8"></th>
              <th className="px-4 py-3 font-medium text-gray-500">Customer Name</th>
              <th className="px-4 py-3 font-medium text-gray-500">Contact Person</th>
              <th className="px-4 py-3 font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dummyCustomers.map(customer => (
              <React.Fragment key={customer.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                      className="text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                      {expandedId === customer.id ? '▼' : '▶'}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{customer.name}</td>
                  <td className="px-4 py-3">{customer.contact}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">Add Product</button>
                    <button className="text-gray-600 hover:text-gray-800 font-medium">Edit</button>
                  </td>
                </tr>
                {expandedId === customer.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="p-4">
                      <div className="bg-white border rounded shadow-sm p-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Products</h4>
                        <table className="min-w-full divide-y">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase">
                              <th className="text-left pb-2">Product Name</th>
                              <th className="text-left pb-2">Style</th>
                              <th className="text-left pb-2">Target</th>
                              <th className="text-left pb-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-sm">
                            {customer.products.map(prod => (
                              <tr key={prod.id}>
                                <td className="py-2">{prod.name}</td>
                                <td className="py-2">{prod.style}</td>
                                <td className="py-2">{prod.target}</td>
                                <td className="py-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    prod.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                                  }`}>
                                    {prod.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}