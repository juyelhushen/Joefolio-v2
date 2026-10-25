import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { Github, Linkedin } from 'lucide-react';
import { motion } from 'motion/react';
import CosmicContactForm, { type ContactStatus } from './CosmicContactForm';
import ScrollReveal from './ScrollReveal';
import type { ContactMessage } from '../lib/contact-api';
import { sendContactMessage } from '../lib/contact-api';

type CosmicContactSectionProps = {
  reduceMotion: boolean;
};

type EarthSceneProps = {
  lit: boolean;
  reduceMotion: boolean;
};

const LazyEarthScene = lazy(() => import('./EarthGlobe'));

function EarthDestination({
  lit,
  reduceMotion,
  targetRef,
}: EarthSceneProps & { targetRef: RefObject<HTMLDivElement | null> }) {
  const [sceneVisible, setSceneVisible] = useState(false);
  const fallbackTexture = `${import.meta.env.BASE_URL}images/earth-blue-marble.jpg`;

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
      <div
        className="earth-fallback"
        style={{ '--earth-texture': `url("${fallbackTexture}")` } as CSSProperties}
        aria-hidden="true"
      />
      {sceneVisible && (
        <Suspense fallback={null}>
          <LazyEarthScene lit={lit} reduceMotion={reduceMotion} />
        </Suspense>
      )}
      <span className="earth-destination-label" aria-hidden="true">
        <span /> MESSAGE DESTINATION / EARTH
      </span>
    </div>
  );
}

function createFlightPath(
  stage: HTMLDivElement,
  launchButton: HTMLButtonElement,
  earth: HTMLDivElement,
): { path: string } | null {
  const stageRect = stage.getBoundingClientRect();
  const launchRect = launchButton.getBoundingClientRect();
  const earthRect = earth.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height || !launchRect.width || !earthRect.width) return null;

  const startX = launchRect.left + launchRect.width / 2 - stageRect.left;
  const startY = launchRect.top + launchRect.height / 2 - stageRect.top;
  const endX = earthRect.left + earthRect.width / 2 - stageRect.left;
  const endY = earthRect.top + earthRect.height / 2 - stageRect.top;
  const dx = endX - startX;
  const dy = endY - startY;
  const arc = Math.min(110, Math.max(42, Math.abs(dx) * 0.17));
  const controlOneX = startX + dx * 0.34;
  const controlOneY = startY + dy * 0.28 - arc;
  const controlTwoX = startX + dx * 0.78;
  const controlTwoY = endY - dy * 0.14 - arc * 0.35;
  const point = (value: number) => Math.round(value * 10) / 10;

  return {
    path: `M ${point(startX)} ${point(startY)} C ${point(controlOneX)} ${point(controlOneY)}, ${point(controlTwoX)} ${point(controlTwoY)}, ${point(endX)} ${point(endY)}`,
  };
}

