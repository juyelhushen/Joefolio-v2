import { Github, Linkedin } from 'lucide-react';
import { m } from 'motion/react';
import CosmicContactForm from './CosmicContactForm';
import EarthDestination from './EarthDestination';
import ScrollReveal from '../../../components/common/ScrollReveal';
import './CosmicContactSection.css';

import { useContactTransmission } from '../hooks/useContactTransmission';
import { PROFILE_LINKS } from '../../../lib/profile';
import type { BackendHealthStatus } from '../../../lib/api/backend-health';
import EmailContact from '../../../components/common/EmailContact';
import { useAnimationVisibility } from '../../../hooks/useAnimationVisibility';

type CosmicContactSectionProps = {
  reduceMotion: boolean;
  backendStatus?: 'CHECKING' | BackendHealthStatus;
};

export default function CosmicContactSection({
  reduceMotion,
  backendStatus = 'CHECKING',
}: CosmicContactSectionProps) {
  const { ref: visibilityRef, visible } = useAnimationVisibility<HTMLElement>();
  const {
    status,
    error,
    earthLit,
    formResetVersion,
    flightPath,
    stageRef,
    launchButtonRef,
    earthRef,
    completeFlight,
    submitMessage,
  } = useContactTransmission(reduceMotion);

  const flightStyle = flightPath
    ? {
        offsetPath: `path("${flightPath}")`,
        offsetAnchor: 'center',
        offsetDistance: '0%',
      }
    : undefined;

  return (
    <section
      ref={visibilityRef}
      className="contact-section section-wrap"
      id="contact"
      aria-labelledby="contact-title"
      data-animation-visible={visible}
    >
      <ScrollReveal className="contact-heading-reveal" headingReveal>
        <span className="section-kicker">06 / CONTACT</span>
        <h2 id="contact-title">
          <span className="heading-line-mask">
            <span className="heading-line">Send a Message</span>
          </span>{' '}
          <br />
          <span className="heading-line-mask">
            <span className="heading-line">
              <em>into Orbit.</em>
            </span>
          </span>
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
            {backendStatus === 'UNAVAILABLE' && (
              <div
                className="contact-service-note"
                role="status"
                aria-label="Contact service availability"
              >
                <p>The form may take a moment or be offline. You can email me directly instead.</p>
                <EmailContact />
              </div>
            )}
            <CosmicContactForm
              key={formResetVersion}
              status={status}
              error={error}
              submitButtonRef={launchButtonRef}
              onSubmitMessage={(message) => void submitMessage(message)}
            />
            <div className="contact-direct-email">
              <p>Prefer email?</p>
              <EmailContact allowCopy />
            </div>
            <nav className="contact-social-links" aria-label="Other ways to connect">
              <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin size={15} aria-hidden="true" /> LinkedIn
              </a>
              <a href={PROFILE_LINKS.github} target="_blank" rel="noopener noreferrer">
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
            <m.div
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
            </m.div>
          )}
        </div>
      </ScrollReveal>
    </section>
  );
}
