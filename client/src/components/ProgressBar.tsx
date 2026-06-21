

interface ProgressBarProps {
  actual: number;
  target: number;
}

export default function ProgressBar({ actual, target }: ProgressBarProps) {
  const percentage = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;
  
  let colorClass = 'bg-red-500';
  if (percentage >= 90) colorClass = 'bg-green-500';
  else if (percentage >= 70) colorClass = 'bg-yellow-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-gray-700">{percentage}%</span>
        <span className="text-gray-500">{actual} / {target}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}