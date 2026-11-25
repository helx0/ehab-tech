import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from '../components/Icon';
import '../demo.css';

type Page = 'home' | 'menu' | 'about' | 'contact';

type Bi = { ar: string; en: string };

interface Product {
  id: string;
  name: Bi;
  description: Bi;
  notes: Bi;
  roast: Bi;
  price: number;
  badge?: Bi;
}

const products: Product[] = [
  {
    id: 'classic',
    name: { ar: 'صنعاء الكلاسيكية', en: 'Sana Classic' },
    description: {
      ar: 'قهوة يمنية متوازنة بنكهة الشوكولاتة والكراميل، مناسبة للاستعمال اليومي.',
      en: 'A balanced Yemeni cup with chocolate and caramel notes — made for everyday drinking.',
    },
    notes: { ar: 'شوكولاتة · كراميل · جوز', en: 'Chocolate · Caramel · Nuts' },
    roast: { ar: 'تحميص متوسط', en: 'Medium roast' },
    price: 12,
    badge: { ar: 'الأكثر مبيعاً', en: 'Best seller' },
  },
  {
    id: 'mountain',
    name: { ar: 'مزيج الجبال', en: 'Mountain Blend' },
    description: {
      ar: 'حبوب من مرتفعات حراز بنكهة الحمضيات المتوازنة ونهاية زهرية.',
      en: 'Beans from Haraz highlands with bright citrus and a delicate floral finish.',
    },
    notes: { ar: 'حمضيات · زهور · عسل', en: 'Citrus · Flowers · Honey' },
    roast: { ar: 'تحميص فاتح', en: 'Light roast' },
    price: 14,
  },
  {
    id: 'pure',
    name: { ar: 'البن اليمني الخالص', en: 'Yemeni Pure' },
    description: {
      ar: 'قهوة أحادية المصدر من مزرعة واحدة، نكهة عميقة وقوام كامل.',
      en: 'Single-origin from one farm — deep flavour and a full, rich body.',
    },
    notes: { ar: 'توت · توابل · كاكاو', en: 'Berries · Spices · Cocoa' },
    roast: { ar: 'تحميص داكن', en: 'Dark roast' },
    price: 16,
    badge: { ar: 'إصدار محدود', en: 'Limited' },
  },
  {
    id: 'gift',
    name: { ar: 'علبة الهدايا', en: 'Gift Box' },
    description: {
      ar: 'ثلاثة أنواع مختارة في علة أنيقة، هدية مناسبة للعملاء والأصدقاء.',
      en: 'Three selected coffees in an elegant box — a thoughtful gift for clients and friends.',
    },
    notes: { ar: 'تشكيلة · تغليف هدايا', en: 'Assortment · Gift wrapped' },
    roast: { ar: 'متوسط · فاتح · داكن', en: 'Medium · Light · Dark' },
    price: 28,
  },
];

const STORAGE_KEY = 'sana-coffee-inquiries';

