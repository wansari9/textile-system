import { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import {
  accents,
  fontSizes,
  uiFonts,
  page,
  type AccentId,
  type FontId,
  type FontSizeId,
} from '../../design';
import { getSessionUser } from '../../lib/session';
import {
  applyPreferences,
  loadPreferences,
  preloadFonts,
  resetPreferences,
  savePreferences,
  type UiPreferences,
} from '../../lib/preferences';

export default function Settings() {
  const user = getSessionUser();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<UiPreferences>(() => loadPreferences(user?.id));

  useEffect(() => {
    preloadFonts();
    const stored = loadPreferences(user?.id);
    setPrefs(stored);
    applyPreferences(stored);
  }, [user?.id]);

  const update = (patch: Partial<UiPreferences>) => {
    const next: UiPreferences = { ...prefs, ...patch };
    setPrefs(next);
    const applied = applyPreferences(next);
    savePreferences(user?.id, applied);
  };

  const handleReset = () => {
    const defaults = resetPreferences(user?.id);
    setPrefs(defaults);
    toast('success', 'Appearance reset to defaults');
  };

  return (
    <div className={page.shell}>
      <div className={page.header}>
        <div>
          <h1 className={page.title}>Settings</h1>
          <p className={page.subtitle}>
            Personalise your interface. These settings are saved in this browser only.
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw size={16} />
          Reset to defaults
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card header="Accent colour">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.keys(accents) as AccentId[]).map((id) => {
                const accent = accents[id];
                const selected = prefs.accent === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => update({ accent: id })}
                    aria-pressed={selected}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ink/20 ${
                      selected ? 'border-ink bg-canvas' : 'border-rule bg-paper hover:bg-raw-cotton'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-8 w-8 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: accent.base }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{accent.label}</span>
                      <span className="block text-[11px] text-muted">
                        {selected ? 'Selected' : 'Preview'}
                      </span>
                    </span>
                    {selected && <Check size={16} className="shrink-0 text-ink" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Accent colour changes buttons, navigation, badges and the dashboard highlight.
            </p>
          </Card>

          <Card header="Font">
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(uiFonts) as FontId[]).map((id) => {
                const font = uiFonts[id];
                const selected = prefs.font === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => update({ font: id })}
                    aria-pressed={selected}
                    className={`rounded-lg border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ink/20 ${
                      selected ? 'border-ink bg-canvas' : 'border-rule bg-paper hover:bg-raw-cotton'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink" style={{ fontFamily: font.stack }}>
                        {font.label}
                      </span>
                      {selected && <Check size={16} className="shrink-0 text-ink" />}
                    </span>
                    <span
                      className="mt-1 block text-[11px] text-muted"
                      style={{ fontFamily: font.stack }}
                    >
                      The quick brown fox jumps over 1,234 units.
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              The selected font replaces the UI typeface; headings and numeric columns keep their own faces.
            </p>
          </Card>

          <Card header="Font size">
            <div role="radiogroup" aria-label="Font size" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(fontSizes) as FontSizeId[]).map((id) => {
                const size = fontSizes[id];
                const selected = prefs.fontSize === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => update({ fontSize: id })}
                    className={`rounded-lg border px-3 py-2 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-ink/20 ${
                      selected ? 'border-ink bg-canvas' : 'border-rule bg-paper hover:bg-raw-cotton'
                    }`}
                  >
                    <span className="block text-sm font-medium text-ink">{size.label}</span>
                    <span className="block text-[11px] text-muted">{size.scale}%</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Font size scales text and spacing together so tables and controls stay aligned.
            </p>
          </Card>
        </div>

        <Card header="Preview" className="h-fit xl:sticky xl:top-20">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">Production overview</p>
              <p className="mt-1 text-xs text-muted">Line 4 · Today</p>
            </div>
            <div className="rounded-lg border border-rule bg-canvas p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Efficiency</span>
                <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-medium text-ink">
                  On target
                </span>
              </div>
              <p className="mt-2 font-serif text-2xl text-ink">4,340</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-rule">
                <div className="h-full w-3/4 rounded-full bg-lime" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">Secondary</Button>
            </div>
            <p className="text-xs text-muted">
              This preview uses the same tokens as the rest of the app.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
