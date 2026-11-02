import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, useTransform } from 'motion/react';
import { m } from 'motion/react';
import { impactStats } from '../data/impact';
import './ImpactStrip.css';

type ImpactStripProps = {
  reduceMotion: boolean;
};

function formatValue(value: number, decimals: number, prefix = '', suffix = '') {
  const fractionDigits = Math.max(0, Math.min(20, Math.trunc(decimals)));
  return `${prefix}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)}${suffix}`;
}

function ImpactTile({
  value,
  prefix,
  suffix,
  decimals = 0,
  label,
  detail,
  entered,
  finalImmediately,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  detail?: string;
  entered: boolean;
  finalImmediately: boolean;
}) {
  const count = useMotionValue(finalImmediately ? value : 0);
  const formattedCount = useTransform(count, (current) =>
    formatValue(current, decimals, prefix, suffix),
  );
  const finalValue = formatValue(value, decimals, prefix, suffix);

  useEffect(() => {
    if (!entered) return;
    if (finalImmediately) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 1.15, ease: 'easeOut' });
    return () => controls.stop();
  }, [count, entered, finalImmediately, value]);

  return (
    <li className="impact-tile">
      <p className="impact-stat-value">
        <span className="visually-hidden">{finalValue} </span>
        <m.span aria-hidden="true">{formattedCount}</m.span>
      </p>
      <h3>{label}</h3>
      {detail && <p className="impact-stat-detail">{detail}</p>}
    </li>
  );
}

export default function ImpactStrip({ reduceMotion }: ImpactStripProps) {
  const stats = impactStats.slice(0, 4);
  const sectionRef = useRef<HTMLElement>(null);
  const observerAvailable = typeof IntersectionObserver !== 'undefined';
  const [entered, setEntered] = useState(reduceMotion || !observerAvailable);
  const [observerFailed, setObserverFailed] = useState(false);
  const finalImmediately = reduceMotion || !observerAvailable || observerFailed;
  const isEntered = entered || reduceMotion || !observerAvailable || observerFailed;

  useEffect(() => {
    if (entered || reduceMotion || !observerAvailable) return;
    const section = sectionRef.current;
    if (!section) return;

    let observer: IntersectionObserver | undefined;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setEntered(true);
            observer?.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      observer.observe(section);
    } catch (error) {
      console.warn('Impact reveal is unavailable; showing final values immediately.', error);
      observer?.disconnect();
      setObserverFailed(true);
      setEntered(true);
    }

    return () => observer?.disconnect();
  }, [entered, observerAvailable, reduceMotion]);

  if (stats.length === 0) return null;

  return (
    <m.section
      ref={sectionRef}
      className="impact-strip section-wrap"
      aria-label="Career impact"
      initial={isEntered ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 0.68, 0.2, 1] }}
    >
      <span className="impact-kicker">AT A GLANCE</span>
      <ul className="impact-grid" data-columns={stats.length}>
        {stats.map((stat) => (
          <ImpactTile
            key={stat.id}
            {...stat}
            entered={isEntered}
            finalImmediately={finalImmediately}
          />
        ))}
      </ul>
    </m.section>
  );
}
