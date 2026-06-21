interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 16, md: 24, lg: 36 };

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const px = sizeMap[size];
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
