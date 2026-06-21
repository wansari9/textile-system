import { useRef, useCallback, useState, useEffect } from 'react';

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
      <div className="text-center py-12 text-text-muted">
        <p className="text-sm">No active lines with product assignments.</p>
      </div>
    );
  }

  const hourTargets = new Map(lines.map(l => [l.line_id, getHourTarget(l)]));
  const hourColCount = 12;

  const cellBg = (lineId: number, _hourIdx: number, value: number) => {
    const ht = hourTargets.get(lineId) || 0;
    if (ht === 0 || value === 0) return '';
    return value >= ht ? 'bg-success-50' : 'bg-danger-50';
  };

  return (
    <div className="space-y-3">
      {/* Line tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveLine(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeLine === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          All Lines
        </button>
        {lines.map(line => (
          <button
            key={line.line_id}
            onClick={() => setActiveLine(line.line_id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeLine === line.line_id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {line.line_name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-auto rounded-xl border border-border shadow-sm max-h-[70vh]">
        <table className="w-full bg-white text-xs">
          <thead>
            <tr className="bg-gray-50 sticky top-0 z-10">
              <th className="sticky left-0 z-20 bg-gray-50 px-2.5 py-2 border-b border-r border-border text-left font-semibold text-text-primary min-w-[70px]">Line</th>
              <th className="sticky left-[70px] z-20 bg-gray-50 px-2.5 py-2 border-b border-r border-border text-left font-semibold text-text-primary min-w-[90px]">Customer</th>
              <th className="sticky left-[160px] z-20 bg-gray-50 px-2.5 py-2 border-b border-r border-border text-left font-semibold text-text-primary min-w-[100px]">Style/Model</th>
              <th className="px-2 py-2 border-b border-r border-border text-center font-semibold text-text-primary min-w-[60px]">Workers<br/>Required</th>
              <th className="px-2 py-2 border-b border-r border-border text-center font-semibold text-text-primary min-w-[60px]">Workers<br/>Present</th>
              <th className="px-2 py-2 border-b border-r border-border text-center font-semibold text-text-primary min-w-[56px]">Day<br/>Target</th>
              <th className="px-2 py-2 border-b border-r border-border text-center font-semibold text-text-primary min-w-[56px]">Hour<br/>Target</th>
              {Array.from({ length: hourColCount }, (_, i) => (
                <th key={i} className="px-1.5 py-2 border-b border-r border-border text-center font-semibold text-text-primary min-w-[52px]">Hr {i + 1}</th>
              ))}
              <th className="px-2.5 py-2 border-b border-r border-border text-center font-semibold text-text-primary min-w-[64px] sticky right-[90px] z-20 bg-gray-50">Total</th>
              <th className="px-2.5 py-2 border-b border-r border-border text-center font-semibold text-text-primary min-w-[64px] sticky right-[26px] z-20 bg-gray-50">Diff</th>
              <th className="px-2.5 py-2 border-b text-left font-semibold text-text-primary min-w-[100px] sticky right-0 z-20 bg-gray-50">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.map(line => {
              const total = getTotal(line.line_id);
              const target = getTarget(line);
              const ht = getHourTarget(line);
              const wf = workforce[line.line_id] || { required: 0, present: 0, notes: '' };
              return (
                <tr key={line.line_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="sticky left-0 z-10 bg-white px-2.5 py-1.5 border-b border-r border-border font-semibold text-text-primary whitespace-nowrap">
                    {line.line_name}
                  </td>
                  <td className="sticky left-[70px] z-10 bg-white px-2.5 py-1.5 border-b border-r border-border text-text-secondary whitespace-nowrap">
                    {line.assignment?.customer_name || '-'}
                  </td>
                  <td className="sticky left-[160px] z-10 bg-white px-2.5 py-1.5 border-b border-r border-border text-text-secondary whitespace-nowrap">
                    {line.assignment?.product_name || '-'}
                  </td>

                  {/* Workforce */}
                  <td className="px-2 py-1.5 border-b border-r border-border text-center">
                    <input type="number" className="w-12 px-1 py-1 border border-border rounded text-center text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                      value={wf.required || ''}
                      onChange={e => onWorkforceUpdate(line.line_id, 'required', Number(e.target.value))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const next = document.getElementById(getInputId(line.line_id, colsBeforeHours)); next?.focus(); } }} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-r border-border text-center">
                    <input type="number" className="w-12 px-1 py-1 border border-border rounded text-center text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                      value={wf.present || ''}
                      onChange={e => onWorkforceUpdate(line.line_id, 'present', Number(e.target.value))} />
                  </td>

                  {/* Targets */}
                  <td className="px-2 py-1.5 border-b border-r border-border text-center font-medium text-text-primary">{target}</td>
                  <td className="px-2 py-1.5 border-b border-r border-border text-center text-text-muted">{ht}</td>

                  {/* Hour inputs */}
                  {Array.from({ length: hourColCount }, (_, i) => {
                    const hour = i + 1;
                    const val = entries[line.line_id]?.[hour];
                    const prod = val?.produced || 0;
                    const inputId = getInputId(line.line_id, colsBeforeHours + i);
                    return (
                      <td key={i} className={`px-1 py-1.5 border-b border-r border-border text-center ${cellBg(line.line_id, hour, prod)}`}>
                        <input
                          ref={el => registerInput(inputId, el)}
                          id={inputId}
                          type="number"
                          className="w-full px-1 py-1 border border-border rounded text-center text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                          placeholder="0"
                          value={val?.produced ?? ''}
                          onChange={e => onUpdate(line.line_id, hour, 'produced', Number(e.target.value))}
                          onKeyDown={e => handleKeyDown(e, line.line_id, colsBeforeHours + i)}
                        />
                      </td>
                    );
                  })}

                  {/* Total & Diff - sticky */}
                  <td className="sticky right-[90px] z-10 bg-white px-2.5 py-1.5 border-b border-r border-border text-center font-bold text-text-primary">
                    {total}
                  </td>
                  <td className={`sticky right-[26px] z-10 bg-white px-2.5 py-1.5 border-b border-r border-border text-center font-medium ${
                    total < target ? 'text-danger-600' : 'text-success-600'
                  }`}>
                    {total - target}
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-2.5 py-1.5 border-b text-left">
                    <input type="text" className="w-full px-1 py-1 border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40" placeholder="Add note..."
                      value={wf.notes}
                      onChange={e => onWorkforceUpdate(line.line_id, 'notes', e.target.value)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted">Use arrow keys or Enter to navigate between cells</p>
    </div>
  );
}
