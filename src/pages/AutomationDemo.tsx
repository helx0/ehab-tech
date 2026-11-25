import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from '../components/Icon';
import summary from '../../demos/automation/data/output/summary.json';
import cleanCsv from '../../demos/automation/data/output/clean_data.csv?raw';
import anomaliesCsv from '../../demos/automation/data/output/anomalies.csv?raw';
import reportMd from '../../demos/automation/data/output/report.md?raw';
import pipelinePy from '../../demos/automation/pipeline.py?raw';
import testsPy from '../../demos/automation/test_pipeline.py?raw';
import inputSanaa from '../../demos/automation/data/input/branch_sanaa.csv?raw';
import inputShanghai from '../../demos/automation/data/input/branch_shanghai.csv?raw';
import inputShenzhen from '../../demos/automation/data/input/branch_shenzhen.csv?raw';
import '../automation.css';
interface CleanRow { branch: string; date: string; customer: string; product: string; qty: number; amount: number; source_file: string }
interface BadRow { reason: string; branch: string; date: string; customer: string; product: string; qty: string; amount: string }
interface RunResult { clean: CleanRow[]; bad: BadRow[]; totalRows: number; revenue: number }
const HEADER = 'branch,date,customer,product,qty,amount,source_file';
const SAMPLE_INPUT = [HEADER, ...[inputSanaa, inputShanghai, inputShenzhen].flatMap((f) => f.trim().split('\n').slice(1).map((l) => l.trim()).filter(Boolean))].join('\n');
function normalise(v: string): string { return (v ?? '').trim().replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (c) => { const n = c.charCodeAt(0); return String(n <= 0x0669 ? n - 0x0660 : n - 0x06F0); }).replace(/\u066C/g, ',').replace(/\u066B/g, '.'); }
function parseAmount(raw: string): number { let t = normalise(raw); if (!t) throw new Error('empty'); const neg = /^\(.*\)$/.test(t); t = t.replace(/^\(|\)$/g, '').replace(/[^0-9.\-]/g, ''); if (!t || ['-', '.', '-.'].includes(t)) throw new Error('bad'); const v = Number.parseFloat(t); if (!Number.isFinite(v)) throw new Error('bad'); return neg ? -v : v; }
function parseDate(raw: string): string {
  const t = normalise(raw);
  const patterns: [RegExp, (y: string, a: string, b: string) => [number, number, number]][] = [
    [/^(\d{4})-(\d{1,2})-(\d{1,2})$/, (y, a, b) => [Number(y), Number(a), Number(b)]],
    [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (y, a, b) => [Number(y), Number(b), Number(a)]],
    [/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, (y, a, b) => [Number(y), Number(a), Number(b)]],
    [/^(\d{1,2})-(\d{1,2})-(\d{4})$/, (y, a, b) => [Number(y), Number(b), Number(a)]],
  ];
  for (const [re, build] of patterns) {
    const m = t.match(re);
    if (!m) continue;
    const [year, month, day] = build(m[1], m[2], m[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error('date');
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  throw new Error('date');
}
function parseQty(raw: string): number { const v = Number(normalise(raw)); if (!Number.isFinite(v) || v <= 0) throw new Error('qty'); return Math.trunc(v); }
function parseCsv(text: string): string[][] { const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false; for (let i = 0; i < text.length; i += 1) { const c = text[i]; if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false; } else field += c; } else if (c === '"') quoted = true; else if (c === ',') { row.push(field); field = ''; } else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else if (c !== '\r') field += c; } if (field || row.length) { row.push(field); rows.push(row); } return rows.filter((r) => r.some((c) => c.trim())); }
function runPipeline(text: string, sourceFile = 'browser_input.csv'): RunResult {
  const rows = parseCsv(text);
  if (rows.length < 2) return { clean: [], bad: [], totalRows: 0, revenue: 0 };
  const h = rows[0].map((c) => c.trim().toLowerCase());
  const ix = (n: string) => h.indexOf(n);
  const clean: CleanRow[] = []; const bad: BadRow[] = []; const seen = new Set<string>();
  let totalRows = 0;
  for (const cells of rows.slice(1)) {
    totalRows += 1;
    const get = (n: string) => normalise(cells[ix(n)] ?? '');
    const raw = { branch: get('branch'), date: get('date'), customer: get('customer'), product: get('product'), qty: get('qty'), amount: get('amount') };
    const reasons: string[] = [];
    for (const f of ['branch', 'date', 'customer', 'product'] as const) if (!raw[f]) reasons.push(`missing:${f}`);
    let day = ''; let qty = 0; let amount = 0;
    if (!reasons.length) {
      try { day = parseDate(raw.date); } catch { reasons.push('invalid:date'); }
      try { qty = parseQty(raw.qty); } catch { reasons.push('invalid:qty'); }
      try { amount = parseAmount(raw.amount); if (amount < 0) reasons.push('negative:amount'); } catch { reasons.push('invalid:amount'); }
    }
    if (reasons.length) { bad.push({ reason: [...new Set(reasons)].sort().join('|'), ...raw }); continue; }
    const key = [raw.branch.toLowerCase(), day, raw.customer.toLowerCase(), raw.product.toLowerCase(), qty, amount.toFixed(2)].join('|');
    if (seen.has(key)) { bad.push({ reason: 'duplicate', ...raw }); continue; }
    seen.add(key);
    clean.push({ branch: raw.branch, date: day, customer: raw.customer, product: raw.product, qty, amount: Math.round(amount * 100) / 100, source_file: sourceFile });
  }
  clean.sort((a, b) => a.date.localeCompare(b.date) || a.branch.localeCompare(b.branch) || a.customer.localeCompare(b.customer));
  return { clean, bad, totalRows, revenue: Math.round(clean.reduce((s, r) => s + r.amount, 0) * 100) / 100 };
}
function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function cleanToCsv(rows: CleanRow[]): string {
  return `\uFEFF${[HEADER, ...rows.map((r) => [r.branch, r.date, r.customer, r.product, r.qty, r.amount, r.source_file].map(csvCell).join(','))].join('\n')}\n`;
}
function download(name: string, content: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function AutomationDemo() {
  const { lang, t } = useLanguage(); const isAr = lang === 'ar'; const tr = (ar: string, en: string) => (isAr ? ar : en);
  const [input, setInput] = useState(SAMPLE_INPUT); const [result, setResult] = useState<RunResult>(() => runPipeline(SAMPLE_INPUT)); const [copied, setCopied] = useState(false);
  useEffect(() => { const prev = document.title; document.title = isAr ? 'مسار أتمتة البيانات | EHAB TECH' : 'Data Automation Pipeline | EHAB TECH'; return () => { document.title = prev; }; }, [isAr]);
  const daily = useMemo(() => Object.entries(summary.daily_revenue), []); const reasons = useMemo(() => Object.entries(summary.anomalies_by_reason), []);
  const maxDaily = Math.max(1, ...daily.map(([, v]) => v)); const maxReason = Math.max(1, ...reasons.map(([, c]) => c));
  const stages = [
    { icon: 'globe', ar: 'الاستيراد', en: 'Ingest', dAr: '3 ملفات CSV', dEn: '3 CSV files', v: `${summary.total_rows} ${tr('صف', 'rows')}` },
    { icon: 'filter', ar: 'التحقق', en: 'Validate', dAr: 'قواعد وحقول', dEn: 'Rules & fields', v: `6 ${tr('قواعد', 'rules')}` },
    { icon: 'bolt', ar: 'التنظيف', en: 'Clean', dAr: 'أرقام وتواريخ', dEn: 'Digits & dates', v: `${summary.clean_rows} ${tr('سليم', 'valid')}` },
    { icon: 'shield', ar: 'كشف الشذوذ', en: 'Detect', dAr: 'تكرار وشذوذ', dEn: 'Duplicates & issues', v: `${summary.anomaly_rows} ${tr('مستبعد', 'flagged')}` },
    { icon: 'chart', ar: 'التحليل', en: 'Analyze', dAr: 'إيرادات ومؤشرات', dEn: 'Revenue & KPIs', v: `$${summary.total_revenue.toLocaleString()}` },
    { icon: 'code', ar: 'التقرير', en: 'Report', dAr: 'JSON + Markdown', dEn: 'JSON + Markdown', v: `4 ${tr('ملفات', 'files')}` },
  ];
  async function copyCode() { try { await navigator.clipboard.writeText(pipelinePy); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { download('pipeline.py', pipelinePy); } }
  return (
    <div className="au-app" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="au-topbar"><Link to="/services/automation" className="au-brand"><span className="au-brand__mark"><Icon name="bolt" size={18} /></span><span><strong>EHAB TECH</strong><small>{tr('الأتمتة ومعالجة البيانات', 'AUTOMATION LAB')}</small></span></Link><div className="au-topbar__right"><span className="au-pill"><span className="au-pulse" /> LIVE DEMO</span><Link to="/" className="au-back">← {t('common.backToSite')}</Link></div></header>
      <main>
        <section className="au-hero"><div className="au-container au-hero__inner"><div><span className="au-eyebrow"><Icon name="bolt" size={14} /> {tr('المشروع الثالث', 'PROJECT 03')}</span><h1>{tr('من فوضى البيانات إلى قرار جاهز.', 'From messy data to a decision-ready report.')}</h1><p>{tr('سكربت Python ينظّف ملفات الفروع ويكشف الشذوذ ويولّد التقارير — بدون مكتبات خارجية.', 'A Python script cleans branch files, flags anomalies and generates reports — with zero external libraries.')}</p><div className="au-hero__actions"><a href="#runner" className="au-btn au-btn--primary"><Icon name="bolt" size={17} /> {tr('جرّبه', 'Try it')}</a><a href="#code" className="au-btn au-btn--ghost"><Icon name="code" size={17} /> {tr('الكود', 'Code')}</a></div></div><div className="au-hero__terminal"><div className="au-terminal__head"><span /><span /><span /><em>pipeline.py</em></div><pre><span className="au-c-dim">$ python3 pipeline.py</span>{'\n'}<span className="au-c-green">✓</span> {tr('قراءة', 'Read')} {summary.total_rows} {tr('صفاً', 'rows')}{'\n'}<span className="au-c-green">✓</span> {tr('نظيف', 'Clean')}: {summary.clean_rows} | {tr('شذوذ', 'Anomalies')}: {summary.anomaly_rows}{'\n'}<span className="au-c-green">✓</span> {tr('الإيرادات', 'Revenue')}: ${summary.total_revenue.toLocaleString()}{'\n'}<span className="au-c-cyan">→</span> clean_data.csv, anomalies.csv, summary.json, report.md{'\n'}<span className="au-c-dim">8/8 tests passed · exit 0</span></pre></div></div></section>
        <section className="au-container au-metrics"><Metric label={tr('مقروءة', 'Ingested')} value={String(summary.total_rows)} sub={tr('3 فروع', '3 branches')} /><Metric label={tr('نظيفة', 'Clean')} value={String(summary.clean_rows)} sub="53%" tone="green" /><Metric label={tr('مستبعدة', 'Flagged')} value={String(summary.anomaly_rows)} sub="46.7%" tone="amber" /><Metric label={tr('الإيرادات', 'Revenue')} value={`$${summary.total_revenue.toLocaleString()}`} sub={tr('مكتشفة', 'recovered')} tone="cyan" /></section>
        <section className="au-container au-section"><SectionHead eyebrow={tr('كيف يعمل', 'HOW IT WORKS')} title={tr('ست مراحل', 'Six stages')} desc={tr('من الملف الخام إلى التقرير', 'From raw file to report')} /><div className="au-stages">{stages.map((s, i) => (<div className="au-stage" key={s.en}><span className="au-stage__num">{String(i + 1).padStart(2, '0')}</span><span className="au-stage__icon"><Icon name={s.icon as 'globe' | 'filter' | 'bolt' | 'shield' | 'chart' | 'code'} size={22} /></span><strong>{isAr ? s.ar : s.en}</strong><small>{isAr ? s.dAr : s.dEn}</small><em>{s.v}</em></div>))}</div></section>
        <section className="au-container au-section"><SectionHead eyebrow={tr('قبل / بعد', 'BEFORE / AFTER')} title={tr('المدخل الخام مقابل المخرج النظيف', 'Raw input vs clean output')} desc={tr('أرقام عربية وتواريخ مختلفة وتكرارات', 'Arabic digits, mixed dates, duplicates')} /><div className="au-compare"><div className="au-code-card au-code-card--raw"><div className="au-code-card__head"><span className="au-dot au-dot--red" /><strong>{tr('المدخل', 'Raw')}</strong></div><pre>{[inputSanaa, inputShanghai, inputShenzhen].map((f) => f.trim()).join('\n\n')}</pre></div><div className="au-compare__arrow"><Icon name="arrow" size={22} /></div><div className="au-code-card au-code-card--clean"><div className="au-code-card__head"><span className="au-dot au-dot--green" /><strong>{tr('النظيف', 'Clean')}</strong></div><pre>{cleanCsv.trim()}</pre></div></div></section>
        <section className="au-container au-section" id="runner"><SectionHead eyebrow={tr('تفاعلي', 'INTERACTIVE')} title={tr('شغّل المنطق في متصفحك', 'Run the logic in your browser')} desc={tr('نسخة JavaScript تطابق قواعد Python', 'A JavaScript mirror of the Python rules')} /><div className="au-runner"><div className="au-runner__input"><div className="au-runner__head"><strong>CSV</strong><button type="button" onClick={() => { setInput(SAMPLE_INPUT); setResult(runPipeline(SAMPLE_INPUT)); }}>{tr('إعادة', 'Reset')}</button></div><textarea value={input} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)} spellCheck={false} aria-label={isAr ? "مدخل CSV" : "CSV input"} /><button type="button" className="au-btn au-btn--primary au-run-btn" onClick={() => setResult(runPipeline(input))}><Icon name="bolt" size={17} /> {tr('تشغيل', 'Run')}</button></div><div className="au-runner__output"><div className="au-runner__head"><strong>{tr('النتيجة', 'Result')}</strong><span>{result.totalRows} → {result.clean.length}</span></div><div className="au-runner__stats"><span><b>{result.clean.length}</b> {tr('نظيف', 'clean')}</span><span><b>{result.bad.length}</b> {tr('مستبعد', 'flagged')}</span><span className="au-revenue"><b>${result.revenue.toLocaleString()}</b></span></div><div className="au-runner__tables"><table><thead><tr><th>{tr('التاريخ', 'Date')}</th><th>{tr('العميل', 'Customer')}</th><th>{tr('المبلغ', 'Amount')}</th></tr></thead><tbody>{result.clean.slice(0, 6).map((r, i) => (<tr key={`${r.date}-${i}`}><td>{r.date}</td><td>{r.customer}</td><td>${r.amount.toFixed(2)}</td></tr>))}</tbody></table>{result.bad.length > 0 && <div className="au-flagged">{[...new Set(result.bad.flatMap((r) => r.reason.split('|')))].map((reason) => (<em key={reason}>{reason} × {result.bad.filter((r) => r.reason.split('|').includes(reason)).length}</em>))}</div>}</div><button type="button" className="au-btn au-btn--ghost au-download-run" onClick={() => download('browser_clean_data.csv', cleanToCsv(result.clean), 'text/csv;charset=utf-8')}><Icon name="download" size={16} /> CSV</button></div></div></section>
        <section className="au-container au-section"><SectionHead eyebrow={tr('التحليلات', 'ANALYTICS')} title={tr('أرقام حقيقية من التنفيذ', 'Real numbers from the run')} desc={tr('من summary.json المولّد', 'From generated summary.json')} /><div className="au-analytics"><div className="au-chart-card"><h3>{tr('الإيرادات اليومية', 'Daily revenue')}</h3><div className="au-bars">{daily.map(([day, value]) => (<div className="au-bar" key={day} title={`${day}: $${value}`}><span className="au-bar__value">${Math.round(value).toLocaleString()}</span><i style={{ height: `${(value / maxDaily) * 100}%` }} /><small>{day.slice(5)}</small></div>))}</div></div><div className="au-insights"><div className="au-insight"><Icon name="target" size={19} /><span>{tr('أفضل منتج', 'Top product')}</span><strong>{summary.top_product}</strong><small>${summary.top_product_revenue.toLocaleString()}</small></div><div className="au-insight"><Icon name="globe" size={19} /><span>{tr('أفضل فرع', 'Top branch')}</span><strong>{summary.top_branch}</strong><small>${summary.top_branch_revenue.toLocaleString()}</small></div><div className="au-insight"><Icon name="chart" size={19} /><span>{tr('المتوسط', 'Average')}</span><strong>${summary.average_order.toLocaleString()}</strong></div><div className="au-reasons"><h4>{tr('الأسباب', 'Reasons')}</h4>{reasons.map(([reason, count]) => (<div className="au-reason" key={reason}><code>{reason}</code><i><b style={{ width: `${(count / maxReason) * 100}%` }} /></i><span>{count}</span></div>))}</div></div></div></section>
        <section className="au-container au-section" id="code"><SectionHead eyebrow={tr('الملفات', 'ARTEFACTS')} title={tr('كل شيء للفحص', 'Open for inspection')} desc={tr('حمّل الكود والمخرجات', 'Download code and outputs')} /><div className="au-artifacts">{[
          { name: 'pipeline.py', label: tr('السكربت', 'Script'), content: pipelinePy, icon: 'code' as const },
          { name: 'test_pipeline.py', label: tr('الاختبارات', 'Tests'), content: testsPy, icon: 'check' as const },
          { name: 'clean_data.csv', label: tr('البيانات النظيفة', 'Clean data'), content: cleanCsv, icon: 'filter' as const },
          { name: 'anomalies.csv', label: tr('الشذوذات', 'Anomalies'), content: anomaliesCsv, icon: 'shield' as const },
          { name: 'summary.json', label: 'JSON', content: JSON.stringify(summary, null, 2), icon: 'chart' as const },
          { name: 'report.md', label: 'Markdown', content: reportMd, icon: 'globe' as const },
        ].map((f) => (<button type="button" className="au-artifact" key={f.name} onClick={() => download(f.name, f.content)}><span className="au-artifact__icon"><Icon name={f.icon} size={19} /></span><span className="au-artifact__meta"><strong>{f.name}</strong><small>{f.label}</small></span><Icon name="download" size={17} /></button>))}</div><div className="au-source"><div className="au-source__head"><strong>pipeline.py</strong><div><span className="au-lang">Python 3 · stdlib only</span><button type="button" onClick={copyCode}><Icon name={copied ? 'check' : 'code'} size={15} /> {copied ? tr('تم', 'Done') : tr('نسخ', 'Copy')}</button></div></div><pre><code>{pipelinePy}</code></pre></div></section>
        <section className="au-cta"><div className="au-container au-cta__inner"><div><Eyebrow>{tr('التالي', 'NEXT')}</Eyebrow><h2>{tr('بياناتك فوضوية؟', 'Messy data?')}</h2><p>{tr('أبني لك مسار أتمتة مخصصاً', 'I can build a custom pipeline for you.')}</p></div><Link to="/contact" className="au-btn au-btn--primary"><Icon name="external" size={17} /> {t('nav.startProject')}</Link></div></section>
      </main>
    </div>
  );
}
function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) { return <div className={`au-metric ${tone ? `au-metric--${tone}` : ''}`}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>; }
function SectionHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) { return <div className="au-section-head"><span className="au-eyebrow"><Icon name="bolt" size={14} /> {eyebrow}</span><h2>{title}</h2><p>{desc}</p></div>; }
function Eyebrow({ children }: { children: ReactNode }) { return <span className="au-eyebrow"><Icon name="bolt" size={14} /> {children}</span>; }
