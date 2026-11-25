#!/usr/bin/env python3
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
    text = re.sub(r"[^0-9.\-]", "", text)
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
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
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
    return str(value).replace("|", "\\|").replace("\n", " ").replace("\r", " ").strip()


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
        f"- إجمالي الإيرادات: ${s['total_revenue']:,.2f}",
        f"- متوسط قيمة الطلب: ${s['average_order']:,.2f}",
        "",
        "## أفضل الأداء",
        "",
        f"- أفضل منتج: **{_md_cell(s['top_product'])}** — ${s['top_product_revenue']:,.2f}",
        f"- أفضل فرع: **{_md_cell(s['top_branch'])}** — ${s['top_branch_revenue']:,.2f}",
        "",
        "## الإيرادات اليومية",
        "",
        "| التاريخ | الإيرادات |",
        "|---|---:|",
    ]
    for day, value in s["daily_revenue"].items():
        lines.append(f"| {_md_cell(day)} | ${value:,.2f} |")

    lines += ["", "## أسباب استبعاد الصفوف", "", "| السبب | العدد |", "|---|---:|"]
    for reason, count in s["anomalies_by_reason"].items():
        lines.append(f"| `{_md_cell(reason)}` | {count} |")

    lines += [
        "",
        "## الملفات المولّدة",
        "",
    ]
    for name in s["output_files"]:
        lines.append(f"- `{_md_cell(name)}`")
    lines.append("")
    return "\n".join(lines)


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
