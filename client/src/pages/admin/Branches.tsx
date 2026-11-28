import { useState, useEffect } from 'react';
import ReportTable from '../../components/ReportTable';
import { getBranches, getBranchSummary, upsertBranchDaily } from '../../api/branches';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { field, page } from '../../design';

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
    <div className={page.shell}>
      <div className={page.header}>
        <div>
          <h1 className={page.title}>Satellite Branches</h1>
          <p className={page.subtitle}>Track daily production targets for each branch</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className={page.dateInput}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      <Card
        header={<h3 className="font-semibold text-ink">Enter Daily Production</h3>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-[10px] text-muted uppercase tracking-[0.14em] border-b border-rule">
                <th className="text-left pb-3 pr-4 font-medium">Branch</th>
                <th className="text-center pb-3 pr-4 font-medium">Daily Target</th>
                <th className="text-center pb-3 pr-4 font-medium">Quantity Produced</th>
                <th className="text-center pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {branches.map((branch: any) => (
                <tr key={branch.branch_id}>
                  <td className="py-3 pr-4 font-medium text-ink">{branch.branch_name}</td>
                  <td className="py-3 pr-4 text-center">
                    <input
                      type="number"
                      className={`w-24 ${field.compact}`}
                      placeholder="0"
                      value={input[branch.branch_id]?.daily_target ?? ''}
                      onChange={e => setInput(prev => ({ ...prev, [branch.branch_id]: { ...prev[branch.branch_id], daily_target: Number(e.target.value), qty_produced: prev[branch.branch_id]?.qty_produced || 0 } }))}
                    />
                  </td>
                  <td className="py-3 pr-4 text-center">
                    <input
                      type="number"
                      className={`w-24 ${field.compact}`}
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
                  <td colSpan={4} className="py-8 text-center text-sm text-muted">No branches configured.</td>
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
