import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { field } from '../../design';

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
          <label htmlFor={inputId} className={field.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`${field.control(Boolean(error))} ${className}`}
          {...props}
        />
        {error && <p id={errorId} className={field.error}>{error}</p>}
        {helperText && !error && <p className={field.helper}>{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
