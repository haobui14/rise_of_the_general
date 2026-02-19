import { useEffect, useRef, useState, useCallback } from 'react';
import type { ITerritory, TerritoryGeneralSummary } from '@rotg/shared-types';

interface WorldMapCanvasProps {
  territories: ITerritory[];
  generalsByTerritory: Record<string, TerritoryGeneralSummary[]>;
  playerFactionId?: string;
  onTerritoryClick: (territory: ITerritory) => void;
  className?: string;
}

// Pre-defined geographic positions for 18 territories (normalized 0-1)
const TERRITORY_POSITIONS: Record<string, { x: number; y: number }> = {
  // North
  "Luoyang":       { x: 0.45, y: 0.15 },
  "Ye":            { x: 0.55, y: 0.08 },
  "Chang'an":      { x: 0.25, y: 0.18 },
  "Bingzhou":      { x: 0.42, y: 0.03 },
  "Liangzhou":     { x: 0.10, y: 0.12 },
  "Youzhou":       { x: 0.72, y: 0.05 },
  // Central
  "Jing Province": { x: 0.38, y: 0.48 },
  "Runan":         { x: 0.55, y: 0.30 },
  "Nanyang":       { x: 0.40, y: 0.35 },
  "Xuzhou":        { x: 0.68, y: 0.22 },
  "Yangzhou":      { x: 0.75, y: 0.38 },
  "Jianye":        { x: 0.70, y: 0.50 },
  // South
  "Yizhou":        { x: 0.18, y: 0.58 },
  "Hanzhong":      { x: 0.22, y: 0.38 },
  "Jiangxia":      { x: 0.55, y: 0.58 },
  "Guilin":        { x: 0.48, y: 0.75 },
  "Nanhai":        { x: 0.65, y: 0.82 },
  "Jianning":      { x: 0.28, y: 0.78 },
};

const FACTION_COLORS: Record<string, string> = {};

function getFactionColor(territory: ITerritory, factions: Map<string, string>): string {
  return factions.get(territory.ownerFactionId) ?? '#6b7280';
}

function buildFactionColorMap(territories: ITerritory[]): Map<string, string> {
  const map = new Map<string, string>();
  const colors = ['#3b82f6', '#22c55e', '#ef4444', '#a855f7'];
  const seen: string[] = [];
  for (const t of territories) {
    if (!map.has(t.ownerFactionId)) {
      seen.push(t.ownerFactionId);
      map.set(t.ownerFactionId, colors[seen.length - 1] ?? '#6b7280');
    }
  }
  return map;
}

const REGION_BG: Record<string, { color: string; y: number; h: number }> = {
  north:   { color: 'rgba(59,130,246,0.04)', y: 0, h: 0.28 },
  central: { color: 'rgba(234,179,8,0.04)',  y: 0.28, h: 0.35 },
  south:   { color: 'rgba(34,197,94,0.04)',  y: 0.63, h: 0.37 },
};

