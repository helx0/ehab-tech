import { useLanguage } from '../context/LanguageContext';
import { services } from '../data/content';
import { CTABand, SectionHeading, ServiceCard } from '../components/Ui';

export default function Services() {
  const { t } = useLanguage();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <SectionHeading
            eyebrow={t('services.eyebrow')}
            title={t('services.title')}
            subtitle={t('services.subtitle')}
            center
          />
        </div>
      </section>
      <section className="section section--muted">
        <div className="container">
          <div className="grid grid--3">
            {services.map((service) => <ServiceCard key={service.slug} service={service} />)}
          </div>
        </div>
      </section>
      <CTABand />
    </>
  );
}
