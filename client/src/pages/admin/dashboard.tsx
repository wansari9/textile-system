import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { getLines, getLineCurrent } from '../../api/lines';
import { getDailyReport } from '../../api/reports';
import { getQuality } from '../../api/quality';
import { getStagesSummary } from '../../api/stages';
import { getHourlyProduction } from '../../api/production';
import { getBranches, getBranchSummary } from '../../api/branches';
import { Badge } from '../../components/ui';
import Card from '../../components/ui/Card';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  TrendingUp, Target, Activity, LayoutDashboard, RefreshCw,
} from 'lucide-react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const stagesName: Record<string, string> = { CUTTING: 'Cutting', PACKING: 'Packing', IRONING: 'Ironing' };

export default function Dashboard() {
  const [lines, setLines] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any[]>([]);
  const [stagesData, setStagesData] = useState<any[]>([]);
  const [branchesData, setBranchesData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (date: string) => {
    setLoading(true);
    const [reportRes, linesRes, qualityRes, stagesRes, hourlyRes] = await Promise.all([
      getDailyReport(date),
      getLines(),
      getQuality({ date }),
      getStagesSummary({ date }),
      getHourlyProduction(date),
    ]);
    if (qualityRes.success) setQualityData(qualityRes.data);
    if (stagesRes.success) setStagesData(stagesRes.data);
    if (hourlyRes.success) {
      const grouped: Record<number, number> = {};
      for (const r of hourlyRes.data || []) {
        grouped[r.hour_number] = (grouped[r.hour_number] || 0) + (r.qty_produced || 0);
      }
      setHourlyData(
        Array.from({ length: 12 }, (_, i) => ({
          hour: `H${i + 1}`,
          produced: grouped[i + 1] || 0,
        }))
      );
    }
    if (reportRes.success) setSummary(reportRes.data);
    if (!linesRes.success) { setLoading(false); return; }

    const byLine = (reportRes.data?.by_line || []) as any[];

    const enriched = await Promise.all(
      linesRes.data.map(async (line: any) => {
        const lineSummary = byLine.find((l: any) => l.line_id === line.line_id);
        try {
          const current = await getLineCurrent(line.line_id);
          const assign = current.data;
          return {
            id: line.line_id,
            name: line.line_name,
            product: assign.product_name,
            customer: assign.customer_name,
            produced: lineSummary?.total_produced ?? 0,
            target: assign.daily_target,
            defects: lineSummary?.total_defect ?? 0,
            status: line.status,
          };
        } catch {
          return {
            id: line.line_id,
            name: line.line_name,
            product: 'No active assignment',
            customer: '-',
            produced: lineSummary?.total_produced ?? 0,
            target: 0,
            defects: 0,
            status: line.status,
          };
        }
      })
    );
    setLines(enriched);

    const branchesRes = await getBranches();
    if (branchesRes.success) {
      const summaries = await Promise.all(
        branchesRes.data.map(async (branch: any) => {
          try {
            const s = await getBranchSummary(branch.branch_id);
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
      setBranchesData(summaries);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const totalProduced = summary?.total?.total_produced ?? 0;
  const totalTarget = summary?.total?.total_target ?? 0;
  const efficiency = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;
  const activeLines = lines.filter(l => l.status === 'ACTIVE').length;

  const stagesSummary = (stage: string) => {
    const items = stagesData.filter((s: any) => s.stage === stage);
    return items.reduce((sum: number, s: any) => sum + (s.qty_completed || 0), 0);
  };

  const barData = lines.filter(l => l.target > 0).slice(0, 20);

  const qualityPie = qualityData.map((q: any, i: number) => ({
    name: q.customer_name,
    value: q.pcs_checked || 0,
    color: COLORS[i % COLORS.length],
  }));

  const stagesChartData = ['CUTTING', 'PACKING', 'IRONING'].map(s => ({
    name: stagesName[s],
    completed: stagesSummary(s),
  }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-cool-gray mt-1">
            Production overview for <span className="font-medium text-slate">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="px-3 py-2 border border-linen rounded-lg text-sm bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand/40"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
          <button onClick={() => fetchData(selectedDate)} className="p-2 text-cool-gray hover:text-brand-dark hover:bg-brand-light rounded-lg transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-xs text-cool-gray uppercase tracking-wider mb-1 font-sans">
            <TrendingUp size={14} className="text-brand" />
            <span>Total Produced</span>
          </div>
          <p className="text-[32px] font-medium font-mono text-ink leading-tight">{totalProduced.toLocaleString()}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-cool-gray uppercase tracking-wider mb-1 font-sans">
            <Target size={14} className="text-loom-green" />
            <span>Total Target</span>
          </div>
          <p className="text-[32px] font-medium font-mono text-ink leading-tight">{totalTarget.toLocaleString()}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-cool-gray uppercase tracking-wider mb-1 font-sans">
            <Activity size={14} className="text-caution-amber" />
            <span>Efficiency Rate</span>
          </div>
          <p className={`text-[32px] font-medium font-mono leading-tight ${
            efficiency >= 100 ? 'text-loom-green' : efficiency >= 70 ? 'text-caution-amber' : 'text-defect-red'
          }`}>
            {efficiency}%
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-cool-gray uppercase tracking-wider mb-1 font-sans">
            <LayoutDashboard size={14} className="text-brand" />
            <span>Active Lines</span>
          </div>
          <p className="text-[32px] font-medium font-mono text-ink leading-tight">
            {activeLines}<span className="text-lg text-cool-gray font-normal font-sans"> / {lines.length}</span>
          </p>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production by Line */}
            <Card header={<h3 className="font-semibold text-ink">Production by Line</h3>}>
              {barData.length === 0 ? (
                <p className="text-sm text-cool-gray text-center py-8">No production data for this date.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                      />
                      <Legend />
                      <Bar dataKey="produced" name="Produced" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" name="Target" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Hourly Trend */}
            <Card header={<h3 className="font-semibold text-ink">Hourly Production Trend</h3>}>
              {hourlyData.every(d => d.produced === 0) ? (
                <p className="text-sm text-cool-gray text-center py-8">No hourly data for this date.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}
                      />
                      <Line type="monotone" dataKey="produced" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Second row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Process Stages */}
            <Card header={<h3 className="font-semibold text-ink">Process Stages</h3>}>
              {stagesChartData.every(d => d.completed === 0) ? (
                <p className="text-sm text-cool-gray text-center py-8">No stage data.</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stagesChartData} layout="vertical" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Quality Overview */}
            <Card header={<h3 className="font-semibold text-ink">Quality Overview</h3>}>
              {qualityPie.length === 0 ? (
                <p className="text-sm text-cool-gray text-center py-8">No quality data.</p>
              ) : (
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={qualityPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {qualityPie.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {qualityPie.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {qualityPie.map((q, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: q.color }} />
                      {q.name}: {q.value.toLocaleString()}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Branch Summary */}
          <Card header={
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Branch Summary</h3>
              <Badge status="on_target" size="sm">{branchesData.length} branches</Badge>
            </div>
          }>
            {branchesData.length === 0 ? (
              <p className="text-sm text-cool-gray text-center py-4">No branch data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-linen text-left text-xs text-cool-gray uppercase tracking-wider">
                      <th className="pb-2 pr-4 font-medium">Branch</th>
                      <th className="pb-2 pr-4 font-medium text-right">Target</th>
                      <th className="pb-2 pr-4 font-medium text-right">Produced</th>
                      <th className="pb-2 font-medium text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {branchesData.map((b: any) => (
                      <tr key={b.branch} className="hover:bg-greige transition-colors">
                        <td className="py-2.5 pr-4 font-medium text-ink">{b.branch}</td>
                        <td className="py-2.5 pr-4 text-right text-slate">{b.target.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-right text-slate">{b.actual.toLocaleString()}</td>
                        <td className={`py-2.5 text-right font-medium ${b.diff < 0 ? 'text-defect-red' : 'text-loom-green'}`}>
                          {b.diff > 0 ? '+' : ''}{b.diff.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Production Lines */}
          <Card header={
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Production Lines</h3>
              <Badge status="on_target" size="sm">{activeLines} active</Badge>
            </div>
          } padding="none">
            {lines.length === 0 ? (
              <p className="text-sm text-cool-gray text-center py-8">No lines configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-linen text-left text-xs text-cool-gray uppercase tracking-wider bg-greige/50">
                      <th className="px-5 py-3 font-medium">Line</th>
                      <th className="px-5 py-3 font-medium">Product / Customer</th>
                      <th className="px-5 py-3 font-medium text-right">Produced</th>
                      <th className="px-5 py-3 font-medium text-right">Target</th>
                      <th className="px-5 py-3 font-medium text-right">%</th>
                      <th className="px-5 py-3 font-medium text-right">Defects</th>
                      <th className="px-5 py-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lines.map(line => {
                      const pct = line.target > 0 ? Math.round((line.produced / line.target) * 100) : 0;
                      return (
                        <tr key={line.id} className="hover:bg-greige transition-colors">
                          <td className="px-5 py-3 font-medium text-ink">{line.name}</td>
                          <td className="px-5 py-3 text-slate">
                            <span className="block truncate max-w-40">{line.product}</span>
                            <span className="text-xs text-cool-gray">{line.customer}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-medium">{line.produced.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right text-slate">{line.target.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`font-medium ${pct >= 90 ? 'text-loom-green' : pct >= 70 ? 'text-caution-amber' : 'text-defect-red'}`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-slate">{line.defects}</td>
                          <td className="px-5 py-3 text-right">
                            <Badge status={line.status === 'ACTIVE' ? 'on_target' : line.status === 'MAINTENANCE' ? 'warning' : 'default'} size="sm">
                              {line.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Quality Table */}
          {qualityData.length > 0 && (
            <Card header={<h3 className="font-semibold text-ink">Quality Control Details</h3>} padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-linen text-left text-xs text-cool-gray uppercase tracking-wider bg-greige/50">
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium text-right">Checked</th>
                      <th className="px-5 py-3 font-medium text-right">Faults</th>
                      <th className="px-5 py-3 font-medium text-right">Passed</th>
                      <th className="px-5 py-3 font-medium text-right">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {qualityData.map((q: any) => {
                      const ok = q.pcs_checked - q.pcs_faults;
                      const rate = q.pcs_checked > 0 ? ((ok / q.pcs_checked) * 100).toFixed(1) : '0';
                      return (
                        <tr key={q.check_id || q.customer_id} className="hover:bg-greige transition-colors">
                          <td className="px-5 py-3 font-medium text-ink">{q.customer_name}</td>
                          <td className="px-5 py-3 text-right">{q.pcs_checked.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right text-defect-red font-medium">{q.pcs_faults}</td>
                          <td className="px-5 py-3 text-right">{ok.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right">
                            <Badge status={Number(rate) >= 95 ? 'on_target' : Number(rate) >= 80 ? 'warning' : 'critical'}>{rate}%</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
