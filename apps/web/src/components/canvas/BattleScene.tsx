import { useEffect, useRef, useCallback } from 'react';

interface BattleSceneProps {
  playerPower: number;
  enemyPower: number;
  outcome: 'won' | 'lost' | null;
  onComplete?: () => void;
  className?: string;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
}

const W = 500;
const H = 280;
const DURATION = 2800; // ms

export function BattleScene({
  playerPower,
  enemyPower,
  outcome,
  onComplete,
  className = '',
}: BattleSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const completedRef = useRef(false);

  const spawnParticles = useCallback((x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.8,
        size: 1 + Math.random() * 3,
        color,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    startTimeRef.current = performance.now();
    completedRef.current = false;
    particlesRef.current = [];
    let running = true;

    function draw(now: number) {
      if (!running || !ctx) return;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, W, H);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      skyGrad.addColorStop(0, '#1a1a2e');
      skyGrad.addColorStop(1, '#16213e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H * 0.6);

      // Ground
      const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
      groundGrad.addColorStop(0, '#2d1b00');
      groundGrad.addColorStop(1, '#1a1000');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      // Ground line
      ctx.strokeStyle = 'rgba(139,92,42,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.58);
      ctx.lineTo(W, H * 0.58);
      ctx.stroke();

      // Phase calculations
      const setupEnd = 0.2;
      const chargeEnd = 0.55;
      const clashEnd = 0.7;

      // Army positions
      const armyY = H * 0.48;
      const troopH = 30;
      const troopCount = 8;

      let playerX: number;
      let enemyX: number;

      if (progress < setupEnd) {
        // Setup: armies stationary
        playerX = 60;
        enemyX = W - 60;
      } else if (progress < chargeEnd) {
        // Charge: armies advance
        const chargeProgress = (progress - setupEnd) / (chargeEnd - setupEnd);
        const eased = chargeProgress * chargeProgress; // ease-in
        playerX = 60 + eased * 140;
        enemyX = W - 60 - eased * 140;
        // Dust particles during charge
        if (Math.random() < 0.3) {
          spawnParticles(playerX + 20, armyY + troopH, 1, 'rgba(139,92,42,0.6)');
          spawnParticles(enemyX - 20, armyY + troopH, 1, 'rgba(139,92,42,0.6)');
        }
      } else if (progress < clashEnd) {
        // Clash: impact
        const clashProgress = (progress - chargeEnd) / (clashEnd - chargeEnd);
        playerX = 200;
        enemyX = W - 200;
        // Screen shake
        const shake = Math.sin(clashProgress * 30) * (1 - clashProgress) * 4;
        ctx.translate(shake, shake * 0.5);
        // Spark particles at clash point
        if (clashProgress < 0.3) {
          spawnParticles(W / 2, armyY, 5, '#fbbf24');
          spawnParticles(W / 2, armyY + 10, 3, '#ef4444');
        }
        // Impact flash
        if (clashProgress < 0.15) {
          ctx.fillStyle = `rgba(255,255,255,${0.3 * (1 - clashProgress / 0.15)})`;
          ctx.fillRect(0, 0, W, H);
        }
      } else {
        // Result: winner pushes, loser retreats
        const resultProgress = (progress - clashEnd) / (1 - clashEnd);
        const eased = 1 - Math.pow(1 - resultProgress, 2);
        if (outcome === 'won') {
          playerX = 200 + eased * 80;
          enemyX = W - 200 + eased * 60;
        } else {
          playerX = 200 - eased * 60;
          enemyX = W - 200 - eased * 80;
        }
      }

      // Draw player army (left, green-tinted)
      drawArmy(ctx, playerX, armyY, troopCount, troopH, '#22c55e', '#15803d', true);

      // Draw enemy army (right, red-tinted)
      drawArmy(ctx, enemyX, armyY, troopCount, troopH, '#ef4444', '#991b1b', false);

      // Power bars (top)
      drawPowerBars(ctx, playerPower, enemyPower, progress, outcome);

      // VS text
      if (progress < clashEnd) {
        ctx.font = '700 18px system-ui';
        ctx.fillStyle = `rgba(255,255,255,${progress < chargeEnd ? 0.4 : 0.8})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VS', W / 2, armyY - 20);
      }

      // Result text
      if (progress > clashEnd + 0.1) {
        const fadeIn = Math.min(1, (progress - clashEnd - 0.1) / 0.2);
        ctx.font = `900 ${outcome === 'won' ? 28 : 24}px 'Cinzel', serif`;
        ctx.fillStyle = outcome === 'won'
          ? `rgba(34,197,94,${fadeIn})`
          : `rgba(239,68,68,${fadeIn})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          outcome === 'won' ? 'VICTORY' : 'DEFEAT',
          W / 2,
          H * 0.2,
        );
      }

      // Update and draw particles
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset shake
      const dt = 1 / 60;
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= dt / p.maxLife;
        if (p.life <= 0) return false;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx!.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.life * 0.8})`);
        ctx!.fill();
        return true;
      });

      if (progress < 1) {
        requestAnimationFrame(draw);
      } else if (!completedRef.current) {
        completedRef.current = true;
        setTimeout(() => onComplete?.(), 400);
      }
    }

    requestAnimationFrame(draw);
    return () => { running = false; };
  }, [playerPower, enemyPower, outcome, onComplete, spawnParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg ${className}`}
      style={{ width: W, height: H, maxWidth: '100%' }}
    />
  );
}

