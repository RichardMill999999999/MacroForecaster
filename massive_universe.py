"""
Massive (formerly Polygon) reference data: ticker types, a categorised universe and search.

Register it in the Flask app that serves localhost:5000:

    from massive_universe import massive_bp
    app.register_blueprint(massive_bp)

Environment variables:
    MASSIVE_API_KEY        required
    MASSIVE_MIN_INTERVAL   seconds between calls. 0.25 on paid plans, 13 on the free 5 requests/minute plan
    MASSIVE_CACHE_SECONDS  how long a full sweep stays cached (default 6 hours)
    MASSIVE_MAX_PAGES      pages of 1000 tickers per type during a sweep (default 6)
"""

import os
import re
import threading
import time
from datetime import datetime, timezone

import requests
from flask import Blueprint, jsonify, request

massive_bp = Blueprint("massive", __name__)

BASE = "https://api.massive.com"
API_KEY = os.getenv("MASSIVE_API_KEY", "")
MIN_INTERVAL = float(os.getenv("MASSIVE_MIN_INTERVAL", "13"))
CACHE_SECONDS = int(os.getenv("MASSIVE_CACHE_SECONDS", str(6 * 3600)))
MAX_PAGES = int(os.getenv("MASSIVE_MAX_PAGES", "6"))
PAGE_SIZE = 1000

CATEGORY_LABELS = {
    "stocks": "Stocks",
    "etfs": "ETFs",
    "bonds": "Bonds",
    "indexes": "Indexes",
    "commodities": "Commodities",
    "forex": "Forex",
    "crypto": "Crypto",
}

# Shown first inside each group so familiar names stay on top
FEATURED = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA", "AVGO", "AMD", "INTC", "TSM", "ASML",
    "ORCL", "NFLX", "JPM", "BAC", "GS", "MS", "V", "MA", "BLK", "XOM", "CVX", "COP", "OXY", "NEM",
    "FCX", "RIO", "BHP", "VALE", "WMT", "COST", "KO", "PEP", "PG", "MCD", "JNJ", "MRK", "BRK.B",
    "SPY", "QQQ", "DIA", "IWM", "VTI", "EFA", "EEM", "GLD", "SLV", "USO", "UNG", "DBA", "DBB",
]
FEATURED_RANK = {symbol: i for i, symbol in enumerate(FEATURED)}

ETF_TYPES = {"ETF", "ETN", "ETV", "ETS", "FUND"}
BOND_TYPES = {"BOND", "AGEN", "EQLK"}

COMMODITY_FAMILIES = [
    ("Precious metals", r"\b(gold|silver|platinum|palladium|precious)\b"),
    ("Energy", r"\b(crude|oil|natural gas|brent|wti|gasoline|heating oil)\b"),
    ("Agriculture", r"\b(agricultur\w*|wheat|corn|soybean\w*|sugar|coffee|livestock|grains?)\b"),
    ("Industrial metals", r"\b(copper|aluminum|aluminium|base metals?|industrial metals?|uranium|lithium|nickel|zinc)\b"),
    ("Broad commodities", r"\bcommodit\w*\b"),
]
# Miners, producers and equity funds that mention a commodity are stocks, not commodity exposure
COMMODITY_EXCLUDE = re.compile(
    r"\b(miners?|mining|producers?|exploration|equit(y|ies)|stocks?|sector|royalty|royalties|services)\b"
)
ETF_FAMILIES = [
    ("Bonds", r"\b(treasur\w*|bonds?|aggregate|fixed income|municipal|muni|credit)\b"),
    ("International", r"\b(msci|ftse|international|emerging|europe\w*|japan|china|india|global|eafe|asia|latin)\b"),
    ("Sectors", r"\b(sector|technology|financial\w*|energy|health\w*|industrial\w*|utilities|real estate|semiconductor\w*|consumer|materials|oil & gas)\b"),
    ("Broad US", r"\b(s&p|nasdaq|russell|dow|total market|total stock|small cap\w*|large cap\w*|mid cap\w*)\b"),
]

MAJOR_CCY = {"EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"}
EM_CCY = {"MXN", "TRY", "ZAR", "BRL", "CNH", "CNY", "INR", "KRW", "SGD", "HKD", "PLN", "HUF", "CZK", "THB", "IDR"}
CRYPTO_MAJORS = {"BTC", "ETH", "SOL", "XRP", "LTC", "BCH", "ADA", "DOGE", "AVAX", "LINK", "DOT"}
GOLD_LINKED = {"PAXG", "XAUT"}

