import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { createOrder, getOrders } from '../../api/orders';
import { getCustomers } from '../../api/customers';
import { updateProduct, deleteProduct } from '../../api/products';
import { Button, Card, Input, Select, Badge, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { page, table } from '../../design';
import { GENDERS, GENDER_LABELS } from '../../domain';

type CustomerMode = 'existing' | 'new';

interface OrderForm {
  customer_id: string;
  customer: {
    customer_name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
  };
  order_no: string;
  product_name: string;
  style_code: string;
  color: string;
  size: string;
  gender: string;
  order_quantity: string;
  daily_target: string;
  status: string;
  start_date: string;
  due_date: string;
  order_date: string;
}

const emptyForm = (): OrderForm => ({
  customer_id: '',
  customer: { customer_name: '', contact_person: '', phone: '', email: '', address: '' },
  order_no: '',
  product_name: '',
  style_code: '',
  color: '',
  size: '',
  gender: 'UNISEX',
  order_quantity: '',
  daily_target: '',
  status: 'PENDING',
  start_date: '',
  due_date: '',
  order_date: new Date().toISOString().split('T')[0],
});

const errorMessage = (err: unknown, fallback: string): string =>
  isAxiosError(err)
    ? (err.response?.data as { message?: string } | undefined)?.message || fallback
    : fallback;

const statusBadge = (status: string) =>
  status === 'ACTIVE'
    ? 'on_target'
    : status === 'COMPLETED'
      ? 'on_target'
      : status === 'PENDING'
        ? 'warning'
        : status === 'CANCELLED'
          ? 'critical'
          : 'default';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [customerMode, setCustomerMode] = useState<CustomerMode>('existing');
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchOrders = async () => {
    const res = await getOrders(statusFilter === 'ALL' ? undefined : { status: statusFilter });
    if (res.success) setOrders(res.data);
  };

  const fetchCustomers = async () => {
    const res = await getCustomers();
    if (res.success) setCustomers(res.data);
  };

  useEffect(() => {
    fetchOrders().catch(() => {});
    fetchCustomers().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setCustomerMode('existing');
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (order: any) => {
    setEditing(order);
    setForm({
      ...emptyForm(),
      customer_id: order.customer_id?.toString() ?? '',
      order_no: order.order_no ?? '',
      product_name: order.product_name ?? '',
      style_code: order.style_code ?? '',
      color: order.color ?? '',
      size: order.size ?? '',
      gender: order.gender ?? 'UNISEX',
      order_quantity: order.order_quantity?.toString() ?? '',
      daily_target: order.daily_target?.toString() ?? '',
      status: order.status ?? 'PENDING',
      start_date: order.start_date ? String(order.start_date).split('T')[0] : '',
      due_date: order.due_date ? String(order.due_date).split('T')[0] : '',
      order_date: order.order_date ? String(order.order_date).split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const quantity = Number(form.order_quantity);
    const target = Number(form.daily_target);

    if (!form.product_name.trim()) {
      toast('error', 'Give the order a product or style name');
      return;
    }
    if (!quantity || quantity <= 0 || !target || target <= 0) {
      toast('error', 'Order quantity and daily target must be greater than zero');
      return;
    }
    if (!editing) {
      if (customerMode === 'existing' && !form.customer_id) {
        toast('error', 'Choose a customer or add a new one');
        return;
      }
      if (customerMode === 'new' && !form.customer.customer_name.trim()) {
        toast('error', 'Enter a name for the new customer');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        order_no: form.order_no.trim() || undefined,
        product_name: form.product_name.trim(),
        style_code: form.style_code || undefined,
        color: form.color || undefined,
        size: form.size || undefined,
        gender: form.gender,
        order_quantity: quantity,
        daily_target: target,
        status: form.status,
        start_date: form.start_date || undefined,
        due_date: form.due_date || undefined,
        order_date: form.order_date || undefined,
      };

      if (editing) {
        await updateProduct(editing.product_id, payload);
        toast('success', 'Order updated');
      } else {
        await createOrder(
          customerMode === 'existing'
            ? { ...payload, customer_id: Number(form.customer_id) }
            : {
                ...payload,
                customer: {
                  customer_name: form.customer.customer_name.trim(),
                  contact_person: form.customer.contact_person || undefined,
                  phone: form.customer.phone || undefined,
                  email: form.customer.email || undefined,
                  address: form.customer.address || undefined,
                },
              }
        );
        toast('success', 'Order created');
      }

      setShowForm(false);
      await Promise.all([fetchOrders(), fetchCustomers()]);
    } catch (err) {
      toast('error', errorMessage(err, 'Failed to save the order'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (order: any) => {
    if (!confirm(`Cancel ${order.order_no}?`)) return;
    try {
      await deleteProduct(order.product_id);
      toast('success', 'Order cancelled');
      fetchOrders();
    } catch (err) {
      toast('error', errorMessage(err, 'Failed to cancel the order'));
    }
  };

  const visibleOrders = orders.filter(order => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return [order.order_no, order.product_name, order.customer_name]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(needle));
  });

  return (
    <div className={page.shell}>
      <div className={page.header}>
        <div>
          <h1 className={page.title}>Orders</h1>
          <p className={page.subtitle}>Customer orders, quantities and delivery dates</p>
        </div>
        <Button onClick={openCreate}>New Order</Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className={`${page.dateInput} sm:w-72`}
          placeholder="Search order, product or customer"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'All statuses' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
        />
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={table.headRow}>
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium text-right">Qty</th>
                <th className="px-5 py-3 font-medium text-right">Daily Target</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {visibleOrders.map(order => {
                const produced = Number(order.produced_to_date) || 0;
                const quantity = Number(order.order_quantity) || 0;
                const pct = quantity > 0 ? Math.min(100, Math.round((produced / quantity) * 100)) : 0;
                return (
                  <tr key={order.product_id} className={table.row}>
                    <td className="px-5 py-3 font-mono text-xs font-medium text-ink">{order.order_no}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{order.product_name}</p>
                      <p className="text-[11px] text-muted">
                        {[order.style_code, order.color, order.size].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{order.customer_name}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {GENDER_LABELS[order.gender as keyof typeof GENDER_LABELS] ?? order.gender ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-ink">
                      {quantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-soft">
                      {Number(order.daily_target).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-raw-cotton">
                          <div className="h-full rounded-full bg-lime-deep" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-[11px] tabular-nums text-muted">
                          {produced.toLocaleString()} / {quantity.toLocaleString()} · {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge status={statusBadge(order.status)} size="sm">{order.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(order)}>Edit</Button>
                      {order.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-risk hover:text-risk"
                          onClick={() => handleCancel(order)}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className={table.empty}>No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Edit ${editing.order_no}` : 'New Order'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Update Order' : 'Create Order'}</Button>
          </>
        }
      >
        {!editing && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-rule bg-canvas/60 p-1">
            {(['existing', 'new'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setCustomerMode(mode)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  customerMode === mode ? 'bg-ink text-lime' : 'text-ink-soft hover:bg-raw-cotton'
                }`}
              >
                {mode === 'existing' ? 'Existing customer' : 'New customer'}
              </button>
            ))}
          </div>
        )}

        {editing ? (
          <Input label="Customer" value={editing.customer_name ?? ''} disabled />
        ) : customerMode === 'existing' ? (
          <Select
            label="Customer"
            value={form.customer_id}
            onChange={e => setForm({ ...form, customer_id: e.target.value })}
            options={customers.map(c => ({ value: c.customer_id, label: c.customer_name }))}
            placeholder="Select customer"
          />
        ) : (
          <div className="space-y-3 rounded-xl border border-rule bg-canvas/50 p-3">
            <Input
              label="New Customer Name"
              value={form.customer.customer_name}
              onChange={e => setForm({ ...form, customer: { ...form.customer, customer_name: e.target.value } })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact Person"
                value={form.customer.contact_person}
                onChange={e => setForm({ ...form, customer: { ...form.customer, contact_person: e.target.value } })}
              />
              <Input
                label="Phone"
                value={form.customer.phone}
                onChange={e => setForm({ ...form, customer: { ...form.customer, phone: e.target.value } })}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={form.customer.email}
              onChange={e => setForm({ ...form, customer: { ...form.customer, email: e.target.value } })}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Order Number"
            value={form.order_no}
            onChange={e => setForm({ ...form, order_no: e.target.value })}
            placeholder="Auto-generated"
            helperText="Leave blank to use the next ORD-00000 number."
          />
          <Select
            label="Gender"
            value={form.gender}
            onChange={e => setForm({ ...form, gender: e.target.value })}
            options={GENDERS.map(g => ({ value: g, label: GENDER_LABELS[g] }))}
          />
        </div>

        <Input
          label="Product / Style Name"
          value={form.product_name}
          onChange={e => setForm({ ...form, product_name: e.target.value })}
        />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Style Code" value={form.style_code} onChange={e => setForm({ ...form, style_code: e.target.value })} />
          <Input label="Color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          <Input label="Size" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Order Quantity" type="number" value={form.order_quantity} onChange={e => setForm({ ...form, order_quantity: e.target.value })} />
          <Input label="Daily Target" type="number" value={form.daily_target} onChange={e => setForm({ ...form, daily_target: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Order Date" type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} />
          <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          <Input label="Due Date" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
        </div>
        <Select
          label="Status"
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
          options={[
            { value: 'PENDING', label: 'Pending' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'ON_HOLD', label: 'On Hold' },
          ]}
        />
      </Modal>
    </div>
  );
}
