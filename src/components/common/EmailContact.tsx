import { useEffect, useRef, useState } from 'react';
import { PUBLIC_EMAIL } from '../../lib/profile';
import './EmailContact.css';

export default function EmailContact({ allowCopy = false }: { allowCopy?: boolean }) {
  const addressRef = useRef<HTMLAnchorElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const copyingRef = useRef(false);
  const [result, setResult] = useState<'copied' | 'failed' | null>(null);
  const [manualCopy, setManualCopy] = useState(false);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const copyEmail = async () => {
    if (copyingRef.current) return;
    copyingRef.current = true;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(PUBLIC_EMAIL);
      if (!activeRef.current) return;
      setResult('copied');
      setManualCopy(false);
    } catch {
      if (!activeRef.current) return;
      const address = addressRef.current;
      if (address) {
        address.focus({ preventScroll: true });
        const range = document.createRange();
        range.selectNodeContents(address);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setResult('failed');
      setManualCopy(true);
    } finally {
      copyingRef.current = false;
    }
    timerRef.current = setTimeout(() => setResult(null), 2000);
  };

  return (
    <div className="email-contact">
      <div className="email-contact-actions">
        <a ref={addressRef} href={`mailto:${PUBLIC_EMAIL}`}>
          {PUBLIC_EMAIL}
        </a>
        {allowCopy && (
          <button type="button" onClick={() => void copyEmail()}>
            {result === 'copied'
              ? 'Email copied'
              : result === 'failed'
                ? 'Copy failed'
                : 'Copy email'}
          </button>
        )}
      </div>
      {allowCopy && (
        <>
          <span className="email-copy-status" role="status" aria-live="polite" aria-atomic="true">
            {result === 'copied'
              ? 'Email copied'
              : result === 'failed'
                ? 'Copy failed, select the address instead'
                : ''}
          </span>
          {manualCopy && (
            <p className="email-copy-help">
              Select the address and press Ctrl+C (Windows) or Command+C (Mac) to copy manually.
            </p>
          )}
        </>
      )}
    </div>
  );
}