export function WorldMapCanvas({
  territories,
  generalsByTerritory,
  playerFactionId,
  onTerritoryClick,
  className = '',
}: WorldMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const animFrameRef = useRef(0);
  const timeRef = useRef(0);

  const factionColors = buildFactionColorMap(territories);

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const w = Math.max(400, Math.min(1200, width));
      setCanvasSize({ w, h: w * 0.65 });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const getNodePos = useCallback(
    (name: string) => {
      const pos = TERRITORY_POSITIONS[name];
      if (!pos) return { x: 0, y: 0 };
      const pad = 50;
      return {
        x: pad + pos.x * (canvasSize.w - pad * 2),
        y: pad + pos.y * (canvasSize.h - pad * 2),
      };
    },
    [canvasSize],
  );

  const getNodeRadius = useCallback(
    (t: ITerritory) => {
      const base = canvasSize.w < 600 ? 14 : 20;
      return base + (t.strategicValue / 20) * 8;
    },
    [canvasSize],
  );

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    ctx.scale(dpr, dpr);

    let running = true;

    function draw(time: number) {
      if (!running || !ctx) return;
      timeRef.current = time;
      const { w, h } = canvasSize;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0d1117');
      bgGrad.addColorStop(0.5, '#111827');
      bgGrad.addColorStop(1, '#0d1117');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Region bands
      for (const [, cfg] of Object.entries(REGION_BG)) {
        ctx.fillStyle = cfg.color;
        ctx.fillRect(0, cfg.y * h, w, cfg.h * h);
      }

      // Region labels
      ctx.font = `600 ${w < 600 ? 10 : 13}px system-ui`;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.textAlign = 'left';
      ctx.fillText('NORTH', 10, 20);
      ctx.fillText('CENTRAL', 10, h * 0.35);
      ctx.fillText('SOUTH', 10, h * 0.68);

      // Draw connections
      for (const t of territories) {
        const from = getNodePos(t.name);
        for (const connId of t.connectedTerritoryIds) {
          const connT = territories.find((tt) => tt._id === connId);
          if (!connT) continue;
          // Avoid drawing duplicates
          if (connT._id < t._id) continue;
          const to = getNodePos(connT.name);

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Marching ants effect on same-faction connections
          if (t.ownerFactionId === connT.ownerFactionId) {
            ctx.setLineDash([4, 8]);
            ctx.lineDashOffset = -(time * 0.02) % 12;
            ctx.strokeStyle = getFactionColor(t, factionColors) + '25';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // Draw territory nodes
      for (const t of territories) {
        const pos = getNodePos(t.name);
        const r = getNodeRadius(t);
        const color = getFactionColor(t, factionColors);
        const isHovered = hoveredId === t._id;
        const hasGenerals = (generalsByTerritory[t._id]?.length ?? 0) > 0;
        const isPlayerFaction = t.ownerFactionId === playerFactionId;

        // Outer glow for player's faction
        if (isPlayerFaction) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r + 6, 0, Math.PI * 2);
          const glowGrad = ctx.createRadialGradient(pos.x, pos.y, r, pos.x, pos.y, r + 6);
          glowGrad.addColorStop(0, color + '20');
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Enemy general pulsing ring
        if (hasGenerals) {
          const pulseScale = 1 + Math.sin(time * 0.003) * 0.15;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r * pulseScale + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(249,115,22,${0.3 + Math.sin(time * 0.003) * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Node background
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        const nodeGrad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, 0, pos.x, pos.y, r);
        nodeGrad.addColorStop(0, color + '40');
        nodeGrad.addColorStop(1, color + '15');
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // Node border
        ctx.strokeStyle = isHovered ? '#ffffff' : color + '80';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        // Defense fill meter (inner arc)
        const defPct = Math.min(t.defenseRating / 50, 1);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.65, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * defPct);
        ctx.strokeStyle = color + '60';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.lineCap = 'butt';

        // Strategic value text inside node
        ctx.font = `700 ${Math.max(9, r * 0.55)}px system-ui`;
        ctx.fillStyle = '#e5e5e5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(t.strategicValue), pos.x, pos.y);

        // Territory name below
        ctx.font = `500 ${w < 600 ? 8 : 10}px system-ui`;
        ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(229,229,229,0.7)';
        ctx.textBaseline = 'top';
        ctx.fillText(t.name, pos.x, pos.y + r + 4);

        // General indicator icon
        if (hasGenerals) {
          const count = generalsByTerritory[t._id]?.length ?? 0;
          ctx.font = `600 ${w < 600 ? 8 : 10}px system-ui`;
          ctx.fillStyle = '#f97316';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`⚔${count}`, pos.x, pos.y - r - 3);
        }

        // Hover tooltip
        if (isHovered) {
          drawTooltip(ctx, t, pos, r, generalsByTerritory[t._id] ?? [], w);
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [territories, generalsByTerritory, hoveredId, canvasSize, factionColors, getNodePos, getNodeRadius, playerFactionId]);

  // Mouse interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: string | null = null;
      for (const t of territories) {
        const pos = getNodePos(t.name);
        const r = getNodeRadius(t);
        const dx = mx - pos.x;
        const dy = my - pos.y;
        if (dx * dx + dy * dy <= (r + 5) * (r + 5)) {
          found = t._id;
          break;
        }
      }
      setHoveredId(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    },
    [territories, getNodePos, getNodeRadius],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const t of territories) {
        const pos = getNodePos(t.name);
        const r = getNodeRadius(t);
        const dx = mx - pos.x;
        const dy = my - pos.y;
        if (dx * dx + dy * dy <= (r + 5) * (r + 5)) {
          onTerritoryClick(t);
          break;
        }
      }
    },
    [territories, getNodePos, getNodeRadius, onTerritoryClick],
  );

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: canvasSize.w, height: canvasSize.h }}
        className="rounded-xl border border-border"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredId(null)}
        onClick={handleClick}
      />
    </div>
  );
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  t: ITerritory,
  pos: { x: number; y: number },
  r: number,
  generals: TerritoryGeneralSummary[],
  canvasW: number,
) {
  const lines = [
    t.name,
    `Region: ${t.region}`,
    `Defense: ${t.defenseRating}`,
    `Value: ${t.strategicValue}`,
  ];
  if (generals.length > 0) {
    lines.push(`Generals: ${generals.length}`);
    for (const g of generals.slice(0, 3)) {
      lines.push(`  ${g.name.replace(' (enemy)', '')} Lv.${g.level}`);
    }
  }

  const padding = 10;
  const lineH = 16;
  const tooltipW = 160;
  const tooltipH = padding * 2 + lines.length * lineH;

  let tx = pos.x + r + 12;
  let ty = pos.y - tooltipH / 2;
  if (tx + tooltipW > canvasW - 10) tx = pos.x - r - tooltipW - 12;
  if (ty < 10) ty = 10;

  // Background
  ctx.fillStyle = 'rgba(17,24,39,0.95)';
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, tx, ty, tooltipW, tooltipH, 6);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    const isTitle = i === 0;
    ctx.font = isTitle ? '600 12px system-ui' : '400 10px system-ui';
    ctx.fillStyle = isTitle ? '#e5e5e5' : 'rgba(229,229,229,0.7)';
    ctx.fillText(lines[i], tx + padding, ty + padding + i * lineH);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
