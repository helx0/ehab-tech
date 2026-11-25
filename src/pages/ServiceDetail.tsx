import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { services } from '../data/content';
import { Icon } from '../components/Icon';
import { CTABand, Eyebrow } from '../components/Ui';
import NotFound from './NotFound';

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, localize } = useLanguage();
  const service = services.find((item) => item.slug === slug);

  if (!service) return <NotFound />;

  const others = services.filter((item) => item.slug !== service.slug);
  const IconName = service.icon;

  return (
    <>
      <section className="page-hero">
        <div className="container detail-hero">
          <div className="detail-hero__icon"><Icon name={IconName} size={30} /></div>
          <div>
            <Eyebrow>{t('services.eyebrow')}</Eyebrow>
            <h1>{localize(service.title)}</h1>
            <p className="lead">{localize(service.summary)}</p>
            <div className="chips chips--large">
              {service.tech.map((tech) => <span key={tech} className="chip">{tech}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container prose-grid">
          <article className="prose-block">
            <h2>{t('services.problem')}</h2>
            <p>{localize(service.problem)}</p>
            <h2>{t('services.solution')}</h2>
            <p>{localize(service.solution)}</p>
            <h2>{t('services.example')}</h2>
            <p className="callout-text">{localize(service.example)}</p>
          </article>
          <aside className="side-card">
            <h3>{t('services.features')}</h3>
            <ul className="check-list">
              {localize(service.features).map((feature) => (
                <li key={feature}><Icon name="check" size={16} /> {feature}</li>
              ))}
            </ul>
            <h3 className="mt-lg">{t('services.deliverables')}</h3>
            <ul className="check-list">
              {localize(service.deliverables).map((item) => (
                <li key={item}><Icon name="check" size={16} /> {item}</li>
              ))}
            </ul>
            <Link to="/contact" className="btn btn--primary btn--block mt-lg">
              {t('common.requestQuote')} <Icon name="arrow" size={18} />
            </Link>
          </aside>
        </div>
      </section>

      {(service.slug === 'website' || service.slug === 'systems' || service.slug === 'automation') && (
        <section className="section">
          <div className="container">
            <div className="demo-promo">
              <div>
                <Eyebrow>{t('common.liveDemo')}</Eyebrow>
                <h2>{t('services.demoTitle')}</h2>
                <p>
                  {service.slug === 'website'
                    ? t('services.demoText')
                    : service.slug === 'systems'
                      ? t('services.demoTextSystem')
                      : t('services.demoTextAutomation')}
                </p>
              </div>
              <Link
                to={service.slug === 'website' ? '/demos/website' : service.slug === 'systems' ? '/demos/system' : '/demos/automation'}
                className="btn btn--primary"
              >
                {t('common.openDemo')} <Icon name="external" size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section section--muted">
        <div className="container">
          <div className="section-heading">
            <Eyebrow>{t('services.other')}</Eyebrow>
            <h2>{t('services.title')}</h2>
          </div>
          <div className="grid grid--2">
            {others.map((item) => (
              <Link key={item.slug} to={`/services/${item.slug}`} className="mini-service">
                <span className="mini-service__icon"><Icon name={item.icon} size={22} /></span>
                <div>
                  <h3>{localize(item.title)}</h3>
                  <p>{localize(item.summary)}</p>
                </div>
                <Icon name="arrow" size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CTABand />
    </>
  );
}
