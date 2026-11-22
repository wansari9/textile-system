import type { TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { field } from '../../design';

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
          <label htmlFor={textareaId} className={field.label}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`${field.control(Boolean(error))} h-auto py-2 ${className}`}
          {...props}
        />
        {error && <p id={errorId} className={field.error}>{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
