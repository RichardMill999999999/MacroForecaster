import { BACKEND_URL } from "./config";

const getJson = async (url, options = {}) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url.replace(BACKEND_URL, "")}`);
    return res.json();
};

const readSettled = async (result) => {
    if (result.status !== "fulfilled" || !result.value.ok) return null;
    try {
        return await result.value.json();
    } catch {
        return null;
    }
};

// Categorised Massive universe (cached on the backend)
export const fetchUniverse = (perGroup = 80, refresh = false, signal) =>
    getJson(`${BACKEND_URL}/massive/universe?per_group=${perGroup}${refresh ? "&refresh=1" : ""}`, { signal });

// Any ticker or name on Massive, already classified
export const searchInstruments = (query, signal) =>
    getJson(`${BACKEND_URL}/massive/search?q=${encodeURIComponent(query)}`, { signal });

// One NYT RSS feed through the existing backend route
export const fetchNyt = (feed, signal) => getJson(`${BACKEND_URL}/NYT/rss/${feed}`, { signal });

// Prices, live options, quote-level liquidity, and the benchmark, fetched together.
export const fetchMarketPackage = async (symbol, bench, from, to, signal) => {
    const sym = encodeURIComponent(symbol);
    const b = encodeURIComponent(bench);
    const settled = await Promise.allSettled([
        fetch(`${BACKEND_URL}/getData/${sym}/${from}/${to}`, { signal }),
        fetch(`${BACKEND_URL}/alpaca/options/${sym}?limit=1000`, { signal }),
        fetch(`${BACKEND_URL}/market/overview/${sym}?feed=iex`, { signal }),
        fetch(`${BACKEND_URL}/getData/${b}/${from}/${to}`, { signal }),
    ]);
    const [priceJson, optionsJson, marketContextJson, benchJson] = await Promise.all(settled.map(readSettled));
    return {
        priceJson,
        optionsJson,
        bookJson: marketContextJson?.quote ?? null,
        marketContextJson,
        benchJson,
    };
};

// POST helper for the AI routes. Throws with the backend's message when a call fails.
export const postJson = async (path, body) => {
    const res = await fetch(`${BACKEND_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
};

export const extractPriceArray = (json) => {
    if (!json) return [];
    const candidates = [json?.datos, json?.data, json?.prices, json?.values, json?.results, json?.bars];
    for (const candidate of candidates) {
        if (!Array.isArray(candidate)) continue;
        const prices = candidate
            .map((item) => {
                if (typeof item === "number") return item;
                if (typeof item === "string") return Number(item);
                if (item && typeof item === "object") {
                    return Number(item.close ?? item.c ?? item.price ?? item.value);
                }
                return NaN;
            })
            .filter(Number.isFinite);
        if (prices.length > 0) return prices;
    }
    return [];
};

export const extractOBI = (json) => {
    if (!json) return null;
    if (Number.isFinite(Number(json.obi))) return Number(json.obi);
    if (Number.isFinite(Number(json.OBI))) return Number(json.OBI);

    const bid = Number(
        json.bidVolume ?? json.bid_size ?? json.bidSize ?? json.bestBidSize ?? json.bids?.[0]?.[1] ?? json.bids?.[0]?.size
    );
    const ask = Number(
        json.askVolume ?? json.ask_size ?? json.askSize ?? json.bestAskSize ?? json.asks?.[0]?.[1] ?? json.asks?.[0]?.size
    );
    if (Number.isFinite(bid) && Number.isFinite(ask) && bid + ask > 0) {
        return (bid - ask) / (bid + ask);
    }
    return null;
};

export const findIV = (value, depth = 0) => {
    if (!value || depth > 6) return null;
    if (Array.isArray(value)) {
        for (const item of value) {
            const result = findIV(item, depth + 1);
            if (result !== null) return result;
        }
        return null;
    }
    if (typeof value !== "object") return null;

    const keys = ["impliedVolatility", "implied_volatility", "impliedVol", "implied_vol", "iv"];
    for (const key of keys) {
        const number = Number(value[key]);
        if (Number.isFinite(number) && number > 0) {
            return number > 1 ? number / 100 : number;
        }
    }
    for (const key of Object.keys(value)) {
        const result = findIV(value[key], depth + 1);
        if (result !== null) return result;
    }
    return null;
};