_lock = threading.Lock()         # guards the request throttle clock
_sweep_lock = threading.Lock()   # only one sweep runs at a time
_last_call = [0.0]
_types_cache = {}
_universe_cache = {"at": 0.0, "data": None}


# ---------------------------------------------------------------- HTTP

def _get(url, params=None, retries=3):
    """GET with the API key, a request throttle and a retry on HTTP 429."""
    if not API_KEY:
        raise RuntimeError("MASSIVE_API_KEY is not set on the server.")
    for attempt in range(retries + 1):
        with _lock:
            wait = MIN_INTERVAL - (time.time() - _last_call[0])
            if wait > 0:
                time.sleep(wait)
            _last_call[0] = time.time()
        response = requests.get(url, params={**(params or {}), "apiKey": API_KEY}, timeout=20)
        if response.status_code == 429 and attempt < retries:
            time.sleep(15 * (attempt + 1))
            continue
        response.raise_for_status()
        return response.json()


def fetch_types(asset_class="stocks", locale="us"):
    """Ticker type codes and descriptions, e.g. {"CS": "Common Stock", "ETF": "Exchange Traded Fund"}."""
    key = (asset_class, locale)
    if key not in _types_cache:
        data = _get(f"{BASE}/v3/reference/tickers/types", {"asset_class": asset_class, "locale": locale})
        _types_cache[key] = {t["code"]: t.get("description", t["code"]) for t in data.get("results", [])}
    return _types_cache[key]


def fetch_tickers(market, ticker_type=None, locale=None, max_pages=MAX_PAGES):
    """Active tickers for a market (and optional type), following next_url pages."""
    params = {"market": market, "active": "true", "limit": PAGE_SIZE, "sort": "ticker", "order": "asc"}
    if ticker_type:
        params["type"] = ticker_type
    if locale:
        params["locale"] = locale
    url, rows = f"{BASE}/v3/reference/tickers", []
    for _ in range(max_pages):
        data = _get(url, params)
        rows.extend(data.get("results", []))
        next_url = data.get("next_url")
        if not next_url:
            break
        url, params = next_url, {}  # next_url already carries the cursor; _get adds the key
    return rows


# ---------------------------------------------------------------- CLASSIFICATION

def _slim(item):
    return {
        "symbol": item.get("ticker"),
        "name": item.get("name", ""),
        "market": item.get("market"),
        "type": item.get("type"),
        "exchange": item.get("primary_exchange"),
    }


def _first_match(families, text):
    for label, pattern in families:
        if re.search(pattern, text):
            return label
    return None


def classify_stock_like(item, type_names):
    """Stocks, ETFs, bonds and commodity ETFs. Returns (category key, subcategory label)."""
    ticker_type = item.get("type") or ""
    name = (item.get("name") or "").lower()
    if ticker_type in BOND_TYPES:
        return "bonds", type_names.get(ticker_type, ticker_type)
    if ticker_type in ETF_TYPES:
        family = _first_match(COMMODITY_FAMILIES, name)
        if family and not COMMODITY_EXCLUDE.search(name):
            return "commodities", family
        return "etfs", _first_match(ETF_FAMILIES, name) or "Other funds"
    return "stocks", type_names.get(ticker_type, ticker_type or "Other")


def classify_index(item):
    text = f"{item.get('name', '')} {item.get('ticker', '')}".lower()
    if re.search(r"vix|volatility", text):
        return "indexes", "Volatility"
    return "indexes", "Equity & broad"


def classify_fx(item):
    pair = item.get("ticker", "").split(":")[-1]
    base, quote = pair[:3], pair[3:6]
    if "USD" in (base, quote):
        other = quote if base == "USD" else base
        if other in MAJOR_CCY:
            return "forex", "Majors vs USD"
        if other in EM_CCY:
            return "forex", "Emerging vs USD"
        return "forex", "Other vs USD"
    if base in EM_CCY or quote in EM_CCY:
        return "forex", "Emerging crosses"
    return "forex", "Crosses"


