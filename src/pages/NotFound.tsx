import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from '../components/Icon';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <section className="notfound">
      <div className="container">
        <span className="notfound__code">404</span>
        <h1>{t('notfound.title')}</h1>
        <p>{t('notfound.subtitle')}</p>
        <Link to="/" className="btn btn--primary">
          <Icon name="arrowLeft" size={18} /> {t('common.backHome')}
        </Link>
      </div>
    </section>
  );
}
