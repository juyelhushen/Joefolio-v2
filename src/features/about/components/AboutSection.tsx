import { experience } from '../../experience/data/experience';
import { skillGroups } from '../../skills/data/skills';
import './AboutSection.css';

export default function AboutSection() {
  return (
    <section className="about-section page-column" id="about" aria-labelledby="experience-title">
      <h2 id="experience-title">Experience</h2>
      <ol className="experience-list">
        {experience.map((entry) => (
          <li className="experience-row" key={entry.id}>
            <span className="experience-dates">{entry.dates ?? ''}</span>
            <span>
              {entry.role}, {entry.employer}
              {entry.current && <span className="current-role">Current</span>}
            </span>
          </li>
        ))}
      </ol>
      <h2 id="toolbox-title">Toolbox</h2>
      <ul className="toolbox-list" aria-labelledby="toolbox-title">
        {skillGroups.map((group) => (
          <li key={group.id}>
            <span>{group.name}</span>
            <span className="toolbox-skills">{group.skills.join(' · ')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
