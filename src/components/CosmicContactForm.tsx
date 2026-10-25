import { useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from 'react';
import { LoaderCircle, Send } from 'lucide-react';
import { motion } from 'motion/react';
import type { ContactMessage } from '../lib/contact-api';

export type ContactStatus = 'idle' | 'pending' | 'flying' | 'success' | 'error';

type ContactFields = Omit<ContactMessage, 'website'>;
type FieldName = keyof ContactFields;
type FieldErrors = Partial<Record<FieldName, string>>;

type CosmicContactFormProps = {
  status: ContactStatus;
  error: string;
  submitButtonRef: RefObject<HTMLButtonElement | null>;
  onSubmitMessage: (message: ContactMessage) => void;
};

const initialFields: ContactFields = { name: '', email: '', subject: '', message: '' };
const fieldNames: FieldName[] = ['name', 'email', 'subject', 'message'];

function ButtonEnvelope({ sealed }: { sealed: boolean }) {
  return (
    <motion.span
      className={`contact-button-envelope${sealed ? ' is-sealed' : ''}`}
      initial={sealed ? { scale: 0.86 } : false}
      animate={{ scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 28 22">
        <rect x="2" y="5" width="24" height="15" rx="3" />
        <path className="envelope-flap-open" d="m3.5 6 10.5 8L24.5 6" />
        <path className="envelope-flap-closed" d="m3.5 6 10.5 9L24.5 6" />
        {sealed && <path className="button-envelope-seal" d="m14 11 3 3-3 3-3-3z" />}
      </svg>
    </motion.span>
  );
}

export default function CosmicContactForm({
  status,
  error,
  submitButtonRef,
  onSubmitMessage,
}: CosmicContactFormProps) {
  const [fields, setFields] = useState(initialFields);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const contactFieldRef = useRef<Record<FieldName, HTMLInputElement | HTMLTextAreaElement | null>>({
    name: null,
    email: null,
    subject: null,
    message: null,
  });
  const busy = status === 'pending' || status === 'flying';

  const updateField = (name: FieldName, value: string) => {
    setFields((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const nextErrors: FieldErrors = {};
    for (const name of fieldNames) {
      const field = contactFieldRef.current[name];
      if (!fields[name].trim()) {
        nextErrors[name] = 'This field is required.';
      } else if (field && !field.validity.valid) {
        nextErrors[name] =
          name === 'email' ? 'Enter a valid email address.' : 'Check this field and try again.';
      }
    }
    setFieldErrors(nextErrors);
    const firstInvalidField = fieldNames.find((name) => nextErrors[name]);
    if (firstInvalidField) {
      contactFieldRef.current[firstInvalidField]?.focus();
      return;
    }

    const website = new FormData(event.currentTarget).get('website');
    onSubmitMessage({
      ...fields,
      website: typeof website === 'string' ? website : '',
    });
  };

  const fieldProps = (name: FieldName) => ({
    id: `contact-${name}`,
    name,
    value: fields[name],
    required: true,
    disabled: busy,
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': fieldErrors[name] ? `contact-${name}-error` : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      updateField(name, event.currentTarget.value),
    ref: (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      contactFieldRef.current[name] = element;
    },
  });

  return (
    <form
      className="cosmic-contact-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Send a message"
    >
      <div className="contact-form-heading">
        <span>TRANSMISSION DETAILS</span>
        <p>
          Required fields are marked <span aria-hidden="true">*</span>.
        </p>
      </div>

      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor="contact-name">
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            {...fieldProps('name')}
            type="text"
            autoComplete="name"
            maxLength={100}
            ref={(element) => {
              contactFieldRef.current.name = element;
            }}
          />
          {fieldErrors.name && (
            <span className="contact-field-error" id="contact-name-error" role="alert">
              {fieldErrors.name}
            </span>
          )}
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            {...fieldProps('email')}
            type="email"
            autoComplete="email"
            maxLength={254}
            ref={(element) => {
              contactFieldRef.current.email = element;
            }}
          />
          {fieldErrors.email && (
            <span className="contact-field-error" id="contact-email-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="contact-field contact-field-wide">
          <label htmlFor="contact-subject">
            Subject <span aria-hidden="true">*</span>
          </label>
          <input
            {...fieldProps('subject')}
            type="text"
            maxLength={120}
            ref={(element) => {
              contactFieldRef.current.subject = element;
            }}
          />
          {fieldErrors.subject && (
            <span className="contact-field-error" id="contact-subject-error" role="alert">
              {fieldErrors.subject}
            </span>
          )}
        </div>

        <div className="contact-field contact-field-wide">
          <label htmlFor="contact-message">
            Message <span aria-hidden="true">*</span>
          </label>
          <textarea
            {...fieldProps('message')}
            rows={5}
            maxLength={4000}
            ref={(element) => {
              contactFieldRef.current.message = element;
            }}
          />
          <div className="contact-message-meta">
            {fieldErrors.message ? (
              <span className="contact-field-error" id="contact-message-error" role="alert">
                {fieldErrors.message}
              </span>
            ) : (
              <span aria-hidden="true">Share a little context for your message.</span>
            )}
            <span>{fields.message.length}/4000</span>
          </div>
        </div>
      </div>

      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === 'pending' && (
        <p className="contact-live-status" role="status" aria-live="polite">
          Sealing your message and contacting the email service…
        </p>
      )}
      {status === 'flying' && (
        <p className="contact-live-status" role="status" aria-live="polite">
          The email service accepted your message. Launching it into orbit…
        </p>
      )}
      {status === 'success' && (
        <p className="contact-success" role="status" aria-live="polite">
          Message launched successfully. Thank you for reaching out.
        </p>
      )}
      {status === 'error' && (
        <p className="contact-error" role="alert">
          {error} Your message is still here—please retry.
        </p>
      )}

      <button
        ref={submitButtonRef}
        className="button button-primary contact-submit"
        type="submit"
        disabled={busy}
      >
        {status === 'pending' ? (
          <ButtonEnvelope sealed />
        ) : status === 'flying' ? (
          <LoaderCircle className="contact-spinner" size={17} aria-hidden="true" />
        ) : status === 'success' ? (
          <Send size={16} aria-hidden="true" />
        ) : (
          <ButtonEnvelope sealed={false} />
        )}
        {status === 'pending'
          ? 'Sending…'
          : status === 'flying'
            ? 'In transit…'
            : status === 'error'
              ? 'Retry message'
              : status === 'success'
                ? 'Send another message'
                : 'Launch message'}
      </button>
    </form>
  );
}
