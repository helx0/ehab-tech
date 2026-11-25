import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { projects, services } from '../data/content';
import { CTABand, ProjectCard, SectionHeading } from '../components/Ui';

export default function Portfolio() {
  const { t, localize } = useLanguage();
  const [filter, setFilter] = useState<string>('all');
  const visible = filter === 'all' ? projects : projects.filter((project) => project.category === filter);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <SectionHeading
            eyebrow={t('portfolio.eyebrow')}
            title={t('portfolio.title')}
            subtitle={t('portfolio.subtitle')}
            center
          />
        </div>
      </section>
      <section className="section section--muted">
        <div className="container">
          <div className="filter-row" role="group" aria-label={t('portfolio.title')}>
            <button
              type="button"
              className={`filter-btn ${filter === 'all' ? 'is-active' : ''}`}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              {t('common.all')}
            </button>
            {services.map((service) => (
              <button
                key={service.slug}
                type="button"
                className={`filter-btn ${filter === service.slug ? 'is-active' : ''}`}
                aria-pressed={filter === service.slug}
                onClick={() => setFilter(service.slug)}
              >
                {localize(service.title)}
              </button>
            ))}
          </div>
          <div className="grid grid--3">
            {visible.map((project) => <ProjectCard key={project.slug} project={project} />)}
          </div>
        </div>
      </section>
      <CTABand />
    </>
  );
}
