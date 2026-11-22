import { spinner } from '../../design';

interface SpinnerProps {
  size?: keyof typeof spinner.sizes;
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const px = spinner.sizes[size];
  return (
    <svg
      className={`animate-spin ${className}`}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
