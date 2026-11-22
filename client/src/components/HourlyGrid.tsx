import { useRef, useCallback, useState, useEffect } from 'react';
import { field, segmented, statusFor, tones } from '../design';

interface HourlyGridProps {
  lines: any[];
  entries: Record<string, Record<number, { produced: number; defect: number }>>;
  onUpdate: (lineId: number, hour: number, field: 'produced' | 'defect', value: number) => void;
  getTotal: (lineId: number) => number;
  workforce: Record<number, { required: number; present: number; notes: string }>;
  onWorkforceUpdate: (lineId: number, field: 'required' | 'present' | 'notes', value: any) => void;
}

export default function HourlyGrid({ lines, entries, onUpdate, getTotal, workforce, onWorkforceUpdate }: HourlyGridProps) {
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [focusCell, setFocusCell] = useState<{ lineId: number; col: number } | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const filteredLines = activeLine ? lines.filter(l => l.line_id === activeLine) : lines;

  const getTarget = (line: any) => line.assignment?.daily_target || 0;
  const getHourTarget = (line: any) => Math.round(getTarget(line) / 8);
  const colsBeforeHours = 7;

  const getInputId = (lineId: number, col: number) => `hourly-${lineId}-${col}`;

  const registerInput = useCallback((id: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(id, el);
    else inputRefs.current.delete(id);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, lineId: number, col: number) => {
    let next: { lineId: number; col: number } | null = null;
    const minCol = colsBeforeHours;
    const maxCol = colsBeforeHours + hourColCount - 1;
    switch (e.key) {
      case 'ArrowRight':
        if (col < maxCol) next = { lineId, col: col + 1 };
        break;
      case 'ArrowLeft':
        if (col > minCol) next = { lineId, col: col - 1 };
        break;
      case 'ArrowDown': {
        const idx = filteredLines.findIndex(l => l.line_id === lineId);
        if (idx < filteredLines.length - 1) next = { lineId: filteredLines[idx + 1].line_id, col };
        break;
      }
      case 'ArrowUp': {
        const idx = filteredLines.findIndex(l => l.line_id === lineId);
        if (idx > 0) next = { lineId: filteredLines[idx - 1].line_id, col };
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (col < maxCol) next = { lineId, col: col + 1 };
        break;
      }
    }
    if (next) {
      e.preventDefault();
      setFocusCell(next);
      const id = getInputId(next.lineId, next.col);
      setTimeout(() => inputRefs.current.get(id)?.focus(), 0);
    }
  };

  useEffect(() => {
    if (focusCell) {
      const id = getInputId(focusCell.lineId, focusCell.col);
      inputRefs.current.get(id)?.focus();
    }
  }, [focusCell]);

  if (lines.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-sm">No active lines with product assignments.</p>
      </div>
    );
  }

  const hourTargets = new Map(lines.map(l => [l.line_id, getHourTarget(l)]));
  const hourColCount = 12;

  const cellBg = (lineId: number, _hourIdx: number, value: number) => {
    const ht = hourTargets.get(lineId) || 0;
    if (ht === 0 || value === 0) return '';
    return statusFor((value / ht) * 100).soft;
  };

  return (
    <div className="space-y-3">
      {/* Line tabs */}
      <div className={segmented.group}>
        <button
          onClick={() => setActiveLine(null)}
          className={`${segmented.item} ${activeLine === null ? segmented.active : segmented.idle}`}
        >
          All Lines
        </button>
        {lines.map(line => (
          <button
            key={line.line_id}
            onClick={() => setActiveLine(line.line_id)}
            className={`${segmented.item} ${activeLine === line.line_id ? segmented.active : segmented.idle}`}
          >
            {line.line_name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-auto rounded-xl border border-rule shadow-card max-h-[70vh]">
        <table className="w-full bg-surface-raised text-xs">
          <thead>
            <tr className="bg-raw-cotton/50 sticky top-0 z-10">
              <th scope="col" className="sticky left-0 z-20 bg-raw-cotton/50 px-2.5 py-2 border-b border-r border-rule text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[70px] font-sans">Line</th>
              <th scope="col" className="sticky left-[70px] z-20 bg-raw-cotton/50 px-2.5 py-2 border-b border-r border-rule text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[90px] font-sans">Customer</th>
              <th scope="col" className="sticky left-[160px] z-20 bg-raw-cotton/50 px-2.5 py-2 border-b border-r border-rule text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[100px] font-sans">Style/Model</th>
              <th scope="col" className="px-2 py-2 border-b border-r border-rule text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[60px] font-sans">Workers<br/>Required</th>
              <th scope="col" className="px-2 py-2 border-b border-r border-rule text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[60px] font-sans">Workers<br/>Present</th>
              <th scope="col" className="px-2 py-2 border-b border-r border-rule text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[56px] font-sans">Day<br/>Target</th>
              <th scope="col" className="px-2 py-2 border-b border-r border-rule text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[56px] font-sans">Hour<br/>Target</th>
              {Array.from({ length: hourColCount }, (_, i) => (
                <th key={i} scope="col" className="px-1.5 py-2 border-b border-r border-rule text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[52px] font-sans">Hr {i + 1}</th>
              ))}
              <th scope="col" className="px-2.5 py-2 border-b border-r border-rule text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[64px] sticky right-[90px] z-20 bg-raw-cotton/50 font-sans">Total</th>
              <th scope="col" className="px-2.5 py-2 border-b border-r border-rule text-center text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[64px] sticky right-[26px] z-20 bg-raw-cotton/50 font-sans">Diff</th>
              <th scope="col" className="px-2.5 py-2 border-b text-left text-[11px] font-semibold text-muted uppercase tracking-[0.08em] min-w-[100px] sticky right-0 z-20 bg-raw-cotton/50 font-sans">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.map(line => {
              const total = getTotal(line.line_id);
              const target = getTarget(line);
              const ht = getHourTarget(line);
              const wf = workforce[line.line_id] || { required: 0, present: 0, notes: '' };
              return (
                <tr key={line.line_id} className="hover:bg-canvas/50 transition-colors">
                  <td className="sticky left-0 z-10 bg-surface-raised px-2.5 py-1.5 border-b border-r border-rule font-semibold text-ink whitespace-nowrap">
                    {line.line_name}
                  </td>
                  <td className="sticky left-[70px] z-10 bg-surface-raised px-2.5 py-1.5 border-b border-r border-rule text-ink-soft whitespace-nowrap">
                    {line.assignment?.customer_name || '-'}
                  </td>
                  <td className="sticky left-[160px] z-10 bg-surface-raised px-2.5 py-1.5 border-b border-r border-rule text-ink-soft whitespace-nowrap">
                    {line.assignment?.product_name || '-'}
                  </td>

                  {/* Workforce */}
                  <td className="px-2 py-1.5 border-b border-r border-rule text-center">
                    <input type="number" className={`w-12 ${field.compact}`}
                      value={wf.required || ''}
                      onChange={e => onWorkforceUpdate(line.line_id, 'required', Number(e.target.value))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const next = document.getElementById(getInputId(line.line_id, colsBeforeHours)); next?.focus(); } }} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-r border-rule text-center">
                    <input type="number" className={`w-12 ${field.compact}`}
                      value={wf.present || ''}
                      onChange={e => onWorkforceUpdate(line.line_id, 'present', Number(e.target.value))} />
                  </td>

                  {/* Targets */}
                  <td className="px-2 py-1.5 border-b border-r border-rule text-center font-medium text-ink">{target}</td>
                  <td className="px-2 py-1.5 border-b border-r border-rule text-center text-muted">{ht}</td>

                  {/* Hour inputs */}
                  {Array.from({ length: hourColCount }, (_, i) => {
                    const hour = i + 1;
                    const val = entries[line.line_id]?.[hour];
                    const prod = val?.produced || 0;
                    const inputId = getInputId(line.line_id, colsBeforeHours + i);
                    return (
                      <td key={i} className={`px-1 py-1.5 border-b border-r border-rule text-center ${cellBg(line.line_id, hour, prod)}`}>
                        <input
                          ref={el => registerInput(inputId, el)}
                          id={inputId}
                          type="number"
                          className={`w-full ${field.compact}`}
                          placeholder="0"
                          value={val?.produced ?? ''}
                          onChange={e => onUpdate(line.line_id, hour, 'produced', Number(e.target.value))}
                          onKeyDown={e => handleKeyDown(e, line.line_id, colsBeforeHours + i)}
                        />
                      </td>
                    );
                  })}

                  {/* Total & Diff - sticky */}
                  <td className="sticky right-[90px] z-10 bg-surface-raised px-2.5 py-1.5 border-b border-r border-rule text-center font-bold text-ink">
                    {total}
                  </td>
                  <td className={`sticky right-[26px] z-10 bg-surface-raised px-2.5 py-1.5 border-b border-r border-rule text-center font-medium ${
                    total < target ? tones.behind.text : tones.onTarget.text
                  }`}>
                    {total - target}
                  </td>
                  <td className="sticky right-0 z-10 bg-surface-raised px-2.5 py-1.5 border-b text-left">
                    <input type="text" className={`w-full ${field.compact} text-left`} placeholder="Add note..."
                      value={wf.notes}
                      onChange={e => onWorkforceUpdate(line.line_id, 'notes', e.target.value)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Running total banner */}
      {filteredLines.length > 0 && (() => {
        const totalProduced = filteredLines.reduce((s, l) => s + getTotal(l.line_id), 0);
        const totalTarget = filteredLines.reduce((s, l) => s + getTarget(l), 0);
        const pct = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;
        const remaining = totalTarget - totalProduced;
        const hrsLeft = Math.max(0, hourColCount - new Date().getHours());
        const needPerHr = hrsLeft > 0 ? Math.ceil(Math.max(0, remaining) / hrsLeft) : 0;
        return (
          <div className={`${tones.onTarget.soft} border ${tones.onTarget.border} rounded-lg px-4 py-2.5 text-sm font-sans flex items-center gap-2`} aria-live="polite">
            <span className="font-semibold text-ink">Total today:</span>
            <span className="font-mono font-medium text-ink">{totalProduced.toLocaleString()}</span>
            <span className="text-muted">/</span>
            <span className="font-mono text-ink">{totalTarget.toLocaleString()}</span>
            <span className={`font-mono font-medium ${statusFor(pct).text}`}>
              ({pct}%)
            </span>
            {remaining > 0 && hrsLeft > 0 && (
              <span className="text-muted ml-2">
                → needs <span className="font-mono font-medium text-ink">{needPerHr.toLocaleString()}</span>/hr to meet target
              </span>
            )}
          </div>
        );
      })()}
      <p className="text-xs text-muted">Use arrow keys or Enter to navigate between cells</p>
    </div>
  );
}
