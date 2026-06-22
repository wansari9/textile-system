import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${selectId}-error` : undefined;
    return (
      <div className="space-y-[6px]">
        {label && (
          <label htmlFor={selectId} className="block text-[12px] font-semibold text-cool-gray uppercase tracking-wider font-sans">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`w-full h-10 px-3 rounded-lg border text-sm font-sans bg-surface-raised transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-raw-cotton disabled:text-cool-gray ${
            error
              ? 'border-defect-red focus:ring-defect-red/40'
              : 'border-linen focus:ring-brand/40 focus:border-brand'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p id={errorId} className="text-xs text-defect-red font-sans">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
