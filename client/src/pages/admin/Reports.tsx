import { useState, useEffect } from 'react';
import ReportTable from '../../components/ReportTable';
import { getDailyReport, getWeeklyReport, getCompanyReport, type ReportSort, type SortDirection } from '../../api/reports';
import { getOrders } from '../../api/orders';
import { Card } from '../../components/ui';
import { page } from '../../design';
import { GENDER_LABELS } from '../../domain';
import { toISODate } from '../../lib/date';

type Tab = 'daily' | 'weekly' | 'company' | 'orders';

interface SortState {
  key: string;
  dir: SortDirection;
}

const genderLabel = (value: any) =>
  GENDER_LABELS[value as keyof typeof GENDER_LABELS] ?? value ?? '—';

export default function Reports() {
  const [tab, setTab] = useState<Tab>('daily');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  // Kept per tab so a sort choice survives switching tab or changing the date.
  const [sorts, setSorts] = useState<Record<Tab, SortState | null>>({
    daily: null,
    weekly: null,
    company: null,
    orders: { key: 'order_no', dir: 'asc' },
  });

  useEffect(() => {
    getCompanyReport({}).then(res => {
      if (res.success && res.data?.length) {
        setSelectedDate(String(res.data[0].production_date).split('T')[0]);
      }
    }).catch(() => {});
  }, []);

  const sort = sorts[tab];

  useEffect(() => {
    setLoading(true);
    setData(null);

    let request: Promise<any>;
    if (tab === 'daily') {
      request = getDailyReport(
        selectedDate,
        (sort?.key as ReportSort | undefined),
        sort?.dir
      );
    } else if (tab === 'weekly') {
      request = getWeeklyReport(
        toISODate(new Date(new Date(selectedDate).getTime() - 7 * 86400000)),
        selectedDate,
        (sort?.key as ReportSort | undefined),
        sort?.dir
      );
    } else if (tab === 'orders') {
      request = getOrders({ sort: sort?.key, dir: sort?.dir });
    } else {
      request = getCompanyReport({ date: selectedDate });
    }

    request
      .then(res => res.success && setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, selectedDate, sort]);

  const handleSort = (key: string) => {
    setSorts(prev => {
      const current = prev[tab];
      const dir: SortDirection = current?.key === key && current.dir === 'asc' ? 'desc' : 'asc';
      return { ...prev, [tab]: { key, dir } };
    });
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'daily', label: 'Daily Report' },
    { key: 'weekly', label: 'Weekly Report' },
    { key: 'company', label: 'All Companies' },
    { key: 'orders', label: 'Orders' },
  ];

  const renderContent = () => {
    if (loading) return <p className="text-sm text-muted text-center py-8">Loading...</p>;
    if (!data) return <p className="text-sm text-muted text-center py-8">No data available.</p>;

    if (tab === 'daily') {
      const total = (data as any)?.total;
      const byLine = (data as any)?.by_line || [];
      return (
        <div className="space-y-6">
          {total && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-canvas p-4 rounded-lg border border-rule">
                <p className="text-sm text-muted">Total Produced</p>
                <p className="text-2xl font-serif text-ink">{total.total_produced?.toLocaleString()}</p>
              </div>
              <div className="bg-canvas p-4 rounded-lg border border-rule">
                <p className="text-sm text-muted">Total Target</p>
                <p className="text-2xl font-serif text-ink">{total.total_target?.toLocaleString()}</p>
              </div>
              <div className="bg-canvas p-4 rounded-lg border border-rule">
                <p className="text-sm text-muted">Efficiency Rate</p>
                <p className="text-2xl font-serif text-ink">{total.efficiency_pct}%</p>
              </div>
            </div>
          )}
          <ReportTable
            title="Per-Line Breakdown"
            sort={sort}
            onSort={handleSort}
            columns={[
              { header: 'Line', accessor: 'line_name', sortKey: 'line' },
              { header: 'Order #', accessor: 'order_no', sortKey: 'order_no' },
              { header: 'Product', accessor: 'product_name', sortKey: 'product' },
              { header: 'Customer', accessor: 'customer_name', sortKey: 'customer' },
              { header: 'Gender', accessor: 'gender', sortKey: 'gender', format: genderLabel },
              { header: 'Total Produced', accessor: 'total_produced', sortKey: 'produced' },
              { header: 'Total Faults', accessor: 'total_defect', sortKey: 'defects' },
              { header: 'Daily Target', accessor: 'daily_target', sortKey: 'target' },
              { header: 'Efficiency Rate', accessor: 'pct_of_target', sortKey: 'pct' },
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
          sort={sort}
          onSort={handleSort}
          columns={[
            { header: 'Week', accessor: 'week_start', sortKey: 'date' },
            { header: 'Line', accessor: 'line_name', sortKey: 'line' },
            { header: 'Order #', accessor: 'order_no', sortKey: 'order_no' },
            { header: 'Product', accessor: 'product_name', sortKey: 'product' },
            { header: 'Customer', accessor: 'customer_name', sortKey: 'customer' },
            { header: 'Gender', accessor: 'gender', sortKey: 'gender', format: genderLabel },
            { header: 'Total Produced', accessor: 'total_produced', sortKey: 'produced' },
            { header: 'Total Faults', accessor: 'total_defect', sortKey: 'defects' },
            { header: 'Daily Target', accessor: 'total_target', sortKey: 'target' },
          ]}
          data={Array.isArray(data) ? data : []}
        />
      );
    }

    if (tab === 'orders') {
      return (
        <ReportTable
          title="Orders"
          sort={sort}
          onSort={handleSort}
          columns={[
            { header: 'Order #', accessor: 'order_no', sortKey: 'order_no' },
            { header: 'Order', accessor: 'product_name', sortKey: 'product' },
            { header: 'Customer', accessor: 'customer_name', sortKey: 'customer' },
            { header: 'Gender', accessor: 'gender', sortKey: 'gender', format: genderLabel },
            { header: 'Quantity', accessor: 'order_quantity', sortKey: 'quantity' },
            { header: 'Daily Target', accessor: 'daily_target', sortKey: 'target' },
            { header: 'Produced', accessor: 'produced_to_date', sortKey: 'produced' },
            { header: 'Progress %', accessor: 'pct_complete', sortKey: 'pct' },
            { header: 'Status', accessor: 'status', sortKey: 'status' },
          ]}
          data={Array.isArray(data) ? data : []}
        />
      );
    }

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
  };

  return (
    <div className={page.shell}>
      <div className={page.header}>
        <div>
          <h1 className={page.title}>Production Reports</h1>
          <p className={page.subtitle}>View daily, weekly, company-wide and order-level reports</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className={page.dateInput}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      <div className={page.tabs}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`${page.tab} ${tab === t.key ? page.tabActive : page.tabIdle}`}
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
