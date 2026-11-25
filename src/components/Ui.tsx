import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import type { Project, Service } from '../data/content';
import { Icon } from './Icon';

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`section-heading ${center ? 'section-heading--center' : ''}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const { localize, t } = useLanguage();
  return (
    <Link to={`/services/${service.slug}`} className="service-card">
      <div className="service-card__top">
        <span className="service-card__icon">
          <Icon name={service.icon} size={24} />
        </span>
        <span className="service-card__arrow"><Icon name="arrow" size={18} /></span>
      </div>
      <h3>{localize(service.title)}</h3>
      <p>{localize(service.summary)}</p>
      <div className="chips">
        {service.tech.slice(0, 3).map((tech) => (
          <span key={tech} className="chip">{tech}</span>
        ))}
      </div>
      <span className="service-card__link">{t('common.readMore')}</span>
    </Link>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const { localize, t } = useLanguage();
  return (
    <Link to={`/portfolio/${project.slug}`} className="project-card">
      <div className={`project-card__visual project-card__visual--${project.accent}`}>
        <img
          className="project-card__image"
          src={project.image}
          alt={localize(project.title)}
          width="800"
          height="500"
          loading="lazy"
        />
        <span className="project-card__tag">{localize(project.tag)}</span>
      </div>
      <div className="project-card__body">
        <h3>{localize(project.title)}</h3>
        <p>{localize(project.summary)}</p>
        <span className="text-link">
          {t('common.viewProject')} <Icon name="arrow" size={16} />
        </span>
      </div>
    </Link>
  );
}

export function CTABand() {
  const { t } = useLanguage();
  return (
    <section className="cta-band">
      <div className="container cta-band__inner">
        <div>
          <h2>{t('home.ctaTitle')}</h2>
          <p>{t('home.ctaSubtitle')}</p>
        </div>
        <Link to="/contact" className="btn btn--primary">
          {t('nav.startProject')} <Icon name="arrow" size={18} />
        </Link>
      </div>
    </section>
  );
}
