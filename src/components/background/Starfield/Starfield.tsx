import { useEffect, useRef } from 'react';
import './Starfield.css';

export type Star = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  phase: number;
  twinkleSpeed: number;
  depth: number;
  velocityX: number;
  velocityY: number;
};

type Meteor = {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
};

function seededValue(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 127.1 + (salt + 1) * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function createStar(index: number, width: number, height: number): Star {
  const depth = 0.12 + seededValue(index, 0) * 0.88;
  return {
    x: seededValue(index, 1) * width,
    y: seededValue(index, 2) * height,
    radius: 0.35 + depth * 1.15,
    alpha: 0.2 + depth * 0.44,
    phase: seededValue(index, 3) * Math.PI * 2,
    twinkleSpeed: 0.4 + seededValue(index, 4) * 0.8,
    depth,
    velocityX: -(2 + depth * 8),
    velocityY: (seededValue(index, 5) * 2 - 1) * (0.35 + depth * 1.1),
  };
}

export function advanceStars(
  stars: Star[],
  deltaSeconds: number,
  width: number,
  height: number,
): void {
  if (deltaSeconds <= 0 || width <= 0 || height <= 0) return;

  for (const star of stars) {
    star.x =
      ((((star.x + star.velocityX * deltaSeconds + 2) % (width + 4)) + width + 4) % (width + 4)) -
      2;
    star.y =
      ((((star.y + star.velocityY * deltaSeconds + 2) % (height + 4)) + height + 4) %
        (height + 4)) -
      2;
  }
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;

    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    const mobileQuery =
      typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 700px)') : null;
    let reduceMotion = Boolean(motionQuery?.matches);
    let mobile = Boolean(mobileQuery?.matches);
    let width = 0;
    let height = 0;
    let raf = 0;
    let lastMeteorAt = 0;
    let lastFrameAt = 0;
    const stars: Star[] = [];
    const meteors: Meteor[] = [];
    const starCount = 210;

    const resize = () => {
      const nextWidth = document.documentElement.clientWidth || window.innerWidth;
      const nextHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      if (width && height) {
        const scaleX = nextWidth / width;
        const scaleY = nextHeight / height;
        for (const star of stars) {
          star.x *= scaleX;
          star.y *= scaleY;
        }
      }
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawStars = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const visibleCount = mobile ? 95 : starCount;
      for (let index = 0; index < visibleCount; index += 1) {
        const star = stars[index];
        const twinkle = reduceMotion
          ? 0.82
          : 0.76 + Math.sin(now * 0.001 * star.twinkleSpeed + star.phase) * 0.2;
        const brightness = star.alpha * twinkle;
        ctx.beginPath();
        ctx.fillStyle = `rgba(225, 235, 255, ${brightness})`;
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const updateMeteors = (deltaSeconds: number) => {
      for (let index = meteors.length - 1; index >= 0; index -= 1) {
        const meteor = meteors[index];
        meteor.x += Math.cos(meteor.angle) * meteor.speed * deltaSeconds;
        meteor.y += Math.sin(meteor.angle) * meteor.speed * deltaSeconds;
        meteor.alpha -= 0.42 * deltaSeconds;
        if (meteor.alpha <= 0 || meteor.x < -meteor.length || meteor.y > height + meteor.length) {
          meteors.splice(index, 1);
        }
      }
    };

    const drawMeteors = () => {
      for (const meteor of meteors) {
        const tailX = meteor.x - Math.cos(meteor.angle) * meteor.length;
        const tailY = meteor.y - Math.sin(meteor.angle) * meteor.length;
        const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 181, 125, ${meteor.alpha})`);
        gradient.addColorStop(0.35, `rgba(125, 183, 255, ${meteor.alpha * 0.52})`);
        gradient.addColorStop(1, 'rgba(125, 183, 255, 0)');
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.4;
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }
    };

    const spawnMeteor = (now: number) => {
      const interval = mobile ? 12000 : 9000;
      if (now - lastMeteorAt < interval || Math.random() < 0.35) return;
      meteors.push({
        x: Math.random() * width * 0.88 + width * 0.06,
        y: Math.random() * height * 0.34,
        length: Math.random() * 64 + 42,
        speed: Math.random() * 110 + 95,
        angle: Math.PI * (0.69 + Math.random() * 0.1),
        alpha: 0.68,
      });
      lastMeteorAt = now;
    };

    const handleFrame = (now: number) => {
      const deltaSeconds = Math.min(Math.max((now - lastFrameAt) / 1000, 0), 0.08);
      lastFrameAt = now;
      if (!reduceMotion) {
        advanceStars(stars, deltaSeconds, width, height);
        spawnMeteor(now);
        updateMeteors(deltaSeconds);
      }
      drawStars(now);
      if (!reduceMotion) drawMeteors();
    };

    const start = () => {
      window.cancelAnimationFrame(raf);
      lastFrameAt = performance.now();
      if (!reduceMotion && !document.hidden) {
        raf = window.requestAnimationFrame(tick);
      } else {
        handleFrame(lastFrameAt);
      }
    };

    const tick = (now: number) => {
      handleFrame(now);
      if (!reduceMotion && !document.hidden) raf = window.requestAnimationFrame(tick);
    };

    resize();
    for (let index = 0; index < starCount; index += 1) stars.push(createStar(index, width, height));
    lastMeteorAt = performance.now();
    handleFrame(lastMeteorAt);

    const onResize = () => {
      mobile = mobileQuery?.matches ?? window.innerWidth <= 700;
      resize();
      if (reduceMotion) handleFrame(performance.now());
    };

    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      meteors.length = 0;
      start();
    };

    const onVisibilityChange = () => start();

    window.addEventListener('resize', onResize);
    motionQuery?.addEventListener('change', onMotionPreferenceChange);
    mobileQuery?.addEventListener('change', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!reduceMotion) start();

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      motionQuery?.removeEventListener('change', onMotionPreferenceChange);
      mobileQuery?.removeEventListener('change', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
