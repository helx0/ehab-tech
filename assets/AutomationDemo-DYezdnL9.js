import{u as z,r as v,j as e,L as C,I as m}from"./index-6cLKRRWW.js";const P="2026-11-24T04:02:58",D=["branch_sanaa.csv","branch_shanghai.csv","branch_shenzhen.csv"],L=15,I=8,O=7,F=.4667,V=13751,B=1718.88,H="CRM System",W=4500,U="Sana'a",Y=5700,G={"2026-01-03":1250,"2026-01-04":1450.5,"2026-01-05":1200,"2026-01-06":3e3,"2026-01-07":1500,"2026-01-09":1500,"2026-01-10":2400,"2026-01-12":1450.5},J={duplicate:3,"invalid:amount":1,"invalid:qty":2,"missing:product":1,"negative:amount":1},Z=["clean_data.csv","anomalies.csv","summary.json","report.md"],c={generated_at:P,input_files:D,total_rows:L,clean_rows:I,anomaly_rows:O,anomaly_rate:F,total_revenue:V,average_order:B,top_product:H,top_product_revenue:W,top_branch:U,top_branch_revenue:Y,daily_revenue:G,anomalies_by_reason:J,output_files:Z},q=`branch,date,customer,product,qty,amount,source_file\r
Shenzhen,2026-01-03,Shenzhen Tech Hub,Data Report Pack,5,1250.0,branch_shenzhen.csv\r
Shanghai,2026-01-04,Shanghai Trade Co.,Business Website,1,1450.5,branch_shanghai.csv\r
Sana'a,2026-01-05,Al-Nour Trading,Website,1,1200.0,branch_sanaa.csv\r
Sana'a,2026-01-06,Li Wei,CRM System,2,3000.0,branch_sanaa.csv\r
Shanghai,2026-01-07,Zhang Min,CRM System,1,1500.0,branch_shanghai.csv\r
Sana'a,2026-01-09,Mona Al-Otaibi,Automation Sprint,3,1500.0,branch_sanaa.csv\r
Shanghai,2026-01-10,Ningbo Export Ltd.,POS Dashboard,2,2400.0,branch_shanghai.csv\r
Shenzhen,2026-01-12,Chen Hao,Business Website,1,1450.5,branch_shenzhen.csv\r
`,Q=`source_file,line,reason,branch,date,customer,product,qty,amount\r
branch_sanaa.csv,4,duplicate,Sana'a,05/01/2026,Al-Nour Trading,Website,1,1200.00\r
branch_sanaa.csv,5,invalid:amount|invalid:qty,Sana'a,2026-01-08,Broken Row,Website,,ABC\r
branch_shanghai.csv,4,duplicate,Shanghai,2026-01-07,Zhang Min,CRM System,1,1500\r
branch_shanghai.csv,6,invalid:qty,Shanghai,2026-01-11,Shanghai Trade Co.,Automation Sprint,-2,600\r
branch_shenzhen.csv,3,duplicate,Shenzhen,03-01-2026,Shenzhen Tech Hub,Data Report Pack,5,1250\r
branch_shenzhen.csv,5,missing:product,Shenzhen,2026-01-13,No Product,,1,900\r
branch_shenzhen.csv,6,negative:amount,Shenzhen,2026-01-14,Chen Hao,CRM System,1,(1500)\r
`,K=`# تقرير معالجة بيانات المبيعات

**تاريخ التوليد:** 2026-11-24T04:02:58

## الملخص التنفيذي

- ملفات الإدخال: 3
- إجمالي الصفوف المقروءة: 15
- الصفوف النظيفة: 8
- الصفوف المستبعدة: 7 (46.7%)
- إجمالي الإيرادات: $13,751.00
- متوسط قيمة الطلب: $1,718.88

## أفضل الأداء

- أفضل منتج: **CRM System** — $4,500.00
- أفضل فرع: **Sana'a** — $5,700.00

## الإيرادات اليومية

| التاريخ | الإيرادات |
|---|---:|
| 2026-01-03 | $1,250.00 |
| 2026-01-04 | $1,450.50 |
| 2026-01-05 | $1,200.00 |
| 2026-01-06 | $3,000.00 |
| 2026-01-07 | $1,500.00 |
| 2026-01-09 | $1,500.00 |
| 2026-01-10 | $2,400.00 |
| 2026-01-12 | $1,450.50 |

## أسباب استبعاد الصفوف

| السبب | العدد |
|---|---:|
| \`duplicate\` | 3 |
| \`invalid:amount\` | 1 |
| \`invalid:qty\` | 2 |
| \`missing:product\` | 1 |
| \`negative:amount\` | 1 |

## الملفات المولّدة

- \`clean_data.csv\`
- \`anomalies.csv\`
- \`summary.json\`
- \`report.md\`
`,w=`#!/usr/bin/env python3
"""EHAB TECH — Sales Data Pipeline.

A dependency-free Python tool that ingests messy branch CSV exports,
validates and normalises them, removes duplicates, detects anomalies,
and produces a clean dataset plus JSON and Markdown reports.

Usage:
    python3 pipeline.py
    python3 pipeline.py --input data/input --output data/output
    python3 pipeline.py --max-anomaly-rate 0.5 --quiet
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import re
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from statistics import mean

BASE_DIR = Path(__file__).resolve().parent

ARABIC_DIGITS = str.maketrans(
    "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹٬٫",
    "01234567890123456789,.",
)
DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y")
REQUIRED_FIELDS = ("branch", "date", "customer", "product")
LOG = logging.getLogger("ehab.pipeline")


@dataclass(frozen=True)
class CleanRow:
    branch: str
    date: str
    customer: str
    product: str
    qty: int
    amount: float
    source_file: str


def normalise_digits(value: object) -> str:
    """Trim text and convert Arabic-Indic digits to ASCII digits."""
    return str(value or "").strip().translate(ARABIC_DIGITS)


def parse_amount(raw: object) -> float:
    """Parse '١٬٥٠٠', '$1,450.50', ' 2,400 ' and '(1500)' into a float."""
    text = normalise_digits(raw)
    if not text:
        raise ValueError("empty amount")

    negative = text.startswith("(") and text.endswith(")")
    text = text.strip("()")
    text = re.sub(r"[^0-9.\\-]", "", text)
    if text in ("", "-", ".", "-."):
        raise ValueError("unreadable amount")

    value = float(text)
    return -value if negative else value


def parse_date(raw: object) -> str:
    """Normalise several date formats into ISO YYYY-MM-DD."""
    text = normalise_digits(raw)
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue
    raise ValueError(f"unknown date format: {raw!r}")


def parse_qty(raw: object) -> int:
    text = normalise_digits(raw)
    if not text:
        raise ValueError("empty quantity")
    value = int(float(text))
    if value <= 0:
        raise ValueError("non-positive quantity")
    return value


def process(input_dir: Path, output_dir: Path) -> dict:
    """Run the full pipeline and write all artefacts to output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)
    files = sorted(input_dir.glob("*.csv"))
    if not files:
        raise FileNotFoundError(f"No CSV files found in {input_dir}")

    clean: list[CleanRow] = []
    anomalies: list[dict] = []
    seen: set[tuple] = set()
    total_rows = 0

    for path in files:
        with path.open(newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                total_rows += 1
                line = reader.line_num
                reasons: list[str] = []

                values = {key: normalise_digits(row.get(key)) for key in REQUIRED_FIELDS}
                for key, value in values.items():
                    if not value:
                        reasons.append(f"missing:{key}")

                if reasons:
                    _record_anomaly(anomalies, reasons, row, path.name, line)
                    continue

                try:
                    day = parse_date(row.get("date"))
                except ValueError:
                    reasons.append("invalid:date")
                    day = ""

                try:
                    qty = parse_qty(row.get("qty"))
                except (ValueError, TypeError):
                    reasons.append("invalid:qty")
                    qty = 0

                try:
                    amount = parse_amount(row.get("amount"))
                except (ValueError, TypeError):
                    reasons.append("invalid:amount")
                    amount = 0.0
                else:
                    if amount < 0:
                        reasons.append("negative:amount")

                if reasons:
                    _record_anomaly(anomalies, reasons, row, path.name, line)
                    continue

                key = (values["branch"].casefold(), day, values["customer"].casefold(),
                       values["product"].casefold(), qty, round(amount, 2))
                if key in seen:
                    _record_anomaly(anomalies, ["duplicate"], row, path.name, line)
                    continue
                seen.add(key)

                clean.append(CleanRow(
                    branch=values["branch"],
                    date=day,
                    customer=values["customer"],
                    product=values["product"],
                    qty=qty,
                    amount=round(amount, 2),
                    source_file=path.name,
                ))

    clean.sort(key=lambda item: (item.date, item.branch, item.customer))

    _write_csv(
        output_dir / "clean_data.csv",
        ["branch", "date", "customer", "product", "qty", "amount", "source_file"],
        [[getattr(row, field) for field in ("branch", "date", "customer", "product", "qty", "amount", "source_file")]
         for row in clean],
    )
    _write_csv(
        output_dir / "anomalies.csv",
        ["source_file", "line", "reason", "branch", "date", "customer", "product", "qty", "amount"],
        [[item["source_file"], item["line"], item["reason"], item["branch"], item["date"],
          item["customer"], item["product"], item["qty"], item["amount"]] for item in anomalies],
    )

    product_revenue: dict[str, float] = defaultdict(float)
    branch_revenue: dict[str, float] = defaultdict(float)
    daily_revenue: dict[str, float] = defaultdict(float)
    for row in clean:
        product_revenue[row.product] += row.amount
        branch_revenue[row.branch] += row.amount
        daily_revenue[row.date] += row.amount

    amounts = [row.amount for row in clean]
    reason_counts = Counter(reason for item in anomalies for reason in item["reason"].split("|"))

    summary = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "input_files": [path.name for path in files],
        "total_rows": total_rows,
        "clean_rows": len(clean),
        "anomaly_rows": len(anomalies),
        "anomaly_rate": round(len(anomalies) / max(total_rows, 1), 4),
        "total_revenue": round(sum(amounts), 2),
        "average_order": round(mean(amounts), 2) if amounts else 0.0,
        "top_product": max(product_revenue, key=product_revenue.get) if product_revenue else "—",
        "top_product_revenue": round(max(product_revenue.values()), 2) if product_revenue else 0.0,
        "top_branch": max(branch_revenue, key=branch_revenue.get) if branch_revenue else "—",
        "top_branch_revenue": round(max(branch_revenue.values()), 2) if branch_revenue else 0.0,
        "daily_revenue": {day: round(value, 2) for day, value in sorted(daily_revenue.items())},
        "anomalies_by_reason": dict(sorted(reason_counts.items())),
        "output_files": ["clean_data.csv", "anomalies.csv", "summary.json", "report.md"],
    }

    (output_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8"
    )
    (output_dir / "report.md").write_text(_render_report(summary), encoding="utf-8")
    return summary


def _record_anomaly(anomalies: list[dict], reasons: list[str], row: dict, filename: str, line: int) -> None:
    anomalies.append({
        "source_file": filename,
        "line": line,
        "reason": "|".join(sorted(set(reasons))),
        "branch": normalise_digits(row.get("branch")),
        "date": normalise_digits(row.get("date")),
        "customer": normalise_digits(row.get("customer")),
        "product": normalise_digits(row.get("product")),
        "qty": normalise_digits(row.get("qty")),
        "amount": normalise_digits(row.get("amount")),
    })


def _write_csv(path: Path, header: list[str], rows: list[list]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)


def _md_cell(value: object) -> str:
    """Escape CSV-derived values before placing them in a Markdown table."""
    return str(value).replace("|", "\\\\|").replace("\\n", " ").replace("\\r", " ").strip()


def _render_report(s: dict) -> str:
    lines = [
        "# تقرير معالجة بيانات المبيعات",
        "",
        f"**تاريخ التوليد:** {s['generated_at']}",
        "",
        "## الملخص التنفيذي",
        "",
        f"- ملفات الإدخال: {len(s['input_files'])}",
        f"- إجمالي الصفوف المقروءة: {s['total_rows']}",
        f"- الصفوف النظيفة: {s['clean_rows']}",
        f"- الصفوف المستبعدة: {s['anomaly_rows']} ({s['anomaly_rate']:.1%})",
        f"- إجمالي الإيرادات: \${s['total_revenue']:,.2f}",
        f"- متوسط قيمة الطلب: \${s['average_order']:,.2f}",
        "",
        "## أفضل الأداء",
        "",
        f"- أفضل منتج: **{_md_cell(s['top_product'])}** — \${s['top_product_revenue']:,.2f}",
        f"- أفضل فرع: **{_md_cell(s['top_branch'])}** — \${s['top_branch_revenue']:,.2f}",
        "",
        "## الإيرادات اليومية",
        "",
        "| التاريخ | الإيرادات |",
        "|---|---:|",
    ]
    for day, value in s["daily_revenue"].items():
        lines.append(f"| {_md_cell(day)} | \${value:,.2f} |")

    lines += ["", "## أسباب استبعاد الصفوف", "", "| السبب | العدد |", "|---|---:|"]
    for reason, count in s["anomalies_by_reason"].items():
        lines.append(f"| \`{_md_cell(reason)}\` | {count} |")

    lines += [
        "",
        "## الملفات المولّدة",
        "",
    ]
    for name in s["output_files"]:
        lines.append(f"- \`{_md_cell(name)}\`")
    lines.append("")
    return "\\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="EHAB TECH sales data pipeline")
    parser.add_argument("--input", type=Path, default=BASE_DIR / "data" / "input", help="folder containing input CSV files")
    parser.add_argument("--output", type=Path, default=BASE_DIR / "data" / "output", help="folder for generated artefacts")
    parser.add_argument("--max-anomaly-rate", type=float, default=1.0, help="fail above this anomaly ratio (0-1)")
    parser.add_argument("--quiet", action="store_true", help="suppress progress logs")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.WARNING if args.quiet else logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%H:%M:%S",
    )

    try:
        summary = process(args.input, args.output)
    except (FileNotFoundError, OSError, ValueError) as exc:
        LOG.error("Pipeline failed: %s", exc)
        return 1

    LOG.info("Read %s rows from %s files", summary["total_rows"], len(summary["input_files"]))
    LOG.info("Clean rows: %s | Anomalies: %s", summary["clean_rows"], summary["anomaly_rows"])
    LOG.info("Revenue: $%s | Output: %s", f"{summary['total_revenue']:,.2f}", args.output)

    if summary["anomaly_rate"] > args.max_anomaly_rate:
        LOG.error("Anomaly rate %.1f%% exceeds limit %.1f%%", summary["anomaly_rate"] * 100, args.max_anomaly_rate * 100)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,X=`#!/usr/bin/env python3
