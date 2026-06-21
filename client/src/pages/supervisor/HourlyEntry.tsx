import { useState, useEffect } from 'react';
import HourlyGrid from '../../components/HourlyGrid';
import { getLines, getLineCurrent } from '../../api/lines';
import { logHourlyProduction, getHourlyProduction } from '../../api/production';
import { saveWorkforce, getWorkforce } from '../../api/workforce';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { Save, Loader2 } from 'lucide-react';

export default function HourlyEntry() {
  const [lines, setLines] = useState<any[]>([]);
  const [entries, setEntries] = useState<Record<string, Record<number, { produced: number; defect: number }>>>({});
  const [workforce, setWorkforce] = useState<Record<number, { required: number; present: number; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const loadData = async (date: string) => {
    setLoaded(false);
    const res = await getLines();
    if (!res.success) return;
    const enriched = await Promise.all(
      res.data.filter((l: any) => l.status === 'ACTIVE').map(async (line: any) => {
        try {
          const curr = await getLineCurrent(line.line_id);
          return { ...line, assignment: curr.data, product: curr.data };
        } catch {
          return null;
        }
      })
    );
    const activeLines = enriched.filter(Boolean);
    setLines(activeLines);

    const lineIds = activeLines.map((l: any) => l.line_id);

    const [hourlyRes, wfRes] = await Promise.all([
      getHourlyProduction(date),
      getWorkforce({ date }),
    ]);

    if (hourlyRes.success && hourlyRes.data) {
      const loadedEntries: Record<string, Record<number, { produced: number; defect: number }>> = {};
      for (const record of hourlyRes.data) {
        if (lineIds.includes(record.line_id)) {
          if (!loadedEntries[record.line_id]) loadedEntries[record.line_id] = {};
          loadedEntries[record.line_id][record.hour_number] = {
            produced: record.qty_produced || 0,
            defect: record.qty_defect || 0,
          };
        }
      }
      setEntries(loadedEntries);
    } else {
      setEntries({});
    }

    if (wfRes.success && wfRes.data) {
      const wfMap: Record<number, { required: number; present: number; notes: string }> = {};
      for (const wf of wfRes.data) {
        if (lineIds.includes(wf.line_id)) {
          wfMap[wf.line_id] = { required: wf.workers_required || 0, present: wf.workers_present || 0, notes: wf.notes || '' };
        }
      }
      setWorkforce(wfMap);
    } else {
      setWorkforce({});
    }
    setLoaded(true);
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const updateEntry = (lineId: number, hour: number, field: 'produced' | 'defect', value: number) => {
    setEntries(prev => ({
      ...prev,
      [lineId]: { ...prev[lineId], [hour]: { ...(prev[lineId]?.[hour] || { produced: 0, defect: 0 }), [field]: value } },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    const promises: Promise<any>[] = [];

    for (const line of lines) {
      const wf = workforce[line.line_id];
      if (wf && (wf.present > 0 || wf.required > 0 || wf.notes)) {
        promises.push(
          saveWorkforce({
            line_id: line.line_id,
            production_date: selectedDate,
            workers_required: wf.required,
            workers_present: wf.present,
            notes: wf.notes || undefined,
          }).catch(e => console.error(`Workforce save failed for ${line.line_name}`, e))
        );
      }

      const lineEntries = entries[line.line_id] || {};
      for (const hour of Object.keys(lineEntries)) {
        const entry = lineEntries[Number(hour)];
        if (entry.produced > 0 || entry.defect > 0) {
          promises.push(
            logHourlyProduction({
              assignment_id: line.assignment.assignment_id,
              line_id: line.line_id,
              product_id: line.assignment.product_id,
              production_date: selectedDate,
              hour_number: Number(hour),
              qty_produced: entry.produced,
              qty_defect: entry.defect,
            }).catch(e => console.error(`Hourly save failed for ${line.line_name} hr ${hour}`, e))
          );
        }
      }
    }

    await Promise.all(promises);
    setSaving(false);
    toast('success', 'All data saved successfully');
  };

  const getTotal = (lineId: number) => {
    const lineEntries = entries[lineId] || {};
    return Object.values(lineEntries).reduce((sum, e) => sum + (e.produced || 0), 0);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Hourly Production Entry</h1>
          <p className="text-sm text-text-muted mt-1 flex items-center gap-2">
            <span>Enter production quantities per hour per line.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
          <Button onClick={saveAll} disabled={saving || !loaded} loading={saving}>
            <Save size={16} />
            Save All Data
          </Button>
        </div>
      </div>

      {!loaded ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="p-4">
            <HourlyGrid
              lines={lines}
              entries={entries}
              onUpdate={updateEntry}
              getTotal={getTotal}
              workforce={workforce}
              onWorkforceUpdate={(lineId, field, value) =>
                setWorkforce(prev => ({
                  ...prev,
                  [lineId]: { ...(prev[lineId] || { required: 0, present: 0, notes: '' }), [field]: value },
                }))
              }
            />
          </div>
        </Card>
      )}
    </div>
  );
}
