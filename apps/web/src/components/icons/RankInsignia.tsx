interface RankInsigniaProps {
  tier: number;
  size?: number;
  className?: string;
}

const tierConfig: Record<number, { label: string; color: string; accent: string }> = {
  1: { label: 'I', color: '#6b7280', accent: '#9ca3af' },
  2: { label: 'II', color: '#78716c', accent: '#a8a29e' },
  3: { label: 'III', color: '#22c55e', accent: '#4ade80' },
  4: { label: 'IV', color: '#3b82f6', accent: '#60a5fa' },
  5: { label: 'V', color: '#8b5cf6', accent: '#a78bfa' },
  6: { label: 'VI', color: '#f59e0b', accent: '#fbbf24' },
  7: { label: 'VII', color: '#f59e0b', accent: '#fde68a' },
};

export function RankInsignia({ tier, size = 40, className = '' }: RankInsigniaProps) {
  const cfg = tierConfig[tier] ?? tierConfig[1];
  const isGeneral = tier === 7;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id={`rank-grad-${tier}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={cfg.color} />
            <stop offset="100%" stopColor={cfg.accent} />
          </linearGradient>
          {isGeneral && (
            <linearGradient id="gold-grad" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          )}
        </defs>

        {/* Shield base */}
        <path
          d="M24 4 L42 12 L42 28 Q42 40 24 46 Q6 40 6 28 L6 12 Z"
          fill={isGeneral ? 'url(#gold-grad)' : `url(#rank-grad-${tier})`}
          fillOpacity={isGeneral ? 0.3 : 0.15}
          stroke={cfg.color}
          strokeWidth="1.5"
        />

        {/* Tier number */}
        <text
          x="24" y={isGeneral ? '26' : '28'}
          textAnchor="middle"
          dominantBaseline="central"
          fill={cfg.accent}
          fontSize={isGeneral ? '11' : '13'}
          fontFamily="'Cinzel', serif"
          fontWeight="700"
        >
          {cfg.label}
        </text>

        {/* Stars for higher tiers */}
        {tier >= 3 && tier < 7 && (
          <circle cx="24" cy="12" r="2" fill={cfg.accent} fillOpacity="0.8" />
        )}
        {tier >= 5 && tier < 7 && (
          <>
            <circle cx="18" cy="14" r="1.5" fill={cfg.accent} fillOpacity="0.6" />
            <circle cx="30" cy="14" r="1.5" fill={cfg.accent} fillOpacity="0.6" />
          </>
        )}

        {/* General crown */}
        {isGeneral && (
          <>
            <path d="M16 10 L20 6 L24 10 L28 6 L32 10" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <circle cx="24" cy="6" r="1.5" fill="#fde68a" />
            {/* Laurel wreath */}
            <path d="M12 24 Q8 18 10 12" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.5" />
            <path d="M36 24 Q40 18 38 12" stroke="#fbbf24" strokeWidth="1" fill="none" opacity="0.5" />
          </>
        )}

        {/* Cross swords at tier 4+ */}
        {tier >= 4 && tier < 7 && (
          <>
            <line x1="14" y1="36" x2="22" y2="32" stroke={cfg.accent} strokeWidth="1" opacity="0.4" />
            <line x1="34" y1="36" x2="26" y2="32" stroke={cfg.accent} strokeWidth="1" opacity="0.4" />
          </>
        )}
      </svg>
    </div>
  );
}
