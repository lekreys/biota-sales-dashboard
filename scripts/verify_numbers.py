import csv
import json
import re
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta

CHANNEL_ALIASES = {
    "shopee": "Shopee",
    "tiktokshop": "TikTok Shop",
    "tiktok": "TikTok Shop",
    "tokopedia": "Tokopedia",
    "tokped": "Tokopedia",
}
ALL_CHANNELS = ["Shopee", "TikTok Shop", "Tokopedia"]
COUNTED = {"selesai", "pesanan selesai", "completed", "dikirim", "sedang dikirim", "in transit"}
CANCELLED = {"batal", "dibatalkan", "cancelled"}
RETURNED = {"pengembalian dana", "refunded", "dikomplain - retur"}
DUPLICATE_KEY = (
    "order_id",
    "channel",
    "date_raw",
    "sku",
    "name",
    "qty",
    "unit",
    "total",
    "status",
    "city",
)
DATE_FORMATS = (
    "%Y-%m-%d %H:%M",
    "%Y-%m-%d %H:%M:%S",
    "%d/%m/%Y %H:%M:%S",
    "%d/%m/%Y %H:%M",
    "%b %d, %Y",
    "%Y-%m-%d",
    "%d/%m/%Y",
)


def scenario_filter(name, start="", end="", channels=None, product=None):
    return {"name": name, "from": start, "to": end, "channels": channels or ALL_CHANNELS, "product": product}


SCENARIOS = [
    scenario_filter("semua data"),
    scenario_filter("1-15 Oktober", "2026-10-01", "2026-10-15"),
    scenario_filter("16-31 Oktober", "2026-10-16", "2026-10-31"),
    scenario_filter("satu hari, 5 Oktober", "2026-10-05", "2026-10-05"),
    scenario_filter("Shopee saja", channels=["Shopee"]),
    scenario_filter(
        "TikTok Shop + Tokopedia, 1-15 Oktober", "2026-10-01", "2026-10-15", ["TikTok Shop", "Tokopedia"]
    ),
    scenario_filter("produk BIO-CAM-BF", product="BIO-CAM-BF"),
    scenario_filter(
        "produk BIO-SD-S64 di Tokopedia, 16-31 Oktober",
        "2026-10-16",
        "2026-10-31",
        ["Tokopedia"],
        "BIO-SD-S64",
    ),
]


def parse_money(text):
    digits = re.sub(r"^(rp|idr)", "", text.strip(), flags=re.I).replace(" ", "")
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", digits):
        return int(digits.replace(".", ""))
    if re.fullmatch(r"\d{1,3}(,\d{3})+", digits):
        return int(digits.replace(",", ""))
    if re.fullmatch(r"\d+(\.0+)?", digits):
        return int(float(digits))
    raise ValueError(f"unknown money format: {text!r}")


def parse_day(text):
    for date_format in DATE_FORMATS:
        try:
            return datetime.strptime(text.strip(), date_format).date().isoformat()
        except ValueError:
            continue
    raise ValueError(f"unknown date format: {text!r}")


def read_row(raw):
    return {
        "order_id": raw["order_id"].strip(),
        "day": parse_day(raw["order_date"]),
        "date_raw": raw["order_date"].strip(),
        "channel": CHANNEL_ALIASES[re.sub(r"[^a-z]", "", raw["channel"].lower())],
        "sku": raw["sku"].strip().upper(),
        "name": raw["product_name"].strip(),
        "qty": int(float(raw["qty"])),
        "unit": parse_money(raw["unit_price"]),
        "total": parse_money(raw["total_price"]),
        "status": raw["status"].strip().lower(),
        "status_raw": " ".join(raw["status"].split()),
        "city": raw["buyer_city"].strip(),
    }


def recover_skus(rows):
    known = defaultdict(set)
    for row in rows:
        if row["sku"]:
            known[(row["channel"], row["name"].lower())].add(row["sku"])
    for row in rows:
        row["sku_was_empty"] = not row["sku"]
        options = known[(row["channel"], row["name"].lower())]
        if not row["sku"] and len(options) == 1:
            row["sku"] = next(iter(options))


def remove_duplicates(rows):
    seen, unique = set(), []
    for row in rows:
        key = tuple(row[k] for k in DUPLICATE_KEY)
        if key not in seen:
            seen.add(key)
            unique.append(row)
    return unique


def load(path):
    with open(path, newline="", encoding="utf-8-sig") as file:
        raw = list(csv.DictReader(file))
    rows = [read_row(r) for r in raw]
    recover_skus(rows)
    return raw, remove_duplicates(rows)


def is_counted(row):
    return row["status"] in COUNTED


def keep(row, scenario, ignore=()):
    before_start = scenario["from"] and row["day"] < scenario["from"]
    after_end = scenario["to"] and row["day"] > scenario["to"]
    if "date" not in ignore and (before_start or after_end):
        return False
    if "channel" not in ignore and row["channel"] not in scenario["channels"]:
        return False
    if "product" not in ignore and scenario["product"] and row["sku"] != scenario["product"]:
        return False
    return True