export default function CosmicContactSection({ reduceMotion }: CosmicContactSectionProps) {
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [error, setError] = useState('');
  const [earthLit, setEarthLit] = useState(false);
  const [formResetVersion, setFormResetVersion] = useState(0);
  const [flightPath, setFlightPath] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const launchButtonRef = useRef<HTMLButtonElement>(null);
  const earthRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  const measureFlightPath = useCallback(() => {
    const stage = stageRef.current;
    const launchButton = launchButtonRef.current;
    const earth = earthRef.current;
    if (!stage || !launchButton || !earth) return false;
    const route = createFlightPath(stage, launchButton, earth);
    if (!route) return false;
    setFlightPath(route.path);
    return true;
  }, []);

  const completeFlight = useCallback(() => {
    setEarthLit(true);
    setStatus('success');
    setFormResetVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionPreferenceChange = () => {
      if (motionQuery.matches && status === 'flying') completeFlight();
    };
    motionQuery.addEventListener('change', onMotionPreferenceChange);
    return () => motionQuery.removeEventListener('change', onMotionPreferenceChange);
  }, [completeFlight, status]);

  useLayoutEffect(() => {
    measureFlightPath();
    const elements = [stageRef.current, launchButtonRef.current, earthRef.current].filter(
      (element): element is HTMLDivElement | HTMLButtonElement => element !== null,
    );
    const observerConstructor = Reflect.get(globalThis, 'ResizeObserver') as
      (new (callback: ResizeObserverCallback) => ResizeObserver) | undefined;
    const observer = observerConstructor ? new observerConstructor(measureFlightPath) : undefined;
    elements.forEach((element) => observer?.observe(element));
    window.addEventListener('resize', measureFlightPath);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measureFlightPath);
    };
  }, [measureFlightPath]);

  const submitMessage = async (message: ContactMessage) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setStatus('pending');
    setError('');
    setEarthLit(false);
    try {
      await sendContactMessage(message);
      if (
        reduceMotion ||
        (typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
        !measureFlightPath()
      ) {
        setEarthLit(true);
        setStatus('success');
        setFormResetVersion((version) => version + 1);
      } else {
        setStatus('flying');
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The email service is unavailable right now.',
      );
      setStatus('error');
    } finally {
      sendingRef.current = false;
    }
  };

  const flightStyle = flightPath
    ? {
        offsetPath: `path("${flightPath}")`,
        offsetAnchor: 'center',
        offsetDistance: '0%',
      }
    : undefined;

  return (
    <section className="contact-section section-wrap" id="contact" aria-labelledby="contact-title">
      <ScrollReveal className="contact-heading-reveal">
        <span className="section-kicker">OPEN CHANNEL / 006</span>
        <h2 id="contact-title">
          Send a Message <br />
          <em>into Orbit.</em>
        </h2>
        <p className="contact-intro">
          Share a little about what you have in mind. Your note will travel directly to my inbox.
        </p>
      </ScrollReveal>

      <ScrollReveal className="contact-layout-reveal">
        <div className="contact-layout" ref={stageRef}>
          <svg
            className={`contact-flight-route${status === 'flying' ? ' is-active' : ''}`}
            viewBox={`0 0 ${Math.max(stageRef.current?.clientWidth ?? 1, 1)} ${Math.max(stageRef.current?.clientHeight ?? 1, 1)}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {flightPath && <path d={flightPath} />}
          </svg>
          <div className="contact-form-column">
            <CosmicContactForm
              key={formResetVersion}
              status={status}
              error={error}
              submitButtonRef={launchButtonRef}
              onSubmitMessage={(message) => void submitMessage(message)}
            />
            <nav className="contact-social-links" aria-label="Other ways to connect">
              <a
                href="https://linkedin.com/in/juyel-hushen-770674170"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={15} aria-hidden="true" /> LinkedIn
              </a>
              <a href="https://github.com/juyelhushen" target="_blank" rel="noopener noreferrer">
                <Github size={15} aria-hidden="true" /> GitHub
              </a>
            </nav>
          </div>

          <div className="contact-celestial-column">
            <div className="contact-orbit contact-orbit-one" aria-hidden="true" />
            <div className="contact-orbit contact-orbit-two" aria-hidden="true" />
            <div className="contact-stars" aria-hidden="true" />
            <EarthDestination targetRef={earthRef} lit={earthLit} reduceMotion={reduceMotion} />
          </div>

          {status === 'flying' && flightPath && (
            <motion.div
              key={flightPath}
              className="contact-envelope-flight"
              style={flightStyle}
              initial={{ offsetDistance: '0%', opacity: 1, scale: 1 }}
              animate={{ offsetDistance: '100%', opacity: [1, 1, 0], scale: [1, 1, 0.45] }}
              transition={{ duration: 2.15, ease: [0.36, 0, 0.24, 1] }}
              onAnimationComplete={completeFlight}
              aria-hidden="true"
            >
              <svg viewBox="0 0 56 42" role="presentation">
                <rect x="2.5" y="3.5" width="51" height="35" rx="5" />
                <path d="m4 7 24 18L52 7" />
                <path d="M4 36 20 22m32 14L36 22" />
                <path className="envelope-seal" d="m28 17 5 5-5 5-5-5z" />
              </svg>
            </motion.div>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}
