import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${textareaId}-error` : undefined;
    return (
      <div className="space-y-[6px]">
        {label && (
          <label htmlFor={textareaId} className="block text-[12px] font-semibold text-cool-gray uppercase tracking-wider font-sans">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`w-full px-3 py-2 rounded-lg border text-sm font-sans transition-all duration-150 placeholder:text-cool-gray focus:outline-none focus:ring-2 disabled:bg-raw-cotton disabled:text-cool-gray ${
            error
              ? 'border-defect-red focus:ring-defect-red/40'
              : 'border-linen focus:ring-brand/40 focus:border-brand'
          } ${className}`}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-defect-red font-sans">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
