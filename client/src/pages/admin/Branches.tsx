import { useState, useEffect } from 'react';
import ReportTable from '../../components/ReportTable';
import { getBranches, getBranchSummary, upsertBranchDaily } from '../../api/branches';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';

export default function Branches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [input, setInput] = useState<Record<number, { daily_target: number; qty_produced: number }>>({});
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const fetchData = async (date: string) => {
    const res = await getBranches();
    if (!res.success) return;
    setBranches(res.data);
    const summaries = await Promise.all(
      res.data.map(async (branch: any) => {
        try {
          const s = await getBranchSummary(branch.branch_id, date);
          const latest = s.data?.[0];
          return {
            branch: branch.branch_name,
            target: latest?.daily_target ?? 0,
            actual: latest?.qty_produced ?? 0,
            diff: (latest?.qty_produced ?? 0) - (latest?.daily_target ?? 0),
          };
        } catch {
          return { branch: branch.branch_name, target: 0, actual: 0, diff: 0 };
        }
      })
    );
    setRows(summaries);
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const handleSave = async (branchId: number) => {
    const vals = input[branchId];
    if (!vals) return;
    setSaving(true);
    try {
      await upsertBranchDaily(branchId, {
        production_date: selectedDate,
        daily_target: vals.daily_target || 0,
        qty_produced: vals.qty_produced || 0,
      });
      setInput(prev => { const next = { ...prev }; delete next[branchId]; return next; });
      toast('success', 'Branch data saved');
      fetchData(selectedDate);
    } catch (e) {
      toast('error', 'Failed to save branch data');
      console.error('Failed to save branch daily', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-ink">Satellite Branches</h1>
          <p className="text-sm text-cool-gray mt-1">Track daily production targets for each branch</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="px-3 py-2 border border-linen rounded-lg text-sm bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand/40"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      <Card
        header={<h3 className="font-semibold text-ink">Enter Daily Production</h3>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-cool-gray uppercase border-b border-linen">
                <th className="text-left pb-3 pr-4 font-medium">Branch</th>
                <th className="text-center pb-3 pr-4 font-medium">Daily Target</th>
                <th className="text-center pb-3 pr-4 font-medium">Quantity Produced</th>
                <th className="text-center pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {branches.map((branch: any) => (
                <tr key={branch.branch_id}>
                  <td className="py-3 pr-4 font-medium text-ink">{branch.branch_name}</td>
                  <td className="py-3 pr-4 text-center">
                    <input
                      type="number"
                      className="w-24 px-2 py-1.5 border border-linen rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                      placeholder="0"
                      value={input[branch.branch_id]?.daily_target ?? ''}
                      onChange={e => setInput(prev => ({ ...prev, [branch.branch_id]: { ...prev[branch.branch_id], daily_target: Number(e.target.value), qty_produced: prev[branch.branch_id]?.qty_produced || 0 } }))}
                    />
                  </td>
                  <td className="py-3 pr-4 text-center">
                    <input
                      type="number"
                      className="w-24 px-2 py-1.5 border border-linen rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                      placeholder="0"
                      value={input[branch.branch_id]?.qty_produced ?? ''}
                      onChange={e => setInput(prev => ({ ...prev, [branch.branch_id]: { ...prev[branch.branch_id], qty_produced: Number(e.target.value), daily_target: prev[branch.branch_id]?.daily_target || 0 } }))}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <Button size="sm" onClick={() => handleSave(branch.branch_id)} disabled={saving || !input[branch.branch_id]}>
                      Save
                    </Button>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-cool-gray">No branches configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ReportTable
        title={`Branch Summary - ${new Date(selectedDate).toLocaleDateString()}`}
        columns={[
          { header: 'Branch Name', accessor: 'branch' },
          { header: 'Daily Target', accessor: 'target' },
          { header: 'Total Produced', accessor: 'actual' },
          { header: 'Difference', accessor: 'diff' },
        ]}
        data={rows}
      />
    </div>
  );
}