function readStored(): Record<string, unknown>[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ClientSiteDemo() {
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';
  const pick = (value: Bi) => (isAr ? value.ar : value.en);

  useEffect(() => {
    const previous = document.title;
    document.title = isAr ? 'قهوة صنعاء — معاينة مشروع | EHAB TECH' : 'SANA COFFEE — Live Demo | EHAB TECH';
    return () => { document.title = previous; };
  }, [isAr]);

  const [page, setPage] = useState<Page>('home');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [count, setCount] = useState(() => readStored().length);

  useEffect(() => {
    const sync = () => setCount(readStored().length);
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const navItems: { id: Page; ar: string; en: string }[] = [
    { id: 'home', ar: 'الرئيسية', en: 'Home' },
    { id: 'menu', ar: 'القائمة', en: 'Menu' },
    { id: 'about', ar: 'قصتنا', en: 'Our story' },
    { id: 'contact', ar: 'اطلب', en: 'Order' },
  ];

  function goTo(next: Page) {
    setPage(next);
    setSent(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function order(productId: string) {
    setSelectedProduct(productId);
    setForm((current) => ({ ...current, message: '' }));
    goTo('contact');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !selectedProduct) {
      setError(isAr ? 'يرجى إدخال الاسم ووسيلة التواصل واختيار المنتج.' : 'Please add your name, contact and choose a product.');
      return;
    }
    try {
      const existing = readStored();
      existing.push({
        name: form.name.trim(),
        contact: form.contact.trim(),
        product: selectedProduct,
        message: form.message.trim(),
        at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      setCount(existing.length);
    } catch {
      setError(isAr ? 'تعذّر الحفظ في هذا المتصفح. جرّب متصفحاً آخر.' : 'Could not save in this browser. Please try another browser.');
      return;
    }
    setError('');
    setSent(true);
  }

  return (
    <div className="demo-site" lang={isAr ? 'ar' : 'en'} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="demo-banner">
        <span>{t('common.demoBanner')}</span>
        <Link to="/services/website">← {t('common.backToSite')}</Link>
      </div>

      <header className="demo-header">
        <div className="demo-container demo-header__inner">
          <button type="button" className="demo-brand" onClick={() => goTo('home')}>
            <span className="demo-brand__mark">S</span>
            <span>
              <strong>{isAr ? 'قهوة صنعاء' : 'SANA COFFEE'}</strong>
              <small>{isAr ? 'محمصة يمنية' : 'YEMENI ROASTERY'}</small>
            </span>
          </button>
          <nav className="demo-nav" aria-label={isAr ? 'القائمة' : 'Main menu'}>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={page === item.id ? 'is-active' : ''}
                onClick={() => goTo(item.id)}
              >
                {isAr ? item.ar : item.en}
              </button>
            ))}
          </nav>
          <button type="button" className="demo-order-btn" onClick={() => goTo('contact')}>
            {isAr ? 'اطلب الآن' : 'Order now'}
          </button>
        </div>
      </header>

      {page === 'home' && (
        <>
          <section className="demo-hero">
            <div className="demo-container demo-hero__inner">
              <div>
                <span className="demo-eyebrow">{isAr ? 'من مزارع اليمن إلى كوبك' : 'From Yemeni farms to your cup'}</span>
                <h1>{isAr ? 'قهوة بطعم الأصل.' : 'Coffee that tastes like its origin.'}</h1>
                <p>
                  {isAr
                    ? 'نختار حبوبنا من مزارع حراز وصنعاء، ونحمصها بكميات صغيرة لنحافظ على نكهتها الحقيقية.'
                    : 'We source beans from Haraz and Sana’a farms and roast in small batches to keep the true flavour.'}
                </p>
                <div className="demo-hero__actions">
                  <button type="button" className="demo-btn demo-btn--dark" onClick={() => goTo('menu')}>
                    {isAr ? 'تصفح القائمة' : 'Browse the menu'} <Icon name="arrow" size={18} />
                  </button>
                  <button type="button" className="demo-btn demo-btn--outline" onClick={() => goTo('about')}>
                    {isAr ? 'قصتنا' : 'Our story'}
                  </button>
                </div>
              </div>
              <div className="demo-hero__art" aria-hidden="true">
                <div className="demo-cup">
                  <span className="demo-cup__steam" />
                  <span className="demo-cup__body"><em>S</em></span>
                  <span className="demo-cup__shadow" />
                </div>
              </div>
            </div>
          </section>

          <section className="demo-section">
            <div className="demo-container">
              <div className="demo-section__head">
                <span className="demo-eyebrow">{isAr ? 'مختارة لك' : 'Selected for you'}</span>
                <h2>{isAr ? 'أشهر أنواعنا' : 'Our favourites'}</h2>
              </div>
              <div className="demo-product-grid">
                {products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} pick={pick} isAr={isAr} onOrder={order} />)}
              </div>
            </div>
          </section>

          <section className="demo-section demo-section--cream">
            <div className="demo-container demo-values">
              {[
                { ar: 'حبوب يمنية ١٠٠٪', en: '100% Yemeni beans' },
                { ar: 'تحميص بكميات صغيرة', en: 'Small-batch roasting' },
                { ar: 'توصيل خلال ٢٤ ساعة', en: 'Delivery within 24h' },
              ].map((value) => (
                <div key={value.en}>
                  <Icon name="check" size={20} />
                  <strong>{isAr ? value.ar : value.en}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {page === 'menu' && (
        <section className="demo-section demo-page">
          <div className="demo-container">
            <div className="demo-section__head">
              <span className="demo-eyebrow">{isAr ? 'القائمة' : 'The menu'}</span>
              <h1>{isAr ? 'اختر قهوتك' : 'Choose your coffee'}</h1>
              <p>{isAr ? 'كل الأنواع متوفرة بالحبوب أو مطحونة حسب طلبك.' : 'All coffees available as whole beans or ground to order.'}</p>
            </div>
            <div className="demo-product-grid">
              {products.map((product) => <ProductCard key={product.id} product={product} pick={pick} isAr={isAr} onOrder={order} />)}
            </div>
          </div>
        </section>
      )}

      {page === 'about' && (
        <>
          <section className="demo-section demo-page">
            <div className="demo-container demo-story">
              <div>
                <span className="demo-eyebrow">{isAr ? 'قصتنا' : 'Our story'}</span>
                <h1>{isAr ? 'بدأت من مزرعة صغيرة في حراز.' : 'It started on a small farm in Haraz.'}</h1>
                <p>
                  {isAr
                    ? 'بدأنا بتحميص القهوة للعائلة والأصدقاء، ثم كبر الطلب. اليوم نعمل مع مزارعين محليين ونحمص كل دفعة بعناية.'
                    : 'We started roasting for family and friends, then orders grew. Today we work with local growers and roast every batch with care.'}
                </p>
                <p>
                  {isAr
                    ? 'هذا المشروع نموذج حقيقي أظهر به قدرتي على بناء موقع كامل لعميل: تصميم، لغات، منتجات، وطلبات.'
                    : 'This project is a real working sample of what I can build for a client: design, languages, products and orders.'}
                </p>
              </div>
              <div className="demo-story__card">
                <span>'3'</span>
                <strong>{isAr ? 'منتجات تجريبية' : 'demo products'}</strong>
              </div>
            </div>
          </section>
          <section className="demo-section demo-section--cream">
            <div className="demo-container demo-values">
              {[
                { ar: 'مصدر مباشر من المزارع', en: 'Direct from farms' },
                { ar: 'جودة مُختبرة', en: 'Tested quality' },
                { ar: 'دعم عملاء سريع', en: 'Fast support' },
              ].map((value) => (
                <div key={value.en}>
                  <Icon name="check" size={20} />
                  <strong>{isAr ? value.ar : value.en}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {page === 'contact' && (
        <section className="demo-section demo-page">
          <div className="demo-container demo-contact">
            <div>
              <span className="demo-eyebrow">{isAr ? 'اطلب الآن' : 'Place an order'}</span>
              <h1>{isAr ? 'نرسل لك قهوتك الطازجة.' : 'Fresh coffee, on its way.'}</h1>
              <p>
                {isAr
                  ? 'أرسل طلبك وسنتواصل معك لتأكيد الكمية والعنوان.'
                  : 'Send your request and we will confirm quantity and delivery details with you.'}
              </p>
              <div className="demo-contact__count">
                <Icon name="check" size={18} />
                {isAr ? `الطلبات المحفوظة في هذه المعاينة: ${count}` : `Requests saved in this preview: ${count}`}
              </div>
            </div>

            <div className="demo-form-card">
              {sent ? (
                <div className="demo-success">
                  <Icon name="check" size={30} />
                  <h2>{isAr ? 'تم حفظ طلبك!' : 'Your request is saved!'}</h2>
                  <p>
                    {isAr
                      ? 'هذا نموذج حقيقي يحفظ البيانات في متصفحك. في الإنتاج نربطه بخادم ورسالة بريد.'
                      : 'This is a real form that saves data in your browser. In production it connects to a server and email.'}
                  </p>
                  <button type="button" className="demo-btn demo-btn--dark" onClick={() => goTo('home')}>
                    {isAr ? 'العودة للرئيسية' : 'Back to home'}
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <label>
                    <span>{isAr ? 'الاسم' : 'Name'}</span>
                    <input
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) => { setForm({ ...form, name: event.target.value }); setError(''); }}
                      placeholder={isAr ? 'اسمك الكامل' : 'Your full name'}
                    />
                  </label>
                  <label>
                    <span>{isAr ? 'البريد أو الهاتف' : 'Email or phone'}</span>
                    <input
                      autoComplete="email"
                      value={form.contact}
                      onChange={(event) => { setForm({ ...form, contact: event.target.value }); setError(''); }}
                      placeholder={isAr ? 'بريدك أو رقم هاتفك' : 'Your email or phone'}
                    />
                  </label>
                  <label>
                    <span>{isAr ? 'المنتج' : 'Product'}</span>
                    <select value={selectedProduct} onChange={(event) => { setSelectedProduct(event.target.value); setError(''); }}>
                      <option value="">{isAr ? 'اختر منتجاً' : 'Choose a product'}</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{pick(product.name)} — ${product.price}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</span>
                    <textarea
                      rows={4}
                      value={form.message}
                      onChange={(event) => setForm({ ...form, message: event.target.value })}
                      placeholder={isAr ? 'الكمية، العنوان، أي تفاصيل...' : 'Quantity, address, any details...'}
                    />
                  </label>
                  {error && <p className="demo-error" role="alert">{error}</p>}
                  <button type="submit" className="demo-btn demo-btn--dark demo-btn--block">
                    {isAr ? 'إرسال الطلب' : 'Send request'} <Icon name="arrow" size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="demo-footer">
        <div className="demo-container demo-footer__inner">
          <span>{isAr ? 'قهوة صنعاء — محمصة يمنية' : 'SANA COFFEE — Yemeni roastery'}</span>
          <Link to="/services/website">← {t('common.backToSite')}</Link>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({
  product,
  pick,
  isAr,
  onOrder,
}: {
  product: Product;
  pick: (value: Bi) => string;
  isAr: boolean;
  onOrder: (id: string) => void;
}) {
  return (
    <article className="demo-product">
      <div className={`demo-product__art demo-product__art--${product.id}`}>
        {product.badge && <span className="demo-product__badge">{pick(product.badge)}</span>}
        <span className="demo-beans" aria-hidden="true">☕</span>
      </div>
      <div className="demo-product__body">
        <h3>{pick(product.name)}</h3>
        <p>{pick(product.description)}</p>
        <span className="demo-notes">{pick(product.notes)}</span>
        <div className="demo-product__foot">
          <span className="demo-price">${product.price}</span>
          <button type="button" onClick={() => onOrder(product.id)}>
            {isAr ? 'اطلب' : 'Order'} <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
