import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { values } from '../data/content';
import { Icon } from '../components/Icon';
import { CTABand, SectionHeading } from '../components/Ui';

const skillGroups = [
  { title: { en: 'Frontend', ar: 'واجهات المستخدم', zh: '前端' }, items: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML/CSS'] },
  { title: { en: 'Backend', ar: 'الخوادم والقواعد', zh: '后端' }, items: ['Laravel', 'PHP', 'REST APIs', 'MySQL', 'Auth & RBAC'] },
  { title: { en: 'Data & Automation', ar: 'البيانات والأتمتة', zh: '数据与自动化' }, items: ['Python', 'Pandas', 'OpenPyXL', 'SQL', 'Pytest'] },
  { title: { en: 'Delivery', ar: 'التسليم', zh: '交付' }, items: ['Git', 'Vite', 'Testing', 'Documentation', 'Deployment'] },
];

export default function About() {
  const { lang, t, localize } = useLanguage();
  const pick = (value: { en: string; ar: string; zh: string }) => value[lang];
  return (
    <>
      <section className="page-hero">
        <div className="container about-hero">
          <div className="about-hero__portrait" aria-hidden="true">
            <span>E</span>
          </div>
          <div>
            <SectionHeading eyebrow={t('about.eyebrow')} title={t('about.title')} />
            <p className="lead">{t('about.lead')}</p>
            <Link to="/contact" className="btn btn--primary mt-md">
              {t('about.cta')} <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <SectionHeading title={t('about.skillsTitle')} />
          <div className="grid grid--4">
            {skillGroups.map((group) => (
              <div key={group.title.en} className="skill-group">
                <h3>{pick(group.title)}</h3>
                <div className="chips">
                  {group.items.map((item) => <span key={item} className="chip">{item}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading title={t('about.valuesTitle')} />
          <div className="grid grid--2">
            {values.map((value) => (
              <div key={value.title.en} className="value-card value-card--wide">
                <span className="value-card__icon"><Icon name={value.icon} size={22} /></span>
                <div>
                  <h3>{localize(value.title)}</h3>
                  <p>{localize(value.description)}</p>
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
