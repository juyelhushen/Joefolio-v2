import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import './UniverseIntro.css';

type UniverseIntroProps = {
  onComplete: () => void;
};

type WarpStar = {
  id: string;
  style: CSSProperties;
};

function createWarpStars(): WarpStar[] {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const diagonal = Math.hypot(width, height);

  return Array.from({ length: 36 }, (_, index) => {
    const angle = index * 2.399963 + 0.4;
    const distance = diagonal * (0.48 + ((index * 37) % 46) / 100);
    const startX = ((index * 29) % 35) - 17;
    const startY = ((index * 17) % 35) - 17;
    const properties = {
      '--star-angle': `${(angle * 180) / Math.PI}deg`,
      '--star-start-x': `${startX}px`,
      '--star-start-y': `${startY}px`,
      '--star-end-x': `${Math.cos(angle) * distance}px`,
      '--star-end-y': `${Math.sin(angle) * distance}px`,
      '--star-height': `${8 + ((index * 13) % 13)}px`,
    } as CSSProperties;

    return { id: `warp-star-${index}`, style: properties };
  });
}

export default function UniverseIntro({ onComplete }: UniverseIntroProps) {
  const introRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const warpStars = useMemo(createWarpStars, []);

  const completeOnce = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const fallbackId = window.setTimeout(completeOnce, 4500);
    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) completeOnce();
    };
    const onVisibilityChange = () => {
      if (document.hidden) completeOnce();
    };
    const onAnimationEnd = (event: Event) => {
      if (event.target === event.currentTarget) completeOnce();
    };

    motionQuery?.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intro = introRef.current;
    intro?.addEventListener('animationend', onAnimationEnd);
    intro?.addEventListener('animationcancel', onAnimationEnd);

    if (motionQuery?.matches || document.hidden) completeOnce();

    return () => {
      window.clearTimeout(fallbackId);
      motionQuery?.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      intro?.removeEventListener('animationend', onAnimationEnd);
      intro?.removeEventListener('animationcancel', onAnimationEnd);
    };
  }, [completeOnce]);

  return (
    <div ref={introRef} className="universe-intro" aria-hidden="true" data-testid="universe-intro">
      <div className="universe-intro-nebula" />
      <div className="universe-intro-stars" />
      <div className="universe-intro-orbit" data-intro-orbit>
        <span className="universe-intro-ring universe-intro-ring-one" />
        <span className="universe-intro-ring universe-intro-ring-two" />
        <span className="universe-intro-ring universe-intro-ring-three" />
        <span className="universe-intro-core">
          <span className="universe-intro-monogram">
            JH<span>•</span>
          </span>
        </span>
      </div>
      <div className="universe-intro-portal" />
      <div className="universe-intro-warp" aria-hidden="true">
        {warpStars.map(({ id, style }) => (
          <span key={id} className="universe-intro-warp-star" style={style} />
        ))}
      </div>
    </div>
  );
}
