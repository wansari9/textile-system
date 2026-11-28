import { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import { getLines, assignProduct, createLine, updateLine } from '../../api/lines';
import { getOrders } from '../../api/orders';
import { getBranches } from '../../api/branches';
import { Button, Card, Input, Select, Badge, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { page, table, statusFor } from '../../design';
import { GENDER_LABELS, LINE_TYPE_LABELS, LINE_TYPES, type LineType } from '../../domain';
import { toISODate } from '../../lib/date';

const typeBadge = (lineType: string) => (lineType === 'CUTTING' ? 'warning' : 'on_target');

const errorMessage = (err: unknown, fallback: string): string =>
  isAxiosError(err)
    ? (err.response?.data as { message?: string } | undefined)?.message || fallback
    : fallback;

export default function Lines() {
  const [lines, setLines] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [showLineForm, setShowLineForm] = useState(false);
  const [editingLine, setEditingLine] = useState<any | null>(null);
  const [lineForm, setLineForm] = useState({ branch_id: '', line_name: '', line_type: 'SEWING', status: 'ACTIVE' });
  const [assignData, setAssignData] = useState({ product_id: 0, daily_target: 0, start_date: '' });
  const { toast } = useToast();

  const fetchLines = async () => {
    const res = await getLines({ date: toISODate(new Date()) });
    if (res.success) setLines(res.data);
  };

  useEffect(() => {
    fetchLines().catch(() => {});
    getBranches().then(res => res.success && setBranches(res.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingLine(null);
    setLineForm({ branch_id: '', line_name: '', line_type: 'SEWING', status: 'ACTIVE' });
    setShowLineForm(true);
  };

  const openEdit = (line: any) => {
    setEditingLine(line);
    setLineForm({
      branch_id: line.branch_id?.toString() || '',
      line_name: line.line_name,
      line_type: line.line_type || 'SEWING',
      status: line.status,
    });
    setShowLineForm(true);
  };

  const handleLineSave = async () => {
    if (!lineForm.line_name.trim() || !lineForm.branch_id) {
      toast('error', 'Line name and branch are required');
      return;
    }
    const payload = {
      branch_id: Number(lineForm.branch_id),
      line_name: lineForm.line_name.trim(),
      line_type: lineForm.line_type,
      status: lineForm.status,
    };
    try {
      if (editingLine) {
        await updateLine(editingLine.line_id, payload);
        toast('success', 'Line updated');
      } else {
        await createLine(payload);
        toast('success', 'Line created');
      }
      setShowLineForm(false);
      fetchLines();
    } catch (err) {
      toast('error', errorMessage(err, 'Failed to save the line'));
    }
  };

  const openAssign = async (lineId: number) => {
    setShowAssign(lineId);
    setAssignData({ product_id: 0, daily_target: 0, start_date: toISODate(new Date()) });
    try {
      const res = await getOrders();
      if (res.success) {
        setOrders(res.data.filter((order: any) => order.status !== 'CANCELLED'));
      }
    } catch {
      setOrders([]);
    }
  };

  const handleAssign = async () => {
    if (!showAssign || !assignData.product_id) {
      toast('error', 'Choose an order to assign');
      return;
    }
    try {
      await assignProduct(showAssign, {
        ...assignData,
        start_date: assignData.start_date || toISODate(new Date()),
      });
      toast('success', 'Order assigned');
      setShowAssign(null);
      fetchLines();
    } catch (err) {
      toast('error', errorMessage(err, 'Failed to assign the order'));
    }
  };

  const selectedOrder = orders.find(order => order.product_id === assignData.product_id);
  const selectedLine = lines.find(line => line.line_id === showAssign);
  const sewingLines = lines.filter(line => line.line_type !== 'CUTTING');
  const cuttingLines = lines.filter(line => line.line_type === 'CUTTING');

  const renderLineTable = (rows: any[], emptyMessage: string) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className={table.headRow}>
            <th className="px-5 py-3 font-medium">Line</th>
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">Branch</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Current Order</th>
            <th className="px-5 py-3 font-medium text-right">Produced / Target</th>
            <th className="px-5 py-3 font-medium text-right">Score</th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {rows.map(line => {
            const score = line.score === null || line.score === undefined ? null : Number(line.score);
            const scoreStyle = statusFor(score);
            const produced = Number(line.produced_today) || 0;
            const target = Number(line.assigned_target ?? line.target_today) || 0;
            return (
              <tr key={line.line_id} className={table.row}>
                <td className="px-5 py-3 font-medium text-ink">{line.line_name}</td>
                <td className="px-5 py-3">
                  <Badge status={typeBadge(line.line_type)} size="sm">
                    {LINE_TYPE_LABELS[line.line_type as LineType] ?? line.line_type}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-ink-soft">{line.branch_name}</td>
                <td className="px-5 py-3">
                  <Badge status={line.status === 'ACTIVE' ? 'on_target' : line.status === 'MAINTENANCE' ? 'warning' : 'default'} size="sm">
                    {line.status}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  {line.product_name ? (
                    <>
                      <p className="font-medium text-ink">{line.product_name}</p>
                      <p className="text-[11px] text-muted">
                        {line.order_no || '—'} · {GENDER_LABELS[line.gender as keyof typeof GENDER_LABELS] ?? line.gender ?? '—'}
                        {line.customer_name ? ` · ${line.customer_name}` : ''}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted">{line.line_type === 'CUTTING' ? 'Cutting line' : 'No active order'}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-ink-soft">
                  {produced.toLocaleString()} / {target.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={`font-mono text-sm tabular-nums ${scoreStyle.text}`}>
                    {score === null ? '—' : `${score}%`}
                  </span>
                </td>
                <td className="px-5 py-3 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(line)}>Edit</Button>
                  {line.line_type !== 'CUTTING' && (
                    <Button variant="outline" size="sm" onClick={() => openAssign(line.line_id)}>Assign Order</Button>
                  )}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className={table.empty}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={page.shell}>
      <div className={page.header}>
        <div>
          <h1 className={page.title}>Production Lines</h1>
          <p className={page.subtitle}>Sewing assignments and cutting-line throughput</p>
        </div>
        <Button onClick={openCreate}>Add Line</Button>
      </div>

      <Card padding="none">
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Sewing lines</h2>
            <p className="text-xs text-muted">Assign one active order per line</p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted">{sewingLines.length} lines</span>
        </div>
        {renderLineTable(sewingLines, 'No sewing lines configured.')}
      </Card>

      <Card padding="none">
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-ink">Cutting lines</h2>
            <p className="text-xs text-muted">Output is recorded per order on the Daily Production page</p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted">{cuttingLines.length} lines</span>
        </div>
        {renderLineTable(cuttingLines, 'No cutting lines configured.')}
      </Card>

      <Modal open={showLineForm} onClose={() => setShowLineForm(false)} title={editingLine ? 'Edit Line' : 'Add Line'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLineForm(false)}>Cancel</Button>
            <Button onClick={handleLineSave}>{editingLine ? 'Update Line' : 'Create Line'}</Button>
          </>
        }
      >
        <Input label="Line Name" value={lineForm.line_name} onChange={e => setLineForm({ ...lineForm, line_name: e.target.value })} />
        <Select label="Branch" value={lineForm.branch_id} onChange={e => setLineForm({ ...lineForm, branch_id: e.target.value })}
          options={branches.map(b => ({ value: b.branch_id, label: b.branch_name }))} placeholder="Select branch" />
        <Select label="Line Type" value={lineForm.line_type} onChange={e => setLineForm({ ...lineForm, line_type: e.target.value })}
          options={LINE_TYPES.map(type => ({ value: type, label: LINE_TYPE_LABELS[type] }))} />
        <Select label="Status" value={lineForm.status} onChange={e => setLineForm({ ...lineForm, status: e.target.value })}
          options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }, { value: 'MAINTENANCE', label: 'Maintenance' }]} />
      </Modal>

      <Modal open={showAssign !== null} onClose={() => setShowAssign(null)} title={`Assign Order${selectedLine ? ` · ${selectedLine.line_name}` : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAssign(null)}>Cancel</Button>
            <Button onClick={handleAssign}>Assign</Button>
          </>
        }
      >
        <Select label="Order" value={assignData.product_id || ''}
          onChange={e => {
            const productId = Number(e.target.value);
            const order = orders.find(item => item.product_id === productId);
            setAssignData({
              product_id: productId,
              daily_target: order?.daily_target ?? 0,
              start_date: assignData.start_date || toISODate(new Date()),
            });
          }}
          options={orders.map(order => ({
            value: order.product_id,
            label: `${order.order_no} · ${order.product_name}`,
          }))}
          placeholder="Select an order" />

        {selectedOrder && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-rule bg-canvas/60 p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Order</p>
              <p className="font-mono text-xs font-medium text-ink">{selectedOrder.order_no}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Gender</p>
              <p className="font-medium text-ink">
                {GENDER_LABELS[selectedOrder.gender as keyof typeof GENDER_LABELS] ?? selectedOrder.gender ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Customer</p>
              <p className="text-ink-soft">{selectedOrder.customer_name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Order quantity</p>
              <p className="font-mono tabular-nums text-ink-soft">{Number(selectedOrder.order_quantity).toLocaleString()}</p>
            </div>
          </div>
        )}

        <Input label="Daily Target" type="number" value={assignData.daily_target || ''} onChange={e => setAssignData({ ...assignData, daily_target: Number(e.target.value) })} />
        <Input label="Start Date" type="date" value={assignData.start_date} onChange={e => setAssignData({ ...assignData, start_date: e.target.value })} />
      </Modal>
    </div>
  );
}
