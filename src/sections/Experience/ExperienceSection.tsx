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
            Every chapter <em>built something.</em>
          </h2>
        </div>
        <p>
          Four career chapters, from a Java Developer Internship through to my current Software
          Engineer II role.
        </p>
      </ScrollReveal>
      <ScrollReveal className="career-odyssey-reveal">
        <ExperienceTimeline reduceMotion={reduceMotion} />
      </ScrollReveal>
    </section>
  );
}
