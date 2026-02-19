import { useEffect, useRef } from 'react';

interface GeneralPortraitProps {
  name: string;
  faction?: string;
  rarity?: 'uncommon' | 'rare' | 'legendary' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 48, md: 80, lg: 120 };

const factionColors: Record<string, { bg: string; accent: string; dark: string }> = {
  wei: { bg: '#1e3a5f', accent: '#3b82f6', dark: '#0f1d30' },
  shu: { bg: '#1a3d2b', accent: '#22c55e', dark: '#0d1f16' },
  wu: { bg: '#3d1a1a', accent: '#ef4444', dark: '#1f0d0d' },
};

const rarityBorder: Record<string, string> = {
  uncommon: '#4ade80',
  rare: '#60a5fa',
  legendary: '#fbbf24',
};

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getFactionKey(faction?: string): string {
  if (!faction) return 'wei';
  const f = faction.toLowerCase();
  if (f.includes('shu') || f.includes('liu')) return 'shu';
  if (f.includes('wu') || f.includes('sun')) return 'wu';
  return 'wei';
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  name: string,
  factionKey: string,
  rarity: string,
) {
  const colors = factionColors[factionKey] ?? factionColors.wei;
  const hash = hashName(name);
  const dpr = window.devicePixelRatio || 1;

  ctx.save();
  ctx.scale(dpr, dpr);

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, colors.dark);
  bgGrad.addColorStop(0.5, colors.bg);
  bgGrad.addColorStop(1, colors.dark);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle pattern (hash-based)
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 12; i++) {
    const x = ((hash * (i + 1) * 7) % w);
    const y = ((hash * (i + 3) * 13) % h);
    const r = 2 + (hash * (i + 5)) % 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = colors.accent;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Warrior silhouette
  const cx = w / 2;
  const cy = h * 0.42;
  const scale = w / 80;

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - 10 * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fillStyle = colors.accent + '30';
  ctx.fill();
  ctx.strokeStyle = colors.accent + '60';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  // Helmet crest (varies by hash)
  const crestStyle = hash % 3;
  ctx.strokeStyle = colors.accent + '50';
  ctx.lineWidth = 1.5 * scale;
  if (crestStyle === 0) {
    // Plume
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18 * scale);
    ctx.quadraticCurveTo(cx + 6 * scale, cy - 28 * scale, cx + 2 * scale, cy - 32 * scale);
    ctx.stroke();
  } else if (crestStyle === 1) {
    // Horns
    ctx.beginPath();
    ctx.moveTo(cx - 6 * scale, cy - 16 * scale);
    ctx.lineTo(cx - 10 * scale, cy - 26 * scale);
    ctx.moveTo(cx + 6 * scale, cy - 16 * scale);
    ctx.lineTo(cx + 10 * scale, cy - 26 * scale);
    ctx.stroke();
  } else {
    // Crown points
    ctx.beginPath();
    ctx.moveTo(cx - 8 * scale, cy - 16 * scale);
    ctx.lineTo(cx - 4 * scale, cy - 24 * scale);
    ctx.lineTo(cx, cy - 18 * scale);
    ctx.lineTo(cx + 4 * scale, cy - 24 * scale);
    ctx.lineTo(cx + 8 * scale, cy - 16 * scale);
    ctx.stroke();
  }

  // Shoulders & body
  ctx.beginPath();
  ctx.moveTo(cx - 16 * scale, cy + 4 * scale);
  ctx.quadraticCurveTo(cx - 12 * scale, cy - 2 * scale, cx, cy - 2 * scale);
  ctx.quadraticCurveTo(cx + 12 * scale, cy - 2 * scale, cx + 16 * scale, cy + 4 * scale);
  ctx.lineTo(cx + 14 * scale, cy + 20 * scale);
  ctx.lineTo(cx - 14 * scale, cy + 20 * scale);
  ctx.closePath();
  ctx.fillStyle = colors.accent + '18';
  ctx.fill();
  ctx.strokeStyle = colors.accent + '40';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Shoulder guards
  ctx.fillStyle = colors.accent + '25';
  ctx.beginPath();
  ctx.ellipse(cx - 16 * scale, cy + 2 * scale, 6 * scale, 4 * scale, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + 16 * scale, cy + 2 * scale, 6 * scale, 4 * scale, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Name banner
  const bannerY = h - 16 * scale;
  const bannerGrad = ctx.createLinearGradient(0, bannerY - 8 * scale, 0, h);
  bannerGrad.addColorStop(0, 'transparent');
  bannerGrad.addColorStop(0.3, colors.dark + 'cc');
  bannerGrad.addColorStop(1, colors.dark + 'ee');
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(0, bannerY - 8 * scale, w, h - bannerY + 8 * scale);

  // Name text
  const fontSize = Math.max(8, Math.min(12, w / 7));
  ctx.font = `600 ${fontSize}px 'Cinzel', serif`;
  ctx.fillStyle = '#e5e5e5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const displayName = name.length > 12 ? name.slice(0, 11) + '…' : name;
  ctx.fillText(displayName, cx, bannerY + 2 * scale);

  // Rarity border
  const borderColor = rarityBorder[rarity] ?? rarityBorder.uncommon;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2 * scale;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // Corner ornaments
  const ornSize = 6 * scale;
  ctx.strokeStyle = borderColor + '80';
  ctx.lineWidth = 1.5 * scale;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(0, ornSize);
  ctx.lineTo(0, 0);
  ctx.lineTo(ornSize, 0);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - ornSize, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, ornSize);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(0, h - ornSize);
  ctx.lineTo(0, h);
  ctx.lineTo(ornSize, h);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - ornSize, h);
  ctx.lineTo(w, h);
  ctx.lineTo(w, h - ornSize);
  ctx.stroke();

  ctx.restore();
}

export function GeneralPortrait({
  name,
  faction,
  rarity = 'uncommon',
  size = 'md',
  className = '',
}: GeneralPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dim = sizeMap[size] ?? sizeMap.md;
  const aspectH = size === 'lg' ? dim * 1.33 : dim;
  const factionKey = getFactionKey(faction);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dim * dpr;
    canvas.height = aspectH * dpr;

    drawPortrait(ctx, dim, aspectH, name, factionKey, rarity);
  }, [name, factionKey, rarity, dim, aspectH]);

  return (
    <canvas
      ref={canvasRef}
      width={dim}
      height={aspectH}
      className={`rounded-lg ${className}`}
      style={{ width: dim, height: aspectH }}
    />
  );
}
