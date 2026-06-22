import { useState, useEffect } from 'react';
import { getLines, getLineCurrent, assignProduct, createLine, updateLine } from '../../api/lines';
import { getProducts } from '../../api/products';
import { getBranches } from '../../api/branches';
import { Button, Card, Input, Select, Badge, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';

export default function Lines() {
  const [lines, setLines] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [showLineForm, setShowLineForm] = useState(false);
  const [editingLine, setEditingLine] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [lineForm, setLineForm] = useState({ branch_id: '', line_name: '', status: 'ACTIVE' });
  const [assignData, setAssignData] = useState({ product_id: 0, daily_target: 0, start_date: '' });
  const { toast } = useToast();

  const fetchLines = async () => {
    const res = await getLines();
    if (!res.success) return;
    const enriched = await Promise.all(
      res.data.map(async (line: any) => {
        try {
          const curr = await getLineCurrent(line.line_id);
          return { ...line, currentProduct: curr.data.product_name, target: curr.data.daily_target };
        } catch {
          return { ...line, currentProduct: 'None', target: 0 };
        }
      })
    );
    setLines(enriched);
  };

  useEffect(() => {
    fetchLines();
    getBranches().then(res => res.success && setBranches(res.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingLine(null);
    setLineForm({ branch_id: '', line_name: '', status: 'ACTIVE' });
    setShowLineForm(true);
  };

  const openEdit = (line: any) => {
    setEditingLine(line);
    setLineForm({ branch_id: line.branch_id?.toString() || '', line_name: line.line_name, status: line.status });
    setShowLineForm(true);
  };

  const handleLineSave = async () => {
    if (!lineForm.line_name || !lineForm.branch_id) return;
    const payload = { branch_id: Number(lineForm.branch_id), line_name: lineForm.line_name, status: lineForm.status };
    if (editingLine) {
      await updateLine(editingLine.line_id, payload);
      toast('success', 'Line updated');
    } else {
      await createLine(payload);
      toast('success', 'Line created');
    }
    setShowLineForm(false);
    fetchLines();
  };

  const openAssign = async (lineId: number) => {
    setShowAssign(lineId);
    const res = await getProducts({ status: 'PENDING' });
    if (res.success) setProducts(res.data);
  };

  const handleAssign = async () => {
    if (!showAssign || !assignData.product_id) return;
    await assignProduct(showAssign, {
      ...assignData,
      start_date: assignData.start_date || new Date().toISOString().split('T')[0],
    });
    setShowAssign(null);
    fetchLines();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-ink">Production Lines</h1>
          <p className="text-sm text-cool-gray mt-1">Manage production lines and product assignments</p>
        </div>
        <Button onClick={openCreate}>Add Line</Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-linen text-left text-xs text-cool-gray uppercase tracking-wider bg-greige/50">
                <th className="px-5 py-3 font-medium">Line Name</th>
                <th className="px-5 py-3 font-medium">Branch</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Current Product</th>
                <th className="px-5 py-3 font-medium text-right">Daily Target</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.map(line => (
                <tr key={line.line_id} className="hover:bg-greige transition-colors">
                  <td className="px-5 py-3 font-medium text-ink">{line.line_name}</td>
                  <td className="px-5 py-3 text-slate">{line.branch_name}</td>
                  <td className="px-5 py-3">
                    <Badge status={line.status === 'ACTIVE' ? 'on_target' : line.status === 'MAINTENANCE' ? 'warning' : 'default'} size="sm">{line.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate">{line.currentProduct}</td>
                  <td className="px-5 py-3 text-right font-medium">{line.target}</td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(line)}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => openAssign(line.line_id)}>Assign Product</Button>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-cool-gray">No lines configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
        <Select label="Status" value={lineForm.status} onChange={e => setLineForm({ ...lineForm, status: e.target.value })}
          options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }, { value: 'MAINTENANCE', label: 'Maintenance' }]} />
      </Modal>

      <Modal open={showAssign !== null} onClose={() => setShowAssign(null)} title="Assign Product to Line"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAssign(null)}>Cancel</Button>
            <Button onClick={handleAssign}>Assign</Button>
          </>
        }
      >
        <Select label="Product" value={assignData.product_id} onChange={e => setAssignData({ ...assignData, product_id: Number(e.target.value) })}
          options={products.map(p => ({ value: p.product_id, label: p.product_name }))} placeholder="Select product" />
        <Input label="Daily Target" type="number" value={assignData.daily_target || ''} onChange={e => setAssignData({ ...assignData, daily_target: Number(e.target.value) })} />
        <Input label="Start Date" type="date" value={assignData.start_date} onChange={e => setAssignData({ ...assignData, start_date: e.target.value })} />
      </Modal>
    </div>
  );
}
