import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import Spinner from './Spinner';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm active:bg-brand-dark',
  secondary: 'bg-raw-cotton text-slate hover:bg-linen active:bg-thread border border-linen',
  outline: 'bg-surface-raised text-brand hover:bg-brand-light border border-brand/30 active:bg-brand-light',
  ghost: 'bg-transparent text-slate hover:bg-raw-cotton active:bg-linen',
  danger: 'bg-defect-red text-white hover:bg-defect-red/90 shadow-sm active:bg-defect-red',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 disabled:pointer-events-none font-sans ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
