import ScrollReveal from '../../../components/common/ScrollReveal';
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
      <ScrollReveal className="section-heading career-heading" headingReveal>
        <div>
          <span className="section-kicker">02 / EXPERIENCE</span>
          <h2 id="experience-title">
            <span className="heading-line-mask">
              <span className="heading-line">
                Career, <em>chapter by chapter.</em>
              </span>
            </span>
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
