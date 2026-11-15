import { useRef, useState } from 'react';
import { sendContactMessage } from '../services/contact-api';
import type { ContactMessage, ContactStatus } from '../types';

export const useContactTransmission = () => {
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [error, setError] = useState('');
  const [formResetVersion, setFormResetVersion] = useState(0);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const sendingRef = useRef(false);

  const submitMessage = async (message: ContactMessage) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setStatus('pending');
    setError('');
    try {
      await sendContactMessage(message);
      setStatus('success');
      setFormResetVersion((version) => version + 1);
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

  return { status, error, formResetVersion, submitButtonRef, submitMessage };
};
