import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { faqs } from '../data/content';
import { Icon } from '../components/Icon';
import { CTABand, SectionHeading } from '../components/Ui';

export default function Faq() {
  const { t, localize } = useLanguage();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <SectionHeading
            eyebrow={t('faq.eyebrow')}
            title={t('faq.title')}
            subtitle={t('faq.subtitle')}
            center
          />
        </div>
      </section>
      <section className="section section--muted">
        <div className="container faq-list">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div key={faq.q.en} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="faq-item__question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  <span>{localize(faq.q)}</span>
                  <Icon name="chevron" size={20} />
                </button>
                <div id={`faq-answer-${index}`} className="faq-item__answer" hidden={!isOpen}>{localize(faq.a)}</div>
              </div>
            );
          })}
        </div>
      </section>
      <CTABand />
    </>
  );
}
