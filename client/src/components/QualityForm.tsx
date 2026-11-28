import { useState, useEffect } from 'react';
import { getCustomers } from '../api/customers';
import { postQuality } from '../api/quality';
import { Button, Card, Input, Select } from './ui';
import { CheckCircle2, XCircle } from 'lucide-react';
import { qualityTone, tones } from '../design';

interface QualityFormProps {
  date: string;
  onSaved?: () => void;
}

/**
 * Shared quality tally form. Used by the Quality page and by the Quality tab
 * on Daily Production so there is exactly one implementation.
 */
export default function QualityForm({ date, onSaved }: QualityFormProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [checked, setChecked] = useState(0);
  const [faults, setFaults] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getCustomers().then(res => {
      if (res.success) setCustomers(res.data);
    }).catch(() => {});
  }, []);

  const passRate = checked > 0 ? (((checked - faults) / checked) * 100).toFixed(1) : '0';
  const passRateNum = Number(passRate);
  const passTone = tones[qualityTone(passRateNum)];

  const handleSubmit = async () => {
    if (!customerId) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await postQuality({
        customer_id: Number(customerId),
        production_date: date,
        pcs_checked: checked,
        pcs_faults: faults,
      });
      if (res.success) {
        setMessage('Quality log submitted successfully!');
        setChecked(0);
        setFaults(0);
        onSaved?.();
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 border ${
          message.includes('success')
            ? `${tones.onTarget.soft} ${tones.onTarget.text} ${tones.onTarget.border}`
            : `${tones.behind.soft} ${tones.behind.text} ${tones.behind.border}`
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Pieces Checked" type="number" value={checked} onChange={e => setChecked(Number(e.target.value))} />
            <Input label="Total Faults" type="number" value={faults} onChange={e => setFaults(Number(e.target.value))} />
          </div>

          <div className="p-5 bg-raw-cotton rounded-xl border border-rule text-center">
            <p className="text-sm text-muted font-medium mb-1 font-sans">Pass Rate</p>
            <p className={`text-4xl font-bold font-mono ${passTone.text}`}>
              {passRate}%
            </p>
            <div className="mt-3 w-full bg-linen rounded-full h-2.5 max-w-xs mx-auto">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${passTone.fill}`}
                style={{ width: `${Math.min(passRateNum, 100)}%` }}
              />
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