"""Unit tests for the EHAB TECH sales data pipeline (stdlib only)."""

import tempfile
import unittest
from pathlib import Path

from pipeline import _render_report, normalise_digits, parse_amount, parse_date, parse_qty, process


class ParsingTests(unittest.TestCase):
    def test_arabic_digits(self):
        self.assertEqual(normalise_digits("١٬٥٠٠"), "1,500")
        self.assertEqual(parse_amount("١٬٥٠٠"), 1500.0)

    def test_currency_and_spaces(self):
        self.assertEqual(parse_amount("$1,450.50"), 1450.5)
        self.assertEqual(parse_amount(" 2,400 "), 2400.0)

    def test_parentheses_are_negative(self):
        self.assertEqual(parse_amount("(1500)"), -1500.0)

    def test_date_formats(self):
        self.assertEqual(parse_date("2026-01-05"), "2026-01-05")
        self.assertEqual(parse_date("05/01/2026"), "2026-01-05")
        self.assertEqual(parse_date("2026/01/04"), "2026-01-04")
        self.assertEqual(parse_date("03-01-2026"), "2026-01-03")

    def test_invalid_inputs(self):
        with self.assertRaises(ValueError):
            parse_amount("ABC")
        with self.assertRaises(ValueError):
            parse_date("not-a-date")
        with self.assertRaises(ValueError):
            parse_qty("-2")
        with self.assertRaises(ValueError):
            parse_qty("")

    def test_valid_quantity(self):
        self.assertEqual(parse_qty("٣"), 3)
        self.assertEqual(parse_qty("2.0"), 2)


