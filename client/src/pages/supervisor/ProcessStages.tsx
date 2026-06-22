import { useState, useEffect } from 'react';
import { getProducts } from '../../api/products';
import { postStage } from '../../api/stages';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { Save } from 'lucide-react';

export default function ProcessStages() {
  const [products, setProducts] = useState<any[]>([]);
  const [stages, setStages] = useState<Record<number, { cutting: number; ironing: number; packing: number }>>({});
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    getProducts({ status: 'ACTIVE' }).then(res => {
      if (res.success) setProducts(res.data);
    }).catch(() => {});
  }, []);

  const updateStage = (productId: number, stage: 'cutting' | 'ironing' | 'packing', value: number) => {
    setStages(prev => ({
      ...prev,
      [productId]: { ...prev[productId] || { cutting: 0, ironing: 0, packing: 0 }, [stage]: value },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    const stageMap: Record<string, string> = { cutting: 'CUTTING', ironing: 'IRONING', packing: 'PACKING' };
    for (const product of products) {
      const s = stages[product.product_id];
      if (!s) continue;
      for (const [key, stageName] of Object.entries(stageMap)) {
        const qty = (s as any)[key];
        if (qty > 0) {
          try {
            await postStage({ stage: stageName, product_id: product.product_id, production_date: selectedDate, qty_completed: qty });
          } catch (e) {
            console.error(`Failed to save ${stageName} for ${product.product_name}`, e);
          }
        }
      }
    }
    setSaving(false);
    toast('success', 'Stage data saved');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-ink">Process Stages</h1>
          <p className="text-sm text-cool-gray mt-1">Log Cutting, Packing, and Ironing totals</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="px-3 py-2 border border-linen rounded-lg text-sm bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand/40"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)} />
          <Button onClick={saveAll} disabled={saving} loading={saving}>
            <Save size={16} />
            Save All
          </Button>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-linen text-left text-xs text-cool-gray uppercase tracking-wider bg-greige/50">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium text-center">Cutting</th>
                <th className="px-5 py-3 font-medium text-center">Ironing</th>
                <th className="px-5 py-3 font-medium text-center">Packing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-cool-gray">No active products.</td>
                </tr>
              ) : (
                products.map((prod: any) => (
                  <tr key={prod.product_id} className="hover:bg-greige transition-colors">
                    <td className="px-5 py-3 font-medium text-ink">{prod.product_name}</td>
                    <td className="px-5 py-3 text-center">
                      <input type="number" className="w-20 px-2 py-1.5 border border-linen rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" placeholder="0"
                        value={stages[prod.product_id]?.cutting ?? ''}
                        onChange={e => updateStage(prod.product_id, 'cutting', Number(e.target.value))} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <input type="number" className="w-20 px-2 py-1.5 border border-linen rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" placeholder="0"
                        value={stages[prod.product_id]?.ironing ?? ''}
                        onChange={e => updateStage(prod.product_id, 'ironing', Number(e.target.value))} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <input type="number" className="w-20 px-2 py-1.5 border border-linen rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" placeholder="0"
                        value={stages[prod.product_id]?.packing ?? ''}
                        onChange={e => updateStage(prod.product_id, 'packing', Number(e.target.value))} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
