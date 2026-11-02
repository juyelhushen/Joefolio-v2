import { useEffect, useState } from 'react';
import { useInteractiveActivity } from '../../../hooks/useInteractiveActivity';
import './LocalTime.css';

const formatTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export default function LocalTime() {
  const { ref, active } = useInteractiveActivity<HTMLSpanElement>(true);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!active) return;
    const update = () => setNow(new Date());
    const firstUpdate = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 60_000);
    return () => {
      window.clearTimeout(firstUpdate);
      window.clearInterval(timer);
    };
  }, [active]);

  return (
    <span ref={ref} className="footer-local-time">
      {now && <time dateTime={now.toISOString()}>Bengaluru · {formatTime.format(now)}</time>}
    </span>
  );
}
