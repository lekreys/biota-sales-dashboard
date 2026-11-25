"""
Independent check of the dashboard numbers.

This is a second implementation of the same rules, written in plain Python
(standard library only) without reusing any of the app's TypeScript code.
If the dashboard and this script agree, the numbers are very unlikely to be
wrong because of a parsing bug in one of them.

Usage:
  python3 scripts/verify_numbers.py data/biota_orders_oct2026.csv          # readable report
  python3 scripts/verify_numbers.py --json data/biota_orders_oct2026.csv   # every dashboard number, as JSON

The JSON mode is used by src/lib/crosscheck.test.ts: for each filter scenario below,
every number the dashboard shows must equal the number computed here.
"""
import csv
import json
import re
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta

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
            "status_raw": " ".join(r["status"].split()),
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


ALL_CHANNELS = ["Shopee", "TikTok Shop", "Tokopedia"]

# Filter scenarios checked against the dashboard (the TypeScript test reads them from here).
SCENARIOS = [
    {"name": "semua data", "from": "", "to": "", "channels": ALL_CHANNELS, "product": None},
    {"name": "1-15 Oktober", "from": "2026-10-01", "to": "2026-10-15", "channels": ALL_CHANNELS, "product": None},
    {"name": "16-31 Oktober", "from": "2026-10-16", "to": "2026-10-31", "channels": ALL_CHANNELS, "product": None},
    {"name": "satu hari, 5 Oktober", "from": "2026-10-05", "to": "2026-10-05", "channels": ALL_CHANNELS, "product": None},
    {"name": "Shopee saja", "from": "", "to": "", "channels": ["Shopee"], "product": None},
    {"name": "TikTok Shop + Tokopedia, 1-15 Oktober", "from": "2026-10-01", "to": "2026-10-15",
     "channels": ["TikTok Shop", "Tokopedia"], "product": None},
    {"name": "produk BIO-CAM-BF", "from": "", "to": "", "channels": ALL_CHANNELS, "product": "BIO-CAM-BF"},
    {"name": "produk BIO-SD-S64 di Tokopedia, 16-31 Oktober", "from": "2026-10-16", "to": "2026-10-31",
     "channels": ["Tokopedia"], "product": "BIO-SD-S64"},
]


def keep(r, f, ignore=()):
    if "date" not in ignore and ((f["from"] and r["day"] < f["from"]) or (f["to"] and r["day"] > f["to"])):
        return False
    if "channel" not in ignore and r["channel"] not in f["channels"]:
        return False
    if "product" not in ignore and f["product"] and r["sku"] != f["product"]:
        return False
    return True


def scenario(rows, f, first_day, last_day):
    selected = [r for r in rows if keep(r, f)]
    counted = [r for r in selected if r["status"] in COUNTED]
    excluded = [r for r in selected if r["status"] not in COUNTED]
    net = sum(r["total"] for r in counted)
    orders = len({(r["channel"], r["order_id"]) for r in counted})
    # Same rounding as JavaScript Math.round for positive numbers (round half up).
    average = (2 * net + orders) // (2 * orders) if orders else 0

    # Channel panel ignores the channel filter, product panel ignores the product filter,
    # daily chart ignores the date filter (they highlight the selection instead).
    by_channel_rows = [r for r in rows if keep(r, f, ("channel",)) and r["status"] in COUNTED]
    channels = {}
    for ch in ALL_CHANNELS:
        lines = [r for r in by_channel_rows if r["channel"] == ch]
        channels[ch] = {"net": sum(r["total"] for r in lines),
                        "orders": len({r["order_id"] for r in lines}),
                        "units": sum(r["qty"] for r in lines)}

    products = {}
    for r in rows:
        if keep(r, f, ("product",)) and r["status"] in COUNTED:
            p = products.setdefault(r["sku"], {"net": 0, "units": 0, "by_channel": {c: 0 for c in ALL_CHANNELS}})
            p["net"] += r["total"]
            p["units"] += r["qty"]
            p["by_channel"][r["channel"]] += r["total"]

    daily = {}
    d, end = date.fromisoformat(first_day), date.fromisoformat(last_day)
    while d <= end:
        daily[d.isoformat()] = {c: 0 for c in ALL_CHANNELS}
        d += timedelta(days=1)
    for r in rows:
        if keep(r, f, ("date",)) and r["status"] in COUNTED:
            daily[r["day"]][r["channel"]] += r["total"]

    return {
        "name": f["name"],
        "filter": {k: f[k] for k in ("from", "to", "channels", "product")},
        "totals": {"net": net, "orders": orders, "units": sum(r["qty"] for r in counted), "average": average,
                   "excluded_value": sum(r["total"] for r in excluded), "excluded_lines": len(excluded)},
        "channels": channels,
        "products": products,
        "daily": daily,
    }


def as_json(path):
    raw, rows = load(path)
    days = sorted(r["day"] for r in rows)
    statuses = {}
    for r in rows:
        s = statuses.setdefault(r["status_raw"], {"lines": 0, "value": 0})
        s["lines"] += 1
        s["value"] += r["total"]
    counted_dups = len(raw) - len(rows)
    return {
        "file": {
            "rows_read": len(raw),
            "duplicates": counted_dups,
            "clean_lines": len(rows),
            "sku_missing": sum(1 for r in rows if r["sku_was_empty"]),
            "sku_recovered": sum(1 for r in rows if r["sku_was_empty"] and r["sku"]),
            "statuses": statuses,
        },
        "scenarios": [scenario(rows, f, days[0], days[-1]) for f in SCENARIOS],
    }


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--json"]
    csv_path = args[0] if args else "data/biota_orders_oct2026.csv"
    if "--json" in sys.argv:
        print(json.dumps(as_json(csv_path), ensure_ascii=False))
    else:
        main(csv_path)