class PipelineTests(unittest.TestCase):
    def test_dedupe_and_anomalies(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            input_dir = base / "input"
            output_dir = base / "output"
            input_dir.mkdir()
            header = "branch,date,customer,product,qty,amount"
            row = "Sanaa,2026-01-05,Acme,Website,2,100"
            (input_dir / "branch.csv").write_text(f"{header}\\n{row}\\n{row}\\nSanaa,2026-02-30,Acme,Website,1,50\\n", encoding="utf-8")
            summary = process(input_dir, output_dir)
            self.assertEqual(summary["total_rows"], 3)
            self.assertEqual(summary["clean_rows"], 1)
            self.assertEqual(summary["anomaly_rows"], 2)
            self.assertEqual(summary["anomalies_by_reason"]["duplicate"], 1)
            self.assertEqual(summary["anomalies_by_reason"]["invalid:date"], 1)
            self.assertEqual(summary["total_revenue"], 100.0)

    def test_report_escapes_markdown_cells(self):
        summary = {
            "generated_at": "2026-01-01T00:00:00", "input_files": ["a.csv"],
            "total_rows": 1, "clean_rows": 1, "anomaly_rows": 0, "anomaly_rate": 0.0,
            "total_revenue": 10.0, "average_order": 10.0,
            "top_product": "Web | Pro", "top_product_revenue": 10.0,
            "top_branch": "Sanaa", "top_branch_revenue": 10.0,
            "daily_revenue": {"2026-01-01": 10.0},
            "anomalies_by_reason": {"missing|amount": 1},
            "output_files": ["clean_data.csv"],
        }
        report = _render_report(summary)
        self.assertIn("Web \\\\| Pro", report)
        self.assertIn("missing\\\\|amount", report)


if __name__ == "__main__":
    unittest.main(verbosity=2)
`,T=`branch,date,customer,product,qty,amount
Sana'a,2026-01-05,Al-Nour Trading,Website,1,1200.00
Sana'a,2026-01-06,Li Wei,CRM System,2,3000
Sana'a,05/01/2026,Al-Nour Trading,Website,1,1200.00
Sana'a,2026-01-08,Broken Row,Website,,ABC
Sana'a,2026-01-09,Mona Al-Otaibi,Automation Sprint,3,"١٬٥٠٠"
`,$=`branch,date,customer,product,qty,amount
Shanghai,2026/01/04,Shanghai Trade Co.,Business Website,1,"$1,450.50"
Shanghai,2026-01-07,Zhang Min,CRM System,1,1500
Shanghai,2026-01-07,Zhang Min,CRM System,1,1500
Shanghai,2026-01-10,Ningbo Export Ltd.,POS Dashboard,2," 2,400 "
Shanghai,2026-01-11,Shanghai Trade Co.,Automation Sprint,-2,600
`,k=`branch,date,customer,product,qty,amount
Shenzhen,2026-01-03,Shenzhen Tech Hub,Data Report Pack,5,1250
Shenzhen,03-01-2026,Shenzhen Tech Hub,Data Report Pack,5,1250
Shenzhen,2026-01-12,Chen Hao,Business Website,1,1450.50
Shenzhen,2026-01-13,No Product,,1,900
Shenzhen,2026-01-14,Chen Hao,CRM System,1,(1500)
`,M="branch,date,customer,product,qty,amount,source_file",S=[M,...[T,$,k].flatMap(r=>r.trim().split(`
`).slice(1).map(s=>s.trim()).filter(Boolean))].join(`
`);function E(r){return(r??"").trim().replace(/[\u0660-\u0669\u06F0-\u06F9]/g,s=>{const t=s.charCodeAt(0);return String(t<=1641?t-1632:t-1776)}).replace(/\u066C/g,",").replace(/\u066B/g,".")}function ee(r){let s=E(r);if(!s)throw new Error("empty");const t=/^\(.*\)$/.test(s);if(s=s.replace(/^\(|\)$/g,"").replace(/[^0-9.\-]/g,""),!s||["-",".","-."].includes(s))throw new Error("bad");const n=Number.parseFloat(s);if(!Number.isFinite(n))throw new Error("bad");return t?-n:n}function ne(r){const s=E(r),t=[[/^(\d{4})-(\d{1,2})-(\d{1,2})$/,(n,l,o)=>[Number(n),Number(l),Number(o)]],[/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,(n,l,o)=>[Number(n),Number(o),Number(l)]],[/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,(n,l,o)=>[Number(n),Number(l),Number(o)]],[/^(\d{1,2})-(\d{1,2})-(\d{4})$/,(n,l,o)=>[Number(n),Number(o),Number(l)]]];for(const[n,l]of t){const o=s.match(n);if(!o)continue;const[i,f,x]=l(o[1],o[2],o[3]),d=new Date(Date.UTC(i,f-1,x));if(d.getUTCFullYear()!==i||d.getUTCMonth()!==f-1||d.getUTCDate()!==x)throw new Error("date");return`${String(i).padStart(4,"0")}-${String(f).padStart(2,"0")}-${String(x).padStart(2,"0")}`}throw new Error("date")}function ae(r){const s=Number(E(r));if(!Number.isFinite(s)||s<=0)throw new Error("qty");return Math.trunc(s)}function se(r){const s=[];let t=[],n="",l=!1;for(let o=0;o<r.length;o+=1){const i=r[o];l?i==='"'?r[o+1]==='"'?(n+='"',o+=1):l=!1:n+=i:i==='"'?l=!0:i===","?(t.push(n),n=""):i===`
`?(t.push(n),s.push(t),t=[],n=""):i!=="\r"&&(n+=i)}return(n||t.length)&&(t.push(n),s.push(t)),s.filter(o=>o.some(i=>i.trim()))}function A(r,s="browser_input.csv"){const t=se(r);if(t.length<2)return{clean:[],bad:[],totalRows:0,revenue:0};const n=t[0].map(d=>d.trim().toLowerCase()),l=d=>n.indexOf(d),o=[],i=[],f=new Set;let x=0;for(const d of t.slice(1)){x+=1;const p=u=>E(d[l(u)]??""),h={branch:p("branch"),date:p("date"),customer:p("customer"),product:p("product"),qty:p("qty"),amount:p("amount")},_=[];for(const u of["branch","date","customer","product"])h[u]||_.push(`missing:${u}`);let g="",y=0,b=0;if(!_.length){try{g=ne(h.date)}catch{_.push("invalid:date")}try{y=ae(h.qty)}catch{_.push("invalid:qty")}try{b=ee(h.amount),b<0&&_.push("negative:amount")}catch{_.push("invalid:amount")}}if(_.length){i.push({reason:[...new Set(_)].sort().join("|"),...h});continue}const a=[h.branch.toLowerCase(),g,h.customer.toLowerCase(),h.product.toLowerCase(),y,b.toFixed(2)].join("|");if(f.has(a)){i.push({reason:"duplicate",...h});continue}f.add(a),o.push({branch:h.branch,date:g,customer:h.customer,product:h.product,qty:y,amount:Math.round(b*100)/100,source_file:s})}return o.sort((d,p)=>d.date.localeCompare(p.date)||d.branch.localeCompare(p.branch)||d.customer.localeCompare(p.customer)),{clean:o,bad:i,totalRows:x,revenue:Math.round(o.reduce((d,p)=>d+p.amount,0)*100)/100}}function te(r){const s=String(r);return/[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}function re(r){return`\uFEFF${[M,...r.map(s=>[s.branch,s.date,s.customer,s.product,s.qty,s.amount,s.source_file].map(te).join(","))].join(`
`)}
`}function R(r,s,t="text/plain;charset=utf-8"){const n=URL.createObjectURL(new Blob([s],{type:t})),l=document.createElement("a");l.href=n,l.download=r,l.click(),window.setTimeout(()=>URL.revokeObjectURL(n),1e3)}function le(){const{lang:r,t:s}=z(),t=r==="ar",n=(a,u)=>t?a:u,[l,o]=v.useState(S),[i,f]=v.useState(()=>A(S)),[x,d]=v.useState(!1);v.useEffect(()=>{const a=document.title;return document.title=t?"مسار أتمتة البيانات | EHAB TECH":"Data Automation Pipeline | EHAB TECH",()=>{document.title=a}},[t]);const p=v.useMemo(()=>Object.entries(c.daily_revenue),[]),h=v.useMemo(()=>Object.entries(c.anomalies_by_reason),[]),_=Math.max(1,...p.map(([,a])=>a)),g=Math.max(1,...h.map(([,a])=>a)),y=[{icon:"globe",ar:"الاستيراد",en:"Ingest",dAr:"3 ملفات CSV",dEn:"3 CSV files",v:`${c.total_rows} ${n("صف","rows")}`},{icon:"filter",ar:"التحقق",en:"Validate",dAr:"قواعد وحقول",dEn:"Rules & fields",v:`6 ${n("قواعد","rules")}`},{icon:"bolt",ar:"التنظيف",en:"Clean",dAr:"أرقام وتواريخ",dEn:"Digits & dates",v:`${c.clean_rows} ${n("سليم","valid")}`},{icon:"shield",ar:"كشف الشذوذ",en:"Detect",dAr:"تكرار وشذوذ",dEn:"Duplicates & issues",v:`${c.anomaly_rows} ${n("مستبعد","flagged")}`},{icon:"chart",ar:"التحليل",en:"Analyze",dAr:"إيرادات ومؤشرات",dEn:"Revenue & KPIs",v:`$${c.total_revenue.toLocaleString()}`},{icon:"code",ar:"التقرير",en:"Report",dAr:"JSON + Markdown",dEn:"JSON + Markdown",v:`4 ${n("ملفات","files")}`}];async function b(){try{await navigator.clipboard.writeText(w),d(!0),window.setTimeout(()=>d(!1),2e3)}catch{R("pipeline.py",w)}}return e.jsxs("div",{className:"au-app",dir:t?"rtl":"ltr",children:[e.jsxs("header",{className:"au-topbar",children:[e.jsxs(C,{to:"/services/automation",className:"au-brand",children:[e.jsx("span",{className:"au-brand__mark",children:e.jsx(m,{name:"bolt",size:18})}),e.jsxs("span",{children:[e.jsx("strong",{children:"EHAB TECH"}),e.jsx("small",{children:n("الأتمتة ومعالجة البيانات","AUTOMATION LAB")})]})]}),e.jsxs("div",{className:"au-topbar__right",children:[e.jsxs("span",{className:"au-pill",children:[e.jsx("span",{className:"au-pulse"})," LIVE DEMO"]}),e.jsxs(C,{to:"/",className:"au-back",children:["← ",s("common.backToSite")]})]})]}),e.jsxs("main",{children:[e.jsx("section",{className:"au-hero",children:e.jsxs("div",{className:"au-container au-hero__inner",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"au-eyebrow",children:[e.jsx(m,{name:"bolt",size:14})," ",n("المشروع الثالث","PROJECT 03")]}),e.jsx("h1",{children:n("من فوضى البيانات إلى قرار جاهز.","From messy data to a decision-ready report.")}),e.jsx("p",{children:n("سكربت Python ينظّف ملفات الفروع ويكشف الشذوذ ويولّد التقارير — بدون مكتبات خارجية.","A Python script cleans branch files, flags anomalies and generates reports — with zero external libraries.")}),e.jsxs("div",{className:"au-hero__actions",children:[e.jsxs("a",{href:"#runner",className:"au-btn au-btn--primary",children:[e.jsx(m,{name:"bolt",size:17})," ",n("جرّبه","Try it")]}),e.jsxs("a",{href:"#code",className:"au-btn au-btn--ghost",children:[e.jsx(m,{name:"code",size:17})," ",n("الكود","Code")]})]})]}),e.jsxs("div",{className:"au-hero__terminal",children:[e.jsxs("div",{className:"au-terminal__head",children:[e.jsx("span",{}),e.jsx("span",{}),e.jsx("span",{}),e.jsx("em",{children:"pipeline.py"})]}),e.jsxs("pre",{children:[e.jsx("span",{className:"au-c-dim",children:"$ python3 pipeline.py"}),`
`,e.jsx("span",{className:"au-c-green",children:"✓"})," ",n("قراءة","Read")," ",c.total_rows," ",n("صفاً","rows"),`
`,e.jsx("span",{className:"au-c-green",children:"✓"})," ",n("نظيف","Clean"),": ",c.clean_rows," | ",n("شذوذ","Anomalies"),": ",c.anomaly_rows,`
`,e.jsx("span",{className:"au-c-green",children:"✓"})," ",n("الإيرادات","Revenue"),": $",c.total_revenue.toLocaleString(),`
`,e.jsx("span",{className:"au-c-cyan",children:"→"})," clean_data.csv, anomalies.csv, summary.json, report.md",`
`,e.jsx("span",{className:"au-c-dim",children:"8/8 tests passed · exit 0"})]})]})]})}),e.jsxs("section",{className:"au-container au-metrics",children:[e.jsx(N,{label:n("مقروءة","Ingested"),value:String(c.total_rows),sub:n("3 فروع","3 branches")}),e.jsx(N,{label:n("نظيفة","Clean"),value:String(c.clean_rows),sub:"53%",tone:"green"}),e.jsx(N,{label:n("مستبعدة","Flagged"),value:String(c.anomaly_rows),sub:"46.7%",tone:"amber"}),e.jsx(N,{label:n("الإيرادات","Revenue"),value:`$${c.total_revenue.toLocaleString()}`,sub:n("مكتشفة","recovered"),tone:"cyan"})]}),e.jsxs("section",{className:"au-container au-section",children:[e.jsx(j,{eyebrow:n("كيف يعمل","HOW IT WORKS"),title:n("ست مراحل","Six stages"),desc:n("من الملف الخام إلى التقرير","From raw file to report")}),e.jsx("div",{className:"au-stages",children:y.map((a,u)=>e.jsxs("div",{className:"au-stage",children:[e.jsx("span",{className:"au-stage__num",children:String(u+1).padStart(2,"0")}),e.jsx("span",{className:"au-stage__icon",children:e.jsx(m,{name:a.icon,size:22})}),e.jsx("strong",{children:t?a.ar:a.en}),e.jsx("small",{children:t?a.dAr:a.dEn}),e.jsx("em",{children:a.v})]},a.en))})]}),e.jsxs("section",{className:"au-container au-section",children:[e.jsx(j,{eyebrow:n("قبل / بعد","BEFORE / AFTER"),title:n("المدخل الخام مقابل المخرج النظيف","Raw input vs clean output"),desc:n("أرقام عربية وتواريخ مختلفة وتكرارات","Arabic digits, mixed dates, duplicates")}),e.jsxs("div",{className:"au-compare",children:[e.jsxs("div",{className:"au-code-card au-code-card--raw",children:[e.jsxs("div",{className:"au-code-card__head",children:[e.jsx("span",{className:"au-dot au-dot--red"}),e.jsx("strong",{children:n("المدخل","Raw")})]}),e.jsx("pre",{children:[T,$,k].map(a=>a.trim()).join(`

`)})]}),e.jsx("div",{className:"au-compare__arrow",children:e.jsx(m,{name:"arrow",size:22})}),e.jsxs("div",{className:"au-code-card au-code-card--clean",children:[e.jsxs("div",{className:"au-code-card__head",children:[e.jsx("span",{className:"au-dot au-dot--green"}),e.jsx("strong",{children:n("النظيف","Clean")})]}),e.jsx("pre",{children:q.trim()})]})]})]}),e.jsxs("section",{className:"au-container au-section",id:"runner",children:[e.jsx(j,{eyebrow:n("تفاعلي","INTERACTIVE"),title:n("شغّل المنطق في متصفحك","Run the logic in your browser"),desc:n("نسخة JavaScript تطابق قواعد Python","A JavaScript mirror of the Python rules")}),e.jsxs("div",{className:"au-runner",children:[e.jsxs("div",{className:"au-runner__input",children:[e.jsxs("div",{className:"au-runner__head",children:[e.jsx("strong",{children:"CSV"}),e.jsx("button",{type:"button",onClick:()=>{o(S),f(A(S))},children:n("إعادة","Reset")})]}),e.jsx("textarea",{value:l,onChange:a=>o(a.target.value),spellCheck:!1,"aria-label":t?"مدخل CSV":"CSV input"}),e.jsxs("button",{type:"button",className:"au-btn au-btn--primary au-run-btn",onClick:()=>f(A(l)),children:[e.jsx(m,{name:"bolt",size:17})," ",n("تشغيل","Run")]})]}),e.jsxs("div",{className:"au-runner__output",children:[e.jsxs("div",{className:"au-runner__head",children:[e.jsx("strong",{children:n("النتيجة","Result")}),e.jsxs("span",{children:[i.totalRows," → ",i.clean.length]})]}),e.jsxs("div",{className:"au-runner__stats",children:[e.jsxs("span",{children:[e.jsx("b",{children:i.clean.length})," ",n("نظيف","clean")]}),e.jsxs("span",{children:[e.jsx("b",{children:i.bad.length})," ",n("مستبعد","flagged")]}),e.jsx("span",{className:"au-revenue",children:e.jsxs("b",{children:["$",i.revenue.toLocaleString()]})})]}),e.jsxs("div",{className:"au-runner__tables",children:[e.jsxs("table",{children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:n("التاريخ","Date")}),e.jsx("th",{children:n("العميل","Customer")}),e.jsx("th",{children:n("المبلغ","Amount")})]})}),e.jsx("tbody",{children:i.clean.slice(0,6).map((a,u)=>e.jsxs("tr",{children:[e.jsx("td",{children:a.date}),e.jsx("td",{children:a.customer}),e.jsxs("td",{children:["$",a.amount.toFixed(2)]})]},`${a.date}-${u}`))})]}),i.bad.length>0&&e.jsx("div",{className:"au-flagged",children:[...new Set(i.bad.flatMap(a=>a.reason.split("|")))].map(a=>e.jsxs("em",{children:[a," × ",i.bad.filter(u=>u.reason.split("|").includes(a)).length]},a))})]}),e.jsxs("button",{type:"button",className:"au-btn au-btn--ghost au-download-run",onClick:()=>R("browser_clean_data.csv",re(i.clean),"text/csv;charset=utf-8"),children:[e.jsx(m,{name:"download",size:16})," CSV"]})]})]})]}),e.jsxs("section",{className:"au-container au-section",children:[e.jsx(j,{eyebrow:n("التحليلات","ANALYTICS"),title:n("أرقام حقيقية من التنفيذ","Real numbers from the run"),desc:n("من summary.json المولّد","From generated summary.json")}),e.jsxs("div",{className:"au-analytics",children:[e.jsxs("div",{className:"au-chart-card",children:[e.jsx("h3",{children:n("الإيرادات اليومية","Daily revenue")}),e.jsx("div",{className:"au-bars",children:p.map(([a,u])=>e.jsxs("div",{className:"au-bar",title:`${a}: $${u}`,children:[e.jsxs("span",{className:"au-bar__value",children:["$",Math.round(u).toLocaleString()]}),e.jsx("i",{style:{height:`${u/_*100}%`}}),e.jsx("small",{children:a.slice(5)})]},a))})]}),e.jsxs("div",{className:"au-insights",children:[e.jsxs("div",{className:"au-insight",children:[e.jsx(m,{name:"target",size:19}),e.jsx("span",{children:n("أفضل منتج","Top product")}),e.jsx("strong",{children:c.top_product}),e.jsxs("small",{children:["$",c.top_product_revenue.toLocaleString()]})]}),e.jsxs("div",{className:"au-insight",children:[e.jsx(m,{name:"globe",size:19}),e.jsx("span",{children:n("أفضل فرع","Top branch")}),e.jsx("strong",{children:c.top_branch}),e.jsxs("small",{children:["$",c.top_branch_revenue.toLocaleString()]})]}),e.jsxs("div",{className:"au-insight",children:[e.jsx(m,{name:"chart",size:19}),e.jsx("span",{children:n("المتوسط","Average")}),e.jsxs("strong",{children:["$",c.average_order.toLocaleString()]})]}),e.jsxs("div",{className:"au-reasons",children:[e.jsx("h4",{children:n("الأسباب","Reasons")}),h.map(([a,u])=>e.jsxs("div",{className:"au-reason",children:[e.jsx("code",{children:a}),e.jsx("i",{children:e.jsx("b",{style:{width:`${u/g*100}%`}})}),e.jsx("span",{children:u})]},a))]})]})]})]}),e.jsxs("section",{className:"au-container au-section",id:"code",children:[e.jsx(j,{eyebrow:n("الملفات","ARTEFACTS"),title:n("كل شيء للفحص","Open for inspection"),desc:n("حمّل الكود والمخرجات","Download code and outputs")}),e.jsx("div",{className:"au-artifacts",children:[{name:"pipeline.py",label:n("السكربت","Script"),content:w,icon:"code"},{name:"test_pipeline.py",label:n("الاختبارات","Tests"),content:X,icon:"check"},{name:"clean_data.csv",label:n("البيانات النظيفة","Clean data"),content:q,icon:"filter"},{name:"anomalies.csv",label:n("الشذوذات","Anomalies"),content:Q,icon:"shield"},{name:"summary.json",label:"JSON",content:JSON.stringify(c,null,2),icon:"chart"},{name:"report.md",label:"Markdown",content:K,icon:"globe"}].map(a=>e.jsxs("button",{type:"button",className:"au-artifact",onClick:()=>R(a.name,a.content),children:[e.jsx("span",{className:"au-artifact__icon",children:e.jsx(m,{name:a.icon,size:19})}),e.jsxs("span",{className:"au-artifact__meta",children:[e.jsx("strong",{children:a.name}),e.jsx("small",{children:a.label})]}),e.jsx(m,{name:"download",size:17})]},a.name))}),e.jsxs("div",{className:"au-source",children:[e.jsxs("div",{className:"au-source__head",children:[e.jsx("strong",{children:"pipeline.py"}),e.jsxs("div",{children:[e.jsx("span",{className:"au-lang",children:"Python 3 · stdlib only"}),e.jsxs("button",{type:"button",onClick:b,children:[e.jsx(m,{name:x?"check":"code",size:15})," ",x?n("تم","Done"):n("نسخ","Copy")]})]})]}),e.jsx("pre",{children:e.jsx("code",{children:w})})]})]}),e.jsx("section",{className:"au-cta",children:e.jsxs("div",{className:"au-container au-cta__inner",children:[e.jsxs("div",{children:[e.jsx(oe,{children:n("التالي","NEXT")}),e.jsx("h2",{children:n("بياناتك فوضوية؟","Messy data?")}),e.jsx("p",{children:n("أبني لك مسار أتمتة مخصصاً","I can build a custom pipeline for you.")})]}),e.jsxs(C,{to:"/contact",className:"au-btn au-btn--primary",children:[e.jsx(m,{name:"external",size:17})," ",s("nav.startProject")]})]})})]})]})}function N({label:r,value:s,sub:t,tone:n}){return e.jsxs("div",{className:`au-metric ${n?`au-metric--${n}`:""}`,children:[e.jsx("span",{children:r}),e.jsx("strong",{children:s}),e.jsx("small",{children:t})]})}function j({eyebrow:r,title:s,desc:t}){return e.jsxs("div",{className:"au-section-head",children:[e.jsxs("span",{className:"au-eyebrow",children:[e.jsx(m,{name:"bolt",size:14})," ",r]}),e.jsx("h2",{children:s}),e.jsx("p",{children:t})]})}function oe({children:r}){return e.jsxs("span",{className:"au-eyebrow",children:[e.jsx(m,{name:"bolt",size:14})," ",r]})}export{le as default};
