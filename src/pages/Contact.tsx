import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { services } from '../data/content';
import { Icon } from '../components/Icon';
import { SectionHeading } from '../components/Ui';

const budgetOptions = [
  { value: 'small', label: { en: 'Under $500', ar: 'أقل من ٥٠٠ دولار', zh: '低于 $500' } },
  { value: 'medium', label: { en: '$500 – $2,000', ar: '٥٠٠ – ٢٠٠٠ دولار', zh: '$500 – $2,000' } },
  { value: 'large', label: { en: 'Over $2,000', ar: 'أكثر من ٢٠٠٠ دولار', zh: '高于 $2,000' } },
  { value: 'unknown', label: { en: 'Not sure yet', ar: 'غير محدد بعد', zh: '还不确定' } },
];

export default function Contact() {
  const { t, localize } = useLanguage();
  const [params] = useSearchParams();
  const preselected = params.get('service') ?? '';
  const [form, setForm] = useState({
    name: '',
    email: '',
    service: services.some((item) => item.slug === preselected) ? preselected : '',
    budget: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.service || !form.message.trim()) {
      setError(t('contact.errorRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t('contact.errorEmail'));
      return;
    }
    const subject = `Project request — ${form.service}`;
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Service: ${form.service}`,
      `Budget: ${form.budget || 'Not specified'}`,
      '',
      form.message,
    ].join('\n');
    window.location.href = `mailto:eng.ayhabtwfyq@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <SectionHeading
            eyebrow={t('contact.eyebrow')}
            title={t('contact.title')}
            subtitle={t('contact.subtitle')}
            center
          />
        </div>
      </section>

      <section className="section section--muted">
        <div className="container contact-grid">
          <div className="contact-form-card">
            <h2>{t('contact.formTitle')}</h2>
            {sent ? (
              <div className="success-box" role="status">
                <span className="success-box__icon"><Icon name="check" size={26} /></span>
                <h3>{t('contact.success')}</h3>
                <p>{t('contact.successSub')}</p>
                <button type="button" className="text-link" onClick={() => setSent(false)}>
                  {t('nav.contact')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <label>
                    <span>{t('contact.name')} *</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => update('name', event.target.value)}
                      placeholder={t('contact.namePlaceholder')}
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    <span>{t('contact.email')} *</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => update('email', event.target.value)}
                      placeholder={t('contact.emailPlaceholder')}
                      autoComplete="email"
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    <span>{t('contact.service')} *</span>
                    <select value={form.service} onChange={(event) => update('service', event.target.value)}>
                      <option value="">{t('contact.servicePlaceholder')}</option>
                      {services.map((service) => (
                        <option key={service.slug} value={service.slug}>{localize(service.title)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{t('contact.budget')}</span>
                    <select value={form.budget} onChange={(event) => update('budget', event.target.value)}>
                      <option value="">{t('contact.budgetPlaceholder')}</option>
                      {budgetOptions.map((option) => (
                        <option key={option.value} value={option.value}>{localize(option.label)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  <span>{t('contact.message')} *</span>
                  <textarea
                    rows={6}
                    value={form.message}
                    onChange={(event) => update('message', event.target.value)}
                    placeholder={t('contact.messagePlaceholder')}
                  />
                </label>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="btn btn--primary btn--block">
                  {t('contact.submit')} <Icon name="arrow" size={18} />
                </button>
              </form>
            )}
          </div>

          <aside className="contact-aside">
            <h2>{t('contact.otherWays')}</h2>
            <a className="contact-method" href="mailto:eng.ayhabtwfyq@gmail.com">
              <span className="contact-method__icon"><Icon name="mail" size={22} /></span>
              <span>
                <strong>{t('contact.emailUs')}</strong>
                <small>eng.ayhabtwfyq@gmail.com</small>
              </span>
              <Icon name="external" size={16} />
            </a>
            <a className="contact-method" href="https://wa.me/967778172806" target="_blank" rel="noopener noreferrer">
              <span className="contact-method__icon"><Icon name="whatsapp" size={22} /></span>
              <span>
                <strong>{t('contact.whatsapp')}</strong>
                <small>+967 778 172 806</small>
              </span>
              <Icon name="external" size={16} />
            </a>
            <p className="contact-note"><Icon name="check" size={16} /> {t('contact.response')}</p>
          </aside>
        </div>
      </section>
    </>
  );
}
