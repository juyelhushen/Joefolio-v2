import { impactStats } from '../data/impact';
import './ImpactStrip.css';

export default function ImpactStrip() {
  const stats = impactStats.slice(0, 4);
  if (stats.length === 0) return null;

  return (
    <section className="impact-strip section-wrap" aria-label="Career impact">
      <span className="impact-kicker">AT A GLANCE</span>
      <ul className="impact-grid" data-columns={stats.length}>
        {stats.map(({ id, value, decimals = 0, prefix = '', suffix = '', label, detail }) => {
          const fractionDigits = Math.max(0, Math.min(20, Math.trunc(decimals)));
          const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
          }).format(value);
          return (
            <li className="impact-tile" key={id}>
              <p className="impact-stat-value">{`${prefix}${formatted}${suffix}`}</p>
              <h3>{label}</h3>
              {detail && <p className="impact-stat-detail">{detail}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
