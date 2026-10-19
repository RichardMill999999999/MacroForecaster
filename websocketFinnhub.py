import json
import logging
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import requests
import websocket

from newsfeeds.core import ttl_cache

log = logging.getLogger(__name__)

RESOURCE_TICKERS = {
    "OANDA:XAU_USD": "Gold",
    "OANDA:XAG_USD": "Silver",
    "OANDA:XPT_USD": "Platinum",
    "OANDA:XPD_USD": "Palladium",
    "OANDA:WTICO_USD": "WTI Oil",
    "OANDA:BCO_USD": "Brent Oil",
    "OANDA:NATGAS_USD": "Natural Gas",
    "OANDA:XCU_USD": "Copper",
    "OANDA:ALUMINUM_USD": "Aluminum",
    "OANDA:WHEAT_USD": "Wheat",
    "OANDA:CORN_USD": "Corn",
    "OANDA:SOYBN_USD": "Soybeans",
    "OANDA:COFFEE_USD": "Coffee",
    "OANDA:COCOA_USD": "Cocoa",
    "OANDA:SUGAR_USD": "Sugar",
    "OANDA:RICE_USD": "Rice",
    "OANDA:OATS_USD": "Oats",
    "OANDA:COTTON_USD": "Cotton",
}
YAHOO_TICKERS = {
    "OANDA:XAU_USD": "GC=F",
    "OANDA:XAG_USD": "SI=F",
    "OANDA:XPT_USD": "PL=F",
    "OANDA:XPD_USD": "PA=F",
    "OANDA:WTICO_USD": "CL=F",
    "OANDA:BCO_USD": "BZ=F",
    "OANDA:NATGAS_USD": "NG=F",
    "OANDA:XCU_USD": "HG=F",
    "OANDA:ALUMINUM_USD": "ALI=F",
    "OANDA:WHEAT_USD": "ZW=F",
    "OANDA:CORN_USD": "ZC=F",
    "OANDA:SOYBN_USD": "ZS=F",
    "OANDA:COFFEE_USD": "KC=F",
    "OANDA:COCOA_USD": "CC=F",
    "OANDA:SUGAR_USD": "SB=F",
    "OANDA:RICE_USD": "ZR=F",
    "OANDA:OATS_USD": "ZO=F",
    "OANDA:COTTON_USD": "CT=F",
}
COMMODITY_SYMBOLS = tuple(RESOURCE_TICKERS)
TICKER_LABELS = {
    **RESOURCE_TICKERS,
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "NVDA": "Nvidia",
    "META": "Meta",
    "KO": "Coca-Cola",
}

_latest_prices = {}
_price_lock = threading.Lock()
_worker_lock = threading.Lock()
_worker_started = False


def _on_message(_ws, message):
    try:
        data = json.loads(message)
    except json.JSONDecodeError:
        log.warning("Ignoring malformed Finnhub price message")
        return
    if data.get("type") != "trade":
        return

    updates = {}
    for trade in data.get("data", []):
        symbol = trade.get("s")
        try:
            price = float(trade["p"])
        except (KeyError, TypeError, ValueError):
            continue
        if symbol in TICKER_LABELS:
            updates[symbol] = round(price, 3)
    if updates:
        with _price_lock:
            _latest_prices.update(updates)


def _run_websocket(api_key):
    while True:
        def on_open(ws):
            for symbol in TICKER_LABELS:
                ws.send(json.dumps({"type": "subscribe", "symbol": symbol}))

        app = websocket.WebSocketApp(
            f"wss://ws.finnhub.io?token={api_key}",
            on_open=on_open,
            on_message=_on_message,
            on_error=lambda _ws, error: log.warning("Finnhub stream error: %s", error),
        )
        app.run_forever()
        time.sleep(5)


def latestPricesFinnhub():
    global _worker_started

    api_key = os.getenv("FINNHUB_API_KEY")
    if not api_key:
        log.warning("Finnhub streaming is unavailable because FINNHUB_API_KEY is not configured")
        return
    with _worker_lock:
        if not _worker_started:
            _worker_started = True
            threading.Thread(target=_run_websocket, args=(api_key,), daemon=True).start()

    with _price_lock:
        live_prices = {
            TICKER_LABELS[symbol]: price
            for symbol, price in _latest_prices.items()
        }
    with ThreadPoolExecutor(max_workers=min(12, len(COMMODITY_SYMBOLS))) as executor:
        market_data = dict(zip(COMMODITY_SYMBOLS, executor.map(_daily_market_data, COMMODITY_SYMBOLS)))
    changes = {}
    for symbol, quote in market_data.items():
        if not quote:
            continue
        label = RESOURCE_TICKERS[symbol]
        live_prices.setdefault(label, quote["price"])
        if quote["changePercent"] is not None:
            changes[label] = quote["changePercent"]
    return {
        "prices": live_prices,
        "changes": changes,
    }


@ttl_cache(60)
def _daily_market_data(symbol):
    try:
        response = requests.get(
            f"https://query1.finance.yahoo.com/v8/finance/chart/{YAHOO_TICKERS[symbol]}",
            params={"range": "5d", "interval": "1d"},
            headers={"User-Agent": "Mozilla/5.0 (compatible; EconDashboard/1.0)"},
            timeout=8,
        )
        response.raise_for_status()
        chart = response.json().get("chart", {})
    except (requests.RequestException, ValueError) as error:
        log.warning("Unable to load daily commodity change for %s: %s", symbol, error)
        return None

    results = chart.get("result") or []
    if chart.get("error") or not results:
        return None
    result = results[0]
    quote_sets = result.get("indicators", {}).get("quote") or []
    closes = quote_sets[0].get("close", []) if quote_sets else []
    valid_closes = [float(value) for value in closes if value is not None]
    meta = result.get("meta", {})
    current_close = meta.get("regularMarketPrice") or (valid_closes[-1] if valid_closes else None)
    previous_close = meta.get("chartPreviousClose") or (valid_closes[-2] if len(valid_closes) > 1 else None)
    if current_close is None:
        return None
    change = (
        (current_close / previous_close - 1) * 100
        if previous_close
        else None
    )
    return {"price": float(current_close), "changePercent": change}


@ttl_cache(900)
def resource_series(symbol):
    symbol = (symbol or "").upper()
    if symbol not in RESOURCE_TICKERS:
        raise ValueError(f"Unsupported commodity symbol '{symbol}'.")
    response = requests.get(
        f"https://query1.finance.yahoo.com/v8/finance/chart/{YAHOO_TICKERS[symbol]}",
        params={"range": "1y", "interval": "1d"},
        headers={"User-Agent": "Mozilla/5.0 (compatible; EconDashboard/1.0)"},
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    chart = payload.get("chart", {})
    results = chart.get("result") or []
    if chart.get("error") or not results:
        raise ValueError(f"No historical price data is available for {RESOURCE_TICKERS[symbol]}.")
    result = results[0]
    timestamps = result.get("timestamp") or []
    quotes = result.get("indicators", {}).get("quote") or []
    closes = quotes[0].get("close", []) if quotes else []
    return [
        {
            "date": datetime.fromtimestamp(timestamp, timezone.utc).strftime("%Y-%m-%d"),
            "value": float(value),
        }
        for timestamp, value in zip(timestamps, closes)
        if value is not None
    ]
