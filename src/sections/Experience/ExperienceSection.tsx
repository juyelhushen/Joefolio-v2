import ScrollReveal from '../../components/ScrollReveal';
import ExperienceTimeline from './ExperienceTimeline';
import './ExperienceSection.css';

type ExperienceSectionProps = {
  reduceMotion: boolean;
};

export default function ExperienceSection({ reduceMotion }: ExperienceSectionProps) {
  return (
    <section
      className="experience-section section-wrap"
      id="experience"
      aria-labelledby="experience-title"
    >
      <ScrollReveal className="section-heading career-heading">
        <div>
          <span className="section-kicker">CAREER ODYSSEY / 003</span>
          <h2 id="experience-title">
            Career, <em>chapter by chapter.</em>
          </h2>
        </div>
        <p>A reverse-chronological timeline of the roles and dates currently documented.</p>
      </ScrollReveal>
      <ScrollReveal className="career-odyssey-reveal">
        <ExperienceTimeline reduceMotion={reduceMotion} />
      </ScrollReveal>
    </section>
  );
}
