import { useLanguage } from '../context/LanguageContext';
import { processSteps } from '../data/content';
import { CTABand, SectionHeading } from '../components/Ui';
import { Icon } from '../components/Icon';

export default function Process() {
  const { t, localize } = useLanguage();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <SectionHeading
            eyebrow={t('process.eyebrow')}
            title={t('process.title')}
            subtitle={t('process.subtitle')}
            center
          />
        </div>
      </section>
      <section className="section section--muted">
        <div className="container">
          <div className="steps-grid steps-grid--all">
            {processSteps.map((step) => (
              <div key={step.n} className="step-card">
                <span className="step-card__number">{step.n}</span>
                <h3>{localize(step.title)}</h3>
                <p>{localize(step.description)}</p>
                <div className="step-card__output">
                  <Icon name="check" size={16} /> {localize(step.output)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CTABand />
    </>
  );
}