def classify_crypto(item):
    base = re.sub(r"(USDT?|USDC)$", "", item.get("ticker", "").split(":")[-1])
    if base in GOLD_LINKED:
        return "crypto", "Gold-linked"
    if base in CRYPTO_MAJORS:
        return "crypto", "Majors"
    return "crypto", "Other tokens"


def _classify_any(item, type_names):
    market = item.get("market")
    if market == "indices":
        return classify_index(item)
    if market == "fx":
        return classify_fx(item)
    if market == "crypto":
        return classify_crypto(item)
    return classify_stock_like(item, type_names)


# ---------------------------------------------------------------- SWEEP AND CACHE

def build_universe():
    """Sweep every ticker type plus the index, FX and crypto markets. Returns grouped instruments."""
    errors, buckets = [], {}

    def add(category, group, item):
        buckets.setdefault((category, group), {})[item.get("ticker")] = _slim(item)

    try:
        type_names = fetch_types()
    except Exception as exc:
        type_names = {}
        errors.append({"scope": "types", "error": str(exc)})

    for code in list(type_names) or ["CS", "ETF", "ADRC", "PFD"]:
        try:
            for item in fetch_tickers("stocks", code, locale="us"):
                add(*classify_stock_like(item, type_names), item)
        except Exception as exc:
            errors.append({"scope": f"stocks/{code}", "error": str(exc)})

    for market, classifier in (("indices", classify_index), ("fx", classify_fx), ("crypto", classify_crypto)):
        try:
            for item in fetch_tickers(market):
                add(*classifier(item), item)
        except Exception as exc:
            errors.append({"scope": market, "error": str(exc)})

    grouped = {}
    for (category, group), items in buckets.items():
        ordered = sorted(items.values(), key=lambda it: (FEATURED_RANK.get(it["symbol"], 10**6), it["symbol"] or ""))
        grouped.setdefault(category, []).append({"label": group, "count": len(ordered), "items": ordered})

    categories = []
    for key, label in CATEGORY_LABELS.items():
        if key in grouped:
            groups = sorted(grouped[key], key=lambda g: (-g["count"], g["label"]))
            categories.append({"key": key, "label": label, "groups": groups})

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "categories": categories,
        "errors": errors,
    }


def _fresh():
    return _universe_cache["data"] is not None and time.time() - _universe_cache["at"] < CACHE_SECONDS


def get_universe(refresh=False):
    if not refresh and _fresh():
        return _universe_cache["data"]
    with _sweep_lock:
        if not refresh and _fresh():  # another request finished the sweep while this one waited
            return _universe_cache["data"]
        data = build_universe()
        _universe_cache.update(at=time.time(), data=data)
        return data


def _trimmed(data, per_group):
    return {
        "generatedAt": data["generatedAt"],
        "errors": data["errors"],
        "categories": [
            {
                "key": c["key"],
                "label": c["label"],
                "count": sum(g["count"] for g in c["groups"]),
                "groups": [
                    {"label": g["label"], "count": g["count"], "items": g["items"][:per_group]}
                    for g in c["groups"]
                ],
            }
            for c in data["categories"]
        ],
    }


# ---------------------------------------------------------------- ROUTES

@massive_bp.get("/massive/types")
def ticker_types():
    try:
        names = fetch_types(request.args.get("asset_class", "stocks"), request.args.get("locale", "us"))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502
    return jsonify([{"code": code, "description": text} for code, text in names.items()])


@massive_bp.get("/massive/universe")
def universe_route():
    per_group = max(1, min(request.args.get("per_group", 80, type=int), 1000))
    try:
        data = get_universe(refresh=request.args.get("refresh") == "1")
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502
    return jsonify(_trimmed(data, per_group))


@massive_bp.get("/massive/search")
def search_route():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])
    params = {
        "search": query,
        "active": "true",
        "sort": "ticker",
        "order": "asc",
        "limit": max(1, min(request.args.get("limit", 20, type=int), 50)),
    }
    if request.args.get("market"):
        params["market"] = request.args["market"]
    try:
        rows = _get(f"{BASE}/v3/reference/tickers", params).get("results", [])
    except Exception as exc:
        return jsonify({"error": str(exc)}), 502
    try:
        type_names = fetch_types()
    except Exception:
        type_names = {}
    out = []
    for item in rows:
        category, group = _classify_any(item, type_names)
        out.append({**_slim(item), "category": category, "group": group})
    return jsonify(out)
