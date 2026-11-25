import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { projects, services, processSteps, values } from '../data/content';
import { Icon } from '../components/Icon';
import { CTABand, ProjectCard, SectionHeading, ServiceCard } from '../components/Ui';

export default function Home() {
  const { t, localize } = useLanguage();

  return (
    <>
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="pill"><span className="dot" /> {t('hero.badge')}</span>
            <h1>{t('hero.title')}</h1>
            <p className="hero__subtitle">{t('hero.subtitle')}</p>
            <div className="hero__actions">
              <Link to="/services" className="btn btn--primary">
                {t('hero.ctaPrimary')} <Icon name="arrow" size={18} />
              </Link>
              <Link to="/contact" className="btn btn--ghost">
                {t('hero.ctaSecondary')}
              </Link>
            </div>
            <ul className="hero__points">
              <li><Icon name="check" size={16} /> {t('home.strength1')}</li>
              <li><Icon name="check" size={16} /> {t('home.strength2')}</li>
              <li><Icon name="check" size={16} /> {t('home.strength3')}</li>
            </ul>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <div className="code-window">
              <div className="code-window__bar">
                <span /><span /><span />
                <small>ehab-tech / solutions</small>
              </div>
              <div className="code-window__body">
                <p><span className="code-key">const</span> services = [</p>
                <p className="indent">{'{ name: '}<span className="code-str">'Web Development'</span>{' },'}</p>
                <p className="indent">{'{ name: '}<span className="code-str">'Business Systems'</span>{' },'}</p>
                <p className="indent">{'{ name: '}<span className="code-str">'Python Automation'</span>{' },'}</p>
                <p>];</p>
                <p className="code-comment">// clean scope · direct communication · real delivery</p>
                <p><span className="code-key">export default</span> EHAB_TECH;</p>
              </div>
            </div>
            <div className="hero__card hero__card--one">
              <Icon name="globe" size={22} />
              <span>EN · 中文 · ع</span>
            </div>
            <div className="hero__card hero__card--two">
              <Icon name="check" size={18} />
              <span>{t('hero.available')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <SectionHeading
            eyebrow={t('home.servicesEyebrow')}
            title={t('home.servicesTitle')}
            subtitle={t('home.servicesSubtitle')}
          />
          <div className="grid grid--3">
            {services.map((service) => <ServiceCard key={service.slug} service={service} />)}
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <SectionHeading
            eyebrow={t('home.workEyebrow')}
            title={t('home.workTitle')}
            subtitle={t('home.workSubtitle')}
          />
          <div className="grid grid--3">
            {projects.map((project) => <ProjectCard key={project.slug} project={project} />)}
          </div>
          <div className="center-row">
            <Link to="/portfolio" className="btn btn--ghost">
              {t('nav.portfolio')} <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow={t('home.whyEyebrow')}
            title={t('home.whyTitle')}
            subtitle={t('home.whySubtitle')}
          />
          <div className="grid grid--4">
            {values.map((value) => (
              <div key={value.title.en} className="value-card">
                <span className="value-card__icon"><Icon name={value.icon} size={22} /></span>
                <h3>{localize(value.title)}</h3>
                <p>{localize(value.description)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <SectionHeading
            eyebrow={t('home.processEyebrow')}
            title={t('home.processTitle')}
            subtitle={t('home.processSubtitle')}
          />
          <div className="steps-grid">
            {processSteps.slice(0, 4).map((step) => (
              <div key={step.n} className="step-card">
                <span className="step-card__number">{step.n}</span>
                <h3>{localize(step.title)}</h3>
                <p>{localize(step.description)}</p>
              </div>
            ))}
          </div>
          <div className="center-row">
            <Link to="/process" className="text-link">
              {t('nav.process')} <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
