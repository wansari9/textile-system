import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products';
import { getCustomers } from '../../api/customers';
import { Button, Card, Input, Select, Badge, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    customer_id: '', product_name: '', style_code: '', color: '', size: '',
    order_quantity: '', daily_target: '', status: 'PENDING', start_date: '', due_date: '',
  });

  const { toast } = useToast();
  const fetchProducts = async () => {
    const res = await getProducts();
    if (res.success) setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
    getCustomers().then(res => res.success && setCustomers(res.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ customer_id: '', product_name: '', style_code: '', color: '', size: '', order_quantity: '', daily_target: '', status: 'PENDING', start_date: '', due_date: '' });
    setShowForm(true);
  };

  const openEdit = (product: any) => {
    setEditing(product);
    setForm({
      customer_id: product.customer_id.toString(),
      product_name: product.product_name,
      style_code: product.style_code || '',
      color: product.color || '',
      size: product.size || '',
      order_quantity: product.order_quantity.toString(),
      daily_target: product.daily_target.toString(),
      status: product.status,
      start_date: product.start_date ? product.start_date.split('T')[0] : '',
      due_date: product.due_date ? product.due_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.customer_id || !form.product_name || !form.order_quantity || !form.daily_target) return;
    const payload = {
      customer_id: Number(form.customer_id),
      product_name: form.product_name,
      style_code: form.style_code || undefined,
      color: form.color || undefined,
      size: form.size || undefined,
      order_quantity: Number(form.order_quantity),
      daily_target: Number(form.daily_target),
      status: form.status,
      start_date: form.start_date || undefined,
      due_date: form.due_date || undefined,
    };
    if (editing) {
      await updateProduct(editing.product_id, payload);
      toast('success', 'Product updated');
    } else {
      await createProduct(payload);
      toast('success', 'Product created');
    }
    setShowForm(false);
    fetchProducts();
  };

  const handleCancel = async (id: number) => {
    if (confirm('Cancel this product?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Products</h1>
          <p className="text-sm text-text-muted mt-1">Manage product catalog and order details</p>
        </div>
        <Button onClick={openCreate}>Add Product</Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wider bg-gray-50/50">
                <th className="px-5 py-3 font-medium">Product Name</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Style Code</th>
                <th className="px-5 py-3 font-medium text-right">Order Quantity</th>
                <th className="px-5 py-3 font-medium text-right">Daily Target</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map(product => (
                <tr key={product.product_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-text-primary">{product.product_name}</td>
                  <td className="px-5 py-3 text-text-secondary">
                    {customers.find(c => c.customer_id === product.customer_id)?.customer_name || '-'}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{product.style_code || '-'}</td>
                  <td className="px-5 py-3 text-right font-medium">{product.order_quantity?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">{product.daily_target}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant={
                      product.status === 'ACTIVE' ? 'success' :
                      product.status === 'PENDING' ? 'warning' :
                      product.status === 'COMPLETED' ? 'info' :
                      product.status === 'CANCELLED' ? 'danger' : 'default'
                    } size="sm">{product.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>Edit</Button>
                    {product.status !== 'CANCELLED' && (
                      <Button variant="ghost" size="sm" className="text-danger-600 hover:text-danger-700" onClick={() => handleCancel(product.product_id)}>Cancel</Button>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-text-muted">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update Product' : 'Create Product'}</Button>
          </>
        }
      >
        <Select label="Customer" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}
          options={customers.map(c => ({ value: c.customer_id, label: c.customer_name }))} placeholder="Select customer" />
        <Input label="Product Name" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Style Code" value={form.style_code} onChange={e => setForm({ ...form, style_code: e.target.value })} />
          <Input label="Color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          <Input label="Size" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Order Quantity" type="number" value={form.order_quantity} onChange={e => setForm({ ...form, order_quantity: e.target.value })} />
          <Input label="Daily Target" type="number" value={form.daily_target} onChange={e => setForm({ ...form, daily_target: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          <Input label="Due Date" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
        </div>
        <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
          options={[
            { value: 'PENDING', label: 'Pending' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'ON_HOLD', label: 'On Hold' },
          ]} />
      </Modal>
    </div>
  );
}
