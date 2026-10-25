import { useRef, useState, type RefObject } from 'react';
import { Linkedin, Plane } from 'lucide-react';
import { motion } from 'motion/react';
import { siGithub, siLeetcode, type SimpleIcon } from 'simple-icons';
import ScrollReveal from './ScrollReveal';

type CosmicFooterProps = {
  homeHeadingRef: RefObject<HTMLHeadingElement | null>;
  reducedMotion: boolean;
};

type Flight = {
  x: number;
  y: number;
  distance: number;
};

const currentYear = new Date().getFullYear();

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/juyel-hushen-770674170',
    icon: 'linkedin',
  },
  { label: 'GitHub', href: 'https://github.com/juyelhushen', icon: siGithub },
  { label: 'LeetCode', href: 'https://leetcode.com/u/Juyel/', icon: siLeetcode },
] as const;

function BrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={icon.path} />
    </svg>
  );
}

export default function CosmicFooter({ homeHeadingRef, reducedMotion }: CosmicFooterProps) {
  const returnButtonRef = useRef<HTMLButtonElement>(null);
  const launchingRef = useRef(false);
  const [flight, setFlight] = useState<Flight | null>(null);

  const returnHome = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    homeHeadingRef.current?.focus({ preventScroll: true });
  };

  const launchJet = () => {
    if (launchingRef.current) return;

    if (
      reducedMotion ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      returnHome();
      return;
    }

    const bounds = returnButtonRef.current?.getBoundingClientRect();
    if (!bounds) return;

    launchingRef.current = true;
    setFlight({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
      distance: Math.max(bounds.top + window.innerHeight * 0.18, window.innerHeight),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishFlight = () => {
    setFlight(null);
    launchingRef.current = false;
    returnHome();
  };

  return (
    <footer className="site-footer section-wrap">
      <ScrollReveal className="footer-connect">
        <span className="section-kicker">COSMIC CONNECT / END OF TRANSMISSION</span>
        <h2>Let’s connect across the universe.</h2>
        <p>
          Thanks for exploring my work. Find me on these platforms and let’s keep the conversation
          going.
        </p>
        <nav className="footer-social-links" aria-label="Social profiles">
          {socialLinks.map((link) => (
            <a
              className="footer-social-link"
              href={link.href}
              key={link.label}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
            >
              {link.icon === 'linkedin' ? (
                <Linkedin size={19} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <BrandIcon icon={link.icon} />
              )}
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
        <button
          className="back-top"
          type="button"
          onClick={launchJet}
          ref={returnButtonRef}
          disabled={flight !== null}
          aria-label="Fly to top"
          aria-busy={flight !== null}
        >
          <Plane size={16} aria-hidden="true" />
          <span>Fly to top</span>
        </button>
      </ScrollReveal>
      <ScrollReveal className="site-footer-bottom">
        <a href="#home" className="footer-brand" aria-label="Juyel Hushen home">
          JH<span>•</span>
        </a>
        <p>© {currentYear} JUYEL HUSHEN · BUILT WITH CURIOSITY</p>
      </ScrollReveal>
      {flight && (
        <motion.div
          key={`${flight.x}-${flight.y}`}
          className="return-flight"
          data-testid="return-flight"
          data-start-x={flight.x}
          data-start-y={flight.y}
          style={{ left: flight.x, top: flight.y }}
          initial={{ opacity: 0, scale: 0.7, x: 0, y: 0, rotate: -45 }}
          animate={{
            opacity: [0, 1, 1, 0.9, 0],
            scale: [0.7, 1, 0.96, 0.84, 0.65],
            x: [0, 22, -14, 13, 0],
            y: [0, -70, -210, -430, -flight.distance],
            rotate: [-45, -37, -54, -41, -45],
          }}
          transition={{
            duration: 1.8,
            times: [0, 0.08, 0.3, 0.66, 1],
            ease: 'easeInOut',
          }}
          onAnimationComplete={finishFlight}
          aria-hidden="true"
        >
          <span className="return-flight-trail" />
          <Plane size={25} strokeWidth={1.7} />
        </motion.div>
      )}
    </footer>
  );
}
