import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from '../components/Icon';
import '../management.css';

type Page = 'overview' | 'customers' | 'orders' | 'inventory' | 'reports';
type Role = 'admin' | 'sales';
type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'active' | 'lead';
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  lowStock: number;
}

interface OrderItem { productId: string; qty: number }

interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

interface Store {
  customers: Customer[];
  products: Product[];
  orders: Order[];
}

const STORAGE_KEY = 'ehab-management-demo-v1';

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const seedProducts: Product[] = [
  { id: 'p1', name: 'Business Website', sku: 'WEB-001', price: 800, stock: 14, lowStock: 5 },
  { id: 'p2', name: 'CRM System', sku: 'SYS-014', price: 1500, stock: 7, lowStock: 4 },
  { id: 'p3', name: 'Automation Sprint', sku: 'AUT-009', price: 300, stock: 3, lowStock: 4 },
  { id: 'p4', name: 'POS Dashboard', sku: 'POS-022', price: 1200, stock: 11, lowStock: 5 },
  { id: 'p5', name: 'Data Report Pack', sku: 'DAT-006', price: 250, stock: 26, lowStock: 8 },
];

const seedCustomers: Customer[] = [
  { id: 'c1', name: 'Li Wei', company: 'Shanghai Trade Co.', email: 'liwei@shanghaitrade.cn', phone: '+86 138 0000 1122', status: 'active', createdAt: daysAgo(46) },
  { id: 'c2', name: 'أحمد السالم', company: 'شركة الخليج للتجارة', email: 'ahmed@gulftrade.example', phone: '+965 9550 1122', status: 'active', createdAt: daysAgo(38) },
  { id: 'c3', name: 'Zhang Min', company: 'Shenzhen Tech Hub', email: 'zhangmin@techhub.cn', phone: '+86 139 0000 7788', status: 'lead', createdAt: daysAgo(25) },
  { id: 'c4', name: 'منى العتيبي', company: 'متجر رفوف', email: 'mona@rafoof.sa', phone: '+966 50 123 4567', status: 'active', createdAt: daysAgo(18) },
  { id: 'c5', name: 'Chen Hao', company: 'Ningbo Export Ltd.', email: 'chenhao@ningboexport.cn', phone: '+86 137 0000 3344', status: 'lead', createdAt: daysAgo(9) },
  { id: 'c6', name: 'ياسر القحطاني', company: 'مجموعة أفق', email: 'yasser@ofooq.example', phone: '+966 55 987 6543', status: 'active', createdAt: daysAgo(3) },
];

function makeOrder(id: string, customerId: string, items: OrderItem[], status: OrderStatus, days: number): Order {
  const total = items.reduce((sum, item) => sum + (seedProducts.find((p) => p.id === item.productId)?.price ?? 0) * item.qty, 0);
  return { id, customerId, items, total, status, createdAt: daysAgo(days) };
}

const seedOrders: Order[] = [
  makeOrder('ORD-1042', 'c1', [{ productId: 'p1', qty: 1 }], 'delivered', 0),
  makeOrder('ORD-1041', 'c2', [{ productId: 'p2', qty: 1 }, { productId: 'p5', qty: 2 }], 'processing', 0),
  makeOrder('ORD-1040', 'c4', [{ productId: 'p4', qty: 1 }], 'shipped', 1),
  makeOrder('ORD-1039', 'c3', [{ productId: 'p3', qty: 2 }], 'new', 1),
  makeOrder('ORD-1038', 'c6', [{ productId: 'p1', qty: 1 }, { productId: 'p5', qty: 1 }], 'delivered', 2),
  makeOrder('ORD-1037', 'c5', [{ productId: 'p2', qty: 1 }], 'processing', 3),
  makeOrder('ORD-1036', 'c2', [{ productId: 'p3', qty: 1 }], 'cancelled', 4),
  makeOrder('ORD-1035', 'c1', [{ productId: 'p4', qty: 1 }, { productId: 'p5', qty: 3 }], 'delivered', 5),
  makeOrder('ORD-1034', 'c4', [{ productId: 'p1', qty: 2 }], 'delivered', 6),
];

