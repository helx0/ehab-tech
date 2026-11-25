import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://ehabtech.example').replace(/\/$/, '');

const ROUTES: Record<string, { title: string; description: string }> = {
  '/': { title: 'EHAB TECH — Websites, Systems & Automation', description: 'Independent developer building business websites, management systems and Python data automation for clients worldwide.' },
  '/services': { title: 'Services — EHAB TECH', description: 'Web development, business management systems and Python automation, delivered end to end.' },
  '/services/website': { title: 'Web Development — EHAB TECH', description: 'Fast, bilingual, conversion-focused business websites built by EHAB TECH.' },
  '/services/systems': { title: 'Business Systems — EHAB TECH', description: 'Management dashboards for customers, orders, stock, reporting and role-based access.' },
  '/services/automation': { title: 'Python Automation — EHAB TECH', description: 'Dependency-free Python pipelines that clean messy data and generate executive reports.' },
  '/portfolio': { title: 'Portfolio — EHAB TECH', description: 'Real working demo projects: SANA COFFEE, EHAB Management OS and the EHAB Data Pipeline.' },
  '/about': { title: 'About — EHAB TECH', description: 'Meet the independent developer behind EHAB TECH and learn how projects are delivered.' },
  '/process': { title: 'Process — EHAB TECH', description: 'A clear, transparent process from discovery to delivery.' },
  '/pricing': { title: 'Pricing — EHAB TECH', description: 'Simple, transparent starting packages for websites, systems and automation.' },
  '/faq': { title: 'FAQ — EHAB TECH', description: 'Answers to common questions about working with EHAB TECH.' },
  '/contact': { title: 'Contact — EHAB TECH', description: 'Start a project with EHAB TECH. Email eng.ayhabtwfyq@gmail.com or WhatsApp +967 778 172 806.' },
  '/privacy': { title: 'Privacy — EHAB TECH', description: 'How EHAB TECH handles your data.' },
};

const GENERIC: Record<string, { title: string; description: string }> = {
  'services': { title: 'Service — EHAB TECH', description: 'A focused service delivered end to end by EHAB TECH.' },
  'portfolio': { title: 'Project — EHAB TECH', description: 'A real working demo project by EHAB TECH.' },
};

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function RouteMeta() {
  const { pathname } = useLocation();
  const { lang } = useLanguage();

  useEffect(() => {
    const segment = pathname.split('/')[2] ?? '';
    const invalidService = pathname.startsWith('/services/') && !['website', 'systems', 'automation'].includes(segment);
    const invalidProject = pathname.startsWith('/portfolio/') && !['sana-coffee-website', 'management-os', 'automation-pipeline'].includes(segment);
    const unknown = !pathname.startsWith('/demos/') && !ROUTES[pathname] && !invalidService && !invalidProject;
    const is404 = invalidService || invalidProject || unknown;

    setMeta('name', 'robots', is404 ? 'noindex, follow' : 'index, follow');
    if (pathname.startsWith('/demos/')) return;

    const exact = ROUTES[pathname];
    const prefix = pathname.startsWith('/services/') ? 'services' : pathname.startsWith('/portfolio/') ? 'portfolio' : '';
    const meta = is404
      ? { title: 'Page not found', description: 'The requested page does not exist.' }
      : exact ?? GENERIC[prefix] ?? ROUTES['/'];
    const suffix = lang === 'ar' ? ' | إيهاب تيك' : ' | EHAB TECH';
    document.title = `${meta.title}${suffix}`;
    setMeta('name', 'description', meta.description);
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:image', `${SITE_URL}/og-image.svg`);
    setMeta('property', 'og:url', `${SITE_URL}${pathname}`);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_URL}${pathname}`;

    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((node) => node.remove());
    for (const code of ['en', 'ar', 'zh', 'x-default']) {
      const alternate = document.createElement('link');
      alternate.rel = 'alternate';
      alternate.hreflang = code;
      alternate.href = `${SITE_URL}${pathname}${code === 'x-default' ? '' : `?lang=${code}`}`;
      document.head.appendChild(alternate);
    }
  }, [pathname, lang]);

  return null;
}
