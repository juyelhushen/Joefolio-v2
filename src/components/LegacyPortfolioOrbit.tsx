import { Globe2 } from 'lucide-react';

const orbitDefinitions = [
  { className: 'legacy-orbit-outer', satellites: ['legacy-satellite-cyan'] },
  {
    className: 'legacy-orbit-middle',
    satellites: ['legacy-satellite-violet', 'legacy-satellite-blue'],
  },
  { className: 'legacy-orbit-inner', satellites: ['legacy-satellite-amber'] },
] as const;

export default function LegacyPortfolioOrbit() {
  return (
    <div className="legacy-portfolio-orbit" data-testid="legacy-portfolio-orbit">
      <div className="legacy-orbit-atmosphere" aria-hidden="true" />
      {orbitDefinitions.map((orbit) => (
        <div
          className={`legacy-orbit-plane ${orbit.className}`}
          data-testid="legacy-orbit"
          key={orbit.className}
          aria-hidden="true"
        >
          <div className="legacy-orbit-track" />
          <div className="legacy-satellite-path">
            {orbit.satellites.map((satellite) => (
              <span className={`legacy-orbit-satellite ${satellite}`} key={satellite} />
            ))}
          </div>
        </div>
      ))}
      <a
        className="legacy-portfolio-link"
        href="https://juyelhushen.netlify.app/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit my previous portfolio"
      >
        <span className="legacy-portfolio-gateway">
          <Globe2 size={25} strokeWidth={1.45} aria-hidden="true" />
          <span>JH</span>
        </span>
        <span className="legacy-portfolio-label" aria-hidden="true">
          EXPLORE LEGACY PORTFOLIO
        </span>
      </a>
      <span className="legacy-orbit-spark legacy-orbit-spark-one" aria-hidden="true" />
      <span className="legacy-orbit-spark legacy-orbit-spark-two" aria-hidden="true" />
    </div>
  );
}
