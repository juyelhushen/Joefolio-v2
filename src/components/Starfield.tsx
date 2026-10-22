import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; radius: number; alpha: number; phase: number; speed: number };
type Meteor = { x: number; y: number; length: number; speed: number; angle: number; alpha: number };

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let lastMeteorAt = 0;
    const stars: Star[] = [];
    const meteors: Meteor[] = [];
    const starCount = mobile ? 95 : 210;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const randomStar = (): Star => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.35 + 0.2,
      alpha: Math.random() * 0.62 + 0.18,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.8 + 0.25,
    });

    resize();
    for (let i = 0; i < starCount; i++) stars.push(randomStar());

    let previous = 0;
    const draw = (now: number) => {
      const delta = Math.min((now - (previous || now)) / 16.67, 2);
      previous = now;
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        const twinkle = reduceMotion ? 0.85 : 0.68 + Math.sin(now * 0.001 * star.speed + star.phase) * 0.25;
        ctx.beginPath();
        ctx.fillStyle = `rgba(225, 235, 255, ${star.alpha * twinkle})`;
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        if (!reduceMotion) {
          star.y += 0.025 * star.speed * delta;
          if (star.y > height + 2) { star.y = -2; star.x = Math.random() * width; }
        }
      }

      if (!reduceMotion && now - lastMeteorAt > (mobile ? 8200 : 5600) && Math.random() > 0.35) {
        meteors.push({
          x: Math.random() * width * 0.9 + width * 0.05,
          y: Math.random() * height * 0.42,
          length: Math.random() * 100 + 70,
          speed: Math.random() * 7 + 7,
          angle: Math.PI * (0.68 + Math.random() * 0.11),
          alpha: 0.85,
        });
        lastMeteorAt = now;
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        const tailX = meteor.x - Math.cos(meteor.angle) * meteor.length;
        const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;
        const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 181, 125, ${meteor.alpha})`);
        gradient.addColorStop(0.35, `rgba(125, 183, 255, ${meteor.alpha * 0.52})`);
        gradient.addColorStop(1, 'rgba(125, 183, 255, 0)');
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.6;
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        meteor.x += Math.cos(meteor.angle) * meteor.speed * delta;
        meteor.y += Math.sin(meteor.angle) * meteor.speed * delta;
        meteor.alpha -= 0.008 * delta;
        if (meteor.alpha <= 0 || meteor.x < -meteor.length || meteor.y > height + meteor.length) meteors.splice(i, 1);
      }

      if (!reduceMotion) raf = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) window.cancelAnimationFrame(raf);
      else if (!reduceMotion) raf = window.requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    draw(0);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
