import CosmicContactForm from './CosmicContactForm';
import './CosmicContactSection.css';
import { useContactTransmission } from '../hooks/useContactTransmission';
import type { BackendHealthStatus } from '../../../lib/api/backend-health';

type CosmicContactSectionProps = {
  backendStatus?: 'CHECKING' | BackendHealthStatus;
};

export default function CosmicContactSection({
  backendStatus = 'CHECKING',
}: CosmicContactSectionProps) {
  const { status, error, formResetVersion, submitButtonRef, submitMessage } =
    useContactTransmission();

  return (
    <section className="contact-section page-column" id="contact" aria-labelledby="contact-title">
      <h2 id="contact-title">Get in touch</h2>
      <p className="contact-intro">Have a project or opportunity in mind? Send me a message.</p>
      {backendStatus === 'UNAVAILABLE' && (
        <p className="contact-service-note" role="status">
          The form may take a moment or be offline. You can use the email link in the footer.
        </p>
      )}
      <CosmicContactForm
        key={formResetVersion}
        status={status}
        error={error}
        submitButtonRef={submitButtonRef}
        onSubmitMessage={(message) => void submitMessage(message)}
      />
    </section>
  );
}
