#!/usr/bin/env python3
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
            (input_dir / "branch.csv").write_text(f"{header}\n{row}\n{row}\nSanaa,2026-02-30,Acme,Website,1,50\n", encoding="utf-8")
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
        self.assertIn("Web \\| Pro", report)
        self.assertIn("missing\\|amount", report)


if __name__ == "__main__":
    unittest.main(verbosity=2)
