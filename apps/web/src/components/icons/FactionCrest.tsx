interface FactionCrestProps {
  faction: 'wei' | 'shu' | 'wu' | string;
  size?: number;
  glow?: boolean;
  className?: string;
}

const factionConfig = {
  wei: { color: '#3b82f6', dark: '#1e40af', label: 'Wei' },
  shu: { color: '#22c55e', dark: '#15803d', label: 'Shu' },
  wu: { color: '#ef4444', dark: '#b91c1c', label: 'Wu' },
};

function getConfig(faction: string) {
  if (faction.toLowerCase().includes('wei') || faction.toLowerCase().includes('cao'))
    return factionConfig.wei;
  if (faction.toLowerCase().includes('shu') || faction.toLowerCase().includes('liu'))
    return factionConfig.shu;
  if (faction.toLowerCase().includes('wu') || faction.toLowerCase().includes('sun'))
    return factionConfig.wu;
  return factionConfig.wei;
}

/** Wei: Dragon motif */
function WeiCrest({ size, color, dark }: { size: number; color: string; dark: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="wei-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path d="M32 4 L56 16 L56 36 Q56 52 32 60 Q8 52 8 36 L8 16 Z"
        fill="url(#wei-grad)" fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Dragon silhouette */}
      <path d="M22 44 Q18 38 20 32 Q22 26 28 24 L32 20 L36 24 Q42 26 44 32 Q46 38 42 44"
        stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Dragon head detail */}
      <circle cx="28" cy="28" r="2" fill={color} />
      <circle cx="36" cy="28" r="2" fill={color} />
      {/* Horns */}
      <path d="M26 24 L22 16 M38 24 L42 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Whiskers */}
      <path d="M24 32 L16 30 M40 32 L48 30" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Shu: Phoenix motif */
function ShuCrest({ size, color, dark }: { size: number; color: string; dark: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="shu-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path d="M32 4 L56 16 L56 36 Q56 52 32 60 Q8 52 8 36 L8 16 Z"
        fill="url(#shu-grad)" fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Phoenix body */}
      <path d="M32 48 Q28 40 24 36 Q20 32 22 26 Q24 20 32 18 Q40 20 42 26 Q44 32 40 36 Q36 40 32 48Z"
        stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      {/* Wings spread */}
      <path d="M24 30 Q16 24 12 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M40 30 Q48 24 52 18" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Tail feathers */}
      <path d="M28 44 Q22 50 18 52 M32 48 Q32 54 32 56 M36 44 Q42 50 46 52"
        stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Eye */}
      <circle cx="32" cy="24" r="2" fill={color} />
      {/* Crown feathers */}
      <path d="M30 18 L28 12 M32 18 L32 10 M34 18 L36 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Wu: Tiger motif */
function WuCrest({ size, color, dark }: { size: number; color: string; dark: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="wu-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path d="M32 4 L56 16 L56 36 Q56 52 32 60 Q8 52 8 36 L8 16 Z"
        fill="url(#wu-grad)" fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Tiger head outline */}
      <path d="M20 36 Q20 24 26 20 Q30 18 32 18 Q34 18 38 20 Q44 24 44 36 Q44 44 32 48 Q20 44 20 36Z"
        stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
      {/* Ears */}
      <path d="M22 24 L18 14 L26 20" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <path d="M42 24 L46 14 L38 20" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      {/* Eyes */}
      <ellipse cx="27" cy="30" rx="2.5" ry="2" fill={color} />
      <ellipse cx="37" cy="30" rx="2.5" ry="2" fill={color} />
      {/* Nose */}
      <path d="M30 36 L32 38 L34 36" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Stripes */}
      <path d="M24 26 L20 24 M40 26 L44 24 M26 34 L22 36 M38 34 L42 36"
        stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function FactionCrest({ faction, size = 48, glow = false, className = '' }: FactionCrestProps) {
  const cfg = getConfig(faction);
  const glowStyle = glow ? { filter: `drop-shadow(0 0 8px ${cfg.color}40)` } : {};

  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={glowStyle}>
      {cfg === factionConfig.wei && <WeiCrest size={size} color={cfg.color} dark={cfg.dark} />}
      {cfg === factionConfig.shu && <ShuCrest size={size} color={cfg.color} dark={cfg.dark} />}
      {cfg === factionConfig.wu && <WuCrest size={size} color={cfg.color} dark={cfg.dark} />}
    </div>
  );
}
