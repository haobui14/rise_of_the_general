import { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  className?: string;
}

interface Ember {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

const EMBER_COLORS = [
  'rgba(251,191,36,', // amber
  'rgba(245,158,11,', // orange
  'rgba(234,88,12,',  // deep orange
  'rgba(220,38,38,',  // red
];

export function ParticleBackground({ className = '' }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const embers: Ember[] = [];
    let running = true;

    function spawnEmber() {
      embers.push({
        x: Math.random() * w,
        y: h + 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(0.3 + Math.random() * 0.7),
        size: 1 + Math.random() * 2.5,
        alpha: 0,
        life: 0,
        maxLife: 3 + Math.random() * 4,
        color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
      });
    }

    // Initial embers
    for (let i = 0; i < 30; i++) {
      const e: Ember = {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(0.3 + Math.random() * 0.7),
        size: 1 + Math.random() * 2.5,
        alpha: Math.random() * 0.6,
        life: Math.random() * 3,
        maxLife: 3 + Math.random() * 4,
        color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
      };
      embers.push(e);
    }

    let lastSpawn = 0;

    function draw(now: number) {
      if (!running || !ctx) return;

      ctx.clearRect(0, 0, w, h);

      // Spawn new embers
      if (now - lastSpawn > 200 && embers.length < 60) {
        spawnEmber();
        lastSpawn = now;
      }

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx;
        e.y += e.vy;
        e.vx += (Math.random() - 0.5) * 0.02;
        e.life += 1 / 60;

        const lifeRatio = e.life / e.maxLife;
        if (lifeRatio < 0.15) {
          e.alpha = (lifeRatio / 0.15) * 0.7;
        } else if (lifeRatio > 0.7) {
          e.alpha = ((1 - lifeRatio) / 0.3) * 0.7;
        } else {
          e.alpha = 0.7;
        }

        if (e.life >= e.maxLife || e.y < -20) {
          embers.splice(i, 1);
          continue;
        }

        // Glow
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = e.color + (e.alpha * 0.15) + ')';
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fillStyle = e.color + e.alpha + ')';
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  );
}
