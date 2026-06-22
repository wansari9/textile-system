import { useState, useEffect } from 'react';
import ReportTable from '../../components/ReportTable';
import { getDailyReport, getWeeklyReport, getCompanyReport } from '../../api/reports';
import { Card } from '../../components/ui';

type Tab = 'daily' | 'weekly' | 'company';

export default function Reports() {
  const [tab, setTab] = useState<Tab>('daily');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);
    const fetchData = tab === 'daily'
      ? getDailyReport(selectedDate)
      : tab === 'weekly'
        ? getWeeklyReport(
            new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
            selectedDate
          )
        : getCompanyReport({ date: selectedDate });
    fetchData.then(res => res.success && setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [tab, selectedDate]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'daily', label: 'Daily Report' },
    { key: 'weekly', label: 'Weekly Report' },
    { key: 'company', label: 'All Companies' },
  ];

  const renderContent = () => {
    if (loading) return <p className="text-sm text-cool-gray text-center py-8">Loading...</p>;
    if (!data) return <p className="text-sm text-cool-gray text-center py-8">No data available.</p>;

    if (tab === 'daily') {
      const total = (data as any)?.total;
      const byLine = (data as any)?.by_line || [];
      return (
        <div className="space-y-6">
          {total && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-greige p-4 rounded-lg border border-linen">
                <p className="text-sm text-cool-gray">Total Produced</p>
                <p className="text-2xl font-bold text-ink">{total.total_produced?.toLocaleString()}</p>
              </div>
              <div className="bg-greige p-4 rounded-lg border border-linen">
                <p className="text-sm text-cool-gray">Total Target</p>
                <p className="text-2xl font-bold text-ink">{total.total_target?.toLocaleString()}</p>
              </div>
              <div className="bg-greige p-4 rounded-lg border border-linen">
                <p className="text-sm text-cool-gray">Efficiency Rate</p>
                <p className="text-2xl font-bold text-ink">{total.efficiency_pct}%</p>
              </div>
            </div>
          )}
          <ReportTable
            title="Per-Line Breakdown"
            columns={[
              { header: 'Line', accessor: 'line_name' },
              { header: 'Product', accessor: 'product_name' },
              { header: 'Customer', accessor: 'customer_name' },
              { header: 'Total Produced', accessor: 'total_produced' },
              { header: 'Total Faults', accessor: 'total_defect' },
              { header: 'Daily Target', accessor: 'daily_target' },
              { header: 'Efficiency Rate', accessor: 'pct_of_target' },
            ]}
            data={byLine}
          />
        </div>
      );
    }

    if (tab === 'weekly') {
      return (
        <ReportTable
          title="Weekly Summary"
          columns={[
            { header: 'Week', accessor: 'week_start' },
            { header: 'Line', accessor: 'line_name' },
            { header: 'Product', accessor: 'product_name' },
            { header: 'Customer', accessor: 'customer_name' },
            { header: 'Total Produced', accessor: 'total_produced' },
            { header: 'Total Faults', accessor: 'total_defect' },
            { header: 'Daily Target', accessor: 'total_target' },
          ]}
          data={Array.isArray(data) ? data : []}
        />
      );
    }

    if (tab === 'company') {
      const rows = Array.isArray(data) ? data : [];
      return (
        <ReportTable
          title="Company Daily Total"
          columns={[
            { header: 'Date', accessor: 'production_date' },
            { header: 'Total Produced', accessor: 'total_produced' },
            { header: 'Total Target', accessor: 'total_target' },
          ]}
          data={rows}
        />
      );
    }

    return null;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-ink">Production Reports</h1>
          <p className="text-sm text-cool-gray mt-1">View daily, weekly, and company-wide production reports</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="px-3 py-2 border border-linen rounded-lg text-sm bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand/40"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-1 border-b border-linen pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.key ? 'bg-surface-raised border border-linen border-b-white text-brand-dark -mb-px' : 'text-cool-gray hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {renderContent()}
      </Card>
    </div>
  );
}
