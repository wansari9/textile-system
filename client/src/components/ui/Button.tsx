import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import Spinner from './Spinner';
import { button } from '../../design';

type Variant = keyof typeof button.variants;
type Size = keyof typeof button.sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${button.base} ${button.variants[variant]} ${button.sizes[size]} ${className}`}
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
