import React, { useEffect, useRef } from 'react';

type Options = {
  maxParticles?: number;
};

const ParticleBackground: React.FC<Options & { className?: string }> = ({ maxParticles = 36, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    let width = 0;
    let height = 0;
    let animationId = 0;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number };
    let particles: Particle[] = [];

    function getPrimaryColor() {
      try {
        const root = getComputedStyle(document.documentElement);
        const primary = root.getPropertyValue('--primary') || '45 90% 50%';
        return `hsl(${primary.trim()})`;
      } catch {
        return 'hsl(45 90% 50%)';
      }
    }

    function resize() {
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(width * DPR);
      canvas.height = Math.round(height * DPR);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      initParticles();
    }

    function initParticles() {
      particles = [];
      const base = isMobile ? Math.min(18, maxParticles / 2) : maxParticles;
      const count = Math.max(8, Math.round(base * Math.sqrt((width * height) / (1400 * 600))));
      for (let i = 0; i < count; i++) {
        const r = 1 + Math.random() * 3.5;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r,
          alpha: 0.2 + Math.random() * 0.7,
        });
      }
    }

    let primaryColor = getPrimaryColor();

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // subtle background wash
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // draw
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        grd.addColorStop(0, primaryColor.replace(')', ` / ${Math.min(0.95, p.alpha)})`).replace('hsl', 'hsl'));
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.fillStyle = grd as any;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function step() {
      if (!prefersReduced) draw();
      animationId = requestAnimationFrame(step);
    }

    // pause when page hidden
    function handleVisibility() {
      if (document.hidden) cancelAnimationFrame(animationId);
      else animationId = requestAnimationFrame(step);
    }

    // initial
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
    // start animation (but be gentle on mobile / reduced motion)
    if (!prefersReduced) animationId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [maxParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} pointer-events-none`}
      aria-hidden
    />
  );
};

export default ParticleBackground;
