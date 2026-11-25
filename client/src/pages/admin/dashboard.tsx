import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays,
  ClipboardList, Minus, RefreshCw,
} from 'lucide-react';
import { getOverviewReport } from '../../api/reports';
import Skeleton from '../../components/ui/Skeleton';
import { formatDateLong, toISODate } from '../../lib/date';
import { chart, page, qualityTone, segmented, statusFor, table, toneFor, tones } from '../../design';
import { GENDER_LABELS } from '../../domain';

type DashboardTab = 'customers' | 'orders' | 'branches' | 'lines';

const DASHBOARD_TABS: { key: DashboardTab; label: string }[] = [
  { key: 'customers', label: 'Customers' },
  { key: 'orders', label: 'Orders' },
  { key: 'branches', label: 'Branches' },
  { key: 'lines', label: 'Lines' },
];

function SignalBars({ pct }: { pct: number | null }) {
  const tone = toneFor(pct);
  const filled = pct === null ? 0 : Math.max(0, Math.min(5, Math.round(pct / 20)));
  return (
    <div className="flex items-end gap-[2px]" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`w-[3px] rounded-sm ${i <= filled ? tones[tone].dot : 'bg-rule'}`}
          style={{ height: 4 + i * 2 }}
        />
      ))}
    </div>
  );
}

const initials = (name?: string) =>
  (name || '—')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '—';

