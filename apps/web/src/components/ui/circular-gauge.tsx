interface CircularGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function CircularGauge({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = 'var(--primary)',
  trackColor = 'oklch(0.269 0 0)',
  label,
  showValue = true,
  className = '',
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference * (1 - percentage);

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      {showValue && (
        <span className="text-xs font-bold text-foreground" style={{ marginTop: -(size / 2 + 6) + 'px', position: 'relative' }}>
          {Math.round(value)}
        </span>
      )}
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
    </div>
  );
}
