import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { field } from '../../design';

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
          <label htmlFor={selectId} className={field.label}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`${field.control(Boolean(error))} bg-surface-raised ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p id={errorId} className={field.error}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