const attainment = (produced: number, target: number): number | null =>
  target > 0 ? Math.min(100, Math.round((produced / target) * 1000) / 10) : null;

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const [overview, setOverview] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(dateParam || toISODate(new Date()));
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState<'all' | 'behind' | 'on-target'>('all');
  const [tab, setTab] = useState<DashboardTab>('lines');

  useEffect(() => {
    if (dateParam) setSelectedDate(dateParam);
  }, [dateParam]);

  const fetchData = async (date: string) => {
    setLoading(true);
    try {
      const res = await getOverviewReport(date);
      if (res.success) setOverview(res.data);
    } catch (err) {
      console.error('Failed to load dashboard overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const totals = overview?.totals;
  const totalProduced = Number(totals?.total_produced) || 0;
  const totalTarget = Number(totals?.total_assigned_target ?? totals?.total_target) || 0;
  const totalDefects = Number(totals?.total_defect) || 0;
  const efficiency = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;

  const customers = overview?.by_customer || [];
  const orders = overview?.by_order || [];
  const branches = overview?.by_branch || [];
  const qualityData = overview?.quality || [];

  const byHour = overview?.by_hour || [];
  const hourlyData = Array.from({ length: 12 }, (_, i) => ({
    hour: `H${i + 1}`,
    produced: Number(byHour.find((h: any) => Number(h.hour_number) === i + 1)?.qty_produced) || 0,
  }));

  const lines = (overview?.by_line || []).map((line: any) => {
    const produced = Number(line.produced) || 0;
    const target = Number(line.assigned_target ?? line.target) || 0;
    return {
      id: line.line_id,
      name: line.line_name,
      type: line.line_type,
      status: line.status,
      product: line.product_name || 'No active assignment',
      customer: line.customer_name || '—',
      orderNo: line.order_no,
      gender: line.gender,
      produced,
      target,
      score: line.score === null || line.score === undefined
        ? attainment(produced, target)
        : Number(line.score),
      workersPresent: Number(line.workers_present) || 0,
      workersRequired: Number(line.workers_required) || 0,
    };
  });

  const activeLines = lines.filter((line: any) => line.status === 'ACTIVE').length;
  const assignedLines = lines.filter((line: any) => line.target > 0);
  const attention = assignedLines
    .filter((line: any) => line.produced < line.target)
    .sort((a: any, b: any) => a.produced / a.target - b.produced / b.target);
  const unassigned = lines.length - assignedLines.length;

  const hoursLogged = hourlyData.filter(h => h.produced > 0).length;
  const shiftTotal = hourlyData.reduce((sum, h) => sum + h.produced, 0);
  const peakHour = Math.max(...hourlyData.map(h => h.produced), 1);

  const qChecked = qualityData.reduce((sum: number, q: any) => sum + (Number(q.pcs_checked) || 0), 0);
  const qFaults = qualityData.reduce((sum: number, q: any) => sum + (Number(q.pcs_faults) || 0), 0);
  const passRate = qChecked > 0 ? Math.round(((qChecked - qFaults) / qChecked) * 100) : null;

  const pctOf = (line: any): number | null => attainment(line.produced, line.target);
  const needsPerHour = (line: any) =>
    Math.ceil(Math.max(0, line.target - line.produced) / Math.max(1, 12 - hoursLogged));

  const sortedLines = [...lines].sort((a: any, b: any) => {
    const aPct = a.target > 0 ? a.produced / a.target : 2;
    const bPct = b.target > 0 ? b.produced / b.target : 2;
    return aPct - bPct;
  });

  const visibleLines = sortedLines.filter((line: any) => {
    if (tableFilter === 'behind') return line.target > 0 && line.produced < line.target;
    if (tableFilter === 'on-target') return line.target > 0 && line.produced >= line.target;
    return true;
  });

  const quietStats = [
    { label: 'Efficiency', value: `${efficiency}%`, sub: 'of daily target' },
    { label: 'Lines running', value: `${activeLines}`, sub: `of ${lines.length} total` },
    { label: 'Defects logged', value: totalDefects.toLocaleString(), sub: 'units today' },
    { label: 'Quality pass', value: passRate === null ? '—' : `${passRate}%`, sub: 'across customers' },
  ];

  const heroBars = hourlyData.map(h => ({ hour: h.hour, produced: h.produced }));

  const qualityFor = (customerId: number) => {
    const row = qualityData.find((q: any) => Number(q.customer_id) === Number(customerId));
    const checked = Number(row?.pcs_checked) || 0;
    const faults = Number(row?.pcs_faults) || 0;
    return checked > 0 ? Math.round(((checked - faults) / checked) * 100) : null;
  };

  const renderCustomers = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={table.headRow}>
            <th className="px-5 py-3 font-medium">Customer</th>
            <th className="px-5 py-3 font-medium text-right">Orders</th>
            <th className="px-5 py-3 font-medium text-right">Output</th>
            <th className="px-5 py-3 font-medium text-right">Target</th>
            <th className="px-5 py-3 font-medium text-right">Attainment</th>
            <th className="px-5 py-3 font-medium text-right">Quality pass</th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {customers.map((customer: any) => {
            const produced = Number(customer.produced) || 0;
            const target = Number(customer.target) || 0;
            const pct = attainment(produced, target);
            const tone = statusFor(pct);
            const pass = qualityFor(customer.customer_id);
            return (
              <tr key={customer.customer_id} className={table.row}>
                <td className="px-5 py-3 font-medium text-ink">{customer.customer_name}</td>
                <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-soft">{Number(customer.orders) || 0}</td>
                <td className="px-5 py-3 text-right font-mono tabular-nums text-ink">{produced.toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-soft">{target.toLocaleString()}</td>
                <td className={`px-5 py-3 text-right font-mono tabular-nums ${tone.text}`}>
                  {pct === null ? '—' : `${pct}%`}
                </td>
                <td className={`px-5 py-3 text-right font-mono tabular-nums ${
                  pass === null ? 'text-muted' : tones[qualityTone(pass)].text
                }`}>
                  {pass === null ? '—' : `${pass}%`}
                </td>
              </tr>
            );
          })}
          {customers.length === 0 && (
            <tr>
              <td colSpan={6} className={table.empty}>No customer output for this date.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderOrders = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={table.headRow}>
            <th className="px-5 py-3 font-medium">Order #</th>
            <th className="px-5 py-3 font-medium">Customer</th>
            <th className="px-5 py-3 font-medium">Gender</th>
            <th className="px-5 py-3 font-medium">Produced / Target</th>
            <th className="px-5 py-3 font-medium">Progress</th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {orders.map((order: any) => {
            const produced = Number(order.produced) || 0;
            const target = Number(order.target) || 0;
            const pct = attainment(produced, target);
            const tone = statusFor(pct);
            return (
              <tr key={order.product_id} className={table.row}>
                <td className="px-5 py-3">
                  <p className="font-mono text-xs font-medium text-ink">{order.order_no}</p>
                  <p className="text-[11px] text-muted">{order.product_name}</p>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  <p>{order.customer_name}</p>
                  <p className="text-[11px] text-muted">{order.line_name || '—'}</p>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {GENDER_LABELS[order.gender as keyof typeof GENDER_LABELS] ?? order.gender ?? '—'}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-ink-soft">
                  {produced.toLocaleString()} / {target.toLocaleString()}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-raw-cotton">
                      <div className={`h-full rounded-full ${tone.fill}`} style={{ width: `${pct ?? 0}%` }} />
                    </div>
                    <span className={`font-mono text-[11px] tabular-nums ${tone.text}`}>
                      {pct === null ? '—' : `${pct}%`}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className={table.empty}>No order output for this date.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderBranches = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={table.headRow}>
            <th className="px-5 py-3 font-medium">Branch</th>
            <th className="px-5 py-3 font-medium text-right">Target</th>
            <th className="px-5 py-3 font-medium text-right">Actual</th>
            <th className="px-5 py-3 font-medium text-right">Difference</th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {branches.map((branch: any) => {
            const target = Number(branch.target) || 0;
            const actual = Number(branch.produced) || 0;
            const diff = Number(branch.difference) || 0;
            return (
              <tr key={branch.branch_id} className={table.row}>
                <td className="px-5 py-3 font-medium text-ink">{branch.branch_name}</td>
                <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-soft">{target.toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-mono tabular-nums text-ink">{actual.toLocaleString()}</td>
                <td className={`px-5 py-3 text-right font-mono tabular-nums ${
                  target === 0 ? 'text-muted' : diff >= 0 ? 'text-lime-deep' : 'text-risk'
                }`}>
                  {target === 0 ? '—' : `${diff > 0 ? '+' : ''}${diff.toLocaleString()}`}
                </td>
              </tr>
            );
          })}
          {branches.length === 0 && (
            <tr>
              <td colSpan={4} className={table.empty}>No branch data for this date.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderLines = () => (
    <>
      <div className="flex justify-end px-5 pb-2 pt-3">
        <div className={segmented.pillGroup}>
          {([
            ['all', 'All'],
            ['behind', 'Behind'],
            ['on-target', 'On target'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTableFilter(value)}
              className={`${segmented.pillItem} ${
                tableFilter === value ? segmented.pillActive : segmented.pillIdle
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={table.headRow}>
              <th className="px-5 py-3 font-medium">Line</th>
              <th className="px-5 py-3 font-medium">Buyer / style</th>
              <th className="px-5 py-3 font-medium">Health</th>
              <th className="px-5 py-3 font-medium text-right">Produced</th>
              <th className="px-5 py-3 font-medium text-right">Attainment</th>
              <th className="px-5 py-3 font-medium text-right">Score</th>
              <th className="px-5 py-3 font-medium text-right">Gap</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className={table.body}>
            {visibleLines.map((line: any) => {
              const pct = pctOf(line);
              const health = statusFor(pct);
              const scoreTone = statusFor(line.score);
              const tone = toneFor(pct);
              const Trend =
                tone === 'idle' ? Minus : tone === 'onTarget' ? ArrowUpRight : tone === 'atRisk' ? Minus : ArrowDownRight;
              const gap = line.target > 0 ? line.produced - line.target : null;
              return (
                <tr key={line.id} className={table.row}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${health.dot}`} />
                      <span className="font-medium text-ink">{line.name}</span>
                    </div>
                    <p className="mt-0.5 max-w-[180px] truncate pl-3.5 text-[11px] text-muted">
                      {line.orderNo ? `${line.orderNo} · ` : ''}{line.customer}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="max-w-[240px] truncate text-sm text-ink-soft">{line.product}</p>
                    <p className="text-[11px] text-muted">
                      {GENDER_LABELS[line.gender as keyof typeof GENDER_LABELS] ?? line.gender ?? '—'} · {line.status}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <SignalBars pct={pct} />
                      <span className={`text-[11px] font-medium ${health.text}`}>{health.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-mono text-sm tabular-nums text-ink">
                      {line.produced.toLocaleString()}
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                      {' '}/ {line.target.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Trend size={13} className={health.text} />
                      <span className={`font-mono text-sm tabular-nums ${health.text}`}>
                        {pct === null ? '—' : `${pct}%`}
                      </span>
                    </div>
                  </td>
                  <td className={`px-5 py-3 text-right font-mono text-sm tabular-nums ${scoreTone.text}`}>
                    {line.score === null ? '—' : `${line.score}%`}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm tabular-nums">
                    {gap === null ? (
                      <span className="text-muted">—</span>
                    ) : gap >= 0 ? (
                      <span className="text-lime-deep">+{gap.toLocaleString()}</span>
                    ) : (
                      <span className="text-risk">−{Math.abs(gap).toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/entry"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-ink"
                    >
                      Log <ArrowUpRight size={12} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {visibleLines.length === 0 && (
              <tr>
                <td colSpan={8} className={table.empty}>No lines match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-5 py-3 text-[11px] text-muted">
        Showing {visibleLines.length} of {lines.length} lines · sorted by gap to target
      </p>
    </>
  );

  return (
    <div className="mx-auto max-w-[1440px] space-y-9 px-4 py-6 lg:px-8 lg:py-8">
      {/* Headline — answers the question the page exists to answer */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted">
            <CalendarDays size={12} />
            Floor overview · {formatDateLong(selectedDate)}
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-[34px] leading-[1.08] tracking-[-0.01em] text-ink sm:text-[42px]">
            {loading && !overview ? (
              <span className="text-muted">Reading today’s floor…</span>
            ) : attention.length > 0 ? (
              <>
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10">
                    {attention.length} {attention.length === 1 ? 'line needs' : 'lines need'}
                  </span>
                  <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-lime/70" />
                </span>{' '}
                <em className="italic">attention</em> before the shift ends.
              </>
            ) : (
              <>
                Every line is <em className="italic">on target</em> today.
              </>
            )}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {formatDateLong(selectedDate)} · {activeLines} lines running · {hoursLogged} of 12 hours logged
            {unassigned > 0 ? ` · ${unassigned} unassigned` : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="h-9 rounded-lg border border-rule bg-paper px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
          <button
            onClick={() => fetchData(selectedDate)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-rule bg-paper text-ink-soft transition-colors hover:bg-raw-cotton hover:text-ink"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {loading && !overview ? (
        <div className="grid gap-5 lg:grid-cols-5">
          <Skeleton variant="rect" className="h-80 rounded-2xl lg:col-span-3" />
          <Skeleton variant="rect" className="h-80 rounded-2xl lg:col-span-2" />
        </div>
      ) : (
        <>
          {/* Dark hero + today's focus. The only dark surface on the page. */}
          <div className="grid gap-5 lg:grid-cols-5">
            <section className="relative overflow-hidden rounded-2xl bg-carbon p-6 text-white lg:col-span-3 lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Units produced today</p>
                  <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                    <span className="font-serif text-6xl leading-none tabular-nums text-lime lg:text-7xl">
                      {totalProduced.toLocaleString()}
                    </span>
                    <span className="mb-2 text-sm text-white/50">
                      of {totalTarget.toLocaleString()} target
                    </span>
                  </div>
                </div>
                <span className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[11px] text-white/60">
                  {efficiency}%
                </span>
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-lime transition-all duration-500"
                  style={{ width: `${Math.min(100, efficiency)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
                <span>{totalDefects.toLocaleString()} defects logged</span>
                <span>{Math.max(0, totalTarget - totalProduced).toLocaleString()} units to target</span>
              </div>

              <div className="mt-6 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heroBars} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="hour" hide />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: chart.heroCursor }} {...chart.heroTooltip} />
                    <Bar dataKey="produced" name="Units" fill={chart.heroBar} radius={chart.barRadius} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.14em] text-white/35">
                <span>Hr 1</span>
                <span>Shift runway · {hoursLogged}/12 hours</span>
                <span>Hr 12</span>
              </div>
            </section>

            {/* Today's focus — delivers on the headline */}
            <aside className="flex flex-col rounded-2xl border border-rule bg-paper p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-risk" />
                  <h2 className="font-serif text-xl text-ink">Today’s focus</h2>
                </div>
                <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  {attention.length} behind
                </span>
              </div>

              <div className="mt-4 flex-1 space-y-2.5">
                {attention.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-rule p-4">
                    <p className="text-sm text-ink-soft">
                      Nothing is behind target. Keep the pace and log each hour as it closes.
                    </p>
                  </div>
                ) : (
                  attention.slice(0, 3).map((line: any) => {
                    const pct = pctOf(line);
                    const health = statusFor(pct);
                    return (
                      <div key={line.id} className="rounded-xl border border-rule bg-surface-raised p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {line.name} · {line.product}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-muted">
                              {line.customer} · {(line.target - line.produced).toLocaleString()} short ·
                              needs {needsPerHour(line)}/hr
                            </p>
                          </div>
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-soft text-[11px] font-semibold text-lime-deep"
                            title={line.customer}
                          >
                            {initials(line.customer)}
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SignalBars pct={pct} />
                            <span className={`text-[11px] font-medium ${health.text}`}>
                              {pct}% · {health.label}
                            </span>
                          </div>
                          <Link
                            to="/entry"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-soft transition-colors hover:text-ink"
                          >
                            Log hours <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
                {attention.length > 3 && (
                  <p className="px-1 text-[11px] text-muted">
                    +{attention.length - 3} more lines behind target
                  </p>
                )}
              </div>

              <Link
                to="/entry"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink transition-colors hover:text-lime-deep"
              >
                <ClipboardList size={13} /> Open hourly entry
              </Link>
            </aside>
          </div>

          {/* Quiet stat row — deliberately smaller than the hero */}
          <div className="grid grid-cols-2 border-y border-rule md:grid-cols-4">
            {quietStats.map((stat, i) => (
              <div
                key={stat.label}
                className={`px-4 py-4 ${i % 2 === 1 ? 'border-l border-rule' : ''} ${
                  i >= 2 ? 'border-t border-rule md:border-t-0' : ''
                } ${i > 0 ? 'md:border-l md:border-rule' : ''}`}
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{stat.label}</p>
                <p className="mt-1 font-serif text-2xl leading-none tabular-nums text-ink">{stat.value}</p>
                <p className="mt-1 text-[11px] text-muted">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Shift runway — one detail only this product would have */}
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-2xl text-ink">Shift runway</h2>
                <p className="text-sm text-ink-soft">Output by hour · dot size shows units logged</p>
              </div>
              <p className="text-sm text-ink-soft">
                <span className="font-serif text-xl tabular-nums text-ink">{shiftTotal.toLocaleString()}</span>{' '}
                units across {hoursLogged} of 12 hours
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-rule bg-paper px-4 pb-4 pt-6">
              <div className="relative min-w-[540px]">
                <div className="absolute left-0 right-0 top-[22px] h-px bg-rule" />
                <div className="relative grid grid-cols-12">
                  {hourlyData.map((h, i) => {
                    const size = h.produced > 0 ? 10 + Math.round((h.produced / peakHour) * 24) : 8;
                    return (
                      <div key={h.hour} className="flex flex-col items-center gap-2.5">
                        <div className="flex h-11 w-full items-center justify-center">
                          <span
                            className={
                              h.produced > 0
                                ? 'rounded-full border border-lime-deep/20 bg-lime'
                                : 'rounded-full border border-rule bg-paper'
                            }
                            style={{ width: size, height: size }}
                            title={`${h.hour}: ${h.produced.toLocaleString()} units`}
                          />
                        </div>
                        <span className={`font-mono text-[11px] ${h.produced > 0 ? 'text-ink' : 'text-muted'}`}>
                          {h.produced > 0 ? h.produced.toLocaleString() : '—'}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
                          H{i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {unassigned > 0 && (
              <p className={`flex items-center gap-1.5 text-xs ${tones.behind.text}`}>
                <AlertTriangle size={12} />
                {unassigned} {unassigned === 1 ? 'line has' : 'lines have'} no active assignment — there is
                nothing to log against until one is assigned.
              </p>
            )}
          </section>

          {/* Tabbed detail — every view comes from the single overview request */}
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-serif text-2xl text-ink">Floor detail</h2>
                <p className="text-sm text-ink-soft">Customers, orders, branches and line scores for the day</p>
              </div>
              <div className={page.tabs}>
                {DASHBOARD_TABS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setTab(item.key)}
                    className={`${page.tab} ${tab === item.key ? page.tabActive : page.tabIdle}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-rule bg-paper">
              {tab === 'customers' && renderCustomers()}
              {tab === 'orders' && renderOrders()}
              {tab === 'branches' && renderBranches()}
              {tab === 'lines' && renderLines()}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
