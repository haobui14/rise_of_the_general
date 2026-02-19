interface TroopIconProps {
  type: 'infantry' | 'cavalry' | 'archer' | string;
  size?: number;
  color?: string;
  className?: string;
}

function InfantrySVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Shield */}
      <path d="M10 12 L10 28 Q10 34 18 36 L18 12 Z"
        stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      {/* Shield emblem line */}
      <line x1="14" y1="18" x2="14" y2="30" stroke={color} strokeWidth="1" opacity="0.3" />
      {/* Spear */}
      <line x1="28" y1="6" x2="28" y2="36" stroke={color} strokeWidth="1.5" />
      {/* Spear tip */}
      <path d="M25 6 L28 2 L31 6 Z" fill={color} />
      {/* Helmet */}
      <circle cx="22" cy="14" r="4" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      {/* Crest */}
      <path d="M22 10 L22 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CavalrySVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Horse body */}
      <path d="M8 28 Q8 22 14 20 L28 18 Q34 18 36 22 L36 28"
        stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
      {/* Horse legs */}
      <line x1="12" y1="28" x2="10" y2="36" stroke={color} strokeWidth="1.5" />
      <line x1="18" y1="28" x2="16" y2="36" stroke={color} strokeWidth="1.5" />
      <line x1="30" y1="26" x2="28" y2="36" stroke={color} strokeWidth="1.5" />
      <line x1="34" y1="26" x2="36" y2="36" stroke={color} strokeWidth="1.5" />
      {/* Horse head */}
      <path d="M8 28 Q4 26 4 22 Q4 18 8 16" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Ear */}
      <path d="M7 17 L5 12" stroke={color} strokeWidth="1" strokeLinecap="round" />
      {/* Rider */}
      <circle cx="22" cy="12" r="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      {/* Lance */}
      <line x1="26" y1="4" x2="18" y2="18" stroke={color} strokeWidth="1.5" />
      <path d="M25 4 L27 2 L28 5" fill={color} />
    </svg>
  );
}

function ArcherSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Bow */}
      <path d="M12 8 Q4 20 12 32" stroke={color} strokeWidth="2" fill="none" />
      {/* Bowstring */}
      <line x1="12" y1="8" x2="12" y2="32" stroke={color} strokeWidth="1" opacity="0.5" />
      {/* Arrow */}
      <line x1="12" y1="20" x2="34" y2="20" stroke={color} strokeWidth="1.5" />
      {/* Arrowhead */}
      <path d="M34 20 L30 17 L30 23 Z" fill={color} />
      {/* Fletching */}
      <path d="M14 18 L12 20 L14 22" stroke={color} strokeWidth="1" fill="none" />
      {/* Helmet */}
      <circle cx="22" cy="10" r="3.5" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      {/* Quiver */}
      <rect x="26" y="8" width="3" height="10" rx="1" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.1" />
      <line x1="27" y1="6" x2="27" y2="8" stroke={color} strokeWidth="1" />
      <line x1="28.5" y1="5" x2="28.5" y2="8" stroke={color} strokeWidth="1" />
    </svg>
  );
}

export function TroopIcon({ type, size = 40, color = '#d4a574', className = '' }: TroopIconProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {type === 'infantry' && <InfantrySVG size={size} color={color} />}
      {type === 'cavalry' && <CavalrySVG size={size} color={color} />}
      {type === 'archer' && <ArcherSVG size={size} color={color} />}
    </div>
  );
}
