import { useLanguage } from '../context/LanguageContext';
import { SectionHeading } from '../components/Ui';

export default function Privacy() {
  const { t } = useLanguage();
  return (
    <section className="page-hero">
      <div className="container narrow-container">
        <SectionHeading eyebrow={t('privacy.updated')} title={t('privacy.title')} />
        <div className="prose-block">
          <p className="lead">{t('privacy.intro')}</p>
          <h2>{t('privacy.dataTitle')}</h2>
          <p>{t('privacy.dataBody')}</p>
          <h2>{t('privacy.cookiesTitle')}</h2>
          <p>{t('privacy.cookiesBody')}</p>
          <h2>{t('privacy.contactTitle')}</h2>
          <p>{t('privacy.contactBody')}</p>
        </div>
      </div>
    </section>
  );
}
