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
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150 bg-white focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 ${
            error
              ? 'border-danger-500 focus:ring-danger-500/40'
              : 'border-gray-300 focus:ring-brand-500/40 focus:border-brand-500'
          } ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
