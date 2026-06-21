import { useState, useEffect, Fragment } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/customers';
import { getProductsByCustomer } from '../../api/products';
import { Button, Card, Input, Textarea, Badge, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { ChevronRight, ChevronDown } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [productsMap, setProductsMap] = useState<Record<number, any[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ customer_name: '', contact_person: '', phone: '', email: '', address: '' });
  const { toast } = useToast();

  const fetchCustomers = async () => {
    const res = await getCustomers();
    if (res.success) setCustomers(res.data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleExpand = async (customerId: number) => {
    if (expandedId === customerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(customerId);
    if (!productsMap[customerId]) {
      const res = await getProductsByCustomer(customerId);
      if (res.success) {
        setProductsMap(prev => ({ ...prev, [customerId]: res.data }));
      }
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ customer_name: '', contact_person: '', phone: '', email: '', address: '' });
    setShowForm(true);
  };

  const openEdit = (customer: any) => {
    setEditing(customer);
    setForm({
      customer_name: customer.customer_name,
      contact_person: customer.contact_person || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.customer_name) return;
    if (editing) {
      await updateCustomer(editing.customer_id, form);
      toast('success', 'Customer updated');
    } else {
      await createCustomer(form);
      toast('success', 'Customer created');
    }
    setShowForm(false);
    fetchCustomers();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deactivate this customer?')) {
      await deleteCustomer(id);
      fetchCustomers();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Customers & Products</h1>
          <p className="text-sm text-text-muted mt-1">Manage customer accounts and their product catalog</p>
        </div>
        <Button onClick={openCreate}>Add Customer</Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wider bg-gray-50/50">
                <th className="px-5 py-3 font-medium w-8"></th>
                <th className="px-5 py-3 font-medium">Customer Name</th>
                <th className="px-5 py-3 font-medium">Contact Person</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map(customer => (
                <Fragment key={customer.customer_id}>
                  <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleExpand(customer.customer_id)}>
                    <td className="px-5 py-3 text-center text-text-muted">
                      {expandedId === customer.customer_id ? <ChevronDown size={16} className="inline" /> : <ChevronRight size={16} className="inline" />}
                    </td>
                    <td className="px-5 py-3 font-medium text-text-primary">{customer.customer_name}</td>
                    <td className="px-5 py-3 text-text-secondary">{customer.contact_person}</td>
                    <td className="px-5 py-3 text-text-secondary">{customer.phone}</td>
                    <td className="px-5 py-3 text-right space-x-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(customer)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-danger-600 hover:text-danger-700" onClick={() => handleDelete(customer.customer_id)}>Deactivate</Button>
                    </td>
                  </tr>
                  {expandedId === customer.customer_id && (
                    <tr key={`${customer.customer_id}-products`}>
                      <td colSpan={5} className="px-5 py-4 bg-gray-50/50">
                        <div className="bg-white rounded-lg border border-border p-4">
                          <h4 className="font-semibold text-text-primary text-sm mb-3">Products</h4>
                          {!productsMap[customer.customer_id] ? (
                            <p className="text-sm text-text-muted">Loading...</p>
                          ) : productsMap[customer.customer_id].length === 0 ? (
                            <p className="text-sm text-text-muted">No products for this customer.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-text-muted uppercase border-b border-border">
                                  <th className="text-left pb-2 pr-4 font-medium">Product Name</th>
                                  <th className="text-left pb-2 pr-4 font-medium">Style Code</th>
                                  <th className="text-right pb-2 pr-4 font-medium">Order Quantity</th>
                                  <th className="text-right pb-2 pr-4 font-medium">Daily Target</th>
                                  <th className="text-center pb-2 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border text-text-secondary">
                                {productsMap[customer.customer_id].map((prod: any) => (
                                  <tr key={prod.product_id}>
                                    <td className="py-2 pr-4 text-text-primary font-medium">{prod.product_name}</td>
                                    <td className="py-2 pr-4">{prod.style_code}</td>
                                    <td className="py-2 pr-4 text-right">{prod.order_quantity?.toLocaleString()}</td>
                                    <td className="py-2 pr-4 text-right">{prod.daily_target}</td>
                                    <td className="py-2 text-center">
                                      <Badge variant={prod.status === 'ACTIVE' ? 'success' : prod.status === 'COMPLETED' ? 'info' : prod.status === 'CANCELLED' ? 'danger' : 'warning'} size="sm">
                                        {prod.status}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-text-muted">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Customer' : 'Add Customer'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update Customer' : 'Create Customer'}</Button>
          </>
        }
      >
        <Input label="Customer Name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
        <Input label="Contact Person" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
        <Input label="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email Address" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Textarea label="Address" rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
      </Modal>
    </div>
  );
}
