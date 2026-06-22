import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className="space-y-[6px]">
        {label && (
          <label htmlFor={inputId} className="block text-[12px] font-semibold text-cool-gray uppercase tracking-wider font-sans">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`w-full h-10 px-3 rounded-lg border text-sm font-sans transition-all duration-150 placeholder:text-cool-gray focus:outline-none focus:ring-2 disabled:bg-raw-cotton disabled:text-cool-gray ${
            error
              ? 'border-defect-red focus:ring-defect-red/40'
              : 'border-linen focus:ring-brand/40 focus:border-brand'
          } ${className}`}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-defect-red font-sans">{error}</p>}
        {helperText && !error && <p className="text-xs text-cool-gray font-sans">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
