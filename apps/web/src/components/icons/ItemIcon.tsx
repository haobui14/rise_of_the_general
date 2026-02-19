interface ItemIconProps {
  type: 'weapon' | 'armor' | string;
  rarity?: 'common' | 'rare' | 'epic' | 'mythic' | string;
  size?: number;
  className?: string;
}

const rarityGlow: Record<string, string> = {
  common: 'none',
  rare: 'drop-shadow(0 0 4px rgba(96,165,250,0.4))',
  epic: 'drop-shadow(0 0 6px rgba(167,139,250,0.5))',
  legendary: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))',
  mythic: 'drop-shadow(0 0 10px rgba(245,158,11,0.6))',
};

const rarityStroke: Record<string, string> = {
  common: '#9ca3af',
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#fbbf24',
  mythic: '#f59e0b',
};

function WeaponSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Blade */}
      <path d="M8 24 L22 10 L26 6 L24 10 L26 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Blade edge */}
      <path d="M22 10 L20 14 L16 16 L8 24" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      {/* Guard */}
      <path d="M14 18 L18 22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Handle wrap */}
      <path d="M10 22 L6 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Pommel */}
      <circle cx="5" cy="27" r="1.5" fill={color} fillOpacity="0.6" />
    </svg>
  );
}

function ArmorSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Chestplate outline */}
      <path d="M10 8 Q10 4 16 4 Q22 4 22 8 L24 14 L24 22 Q24 26 16 28 Q8 26 8 22 L8 14 Z"
        stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      {/* Shoulder guards */}
      <path d="M10 8 L4 12 L6 14 L10 12" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
      <path d="M22 8 L28 12 L26 14 L22 12" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
      {/* Center line */}
      <line x1="16" y1="8" x2="16" y2="24" stroke={color} strokeWidth="1" opacity="0.3" />
      {/* Cross detail */}
      <line x1="12" y1="16" x2="20" y2="16" stroke={color} strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

export function ItemIcon({ type, rarity = 'common', size = 32, className = '' }: ItemIconProps) {
  const color = rarityStroke[rarity] ?? rarityStroke.common;
  const filter = rarityGlow[rarity] ?? 'none';

  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ filter }}>
      {type === 'weapon' ? (
        <WeaponSVG size={size} color={color} />
      ) : (
        <ArmorSVG size={size} color={color} />
      )}
    </div>
  );
}