def channel_totals(rows, scenario):
    counted = [r for r in rows if keep(r, scenario, ("channel",)) and is_counted(r)]
    totals = {}
    for channel in ALL_CHANNELS:
        lines = [r for r in counted if r["channel"] == channel]
        totals[channel] = {
            "net": sum(r["total"] for r in lines),
            "orders": len({r["order_id"] for r in lines}),
            "units": sum(r["qty"] for r in lines),
        }
    return totals


def product_totals(rows, scenario):
    products = {}
    for row in rows:
        if keep(row, scenario, ("product",)) and is_counted(row):
            product = products.setdefault(
                row["sku"], {"net": 0, "units": 0, "by_channel": {c: 0 for c in ALL_CHANNELS}}
            )
            product["net"] += row["total"]
            product["units"] += row["qty"]
            product["by_channel"][row["channel"]] += row["total"]
    return products


def daily_totals(rows, scenario, first_day, last_day):
    daily = {}
    day, end = date.fromisoformat(first_day), date.fromisoformat(last_day)
    while day <= end:
        daily[day.isoformat()] = {c: 0 for c in ALL_CHANNELS}
        day += timedelta(days=1)
    for row in rows:
        if keep(row, scenario, ("date",)) and is_counted(row):
            daily[row["day"]][row["channel"]] += row["total"]
    return daily


def scenario_result(rows, scenario, first_day, last_day):
    selected = [r for r in rows if keep(r, scenario)]
    counted = [r for r in selected if is_counted(r)]
    return {
        "name": scenario["name"],
        "filter": {k: scenario[k] for k in ("from", "to", "channels", "product")},
        "totals": {
            "net": sum(r["total"] for r in counted),
            "orders": len({(r["channel"], r["order_id"]) for r in counted}),
            "units": sum(r["qty"] for r in counted),
            "excluded_lines": len(selected) - len(counted),
        },
        "channels": channel_totals(rows, scenario),
        "products": product_totals(rows, scenario),
        "daily": daily_totals(rows, scenario, first_day, last_day),
    }


def as_json(path):
    raw, rows = load(path)
    days = sorted(r["day"] for r in rows)
    statuses = {}
    for row in rows:
        status = statuses.setdefault(row["status_raw"], {"lines": 0, "value": 0})
        status["lines"] += 1
        status["value"] += row["total"]
    return {
        "file": {
            "rows_read": len(raw),
            "duplicates": len(raw) - len(rows),
            "clean_lines": len(rows),
            "sku_missing": sum(1 for r in rows if r["sku_was_empty"]),
            "sku_recovered": sum(1 for r in rows if r["sku_was_empty"] and r["sku"]),
            "statuses": statuses,
        },
        "scenarios": [scenario_result(rows, s, days[0], days[-1]) for s in SCENARIOS],
    }


def print_period(rows, label):
    counted = [r for r in rows if is_counted(r)]
    print(f"\n== {label} ==")
    print(f"Net revenue      : Rp {sum(r['total'] for r in counted):>13,}")
    for channel in ALL_CHANNELS:
        print(f"  {channel:<15}: Rp {sum(r['total'] for r in counted if r['channel'] == channel):>13,}")
    orders = len({(r["channel"], r["order_id"]) for r in counted})
    print(f"Orders / units   : {orders} / {sum(r['qty'] for r in counted)}")


def print_report(path):
    raw, rows = load(path)
    unknown = {r["status"] for r in rows} - COUNTED - CANCELLED - RETURNED
    if unknown:
        raise ValueError(f"unknown statuses: {unknown}")

    empty_sku = [r for r in rows if r["sku_was_empty"]]
    print(f"Rows read {len(raw)}, duplicates removed {len(raw) - len(rows)}, lines kept {len(rows)}")
    print(f"Kept lines with empty SKU {len(empty_sku)}, recovered {sum(1 for r in empty_sku if r['sku'])}")
    print_period(rows, "Semua data")
    print_period([r for r in rows if "2026-10-01" <= r["day"] <= "2026-10-15"], "1-15 Oktober 2026")
    print_period([r for r in rows if "2026-10-16" <= r["day"] <= "2026-10-31"], "16-31 Oktober 2026")

    print("\n== Top 10 produk (semua data) ==")
    products = product_totals(rows, SCENARIOS[0])
    ranked = sorted(products.items(), key=lambda item: -item[1]["net"])
    for rank, (sku, product) in enumerate(ranked[:10], 1):
        print(f"{rank:>2}. {sku:<12} Rp {product['net']:>12,}  {product['units']:>3} unit")


if __name__ == "__main__":
    paths = [arg for arg in sys.argv[1:] if arg != "--json"]
    csv_path = paths[0] if paths else "data/biota_orders_oct2026.csv"
    if "--json" in sys.argv:
        print(json.dumps(as_json(csv_path), ensure_ascii=False))
    else:
        print_report(csv_path)