const initialStore: Store = { customers: seedCustomers, products: seedProducts, orders: seedOrders };

function usePersistentStore() {
  const [store, setStore] = useState<Store>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Store;
        if (parsed.customers && parsed.products && parsed.orders) return parsed;
      }
    } catch {
      // ignore corrupted storage
    }
    return initialStore;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* storage unavailable */ }
  }, [store]);

  return [store, setStore] as const;
}

export default function ManagementDemo() {
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';
  const tr = (ar: string, en: string) => (isAr ? ar : en);

  useEffect(() => {
    const previous = document.title;
    document.title = isAr ? 'نظام EHAB للإدارة — معاينة حية | EHAB TECH' : 'EHAB Management OS — Live Demo | EHAB TECH';
    return () => { document.title = previous; };
  }, [isAr]);

  const [page, setPage] = useState<Page>('overview');
  const [role, setRole] = useState<Role>('admin');
  const [store, setStore] = usePersistentStore();
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'customer' | 'order' | null>(null);
  const [toast, setToast] = useState('');
  const [customerForm, setCustomerForm] = useState({ name: '', company: '', email: '', phone: '' });
  const [orderForm, setOrderForm] = useState({ customerId: 'c1', productId: 'p1', qty: '1' });
  const [restock, setRestock] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const navItems: { id: Page; icon: 'grid' | 'user' | 'cart' | 'box' | 'chart'; ar: string; en: string }[] = [
    { id: 'overview', icon: 'grid', ar: 'نظرة عامة', en: 'Overview' },
    { id: 'customers', icon: 'user', ar: 'العملاء', en: 'Customers' },
    { id: 'orders', icon: 'cart', ar: 'الطلبات', en: 'Orders' },
    { id: 'inventory', icon: 'box', ar: 'المخزون', en: 'Inventory' },
    { id: 'reports', icon: 'chart', ar: 'التقارير', en: 'Reports' },
  ];
  const visibleNav = role === 'admin' ? navItems : navItems.filter((item) => item.id !== 'inventory');

  const activeRevenue = store.orders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);
  const lowStockCount = store.products.filter((product) => product.stock <= product.lowStock).length;
  const newOrders = store.orders.filter((order) => order.status === 'new').length;

  const customerName = (id: string) => store.customers.find((customer) => customer.id === id)?.name ?? '—';
  const productName = (id: string) => store.products.find((product) => product.id === id)?.name ?? '—';

  const statusText: Record<OrderStatus, string> = {
    new: tr('جديد', 'New'),
    processing: tr('قيد التنفيذ', 'Processing'),
    shipped: tr('تم الشحن', 'Shipped'),
    delivered: tr('مكتمل', 'Delivered'),
    cancelled: tr('ملغي', 'Cancelled'),
  };

  function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerForm.name.trim() || !customerForm.email.trim()) {
      setToast(tr('يرجى إدخال الاسم والبريد.', 'Please enter name and email.'));
      return;
    }
    const customer: Customer = {
      id: `c${Date.now()}`,
      name: customerForm.name.trim(),
      company: customerForm.company.trim() || '—',
      email: customerForm.email.trim(),
      phone: customerForm.phone.trim() || '—',
      status: 'lead',
      createdAt: new Date().toISOString(),
    };
    setStore((current) => ({ ...current, customers: [customer, ...current.customers] }));
    setCustomerForm({ name: '', company: '', email: '', phone: '' });
    setModal(null);
    setToast(tr('تمت إضافة العميل وحفظه.', 'Customer added and saved.'));
  }

  function addOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qty = Number(orderForm.qty);
    const product = store.products.find((item) => item.id === orderForm.productId);
    if (!product || qty < 1) {
      setToast(tr('تحقق من المنتج والكمية.', 'Check product and quantity.'));
      return;
    }
    if (qty > product.stock) {
      setToast(tr('الكمية أكبر من المتاح في المخزون.', 'Quantity exceeds available stock.'));
      return;
    }
    const order: Order = {
      id: `ORD-${1043 + store.orders.length}`,
      customerId: orderForm.customerId,
      items: [{ productId: product.id, qty }],
      total: product.price * qty,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setStore((current) => ({
      ...current,
      orders: [order, ...current.orders],
      products: current.products.map((item) => item.id === product.id ? { ...item, stock: item.stock - qty } : item),
    }));
    setModal(null);
    setToast(tr('تم إنشاء الطلب وتحديث المخزون.', 'Order created and stock updated.'));
  }

  function changeStatus(id: string, next: OrderStatus) {
    const order = store.orders.find((item) => item.id === id);
    if (!order || order.status === next) return;
    setStore((current) => {
      let products = current.products;
      if (order.status === 'cancelled' && next !== 'cancelled') {
        products = products.map((p) => {
          const line = order.items.find((i) => i.productId === p.id);
          return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
        });
      } else if (order.status !== 'cancelled' && next === 'cancelled') {
        products = products.map((p) => {
          const line = order.items.find((i) => i.productId === p.id);
          return line ? { ...p, stock: p.stock + line.qty } : p;
        });
      }
      return {
        ...current,
        products,
        orders: current.orders.map((item) => item.id === id ? { ...item, status: next } : item),
      };
    });
    setToast(tr('تم تحديث حالة الطلب.', 'Order status updated.'));
  }

  function applyRestock(productId: string) {
    const amount = Number(restock[productId] ?? 0);
    if (!amount || amount < 1) return;
    setStore((current) => ({
      ...current,
      products: current.products.map((p) => p.id === productId ? { ...p, stock: p.stock + amount } : p),
    }));
    setRestock((current) => ({ ...current, [productId]: '' }));
    setToast(tr('تم تحديث المخزون.', 'Stock updated.'));
  }

  function exportCsv() {
    const header = ['ID', tr('العميل', 'Customer'), tr('المنتج', 'Product'), tr('الكمية', 'Qty'), tr('الإجمالي', 'Total'), tr('الحالة', 'Status'), tr('التاريخ', 'Date')];
    const rows = store.orders.map((order) => [
      order.id,
      customerName(order.customerId),
      order.items.map((item) => productName(item.productId)).join(' + '),
      String(order.items.reduce((sum, item) => sum + item.qty, 0)),
      String(order.total),
      statusText[order.status],
      new Date(order.createdAt).toLocaleDateString(),
    ]);
    const csv = '\uFEFF' + [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ehab-orders-report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setToast(tr('تم تصدير التقرير.', 'Report exported.'));
  }

  const q = query.trim().toLowerCase();
  const filteredCustomers = store.customers.filter((customer) =>
    !q || `${customer.name} ${customer.company} ${customer.email}`.toLowerCase().includes(q));
  const filteredOrders = store.orders.filter((order) =>
    !q || `${order.id} ${customerName(order.customerId)} ${statusText[order.status]}`.toLowerCase().includes(q));
  const filteredProducts = store.products.filter((product) =>
    !q || `${product.name} ${product.sku}`.toLowerCase().includes(q));

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    const value = store.orders
      .filter((order) => new Date(order.createdAt).toDateString() === key && order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total, 0);
    return {
      label: date.toLocaleDateString(isAr ? 'ar' : 'en', { weekday: 'short' }),
      value,
    };
  });

  const topProducts = store.products
    .map((product) => ({
      name: product.name,
      qty: store.orders
        .filter((order) => order.status !== 'cancelled')
        .flatMap((order) => order.items)
        .filter((item) => item.productId === product.id)
        .reduce((sum, item) => sum + item.qty, 0),
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);

  return (
    <div className="mg-app" dir={isAr ? 'rtl' : 'ltr'}>
      <aside className="mg-sidebar">
        <div className="mg-logo">
          <span className="mg-logo__mark">E</span>
          <span><strong>EHAB</strong><small>{tr('نظام الإدارة', 'MANAGEMENT OS')}</small></span>
        </div>
        <nav className="mg-nav" aria-label={tr('القائمة', 'Sidebar navigation')}>
          <span className="mg-nav__label">{tr('القائمة الرئيسية', 'MAIN MENU')}</span>
          {visibleNav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? 'is-active' : ''}
              onClick={() => setPage(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{isAr ? item.ar : item.en}</span>
              {item.id === 'orders' && newOrders > 0 && <em>{newOrders}</em>}
            </button>
          ))}
        </nav>
        <div className="mg-sidebar__foot">
          <div className="mg-role-card">
            <Icon name="shield" size={18} />
            <span>
              <strong>{tr('الصلاحيات', 'Access level')}</strong>
              <small>{role === 'admin' ? tr('مدير — وصول كامل', 'Admin — full access') : tr('مبيعات — وصول محدود', 'Sales — limited access')}</small>
            </span>
          </div>
          <Link to="/services/systems" className="mg-back">← {t('common.backToSite')}</Link>
        </div>
      </aside>

      <div className="mg-main">
        <header className="mg-topbar">
          <div>
            <h1>{navItems.find((item) => item.id === page) ? (isAr ? navItems.find((item) => item.id === page)!.ar : navItems.find((item) => item.id === page)!.en) : ''}</h1>
            <span className="mg-breadcrumb">{tr('لوحة التحكم', 'Dashboard')} / {isAr ? navItems.find((item) => item.id === page)!.ar : navItems.find((item) => item.id === page)!.en}</span>
          </div>
          <div className="mg-topbar__tools">
            <label className="mg-search">
              <Icon name="search" size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr('ابحث عن عميل أو طلب...', 'Search customer or order...')} />
            </label>
            <button type="button" className="mg-icon-btn" title={tr('التنبيهات', 'Notifications')}>
              <Icon name="bell" size={18} />
              {newOrders + lowStockCount > 0 && <span className="mg-dot" />}
            </button>
            <select className="mg-role-select" value={role} onChange={(event) => setRole(event.target.value as Role)} aria-label={tr('الدور', 'Role')}>
              <option value="admin">{tr('مدير', 'Admin')}</option>
              <option value="sales">{tr('مبيعات', 'Sales')}</option>
            </select>
            <span className="mg-avatar">ET</span>
          </div>
        </header>

        <div className="mg-content">
          <div className="mg-demo-note">
            <Icon name="check" size={16} />
            {tr('نموذج تفاعلي حقيقي: كل إضافة أو تعديل يُحفظ في متصفحك ويعود بعد إعادة التحميل.', 'A real interactive demo: every add or edit is saved in your browser and survives reload.')}
          </div>

          {page === 'overview' && (
            <>
              <div className="mg-kpis">
                <Kpi icon="chart" label={tr('الإيرادات النشطة', 'Active revenue')} value={`$${activeRevenue.toLocaleString()}`} note={tr('من الطلبات غير الملغاة', 'From non-cancelled orders')} tone="green" />
                <Kpi icon="cart" label={tr('إجمالي الطلبات', 'Total orders')} value={String(store.orders.length)} note={`${newOrders} ${tr('طلب جديد', 'new orders')}`} tone="blue" />
                <Kpi icon="user" label={tr('العملاء', 'Customers')} value={String(store.customers.length)} note={`${store.customers.filter((c) => c.status === 'active').length} ${tr('نشط', 'active')}`} tone="violet" />
                <Kpi icon="box" label={tr('تنبيه مخزون', 'Stock alerts')} value={String(lowStockCount)} note={tr('منتجات تحتاج إعادة تعبئة', 'Products need restocking')} tone="amber" />
              </div>

              <div className="mg-grid-2">
                <section className="mg-panel">
                  <div className="mg-panel__head">
                    <div><h2>{tr('الإيرادات خلال 7 أيام', 'Revenue · last 7 days')}</h2><p>{tr('محسوبة من الطلبات المحفوظة', 'Calculated from saved orders')}</p></div>
                    <button type="button" className="mg-ghost-btn" onClick={() => setPage('reports')}>{tr('التفاصيل', 'Details')}</button>
                  </div>
                  <BarChart data={chartData} isAr={isAr} />
                </section>

                <section className="mg-panel">
                  <div className="mg-panel__head">
                    <div><h2>{tr('أفضل المنتجات مبيعاً', 'Top selling products')}</h2><p>{tr('حسب الكمية المباعة', 'By quantity sold')}</p></div>
                  </div>
                  <div className="mg-top-list">
                    {topProducts.map((product, index) => (
                      <div key={product.name} className="mg-top-list__row">
                        <span className="mg-rank">{index + 1}</span>
                        <span className="mg-top-list__name">{product.name}</span>
                        <span className="mg-bar"><i style={{ width: `${Math.min(100, (product.qty / Math.max(1, topProducts[0].qty)) * 100)}%` }} /></span>
                        <strong>{product.qty}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="mg-panel">
                <div className="mg-panel__head">
                  <div><h2>{tr('أحدث الطلبات', 'Recent orders')}</h2><p>{tr('آخر 5 طلبات في النظام', 'Latest 5 orders in the system')}</p></div>
                  <button type="button" className="mg-ghost-btn" onClick={() => setPage('orders')}>{tr('كل الطلبات', 'All orders')}</button>
                </div>
                <OrdersTable orders={store.orders.slice(0, 5)} customerName={customerName} statusText={statusText} isAr={isAr} onChangeStatus={changeStatus} compact />
              </section>
            </>
          )}

          {page === 'customers' && (
            <section className="mg-panel">
              <div className="mg-panel__head">
                <div><h2>{tr('دليل العملاء', 'Customer directory')}</h2><p>{tr('بحث وإضافة وحفظ', 'Search, add and persist')}</p></div>
                <button type="button" className="mg-primary-btn" onClick={() => setModal('customer')}><Icon name="plus" size={16} /> {tr('عميل جديد', 'New customer')}</button>
              </div>
              <div className="mg-table-wrap">
                <table className="mg-table">
                  <thead><tr>
                    <th>{tr('العميل', 'Customer')}</th><th>{tr('الشركة', 'Company')}</th><th>{tr('البريد', 'Email')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('تاريخ الإضافة', 'Added')}</th>
                  </tr></thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td><div className="mg-person"><span>{customer.name.slice(0, 2)}</span><strong>{customer.name}</strong></div></td>
                        <td>{customer.company}</td>
                        <td className="mg-muted">{customer.email}</td>
                        <td><span className={`mg-badge ${customer.status === 'active' ? 'mg-badge--green' : 'mg-badge--amber'}`}>{customer.status === 'active' ? tr('نشط', 'Active') : tr('محتمل', 'Lead')}</span></td>
                        <td className="mg-muted">{new Date(customer.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && <tr><td colSpan={5} className="mg-empty">{tr('لا توجد نتائج.', 'No results.')}</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {page === 'orders' && (
            <section className="mg-panel">
              <div className="mg-panel__head">
                <div><h2>{tr('إدارة الطلبات', 'Order management')}</h2><p>{tr('تحديث الحالة يعيد حساب المخزون تلقائياً', 'Changing status recalculates stock automatically')}</p></div>
                <button type="button" className="mg-primary-btn" onClick={() => setModal('order')}><Icon name="plus" size={16} /> {tr('طلب جديد', 'New order')}</button>
              </div>
              <OrdersTable orders={filteredOrders} customerName={customerName} statusText={statusText} isAr={isAr} onChangeStatus={changeStatus} />
            </section>
          )}

          {page === 'inventory' && role === 'admin' && (
            <section className="mg-panel">
              <div className="mg-panel__head">
                <div><h2>{tr('المخزون', 'Inventory')}</h2><p>{tr('إعادة تعبئة مباشرة مع حفظ فوري', 'Direct restocking with instant save')}</p></div>
                <span className="mg-badge mg-badge--amber">{lowStockCount} {tr('تنبيه', 'alerts')}</span>
              </div>
              <div className="mg-table-wrap">
                <table className="mg-table">
                  <thead><tr>
                    <th>{tr('المنتج', 'Product')}</th><th>SKU</th><th>{tr('السعر', 'Price')}</th><th>{tr('المتوفر', 'In stock')}</th><th>{tr('إعادة تعبئة', 'Restock')}</th>
                  </tr></thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const low = product.stock <= product.lowStock;
                      return (
                        <tr key={product.id}>
                          <td><strong>{product.name}</strong></td>
                          <td className="mg-muted mg-mono">{product.sku}</td>
                          <td>${product.price}</td>
                          <td>
                            <div className="mg-stock">
                              <span className={low ? 'is-low' : ''}>{product.stock}</span>
                              <i><b className={low ? 'is-low' : ''} style={{ width: `${Math.min(100, (product.stock / Math.max(product.lowStock * 3, 1)) * 100)}%` }} /></i>
                            </div>
                          </td>
                          <td>
                            <div className="mg-restock">
                              <input
                                type="number"
                                min="1"
                                value={restock[product.id] ?? ''}
                                onChange={(event) => setRestock((current) => ({ ...current, [product.id]: event.target.value }))}
                                placeholder="+"
                              />
                              <button type="button" onClick={() => applyRestock(product.id)}>{tr('تحديث', 'Update')}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {page === 'reports' && (
            <>
              <div className="mg-kpis">
                <Kpi icon="chart" label={tr('الإيرادات', 'Revenue')} value={`$${activeRevenue.toLocaleString()}`} note={tr('طلبات نشطة', 'Active orders')} tone="green" />
                <Kpi icon="cart" label={tr('متوسط الطلب', 'Avg. order')} value={`$${Math.round(activeRevenue / Math.max(1, store.orders.filter((o) => o.status !== 'cancelled').length))}`} note={tr('لكل طلب', 'per order')} tone="blue" />
                <Kpi icon="user" label={tr('عميل نشط', 'Active customers')} value={String(store.customers.filter((c) => c.status === 'active').length)} note={tr('من إجمالي العملاء', 'of all customers')} tone="violet" />
                <Kpi icon="box" label={tr('قيمة المخزون', 'Stock value')} value={`$${store.products.reduce((sum, p) => sum + p.price * p.stock, 0).toLocaleString()}`} note={tr('حسب سعر المنتج', 'at product prices')} tone="amber" />
              </div>
              <section className="mg-panel">
                <div className="mg-panel__head">
                  <div><h2>{tr('تقرير الطلبات', 'Orders report')}</h2><p>{tr('تصدير CSV حقيقي لكل الطلبات', 'A real CSV export of all orders')}</p></div>
                  <button type="button" className="mg-primary-btn" onClick={exportCsv}><Icon name="download" size={16} /> {tr('تصدير CSV', 'Export CSV')}</button>
                </div>
                <BarChart data={chartData} isAr={isAr} />
                <OrdersTable orders={store.orders.slice(0, 8)} customerName={customerName} statusText={statusText} isAr={isAr} onChangeStatus={changeStatus} compact />
              </section>
            </>
          )}
        </div>
      </div>

      {modal && (
        <div className="mg-modal-backdrop" onClick={() => setModal(null)}>
          <div className="mg-modal" onClick={(event) => event.stopPropagation()}>
            <div className="mg-modal__head">
              <h2>{modal === 'customer' ? tr('عميل جديد', 'New customer') : tr('طلب جديد', 'New order')}</h2>
              <button type="button" onClick={() => setModal(null)} aria-label={tr('إغلاق', 'Close')}><Icon name="close" size={18} /></button>
            </div>
            {modal === 'customer' ? (
              <form onSubmit={addCustomer}>
                <label><span>{tr('الاسم', 'Name')} *</span><input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} /></label>
                <label><span>{tr('الشركة', 'Company')}</span><input value={customerForm.company} onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })} /></label>
                <label><span>{tr('البريد', 'Email')} *</span><input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} /></label>
                <label><span>{tr('الهاتف', 'Phone')}</span><input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} /></label>
                <button type="submit" className="mg-primary-btn mg-full">{tr('حفظ العميل', 'Save customer')}</button>
              </form>
            ) : (
              <form onSubmit={addOrder}>
                <label><span>{tr('العميل', 'Customer')}</span>
                  <select value={orderForm.customerId} onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}>
                    {store.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} — {customer.company}</option>)}
                  </select>
                </label>
                <label><span>{tr('المنتج', 'Product')}</span>
                  <select value={orderForm.productId} onChange={(e) => setOrderForm({ ...orderForm, productId: e.target.value })}>
                    {store.products.map((product) => <option key={product.id} value={product.id}>{product.name} — ${product.price} ({product.stock})</option>)}
                  </select>
                </label>
                <label><span>{tr('الكمية', 'Quantity')}</span><input type="number" min="1" value={orderForm.qty} onChange={(e) => setOrderForm({ ...orderForm, qty: e.target.value })} /></label>
                <button type="submit" className="mg-primary-btn mg-full">{tr('إنشاء الطلب', 'Create order')}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {toast && <div className="mg-toast"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}

function Kpi({ icon, label, value, note, tone }: { icon: 'chart' | 'cart' | 'user' | 'box'; label: string; value: string; note: string; tone: string }) {
  return (
    <div className={`mg-kpi mg-kpi--${tone}`}>
      <span className="mg-kpi__icon"><Icon name={icon} size={20} /></span>
      <div>
        <span className="mg-kpi__label">{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}

function BarChart({ data, isAr }: { data: { label: string; value: number }[]; isAr: boolean }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  const width = 640;
  const height = 180;
  const barWidth = width / data.length;
  return (
    <div className="mg-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={isAr ? 'رسم الإيرادات' : 'Revenue chart'}>
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line key={ratio} x1="0" x2={width} y1={height - 26 - ratio * 130} y2={height - 26 - ratio * 130} stroke="rgba(255,255,255,.07)" strokeWidth="1" />
        ))}
        {data.map((item, index) => {
          const barHeight = Math.max(3, (item.value / max) * 130);
          return (
            <g key={`${item.label}-${index}`}>
              <rect x={index * barWidth + barWidth * 0.22} y={height - 26 - barHeight} width={barWidth * 0.56} height={barHeight} rx="6" fill={item.value ? '#42d6a4' : 'rgba(66,214,164,.18)'} />
              <text x={index * barWidth + barWidth / 2} y={height - 6} textAnchor="middle" fill="#8ba0b2" fontSize="12">{item.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function OrdersTable({
  orders,
  customerName,
  statusText,
  isAr,
  onChangeStatus,
  compact,
}: {
  orders: Order[];
  customerName: (id: string) => string;
  statusText: Record<OrderStatus, string>;
  isAr: boolean;
  onChangeStatus: (id: string, status: OrderStatus) => void;
  compact?: boolean;
}) {
  return (
    <div className="mg-table-wrap">
      <table className="mg-table">
        <thead><tr>
          <th>{isAr ? 'رقم الطلب' : 'Order'}</th><th>{isAr ? 'العميل' : 'Customer'}</th><th>{isAr ? 'المنتجات' : 'Products'}</th><th>{isAr ? 'الإجمالي' : 'Total'}</th><th>{isAr ? 'الحالة' : 'Status'}</th>{!compact && <th>{isAr ? 'التاريخ' : 'Date'}</th>}
        </tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="mg-mono">{order.id}</td>
              <td><strong>{customerName(order.customerId)}</strong></td>
              <td className="mg-muted">{order.items.map((item) => `${item.qty}× ${item.productId}`).join(', ')}</td>
              <td><strong>${order.total}</strong></td>
              <td>
                <select className={`mg-status mg-status--${order.status}`} value={order.status} onChange={(event) => onChangeStatus(order.id, event.target.value as OrderStatus)}>
                  {(Object.keys(statusText) as OrderStatus[]).map((status) => <option key={status} value={status}>{statusText[status]}</option>)}
                </select>
              </td>
              {!compact && <td className="mg-muted">{new Date(order.createdAt).toLocaleDateString()}</td>}
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={compact ? 5 : 6} className="mg-empty">{isAr ? 'لا توجد طلبات.' : 'No orders.'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
