"""
Independent check of the dashboard numbers.

This is a second implementation of the same rules, written in plain Python
(standard library only) without reusing any of the app's TypeScript code.
If the dashboard and this script agree, the numbers are very unlikely to be
wrong because of a parsing bug in one of them.

Usage: python3 scripts/verify_numbers.py data/biota_orders_oct2026.csv
"""
import csv
import re
import sys
from collections import defaultdict
from datetime import datetime

CHANNELS = {"shopee": "Shopee", "tiktokshop": "TikTok Shop", "tiktok": "TikTok Shop",
            "tokopedia": "Tokopedia", "tokped": "Tokopedia"}
COUNTED = {"selesai", "pesanan selesai", "completed", "dikirim", "sedang dikirim", "in transit"}
CANCELLED = {"batal", "dibatalkan", "cancelled"}
RETURNED = {"pengembalian dana", "refunded", "dikomplain - retur"}


def money(text):
    s = re.sub(r"^(rp|idr)", "", text.strip(), flags=re.I).replace(" ", "")
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", s):
        return int(s.replace(".", ""))
    if re.fullmatch(r"\d{1,3}(,\d{3})+", s):
        return int(s.replace(",", ""))
    if re.fullmatch(r"\d+(\.0+)?", s):
        return int(float(s))
    raise ValueError(f"unknown money format: {text!r}")


def order_day(text):
    s = text.strip()
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M",
                "%b %d, %Y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass
    raise ValueError(f"unknown date format: {text!r}")


def load(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        raw = list(csv.DictReader(f))
    rows = []
    for r in raw:
        rows.append({
            "order_id": r["order_id"].strip(),
            "day": order_day(r["order_date"]),
            "date_raw": r["order_date"].strip(),
            "channel": CHANNELS[re.sub(r"[^a-z]", "", r["channel"].lower())],
            "sku": r["sku"].strip().upper(),
            "name": r["product_name"].strip(),
            "qty": int(float(r["qty"])),
            "unit": money(r["unit_price"]),
            "total": money(r["total_price"]),
            "status": r["status"].strip().lower(),
            "city": r["buyer_city"].strip(),
        })
    # Fill empty SKUs from rows with the same channel + listing name.
    known = defaultdict(set)
    for r in rows:
        if r["sku"]:
            known[(r["channel"], r["name"].lower())].add(r["sku"])
    for r in rows:
        r["sku_was_empty"] = not r["sku"]
        if not r["sku"]:
            options = known[(r["channel"], r["name"].lower())]
            if len(options) == 1:
                r["sku"] = next(iter(options))
    # Drop exact duplicates.
    seen, unique = set(), []
    for r in rows:
        key = (r["order_id"], r["channel"], r["date_raw"], r["sku"], r["name"], r["qty"],
               r["unit"], r["total"], r["status"], r["city"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return raw, unique


def report(rows, label):
    counted = [r for r in rows if r["status"] in COUNTED]
    print(f"\n== {label} ==")
    print(f"Net revenue      : Rp {sum(r['total'] for r in counted):>13,}")
    for ch in ("Shopee", "TikTok Shop", "Tokopedia"):
        print(f"  {ch:<15}: Rp {sum(r['total'] for r in counted if r['channel'] == ch):>13,}")
    print(f"Orders / units   : {len({(r['channel'], r['order_id']) for r in counted})} / {sum(r['qty'] for r in counted)}")
    return counted


def main(path):
    raw, rows = load(path)
    unknown = {r["status"] for r in rows} - COUNTED - CANCELLED - RETURNED
    assert not unknown, f"unknown statuses: {unknown}"
    print(f"Rows read {len(raw)}, duplicates removed {len(raw) - len(rows)}, lines kept {len(rows)}")
    empty = [r for r in rows if r["sku_was_empty"]]
    print(f"Kept lines with empty SKU {len(empty)}, recovered {sum(1 for r in empty if r['sku'])}")
    counted = report(rows, "Semua data")
    report([r for r in rows if "2026-10-01" <= r["day"] <= "2026-10-15"], "1-15 Oktober 2026")
    report([r for r in rows if "2026-10-16" <= r["day"] <= "2026-10-31"], "16-31 Oktober 2026")
    print("\n== Top 10 produk (semua data) ==")
    products = defaultdict(lambda: [0, 0])
    for r in counted:
        products[r["sku"]][0] += r["total"]
        products[r["sku"]][1] += r["qty"]
    ranked = sorted(products.items(), key=lambda kv: -kv[1][0])
    for i, (sku, (total, qty)) in enumerate(ranked[:10], 1):
        print(f"{i:>2}. {sku:<12} Rp {total:>12,}  {qty:>3} unit")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "data/biota_orders_oct2026.csv")
