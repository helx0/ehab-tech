import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { plans } from '../data/content';
import { Icon } from '../components/Icon';
import { CTABand, SectionHeading } from '../components/Ui';

export default function Pricing() {
  const { t, localize } = useLanguage();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <SectionHeading
            eyebrow={t('pricing.eyebrow')}
            title={t('pricing.title')}
            subtitle={t('pricing.subtitle')}
            center
          />
        </div>
      </section>
      <section className="section section--muted">
        <div className="container">
          <div className="grid grid--3 pricing-grid">
            {plans.map((plan) => (
              <div key={plan.id} className={`plan-card ${plan.featured ? 'is-featured' : ''}`}>
                {plan.featured && <span className="plan-card__badge">{t('pricing.popular')}</span>}
                <h3>{localize(plan.title)}</h3>
                <div className="plan-card__price">{localize(plan.price)}</div>
                <p>{localize(plan.description)}</p>
                <ul className="check-list">
                  {localize(plan.features).map((feature) => (
                    <li key={feature}><Icon name="check" size={16} /> {feature}</li>
                  ))}
                </ul>
                <Link
                  to={`/contact?service=${plan.id === 'automation' ? 'automation' : plan.id === 'growth' ? 'systems' : 'website'}`}
                  className={`btn btn--block ${plan.featured ? 'btn--primary' : 'btn--ghost'}`}
                >
                  {t('common.requestQuote')} <Icon name="arrow" size={18} />
                </Link>
              </div>
            ))}
          </div>
          <p className="pricing-note">{t('pricing.note')}</p>
        </div>
      </section>
      <CTABand />
    </>
  );
}
