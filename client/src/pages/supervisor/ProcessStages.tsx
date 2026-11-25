import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../../api/orders';
import { getLines } from '../../api/lines';
import { getStages, postStage } from '../../api/stages';
import { Button, Card } from '../../components/ui';
import QualityForm from '../../components/QualityForm';
import { useToast } from '../../components/ui/Toast';
import { Save, ArrowRight } from 'lucide-react';
import { field, page, statusFor, table } from '../../design';
import {
  DAILY_STAGE_TABS,
  DAILY_STAGE_TAB_LABELS,
  GENDER_LABELS,
  type DailyStageTab,
} from '../../domain';
import { toISODate } from '../../lib/date';

const cellKey = (productId: number, lineId: number) => `${productId}:${lineId}`;

export default function ProcessStages() {
  const [tab, setTab] = useState<DailyStageTab>('CUTTING');
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [orders, setOrders] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [cutting, setCutting] = useState<Record<string, string>>({});
  const [ironing, setIroning] = useState<Record<string, string>>({});
  const [packing, setPacking] = useState<Record<string, string>>({});
  const [dirtyCutting, setDirtyCutting] = useState<Set<string>>(new Set());
  const [dirtyIroning, setDirtyIroning] = useState<Set<string>>(new Set());
  const [dirtyPacking, setDirtyPacking] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadData = async (date: string) => {
    setLoading(true);
    try {
      const [ordersRes, linesRes, stagesRes] = await Promise.all([
        getOrders({ status: 'ACTIVE' }),
        getLines({ date }),
        getStages({ date }),
      ]);

      if (ordersRes.success) setOrders(ordersRes.data || []);
      if (linesRes.success) setLines(linesRes.data || []);

      const cuttingMap: Record<string, string> = {};
      const ironingMap: Record<string, string> = {};
      const packingMap: Record<string, string> = {};

      for (const row of stagesRes.data || []) {
        if (row.stage === 'CUTTING' && row.line_id) {
          cuttingMap[cellKey(row.product_id, row.line_id)] = String(row.qty_completed ?? '');
        } else if (row.stage === 'IRONING') {
          ironingMap[String(row.product_id)] = String(row.qty_completed ?? '');
        } else if (row.stage === 'PACKING') {
          packingMap[String(row.product_id)] = String(row.qty_completed ?? '');
        }
      }

      setCutting(cuttingMap);
      setIroning(ironingMap);
      setPacking(packingMap);
      setDirtyCutting(new Set());
      setDirtyIroning(new Set());
      setDirtyPacking(new Set());
    } catch (err) {
      console.error('Failed to load daily production data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const markDirty = (setter: Dispatch<SetStateAction<Set<string>>>, key: string) => {
    setter(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const updateCutting = (productId: number, lineId: number, value: string) => {
    const key = cellKey(productId, lineId);
    setCutting(prev => ({ ...prev, [key]: value }));
    markDirty(setDirtyCutting, key);
  };

  const updateStage = (
    stage: 'IRONING' | 'PACKING',
    productId: number,
    value: string
  ) => {
    const key = String(productId);
    if (stage === 'IRONING') {
      setIroning(prev => ({ ...prev, [key]: value }));
      markDirty(setDirtyIroning, key);
    } else {
      setPacking(prev => ({ ...prev, [key]: value }));
      markDirty(setDirtyPacking, key);
    }
  };

  const reportSave = (results: PromiseSettledResult<any>[], saved: number) => {
    const failed = results.filter(result => result.status === 'rejected').length;
    if (failed > 0) {
      toast('error', `${failed} of ${saved} rows failed to save`);
    } else {
      toast('success', `${saved} ${saved === 1 ? 'row' : 'rows'} saved`);
    }
  };

  const saveCutting = async () => {
    if (dirtyCutting.size === 0) {
      toast('info', 'Nothing has changed yet');
      return;
    }
    setSaving(true);
    const tasks = [...dirtyCutting].map(key => {
      const [productId, lineId] = key.split(':').map(Number);
      return postStage({
        stage: 'CUTTING',
        product_id: productId,
        line_id: lineId,
        production_date: selectedDate,
        qty_completed: Number(cutting[key] || 0),
      });
    });
    const results = await Promise.allSettled(tasks);
    setSaving(false);
    setDirtyCutting(new Set());
    reportSave(results, tasks.length);
    loadData(selectedDate);
  };

  const saveFlatStage = async (stage: 'IRONING' | 'PACKING') => {
    const entries = stage === 'IRONING' ? ironing : packing;
    const dirty = stage === 'IRONING' ? dirtyIroning : dirtyPacking;
    if (dirty.size === 0) {
      toast('info', 'Nothing has changed yet');
      return;
    }
    setSaving(true);
    const tasks = [...dirty].map(productId =>
      postStage({
        stage,
        product_id: Number(productId),
        production_date: selectedDate,
        qty_completed: Number(entries[productId] || 0),
      })
    );
    const results = await Promise.allSettled(tasks);
    setSaving(false);
    if (stage === 'IRONING') {
      setDirtyIroning(new Set());
    } else {
      setDirtyPacking(new Set());
    }
    reportSave(results, tasks.length);
    loadData(selectedDate);
  };

  const cuttingLines = lines.filter(line => line.line_type === 'CUTTING' && line.status !== 'INACTIVE');
  const sewingLines = lines.filter(line => line.line_type === 'SEWING' && line.status !== 'INACTIVE');
  const canSave = tab === 'CUTTING' || tab === 'IRONING' || tab === 'PACKING';

  const handleSave = () => {
    if (tab === 'CUTTING') return saveCutting();
    if (tab === 'IRONING') return saveFlatStage('IRONING');
    if (tab === 'PACKING') return saveFlatStage('PACKING');
  };

  const renderOrderStage = (stage: 'IRONING' | 'PACKING') => {
    const entries = stage === 'IRONING' ? ironing : packing;
    return (
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={table.headRow}>
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium text-right">Order Qty</th>
                <th className="px-5 py-3 font-medium text-right">Daily Target</th>
                <th className="px-5 py-3 font-medium text-center">{DAILY_STAGE_TAB_LABELS[stage]} Today</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {orders.map(order => (
                <tr key={order.product_id} className={table.row}>
                  <td className="px-5 py-3 font-mono text-xs text-ink">{order.order_no}</td>
                  <td className="px-5 py-3 font-medium text-ink">{order.product_name}</td>
                  <td className="px-5 py-3 text-ink-soft">{order.customer_name}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {GENDER_LABELS[order.gender as keyof typeof GENDER_LABELS] ?? order.gender ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-soft">
                    {Number(order.order_quantity).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-soft">
                    {Number(order.daily_target).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      className={`w-24 ${field.compact}`}
                      placeholder="0"
                      value={entries[String(order.product_id)] ?? ''}
                      onChange={e => updateStage(stage, order.product_id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className={table.empty}>No active orders.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderCutting = () => (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={table.headRow}>
              <th className="px-5 py-3 font-medium">Order #</th>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Gender</th>
              <th className="px-5 py-3 font-medium text-right">Order Qty</th>
              {cuttingLines.map(line => (
                <th key={line.line_id} className="px-5 py-3 font-medium text-center">{line.line_name}</th>
              ))}
            </tr>
          </thead>
          <tbody className={table.body}>
            {orders.map(order => (
              <tr key={order.product_id} className={table.row}>
                <td className="px-5 py-3 font-mono text-xs text-ink">{order.order_no}</td>
                <td className="px-5 py-3 font-medium text-ink">{order.product_name}</td>
                <td className="px-5 py-3 text-ink-soft">{order.customer_name}</td>
                <td className="px-5 py-3 text-ink-soft">
                  {GENDER_LABELS[order.gender as keyof typeof GENDER_LABELS] ?? order.gender ?? '—'}
                </td>
                <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-soft">
                  {Number(order.order_quantity).toLocaleString()}
                </td>
                {cuttingLines.map(line => {
                  const key = cellKey(order.product_id, line.line_id);
                  return (
                    <td key={line.line_id} className="px-5 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        className={`w-24 ${field.compact}`}
                        placeholder="0"
                        value={cutting[key] ?? ''}
                        onChange={e => updateCutting(order.product_id, line.line_id, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5 + cuttingLines.length} className={table.empty}>No active orders.</td>
              </tr>
            )}
            {cuttingLines.length === 0 && (
              <tr>
                <td colSpan={5} className={table.empty}>No cutting lines configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderStitching = () => (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={table.headRow}>
              <th className="px-5 py-3 font-medium">Sewing Line</th>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Gender</th>
              <th className="px-5 py-3 font-medium text-right">Produced</th>
              <th className="px-5 py-3 font-medium text-right">Target</th>
              <th className="px-5 py-3 font-medium text-right">Attainment</th>
              <th className="px-5 py-3 font-medium text-right">Hourly Entry</th>
            </tr>
          </thead>
          <tbody className={table.body}>
            {sewingLines.map(line => {
              const produced = Number(line.produced_today) || 0;
              const target = Number(line.assigned_target ?? line.target_today) || 0;
              const score = line.score === null || line.score === undefined ? null : Number(line.score);
              const scoreStyle = statusFor(score);
              return (
                <tr key={line.line_id} className={table.row}>
                  <td className="px-5 py-3 font-medium text-ink">{line.line_name}</td>
                  <td className="px-5 py-3">
                    {line.product_name ? (
                      <>
                        <p className="text-ink">{line.product_name}</p>
                        <p className="text-[11px] text-muted">{line.order_no || '—'} · {line.customer_name}</p>
                      </>
                    ) : (
                      <span className="text-muted">No active order</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {GENDER_LABELS[line.gender as keyof typeof GENDER_LABELS] ?? line.gender ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-ink">{produced.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-soft">{target.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-mono text-sm tabular-nums ${scoreStyle.text}`}>
                      {score === null ? '—' : `${score}%`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link to="/entry" className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft hover:text-ink">
                      Log hours <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {sewingLines.length === 0 && (
              <tr>
                <td colSpan={7} className={table.empty}>No sewing lines configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className={page.shell}>
      <div className={page.header}>
        <div>
          <h1 className={page.title}>Daily Production</h1>
          <p className={page.subtitle}>Cutting, stitching, ironing, packing and quality for one day</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className={page.dateInput}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
          {canSave && (
            <Button onClick={handleSave} disabled={saving} loading={saving}>
              <Save size={16} />
              Save
            </Button>
          )}
        </div>
      </div>

      <div className={page.tabs}>
        {DAILY_STAGE_TABS.map(stage => (
          <button
            key={stage}
            onClick={() => setTab(stage)}
            className={`${page.tab} ${tab === stage ? page.tabActive : page.tabIdle}`}
          >
            {DAILY_STAGE_TAB_LABELS[stage]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted">Loading daily production…</p>
      ) : (
        <>
          {tab === 'CUTTING' && renderCutting()}
          {tab === 'STITCHING' && renderStitching()}
          {tab === 'IRONING' && renderOrderStage('IRONING')}
          {tab === 'PACKING' && renderOrderStage('PACKING')}
          {tab === 'QUALITY' && <QualityForm date={selectedDate} onSaved={() => loadData(selectedDate)} />}
        </>
      )}
    </div>
  );
}
