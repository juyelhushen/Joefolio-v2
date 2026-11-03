import { lazy, Suspense, useEffect, useState, type CSSProperties, type RefObject } from 'react';
import LoadBoundary from '../../../components/common/LoadBoundary';

const LazyEarthScene = lazy(() => import('./EarthGlobe'));

type EarthDestinationProps = {
  lit: boolean;
  reduceMotion: boolean;
  targetRef: RefObject<HTMLDivElement | null>;
};

type EarthFallbackStyle = CSSProperties & {
  '--earth-texture'?: string;
};

export default function EarthDestination({ lit, reduceMotion, targetRef }: EarthDestinationProps) {
  const [sceneVisible, setSceneVisible] = useState(false);
  const fallbackTexture = `${import.meta.env.BASE_URL}images/earth-blue-marble.jpg`;
  const fallbackStyle: EarthFallbackStyle = sceneVisible
    ? { '--earth-texture': `url("${fallbackTexture}")` }
    : {};

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;
    let active = true;
    let observer: IntersectionObserver | undefined;

    const loadScene = () => {
      if (active) setSceneVisible(true);
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            loadScene();
          }
        },
        { rootMargin: '180px' },
      );
      observer.observe(element);
    } else {
      loadScene();
    }

    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [targetRef]);

  return (
    <div
      className="contact-earth-target"
      ref={targetRef}
      data-lit={lit ? 'true' : 'false'}
      data-reduced-motion={reduceMotion ? 'true' : 'false'}
      aria-label="Rotating Earth, the message destination"
      role="img"
    >
      <div className="earth-halo" aria-hidden="true" />
      <div className="earth-fallback" style={fallbackStyle} aria-hidden="true" />
      {sceneVisible && (
        <LoadBoundary label="the optional Earth scene" fallback={null}>
          <Suspense fallback={null}>
            <LazyEarthScene lit={lit} reduceMotion={reduceMotion} />
          </Suspense>
        </LoadBoundary>
      )}
      <span className="earth-destination-label" aria-hidden="true">
        <span /> MESSAGE DESTINATION / EARTH
      </span>
    </div>
  );
}