function drawArmy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  h: number,
  color: string,
  dark: string,
  facingRight: boolean,
) {
  const spacing = 12;
  const soldierW = 6;

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const sx = facingRight
      ? x - col * spacing
      : x + col * spacing;
    const sy = y + row * 18 - 5;

    // Body
    ctx.fillStyle = dark;
    ctx.fillRect(sx - soldierW / 2, sy, soldierW, h * 0.5);

    // Head
    ctx.beginPath();
    ctx.arc(sx, sy - 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Shield/weapon line
    ctx.strokeStyle = color + '80';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (facingRight) {
      ctx.moveTo(sx + 3, sy + 2);
      ctx.lineTo(sx + 8, sy - 4);
    } else {
      ctx.moveTo(sx - 3, sy + 2);
      ctx.lineTo(sx - 8, sy - 4);
    }
    ctx.stroke();
  }
}

function drawPowerBars(
  ctx: CanvasRenderingContext2D,
  playerPower: number,
  enemyPower: number,
  progress: number,
  outcome: 'won' | 'lost' | null,
) {
  const barW = 180;
  const barH = 14;
  const barY = 12;
  const gap = 10;

  const fillProgress = Math.min(progress / 0.5, 1);

  // Player power bar (left)
  const playerBarX = W / 2 - barW - gap;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRectFill(ctx, playerBarX, barY, barW, barH, 4);
  const playerFill = barW * fillProgress;
  ctx.fillStyle = outcome === 'won' ? '#22c55e' : '#3b82f6';
  roundRectFill(ctx, playerBarX, barY, playerFill, barH, 4);

  ctx.font = '600 10px system-ui';
  ctx.fillStyle = '#e5e5e5';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.round(playerPower * fillProgress)), playerBarX - 6, barY + barH / 2);

  // Enemy power bar (right)
  const enemyBarX = W / 2 + gap;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRectFill(ctx, enemyBarX, barY, barW, barH, 4);
  const enemyFill = barW * fillProgress;
  ctx.fillStyle = '#ef4444';
  roundRectFill(ctx, enemyBarX + barW - enemyFill, barY, enemyFill, barH, 4);

  ctx.textAlign = 'left';
  ctx.fillText(String(Math.round(enemyPower * fillProgress)), enemyBarX + barW + 6, barY + barH / 2);
}

function roundRectFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w <= 0) return;
  ctx.beginPath();
  r = Math.min(r, w / 2, h / 2);
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
  ctx.fill();
}
