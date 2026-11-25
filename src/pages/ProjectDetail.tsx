import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { projects } from '../data/content';
import { Icon } from '../components/Icon';
import { CTABand, Eyebrow } from '../components/Ui';
import NotFound from './NotFound';

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, localize } = useLanguage();
  const index = projects.findIndex((item) => item.slug === slug);
  const project = projects[index];

  if (!project) return <NotFound />;

  const next = projects[(index + 1) % projects.length];

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Eyebrow>{localize(project.tag)}</Eyebrow>
          <h1>{localize(project.title)}</h1>
          <p className="lead">{localize(project.summary)}</p>
        </div>
        <div className="container project-detail__image-wrap">
          <img src={project.image} alt={localize(project.title)} width="800" height="500" />
        </div>
      </section>

      <section className="section">
        <div className="container prose-grid">
          <article className="prose-block">
            <h2>{t('project.challenge')}</h2>
            <p>{localize(project.challenge)}</p>
            <h2>{t('project.approach')}</h2>
            <p>{localize(project.approach)}</p>
            <h2>{t('project.result')}</h2>
            <p className="callout-text">{localize(project.result)}</p>
          </article>
          <aside className="side-card">
            <h3>{t('project.role')}</h3>
            <p>{localize(project.role)}</p>
            <h3 className="mt-lg">{t('project.stack')}</h3>
            <div className="chips">
              {project.stack.map((tech) => <span key={tech} className="chip">{tech}</span>)}
            </div>
            {project.demoUrl && (
              <Link to={project.demoUrl} className="btn btn--primary btn--block mt-lg">
                {t('common.openDemo')} <Icon name="external" size={18} />
              </Link>
            )}
            <Link to="/contact" className="btn btn--ghost btn--block mt-md">
              {t('common.requestQuote')} <Icon name="arrow" size={18} />
            </Link>
          </aside>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <Eyebrow>{t('project.next')}</Eyebrow>
          <Link to={`/portfolio/${next.slug}`} className="next-project">
            <span>{localize(next.title)}</span>
            <Icon name="arrow" size={24} />
          </Link>
        </div>
      </section>
      <CTABand />
    </>
  );
}
