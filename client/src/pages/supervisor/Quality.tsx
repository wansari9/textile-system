import { useState, useEffect } from 'react';
import { getCustomers } from '../../api/customers';
import { postQuality } from '../../api/quality';
import { Button, Card, Input, Select } from '../../components/ui';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Quality() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [checked, setChecked] = useState(0);
  const [faults, setFaults] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    getCustomers().then(res => {
      if (res.success) setCustomers(res.data);
    }).catch(() => {});
  }, []);

  const passRate = checked > 0 ? (((checked - faults) / checked) * 100).toFixed(1) : '0';
  const passRateNum = Number(passRate);
  const passRateStatus = passRateNum >= 95 ? 'good' : passRateNum >= 85 ? 'amber' : 'bad';

  const handleSubmit = async () => {
    if (!customerId) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await postQuality({
        customer_id: Number(customerId),
        production_date: selectedDate,
        pcs_checked: checked,
        pcs_faults: faults,
      });
      if (res.success) {
        setMessage('Quality log submitted successfully!');
        setChecked(0);
        setFaults(0);
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-ink">Quality Control</h1>
          <p className="text-sm text-cool-gray mt-1">Enter total pieces checked and faults found for the day</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="px-3 py-2 border border-linen rounded-lg text-sm bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand/40"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
          message.includes('success') ? 'bg-loom-green-bg text-loom-green border border-loom-green/20' : 'bg-defect-red-bg text-defect-red border border-defect-red/20'
        }`}>
          {message.includes('success') ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {message}
        </div>
      )}

      <Card>
        <form className="space-y-5" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <Select label="Customer" value={customerId} onChange={e => setCustomerId(Number(e.target.value) || '')}
            options={customers.map((c: any) => ({ value: c.customer_id, label: c.customer_name }))}
            placeholder="Select customer" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Pieces Checked" type="number" value={checked} onChange={e => setChecked(Number(e.target.value))} />
            <Input label="Total Faults" type="number" value={faults} onChange={e => setFaults(Number(e.target.value))}
              className="border-defect-red focus:ring-defect-red/40" />
          </div>

          <div className="p-5 bg-raw-cotton rounded-xl border border-linen text-center">
            <p className="text-sm text-cool-gray font-medium mb-1 font-sans">Pass Rate</p>
            <p className={`text-4xl font-bold font-mono ${
              passRateStatus === 'good' ? 'text-loom-green' : passRateStatus === 'amber' ? 'text-caution-amber' : 'text-defect-red'
            }`}>
              {passRate}%
            </p>
            <div className="mt-3 w-full bg-linen rounded-full h-2.5 max-w-xs mx-auto">
              <div className={`h-2.5 rounded-full transition-all duration-300 ${
                passRateStatus === 'good' ? 'bg-loom-green' : passRateStatus === 'amber' ? 'bg-caution-amber' : 'bg-defect-red'
              }`}
                style={{ width: `${Math.min(passRateNum, 100)}%` }} />
            </div>
          </div>

          <Button type="submit" disabled={submitting || !customerId} loading={submitting} className="w-full" size="lg">
            Submit Quality Log
          </Button>
        </form>
      </Card>
    </div>
  );
}
