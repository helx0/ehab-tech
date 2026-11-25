import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { Icon } from './Icon';

const navItems = [
  { to: '/', key: 'nav.home' },
  { to: '/services', key: 'nav.services' },
  { to: '/portfolio', key: 'nav.portfolio' },
  { to: '/about', key: 'nav.about' },
  { to: '/process', key: 'nav.process' },
  { to: '/pricing', key: 'nav.pricing' },
  { to: '/faq', key: 'nav.faq' },
];

function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();
  return (
    <div className="lang-switch" role="group" aria-label={t('common.language')}>
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          className={`lang-switch__btn ${lang === language.code ? 'is-active' : ''}`}
          onClick={() => setLang(language.code)}
          title={language.native}
          aria-pressed={lang === language.code}
        >
          {language.short}
        </button>
      ))}
    </div>
  );
}

function Header() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand" aria-label="EHAB TECH home">
          <span className="brand__mark">E</span>
          <span className="brand__text">
            EHAB<span>TECH</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <LanguageSwitcher />
          <Link to="/contact" className="btn btn--primary btn--sm header-cta">
            {t('nav.startProject')}
            <Icon name="arrow" size={16} />
          </Link>
          <button
            type="button"
            className="menu-button"
            aria-label={open ? t('nav.close') : t('nav.menu')}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'mobile-nav__link is-active' : 'mobile-nav__link')}
            >
              {t(item.key)}
            </NavLink>
          ))}
          <Link to="/contact" className="btn btn--primary mobile-nav__cta">
            {t('nav.startProject')}
          </Link>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { t, localize } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand">
            <span className="brand__mark">E</span>
            <span className="brand__text">
              EHAB<span>TECH</span>
            </span>
          </Link>
          <p>{t('footer.tagline')}</p>
          <span className="footer-available">
            <span className="dot" /> {t('hero.available')}
          </span>
        </div>

        <div>
          <h3 className="footer-heading">{t('footer.quickLinks')}</h3>
          <ul className="footer-list">
            <li><Link to="/about">{t('nav.about')}</Link></li>
            <li><Link to="/process">{t('nav.process')}</Link></li>
            <li><Link to="/pricing">{t('nav.pricing')}</Link></li>
            <li><Link to="/faq">{t('nav.faq')}</Link></li>
            <li><Link to="/privacy">{t('privacy.title')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="footer-heading">{t('footer.services')}</h3>
          <ul className="footer-list">
            <li><Link to="/services/website">{localize({ en: 'Web Development', ar: 'تطوير المواقع', zh: '网站开发' })}</Link></li>
            <li><Link to="/services/systems">{localize({ en: 'Business Systems', ar: 'أنظمة الأعمال', zh: '企业系统' })}</Link></li>
            <li><Link to="/services/automation">{localize({ en: 'Python Automation', ar: 'أتمتة Python', zh: 'Python 自动化' })}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="footer-heading">{t('footer.contact')}</h3>
          <ul className="footer-list">
            <li><Link to="/contact">{t('nav.contact')}</Link></li>
            <li><a href="mailto:eng.ayhabtwfyq@gmail.com">eng.ayhabtwfyq@gmail.com</a></li>
            <li><a href="https://wa.me/967778172806" target="_blank" rel="noopener noreferrer">+967 778 172 806</a></li>
            <li><span className="muted">{t('contact.response')}</span></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {year} EHAB TECH. {t('footer.rights')}</span>
        <span>{t('footer.note')}</span>
      </div>
    </footer>
  );
}

export function Layout() {
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}
