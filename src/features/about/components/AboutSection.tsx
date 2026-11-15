import { experience } from '../../experience/data/experience';
import { skillGroups } from '../../skills/data/skills';
import './AboutSection.css';

export default function AboutSection() {
  return (
    <section className="about-section page-column" id="about" aria-labelledby="experience">
      <h2 id="experience">Experience</h2>
      <ol className="experience-list">
        {experience.map((entry) => (
          <li className="experience-row" key={entry.id}>
            <div>
              <strong>
                {entry.role}, {entry.employer}
              </strong>
              {entry.dates && <span className="experience-dates">{entry.dates}</span>}
            </div>
            {entry.current && <span className="current-role">Current</span>}
          </li>
        ))}
      </ol>
      <h2 id="skills">Toolbox</h2>
      <ul className="toolbox-list" aria-labelledby="skills">
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
