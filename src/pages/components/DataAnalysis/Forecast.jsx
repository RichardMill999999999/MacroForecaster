import { BACKEND_URL } from "../../../apiUrl.js";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AIChatPanel from "../AIChatPanel";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    ComposedChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    Legend,
} from "recharts";

/* ================================================================== */
/* CONFIG                                                              */
/* ================================================================== */

const BENCHMARK = "SPY";
const TRADING_DAYS = 252;
const MAX_HORIZON = 360;
const MC_PATHS = 2000;
const FORECAST_DAYS = 30;
const TARGET_MULTIPLIER = 1.05;
const BAND_LEVELS = [50, 67, 80, 90, 95];
const zForLevel = (p) => ({ 50: 0.6745, 67: 0.974, 80: 1.2816, 90: 1.6449, 95: 1.96 })[p] ?? 0.974;
const HORIZONS = [1, 5, 10, 20, 30, 60, 90, 120, 180, 252, 360];
const WINDOW_OPTIONS = [30, 90, 180, 360, 730];

// const TICKERS = [
//     { symbol: "AAPL", name: "Apple" },
//     { symbol: "MSFT", name: "Microsoft" },
//     { symbol: "NVDA", name: "NVIDIA" },
//     { symbol: "AMZN", name: "Amazon" },
//         { symbol: "SMCI", name: "Super Micro Computer" },

//     { symbol: "GOOGL", name: "Alphabet" },
//     { symbol: "META", name: "Meta" },
//     { symbol: "TSLA", name: "Tesla" },
//     { symbol: "AVGO", name: "Broadcom" },
//     { symbol: "JPM", name: "JPMorgan" },
//     { symbol: "V", name: "Visa" },
//     { symbol: "MA", name: "Mastercard" },
//     { symbol: "WMT", name: "Walmart" },
//     { symbol: "COST", name: "Costco" },
//     { symbol: "KO", name: "Coca-Cola" },
//     { symbol: "PEP", name: "PepsiCo" },
//     { symbol: "XOM", name: "Exxon Mobil" },
//     { symbol: "CVX", name: "Chevron" },
//     { symbol: "GLD", name: "Gold ETF" },
//     { symbol: "SLV", name: "Silver ETF" },
//     { symbol: "USO", name: "Oil ETF" },
//     { symbol: "SPY", name: "S&P 500 ETF" },
//     { symbol: "QQQ", name: "Nasdaq 100 ETF" },
//     { symbol: "IWM", name: "Russell 2000 ETF" },
// ];
/* ================================================================== */
/* MARKET UNIVERSE                                                     */
/* Categories hold the instruments. Groups set the dropdown sections.  */
/* Aliases are extra words the news search looks for.                  */
/* ================================================================== */

const MARKET_CATEGORIES = {
    stocks: {
        label: "Stocks",
        items: [
            { symbol: "AAPL", name: "Apple", group: "Technology", aliases: ["Apple", "iPhone"] },
            { symbol: "MSFT", name: "Microsoft", group: "Technology", aliases: ["Microsoft"] },
            { symbol: "NVDA", name: "NVIDIA", group: "Technology", aliases: ["Nvidia"] },
            { symbol: "GOOGL", name: "Alphabet", group: "Technology", aliases: ["Google", "Alphabet"] },
            { symbol: "GOOG", name: "Alphabet Class C", group: "Technology", aliases: ["Google", "Alphabet"] },
            { symbol: "META", name: "Meta", group: "Technology", aliases: ["Facebook", "Instagram"] },
            { symbol: "AMZN", name: "Amazon", group: "Technology", aliases: ["Amazon", "AWS"] },
            { symbol: "TSLA", name: "Tesla", group: "Technology", aliases: ["Tesla"] },
            { symbol: "AVGO", name: "Broadcom", group: "Technology", aliases: ["Broadcom"] },
            { symbol: "AMD", name: "Advanced Micro Devices", group: "Technology" },
            { symbol: "INTC", name: "Intel", group: "Technology" },
            { symbol: "TSM", name: "Taiwan Semiconductor", group: "Technology", aliases: ["TSMC"] },
            { symbol: "ASML", name: "ASML Holding", group: "Technology", aliases: ["ASML"] },
            { symbol: "ORCL", name: "Oracle", group: "Technology" },
            { symbol: "NFLX", name: "Netflix", group: "Technology" },
            { symbol: "IBM", name: "IBM", group: "Technology" },
            { symbol: "CSCO", name: "Cisco Systems", group: "Technology" },
            { symbol: "QCOM", name: "Qualcomm", group: "Technology" },
            { symbol: "AMAT", name: "Applied Materials", group: "Technology" },
            { symbol: "MU", name: "Micron Technology", group: "Technology" },
            { symbol: "CRM", name: "Salesforce", group: "Technology" },
            { symbol: "ADBE", name: "Adobe", group: "Technology" },
            { symbol: "NOW", name: "ServiceNow", group: "Technology" },
            { symbol: "UBER", name: "Uber Technologies", group: "Technology" },
            { symbol: "SHOP", name: "Shopify", group: "Technology" },
            { symbol: "PLTR", name: "Palantir Technologies", group: "Technology" },
            { symbol: "SMCI", name: "Super Micro Computer", group: "Technology" },

            { symbol: "JPM", name: "JPMorgan", group: "Financials", aliases: ["JPMorgan", "Chase"] },
            { symbol: "BAC", name: "Bank of America", group: "Financials" },
            { symbol: "GS", name: "Goldman Sachs", group: "Financials" },
            { symbol: "MS", name: "Morgan Stanley", group: "Financials" },
            { symbol: "V", name: "Visa", group: "Financials" },
            { symbol: "MA", name: "Mastercard", group: "Financials" },
            { symbol: "BLK", name: "BlackRock", group: "Financials" },
            { symbol: "C", name: "Citigroup", group: "Financials" },
            { symbol: "WFC", name: "Wells Fargo", group: "Financials" },

            { symbol: "XOM", name: "Exxon Mobil", group: "Energy", aliases: ["Exxon"] },
            { symbol: "CVX", name: "Chevron", group: "Energy", aliases: ["Chevron"] },
            { symbol: "COP", name: "ConocoPhillips", group: "Energy" },
            { symbol: "OXY", name: "Occidental Petroleum", group: "Energy" },
            { symbol: "SLB", name: "SLB", group: "Energy" },
            { symbol: "EOG", name: "EOG Resources", group: "Energy" },

            { symbol: "NEM", name: "Newmont", group: "Materials & mining" },
            { symbol: "FCX", name: "Freeport-McMoRan", group: "Materials & mining" },
            { symbol: "RIO", name: "Rio Tinto", group: "Materials & mining" },
            { symbol: "BHP", name: "BHP Group", group: "Materials & mining" },
            { symbol: "VALE", name: "Vale", group: "Materials & mining" },
            { symbol: "AA", name: "Alcoa", group: "Materials & mining" },
            { symbol: "SCCO", name: "Southern Copper", group: "Materials & mining" },

            { symbol: "WMT", name: "Walmart", group: "Consumer & health" },
            { symbol: "COST", name: "Costco", group: "Consumer & health" },
            { symbol: "KO", name: "Coca-Cola", group: "Consumer & health" },
            { symbol: "PEP", name: "PepsiCo", group: "Consumer & health" },
            { symbol: "PG", name: "Procter & Gamble", group: "Consumer & health" },
            { symbol: "MCD", name: "McDonald's", group: "Consumer & health" },
            { symbol: "JNJ", name: "Johnson & Johnson", group: "Consumer & health" },
            { symbol: "MRK", name: "Merck", group: "Consumer & health" },
            { symbol: "HD", name: "Home Depot", group: "Consumer & health" },
            { symbol: "LOW", name: "Lowe's", group: "Consumer & health" },
            { symbol: "NKE", name: "Nike", group: "Consumer & health" },
            { symbol: "DIS", name: "Walt Disney", group: "Consumer & health" },
            { symbol: "SBUX", name: "Starbucks", group: "Consumer & health" },
            { symbol: "TGT", name: "Target", group: "Consumer & health" },
            { symbol: "PFE", name: "Pfizer", group: "Consumer & health" },
            { symbol: "ABBV", name: "AbbVie", group: "Consumer & health" },
            { symbol: "UNH", name: "UnitedHealth Group", group: "Consumer & health" },
            { symbol: "LLY", name: "Eli Lilly", group: "Consumer & health" },
            { symbol: "AMGN", name: "Amgen", group: "Consumer & health" },
            { symbol: "ABT", name: "Abbott Laboratories", group: "Consumer & health" },
            { symbol: "TMO", name: "Thermo Fisher Scientific", group: "Consumer & health" },
            { symbol: "CAT", name: "Caterpillar", group: "Industrials" },
            { symbol: "GE", name: "GE Aerospace", group: "Industrials" },
            { symbol: "HON", name: "Honeywell", group: "Industrials" },
            { symbol: "BA", name: "Boeing", group: "Industrials" },
            { symbol: "UPS", name: "United Parcel Service", group: "Industrials" },
        ],
    },

    indexes: {
        label: "Indexes & ETFs",
        items: [
            { symbol: "SPY", name: "S&P 500 ETF", group: "US market", aliases: ["S&P 500", "stock market"] },
            { symbol: "QQQ", name: "Nasdaq-100 ETF", group: "US market", aliases: ["Nasdaq"] },
            { symbol: "DIA", name: "Dow Jones ETF", group: "US market", aliases: ["Dow Jones", "Dow"] },
            { symbol: "IWM", name: "Russell 2000 ETF", group: "US market", aliases: ["small caps"] },
            { symbol: "VTI", name: "Total US Market ETF", group: "US market" },
            { symbol: "VOO", name: "Vanguard S&P 500 ETF", group: "US market" },
            { symbol: "IVV", name: "iShares Core S&P 500 ETF", group: "US market" },
            { symbol: "SCHD", name: "Schwab US Dividend Equity ETF", group: "US market" },
            { symbol: "ACWI", name: "MSCI All Country World ETF", group: "International" },
            { symbol: "EFA", name: "MSCI EAFE ETF", group: "International" },
            { symbol: "EEM", name: "MSCI Emerging Markets ETF", group: "International", aliases: ["emerging markets"] },
            { symbol: "VWO", name: "Vanguard Emerging Markets ETF", group: "International" },
            { symbol: "VGK", name: "Vanguard FTSE Europe ETF", group: "International" },
            { symbol: "EWU", name: "United Kingdom market ETF", group: "Country markets" },
            { symbol: "EWG", name: "Germany market ETF", group: "Country markets" },
            { symbol: "FXI", name: "China large-cap ETF", group: "Country markets" },
            { symbol: "EWJ", name: "Japan market ETF", group: "Country markets" },
            { symbol: "EWZ", name: "Brazil market ETF", group: "Country markets" },
            { symbol: "INDA", name: "India market ETF", group: "Country markets" },
            { symbol: "EWC", name: "Canada market ETF", group: "Country markets" },
            { symbol: "EWA", name: "Australia market ETF", group: "Country markets" },
            { symbol: "EWW", name: "Mexico market ETF", group: "Country markets" },
            { symbol: "EWQ", name: "France market ETF", group: "Country markets" },
            { symbol: "EWI", name: "Italy market ETF", group: "Country markets" },
            { symbol: "EWP", name: "Spain market ETF", group: "Country markets" },
            { symbol: "EWL", name: "Switzerland market ETF", group: "Country markets" },
            { symbol: "EWH", name: "Hong Kong market ETF", group: "Country markets" },
            { symbol: "EWY", name: "South Korea market ETF", group: "Country markets" },
            { symbol: "EWT", name: "Taiwan market ETF", group: "Country markets" },
            { symbol: "VIXY", name: "VIX short-term futures ETF", group: "Volatility" },
            { symbol: "UVXY", name: "Ultra VIX Short-Term Futures ETF", group: "Volatility" },
            { symbol: "SVXY", name: "Short VIX Short-Term Futures ETF", group: "Volatility" },
            { symbol: "XLF", name: "Financial Select Sector SPDR", group: "Sector ETFs" },
            { symbol: "XLK", name: "Technology Select Sector SPDR", group: "Sector ETFs" },
            { symbol: "XLE", name: "Energy Select Sector SPDR", group: "Sector ETFs" },
            { symbol: "XLV", name: "Health Care Select Sector SPDR", group: "Sector ETFs" },
            { symbol: "XLI", name: "Industrial Select Sector SPDR", group: "Sector ETFs" },
        ],
    },

    commodities: {
        label: "Commodities",
        items: [
            { symbol: "GLD", name: "Gold ETF proxy", group: "Precious metals", aliases: ["gold prices"] },
            { symbol: "SLV", name: "Silver ETF proxy", group: "Precious metals", aliases: ["silver prices"] },
            { symbol: "PPLT", name: "Platinum ETF proxy", group: "Precious metals", aliases: ["platinum"] },
            { symbol: "PALL", name: "Palladium ETF proxy", group: "Precious metals", aliases: ["palladium"] },
            { symbol: "CPER", name: "Copper ETF proxy", group: "Industrial metals", aliases: ["copper"] },
            { symbol: "DBB", name: "Base metals ETF proxy", group: "Industrial metals", aliases: ["aluminum", "nickel"] },
            { symbol: "USO", name: "WTI crude oil ETF proxy", group: "Energy", aliases: ["crude oil", "oil prices", "OPEC"] },
            { symbol: "BNO", name: "Brent crude oil ETF proxy", group: "Energy", aliases: ["Brent crude"] },
            { symbol: "UNG", name: "Natural gas ETF proxy", group: "Energy", aliases: ["natural gas"] },
            { symbol: "WEAT", name: "Wheat ETF proxy", group: "Grains", aliases: ["wheat"] },
            { symbol: "CORN", name: "Corn ETF proxy", group: "Grains", aliases: ["corn", "maize"] },
            { symbol: "SOYB", name: "Soybean ETF proxy", group: "Grains", aliases: ["soybeans"] },
            { symbol: "JO", name: "Coffee ETF proxy", group: "Soft commodities", aliases: ["coffee"] },
            { symbol: "NIB", name: "Cocoa ETF proxy", group: "Soft commodities", aliases: ["cocoa"] },
            { symbol: "CANE", name: "Sugar ETF proxy", group: "Soft commodities", aliases: ["sugar"] },
            { symbol: "BAL", name: "Cotton ETN proxy", group: "Soft commodities", aliases: ["cotton"] },
            { symbol: "DBA", name: "Broad agriculture ETF proxy", group: "Agriculture", aliases: ["rice", "oats", "agriculture"] },
            { symbol: "COW", name: "Livestock ETF proxy", group: "Agriculture", aliases: ["cattle", "livestock"] },
            { symbol: "PDBC", name: "Diversified commodity ETF", group: "Broad commodities", aliases: ["commodity index"] },
            { symbol: "GSG", name: "Broad commodity ETF", group: "Broad commodities" },
            { symbol: "JJC", name: "Copper ETN proxy", group: "Industrial metals" },
            { symbol: "PICK", name: "Global metals and mining ETF", group: "Industrial metals" },
            { symbol: "COPX", name: "Copper miners ETF", group: "Industrial metals" },
            { symbol: "MOO", name: "Agribusiness ETF", group: "Agriculture" },
        ],
    },

    futures: {
        label: "Futures exposure (ETF proxies)",
        items: [
            { symbol: "USO", name: "WTI crude oil ETF proxy", group: "Energy futures" },
            { symbol: "BNO", name: "Brent crude oil ETF proxy", group: "Energy futures" },
            { symbol: "UNG", name: "Natural gas ETF proxy", group: "Energy futures" },
            { symbol: "GLD", name: "Gold ETF proxy", group: "Metals futures" },
            { symbol: "SLV", name: "Silver ETF proxy", group: "Metals futures" },
            { symbol: "CPER", name: "Copper ETF proxy", group: "Metals futures" },
            { symbol: "DBB", name: "Base metals ETF proxy", group: "Metals futures" },
            { symbol: "WEAT", name: "Wheat ETF proxy", group: "Grain futures" },
            { symbol: "CORN", name: "Corn ETF proxy", group: "Grain futures" },
            { symbol: "SOYB", name: "Soybean ETF proxy", group: "Grain futures" },
            { symbol: "JO", name: "Coffee ETF proxy", group: "Soft commodity futures" },
            { symbol: "NIB", name: "Cocoa ETF proxy", group: "Soft commodity futures" },
            { symbol: "CANE", name: "Sugar ETF proxy", group: "Soft commodity futures" },
            { symbol: "BAL", name: "Cotton ETN proxy", group: "Soft commodity futures" },
            { symbol: "DBA", name: "Agriculture ETF proxy", group: "Agriculture futures" },
        ],
    },

    bonds: {
        label: "Bonds & rates",
        items: [
            { symbol: "TLT", name: "20+ Year Treasury Bond ETF", group: "Treasuries" },
            { symbol: "IEF", name: "7-10 Year Treasury Bond ETF", group: "Treasuries" },
            { symbol: "SHY", name: "1-3 Year Treasury Bond ETF", group: "Treasuries" },
            { symbol: "BIL", name: "1-3 Month Treasury Bill ETF", group: "Treasuries" },
            { symbol: "TIP", name: "TIPS Bond ETF", group: "Inflation protected" },
            { symbol: "AGG", name: "US Aggregate Bond ETF", group: "Investment grade" },
            { symbol: "BND", name: "Total Bond Market ETF", group: "Investment grade" },
            { symbol: "LQD", name: "Investment Grade Corporate Bond ETF", group: "Corporate bonds" },
            { symbol: "HYG", name: "High Yield Corporate Bond ETF", group: "Corporate bonds" },
            { symbol: "EMB", name: "Emerging Markets Bond ETF", group: "International bonds" },
        ],
    },

    forex: {
        label: "Forex",
        items: [
            { symbol: "C:EURUSD", display: "EUR/USD", name: "Euro / US Dollar", group: "Majors", aliases: ["euro", "ECB", "eurozone"] },
            { symbol: "C:GBPUSD", display: "GBP/USD", name: "British Pound / US Dollar", group: "Majors", aliases: ["sterling", "Bank of England"] },
            { symbol: "C:USDJPY", display: "USD/JPY", name: "US Dollar / Japanese Yen", group: "Majors", aliases: ["yen", "Bank of Japan"] },
            { symbol: "C:USDCHF", display: "USD/CHF", name: "US Dollar / Swiss Franc", group: "Majors", aliases: ["Swiss franc", "SNB"] },
            { symbol: "C:AUDUSD", display: "AUD/USD", name: "Australian Dollar / US Dollar", group: "Commodity & emerging", aliases: ["Australian dollar", "RBA"] },
            { symbol: "C:USDCAD", display: "USD/CAD", name: "US Dollar / Canadian Dollar", group: "Commodity & emerging", aliases: ["loonie", "Bank of Canada"] },
            { symbol: "C:USDMXN", display: "USD/MXN", name: "US Dollar / Mexican Peso", group: "Commodity & emerging", aliases: ["peso", "Banxico"] },
        ],
    },
};

// Flat list used for lookups (company name, category of the current ticker)
const TICKERS = Object.entries(MARKET_CATEGORIES).flatMap(([key, cat]) =>
    cat.items.map((item) => ({ ...item, category: key }))
);

// News search terms per symbol, taken from each instrument's aliases
const NEWS_ALIASES = Object.fromEntries(
    TICKERS.filter((t) => t.aliases?.length).map((t) => [t.symbol, t.aliases])
);

// Groups one category's instruments by section, keeping the listed order
const groupedFor = (categoryKey) => {
    const cat = MARKET_CATEGORIES[categoryKey];
    const groups = {};
    cat.items.forEach((item) => {
        const g = item.group ?? cat.label;
        if (!groups[g]) groups[g] = [];
        groups[g].push(item);
    });
    return Object.entries(groups);
};
/* ================================================================== */
/* DESIGN TOKENS                                                       */
/* ================================================================== */

const INK = "#16181d";
const MUTED = "#6b6f76";
const FAINT = "#a3a7ae";
const LINE = "#ebe9e4";
const PAPER = "#f5f4f0";
const ACCENT = "#2b5bd7";
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
const SANS = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
const SHADOW = "0 1px 2px rgba(16,24,40,0.04), 0 14px 36px -22px rgba(16,24,40,0.22)";

const TONE = { bull: "#2f7d5b", bear: "#b4493f", warn: "#b7791f", neutral: "#6b6f76" };
const TONE_WORD = { bull: "Bullish", bear: "Bearish", warn: "To watch", neutral: "Neutral" };

const GLOBAL_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600&display=swap");
#root { max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important; }
body { display: block !important; place-items: unset !important; margin: 0; background: ${PAPER}; }
.forecast-overview-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr); gap: 14px; margin-bottom: 20px; }
.forecast-next-grid { display: grid; grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.5fr); gap: 18px; align-items: center; margin-bottom: 18px; }
.forecast-indicator-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
@media (max-width: 850px) {
    .forecast-overview-grid, .forecast-next-grid, .forecast-indicator-pair { grid-template-columns: minmax(0, 1fr); }
}
`;

const cardBase = {
    background: "#ffffff",
    border: `1px solid ${LINE}`,
    borderRadius: 18,
    padding: 24,
    marginBottom: 20,
    boxShadow: SHADOW,
    minWidth: 0,
    overflow: "hidden",
    boxSizing: "border-box",
    textAlign: "left",
};

const panelStyle = {
    background: "#ffffff",
    border: `1px solid ${LINE}`,
    borderRadius: 14,
    padding: 16,
    minWidth: 0,
    boxShadow: SHADOW,
    boxSizing: "border-box",
};

const hintLabel = {
    fontSize: 12,
    color: MUTED,
    borderBottom: "1px dotted #cfcac0",
    paddingBottom: 1,
    display: "inline-block",
    cursor: "help",
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${LINE}`,
    borderRadius: 10,
    boxSizing: "border-box",
    background: "#fff",
    fontFamily: SANS,
    fontSize: 14,
    color: INK,
};

const labelStyle = { display: "block", fontSize: 12, color: MUTED, marginBottom: 6 };

const ghostBtn = {
    padding: "7px 12px",
    borderRadius: 8,
    border: `1px solid ${LINE}`,
    background: "#fff",
    color: INK,
    fontSize: 13,
    fontFamily: SANS,
    cursor: "pointer",
};

const grid = (min) => ({
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
    gap: 14,
});

/* ================================================================== */
/* FORMATTING                                                          */
/* ================================================================== */

const money = (v) => {
    if (!Number.isFinite(v)) return "—";
    const digits = Math.abs(v) < 10 ? 4 : 2; // forex quotes need four decimals
    return v.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};
const compactNumber = (v) =>
    v != null && v !== "" && Number.isFinite(Number(v))
        ? Number(v).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 })
        : "—";
const compactMoney = (v) => (v != null && v !== "" && Number.isFinite(Number(v)) ? `$${compactNumber(Number(v))}` : "—");
const pct = (v, d = 2) => (Number.isFinite(v) ? `${(v * 100).toFixed(d)}%` : "—");
const movePct = (v, d = 1) =>
    Number.isFinite(v) ? `${v >= 0 ? "+" : ""}${(v * 100).toFixed(d)}%` : "—";
const num = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "—");
const signed = (v, d = 3) => (Number.isFinite(v) ? `${v >= 0 ? "+" : ""}${v.toFixed(d)}` : "—");

const timeAgo = (iso) => {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return "";
    const mins = Math.round((Date.now() - t) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 48) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
};

/* ================================================================== */
/* GLOSSARY: museum placards for every figure on the page              */
/* what = what it is, how = how it's calculated,                        */
/* read(value, ctx) = what this particular reading implies              */
/* ================================================================== */

const GLOSSARY = {
    price: {
        name: "Current price",
        what: "The most recent closing price in the data feed.",
        how: "The last close in the two-year daily series.",
        read: (v) => `Every target, average and band on this page is measured from ${money(v)}.`,
    },
    vol5: {
        name: "5-day volatility",
        what: "How much the price has been jumping around over the last week.",
        how: "Standard deviation of the last five daily log returns. A log return is ln(today's close ÷ yesterday's close).",
        read: (v) =>
            `A typical daily move recently has been about ${pct(v)}. Compare it with the 20-day figure: higher means the last week was choppier than usual.`,
    },
    baseline: {
        name: "20-day volatility",
        what: "The typical daily swing over roughly the last month.",
        how: "Standard deviation of the last twenty daily log returns.",
        read: (v) =>
            `The usual daily swing over the past month is about ${pct(v)}. It's the calm-period yardstick the short-term figure is judged against.`,
    },
    ewma: {
        name: "EWMA volatility",
        what: "A volatility estimate that gives recent days more weight than older ones.",
        how: "Starts from the 20-day variance, then for each of the last 60 days updates: variance = 0.94 × variance + 0.06 × (today's return)². Takes the square root.",
        read: (v) =>
            `The recency-weighted daily swing is ${pct(v)}. It sits above the 20-day figure when large moves from recent weeks still carry weight.`,
    },
    momentum: {
        name: "Momentum",
        what: "Whether the past week's moves have been leaning one way.",
        how: "Average of the last five daily log returns, divided by EWMA volatility, capped between −1 and +1.",
        read: (v) =>
            v > 0.5
                ? "Strong upward push over the past week."
                : v > 0.1
                    ? "Mild upward push."
                    : v > -0.1
                        ? "Flat: no clear push either way."
                        : v > -0.5
                            ? "Mild downward push."
                            : "Strong downward push over the past week.",
    },
    trend: {
        name: "Trend",
        what: "How far price sits above or below its 20-day average.",
        how: "(Price ÷ 20-day average − 1) × 10, capped at ±1. Multiplying by 10 makes small gaps count.",
        read: (v) =>
            v > 0.3
                ? "Clearly above its short-term average: short-term strength."
                : v > 0
                    ? "Slightly above its short-term average."
                    : v > -0.3
                        ? "Slightly below its short-term average."
                        : "Clearly below its short-term average: short-term weakness.",
    },
    dirscore: {
        name: "Directional score",
        what: "One blended reading of the model's directional inputs.",
        how: "45% order book imbalance + 25% momentum + 30% trend. Missing inputs count as zero.",
        read: (v) =>
            v > 0.1
                ? "Leans bullish: the blend of inputs points up."
                : v < -0.1
                    ? "Leans bearish: the blend of inputs points down."
                    : "Close to neutral: the inputs roughly cancel out.",
    },
    fvol: {
        name: "Forecast volatility (annual)",
        what: "The yearly volatility the probability and forecast maths actually use.",
        how: "Blends the median implied volatility of near-the-money options with realized volatility when usable option IV or quotes exist; otherwise uses realized volatility alone. Adds a bump when recent volatility is spiking.",
        read: (v) =>
            `The model expects a one-standard-deviation yearly move of about ${pct(v, 1)}. Roughly two-thirds of outcomes land within that distance over a year.`,
    },
    target: {
        name: "Target price",
        what: "The price level you want to test.",
        how: "Entered by you. Defaults to the current price × 1.05 when a ticker loads.",
        read: (v, c) =>
            c?.price
                ? `Requires a ${movePct(v / c.price - 1)} move from ${money(c.price)}.`
                : "Set a target to see how far it sits from today.",
    },
    terminal: {
        name: "Terminal probability",
        what: "The chance the price sits on the target's side of the level exactly on the forecast day.",
        how: "Measures the distance to the target in standard deviations (a z-score) using volatility and drift, then reads the tail of the lognormal distribution.",
        read: (v, c) =>
            `About ${pct(v, 1)} of simulated futures finish at or beyond the target on day ${c?.horizon}. Above 50% leans toward the target; below 50% leans away.`,
    },
    touch: {
        name: "Touch probability",
        what: "The chance the price reaches the target at least once before the forecast day.",
        how: "Uses the barrier-hit formula for a drifting random walk. It is always at least as large as the terminal probability, because a path can touch the level and come back.",
        read: (v, c) =>
            `${pct(v, 1)} chance the price prints the target at some point by day ${c?.horizon}. Useful for alerts and limit orders; the terminal figure matters for holding to a date.`,
    },
    reqz: {
        name: "Required z-score",
        what: "How many standard deviations the target sits from the model's central outcome.",
        how: "(ln(target ÷ price) − drift × T) ÷ (volatility × √T), where T is the horizon in years.",
        read: (v) =>
            Math.abs(v) < 0.5
                ? "Close to the center of the distribution: roughly a coin flip, tilted by drift."
                : Math.abs(v) < 1.5
                    ? "Within a normal-sized move for this horizon."
                    : "A tail event under the model: possible, but unusual.",
    },
    tmove: {
        name: "Target move",
        what: "How far the target sits from today's price.",
        how: "Target ÷ current price − 1.",
        read: (v) =>
            v >= 0
                ? `The stock has to rise ${pct(v, 1)} to reach the target.`
                : `The target sits ${pct(-v, 1)} below today's price.`,
    },
    median: {
        name: "Median at horizon",
        what: "The model's most likely central price on the forecast day.",
        how: "Current price × e^((drift − ½σ²) × T). The −½σ² term is volatility drag: big swings pull the typical path below the average.",
        read: (v, c) =>
            c?.price
                ? v < c.price
                    ? `The typical path ends ${pct(1 - v / c.price, 1)} below today, largely from volatility drag.`
                    : `The typical path ends ${pct(v / c.price - 1, 1)} above today.`
                : "The model's central estimate for the day.",
    },
    band: {
        name: "Confidence range at horizon",
        what: "The band where about two-thirds of simulated outcomes are expected to land.",
        how: "Median × e^(±zσ√T), where z follows the selected confidence level. The edges are multiplicative, so the dollar distance is wider on the upside.",
        read: (v, c) =>
            `About ${Math.round(c?.confidence ?? 67)}% of model outcomes land inside this band. Its half-width, ${pct(v, 1)}, is the cost of uncertainty over this horizon.`,
    },
    support: {
        name: "Support (50-day average)",
        what: "A price floor that buyers have defended on average over the past 50 sessions.",
        how: "Simple average of the last 50 closes.",
        read: (v, c) =>
            c?.price && c.price >= v
                ? `Price is ${pct(c.price / v - 1, 1)} above this level. A close below it would weaken the medium-term trend.`
                : "Price is already below this average, so it now acts as overhead resistance.",
    },
    resistance: {
        name: "Resistance (upper band)",
        what: "A ceiling where sellers have tended to appear after strong moves.",
        how: "20-day average plus two standard deviations of price.",
        read: (v, c) =>
            c?.price && c.price > v
                ? "Price is already above the upper band, which means it is stretched high against its recent range."
                : "A close above this band would mean price is stretched high against its recent range.",
    },
    high52: {
        name: "52-week high",
        what: "The highest close over the last year.",
        how: "Maximum close over the last 252 sessions.",
        read: (v, c) =>
            c?.price ? `Price is ${pct(1 - c.price / v, 1)} below its one-year peak.` : "The one-year peak.",
    },
    invalid: {
        name: "Invalidation level (200-day average)",
        what: "The price where the long-term trend would be considered broken.",
        how: "Simple average of the last 200 closes.",
        read: (v, c) =>
            c?.price && c.price >= v
                ? `Price is ${pct(c.price / v - 1, 1)} above this level. A close below it is the usual point to reassess.`
                : "Price is already below this level, so the long-term trend is broken.",
    },
    rsi: {
        name: "Relative Strength Index (14)",
        what: "A 0–100 gauge of how strongly recent gains outweigh recent losses.",
        how: "Average 14-day gain ÷ average 14-day loss = RS. RSI = 100 − 100 ÷ (1 + RS).",
        read: (v) =>
            v > 70
                ? "Overbought: strong recent gains. Pullbacks are common from here."
                : v < 30
                    ? "Oversold: heavy recent selling. Bounces are common from here."
                    : v >= 50
                        ? "Above 50: gains have been winning recently."
                        : "Below 50: losses have been winning recently.",
    },
    macd: {
        name: "MACD histogram",
        what: "The gap between short-term and long-term momentum, and whether that gap is widening.",
        how: "MACD = EMA12 − EMA26. Signal = EMA9 of MACD. Histogram = MACD − Signal.",
        read: (v) =>
            v > 0
                ? "Positive: short-term momentum is pulling ahead of its trend."
                : "Negative: momentum is fading or turning down.",
    },
    sma50: {
        name: "Price vs 50-day average",
        what: "How far price sits from its medium-term average.",
        how: "Price ÷ average of the last 50 closes − 1.",
        read: (v) =>
            v > 0
                ? `Price is ${pct(v, 1)} above its 50-day average: the medium-term trend is up.`
                : `Price is ${pct(-v, 1)} below its 50-day average: the medium-term trend is down.`,
    },
    cross: {
        name: "50-day vs 200-day average",
        what: "Whether the medium-term trend sits above the long-term trend.",
        how: "Compares the 50-day and 200-day simple averages. 50 above 200 is a golden cross; the reverse is a death cross.",
        read: (v) =>
            v > 0
                ? "Golden cross: the medium-term average is above the long-term one, a classic sign of a long uptrend."
                : "Death cross: the medium-term average is below the long-term one, a classic sign of a long downtrend.",
    },
    pctb: {
        name: "Bollinger %B",
        what: "Where price sits inside its volatility bands.",
        how: "(Price − lower band) ÷ (upper band − lower band). The bands are the 20-day average ± 2 standard deviations.",
        read: (v) =>
            v > 1
                ? "Above the upper band: stretched high against the recent range."
                : v < 0
                    ? "Below the lower band: stretched low against the recent range."
                    : v > 0.8
                        ? "Near the top of the bands."
                        : v < 0.2
                            ? "Near the bottom of the bands."
                            : "Inside the bands, near the middle: nothing stretched.",
    },
    volregime: {
        name: "Volatility regime",
        what: "Whether recent volatility is high or low compared with this stock's own history.",
        how: "Ranks today's 20-day volatility against every 20-day reading in the window. 0th is the calmest, 100th the most turbulent.",
        read: (v) =>
            v > 0.8
                ? "Stressed: turbulence is higher than most of the window. Expect wider swings."
                : v < 0.2
                    ? "Calm: quieter than most of the window. Quiet spells often end with larger moves, though the timing is unknown."
                    : "Normal range for this stock.",
    },
    vr5: {
        name: "Trend persistence VR(5)",
        what: "Whether moves tend to carry on or reverse over a week.",
        how: "Variance of 5-day returns ÷ (5 × variance of 1-day returns). Equals 1 for a pure random walk.",
        read: (v) =>
            v > 1.1
                ? "Above 1: moves have been persisting, a trend-friendly profile."
                : v < 0.9
                    ? "Below 1: moves have been reversing, which favors mean-reversion approaches."
                    : "About 1: close to a random walk, so past moves say little about the next.",
    },
    r2: {
        name: "Trend cleanliness R² (60)",
        what: "How closely the last 60 sessions followed a straight line.",
        how: "Fit a straight line to the log of the last 60 closes. R² is the share of variation the line explains, from 0 to 1. The tone badge shows the direction.",
        read: (v) =>
            v > 0.7
                ? "A very clean trend: the price has moved almost in a straight line."
                : v > 0.3
                    ? "A trend with noise around it."
                    : "No clear straight-line trend: the price has zig-zagged.",
    },
    roc: {
        name: "Rate of change (10)",
        what: "Percent change over the last ten sessions.",
        how: "Today's close ÷ the close ten sessions ago − 1.",
        read: (v) =>
            Math.abs(v) > 0.1
                ? `A ${movePct(v)} move in two weeks is large for most stocks.`
                : `A ${movePct(v)} move in two weeks is within a normal range.`,
    },
    stoch: {
        name: "Stochastic %K (14)",
        what: "Where today's close sits within the last 14 sessions' price range.",
        how: "(Close − lowest close) ÷ (highest close − lowest close) × 100. Uses closes only, because the feed has no highs or lows.",
        read: (v) =>
            v > 80
                ? "Near the top of its two-week range: stretched high."
                : v < 20
                    ? "Near the bottom of its two-week range: stretched low."
                    : "Mid-range, with no stretch either way.",
    },
    z20: {
        name: "Z-score vs 20-day average",
        what: "How many standard deviations today's price sits from its recent average.",
        how: "(Price − 20-day average) ÷ standard deviation of the last 20 closes.",
        read: (v) =>
            Math.abs(v) > 2
                ? `${v > 0 ? "Far above" : "Far below"} the recent range (${v.toFixed(1)}σ). Extreme readings often revert, but not on a schedule.`
                : `${v.toFixed(1)}σ from the 20-day average: inside the normal band.`,
    },
    atr: {
        name: "Average daily move (14)",
        what: "The typical size of one day's move, as a percentage of price.",
        how: "Average of the absolute daily log returns over the last 14 sessions. A close-only stand-in for ATR, since highs and lows aren't in the feed.",
        read: (v) =>
            `A typical day moves about ${pct(v, 2)}. A stop closer than one typical move will often be hit by ordinary noise.`,
    },
    beta: {
        name: "Beta vs SPY",
        what: "How much the stock tends to move for each 1% move in the S&P 500.",
        how: "Covariance of the stock's and SPY's daily returns ÷ variance of SPY's daily returns.",
        read: (v) =>
            v > 1.2
                ? `A 1% move in SPY has tended to come with about ${num(v)}% in this stock: amplified both ways.`
                : v < 0.8
                    ? "Moves less than the market: a more defensive profile."
                    : "Roughly moves with the market.",
    },
    rel3m: {
        name: "3-month vs SPY",
        what: "How much the stock beat or trailed the index over three months.",
        how: "The stock's 63-day return − SPY's 63-day return.",
        read: (v) =>
            v >= 0
                ? `Outperformed the index by ${pct(v, 1)} over three months.`
                : `Trailed the index by ${pct(-v, 1)} over three months.`,
    },
    sharpe: {
        name: "Sharpe ratio",
        what: "Return earned per unit of volatility, after subtracting the risk-free rate.",
        how: "(Annual return − risk-free rate) ÷ annual volatility.",
        read: (v) =>
            v > 1
                ? "Strong reward for the risk taken."
                : v >= 0
                    ? "Modest reward for the risk: positive, but not exceptional."
                    : "Did not beat the risk-free rate over the window.",
    },
    obi: {
        name: "Order book imbalance",
        what: "Whether more shares are waiting to buy than to sell at the best prices.",
        how: "(Bid size − ask size) ÷ (bid size + ask size) at the top of the book. Runs from −1 (all sellers) to +1 (all buyers).",
        read: (v) =>
            v > 0.1
                ? "Bid-heavy: more size is waiting to buy. These imbalances can vanish quickly."
                : v < -0.1
                    ? "Ask-heavy: more size is waiting to sell."
                    : "Balanced book.",
        missing: "The order book didn't return data, so this input counts as neutral.",
    },
    ivrv: {
        name: "Implied vs realized volatility",
        what: "Whether options are pricing bigger moves than the stock has actually made.",
        how: "Implied volatility ÷ realized volatility − 1.",
        read: (v) =>
            v > 0.1
                ? "Options price more movement than recent history: traders expect turbulence."
                : v < -0.1
                    ? "Options price less movement than recent history: traders expect calm."
                    : "Options roughly match history.",
        missing: "No usable option quotes or implied-volatility data were available, so the model uses realized volatility alone.",
    },
    recdrift: {
        name: "Recommended drift (annual)",
        what: "The annual return the model tilts the forecast toward.",
        how: "The risk-free rate plus a directional tilt of up to ±10% a year. Changing the risk-free rate therefore changes projected prices and probabilities as well as risk-adjusted ratios.",
        read: (v) =>
            v > 0
                ? `The model tilts the forecast up by about ${pct(v, 2)} a year.`
                : v < 0
                    ? `The model tilts the forecast down by about ${pct(-v, 2)} a year.`
                    : "No drift tilt.",
    },
    volshock: {
        name: "Volatility shock",
        what: "Whether the last week is more turbulent than the last month.",
        how: "5-day volatility ÷ 20-day volatility − 1.",
        read: (v) =>
            v > 0.3
                ? "Recent turbulence is well above the monthly norm."
                : v > 0
                    ? "Slightly above the monthly norm."
                    : "Calmer than the monthly norm.",
    },
    impliedvol: {
        name: "Implied volatility",
        what: "The volatility that options prices imply for the coming period.",
        how: "Median implied volatility from near-the-money contracts with expirations near six weeks, using provider IV when available and otherwise solving Black–Scholes from the latest option quote or trade.",
        read: (v) => `Options traders are pricing roughly ±${pct(v, 0)} a year at one standard deviation.`,
        missing: "No usable near-the-money option IV or premium was available to estimate volatility.",
    },
    annret: {
        name: "Annualized log return",
        what: "The average daily return, scaled to a full year.",
        how: "Mean daily log return × 252. Log returns compound slightly differently from simple returns, so this runs a little above the CAGR in volatile stocks.",
        read: (v) => `The average year added ${pct(v, 1)} in log terms.`,
    },
    cagr: {
        name: "Compound annual growth (CAGR)",
        what: "The steady yearly rate that would turn the starting price into today's price.",
        how: "(Last price ÷ first price)^(1 ÷ years) − 1.",
        read: (v) => `Compounded at ${pct(v, 1)} a year across the window.`,
    },
    realvol: {
        name: "Realized volatility (annual)",
        what: "How much the stock actually moved over the window, expressed per year.",
        how: "Standard deviation of daily log returns × √252.",
        read: (v) => `Across the window, one standard deviation of a year's move was about ${pct(v, 1)}.`,
    },
    sortino: {
        name: "Sortino ratio",
        what: "Like Sharpe, but it counts only downside volatility.",
        how: "(Annual return − risk-free rate) ÷ downside deviation, which uses only negative days.",
        read: (v) =>
            v > 1
                ? "Good reward against downside risk."
                : v >= 0
                    ? "Positive, but downside risk is significant."
                    : "Losses outweighed gains against downside risk.",
    },
    calmar: {
        name: "Calmar ratio",
        what: "Annual growth relative to the worst fall the stock suffered.",
        how: "CAGR ÷ |maximum drawdown|.",
        read: (v) =>
            v > 1
                ? "Growth comfortably outweighed the worst drawdown."
                : v > 0
                    ? "Growth was smaller than the worst drawdown."
                    : "Growth was negative over the window.",
    },
    maxdd: {
        name: "Maximum drawdown",
        what: "The largest peak-to-trough fall in the window.",
        how: "The lowest value of (price ÷ running peak − 1).",
        read: (v) =>
            `At the worst point the stock was ${pct(-v, 1)} below a previous high. Getting back there needs a gain of ${pct(1 / (1 + v) - 1, 0)}.`,
    },
    curdd: {
        name: "Current drawdown",
        what: "How far the stock sits below its highest close in the window.",
        how: "Latest price ÷ running peak − 1.",
        read: (v) => (v > -0.02 ? "At or near a high." : `${pct(-v, 1)} below the peak, still recovering.`),
    },
    var95: {
        name: "1-day VaR (95%)",
        what: "A daily loss threshold that is exceeded only about one day in twenty.",
        how: "The 5th percentile of daily returns, expressed as a loss.",
        read: (v) =>
            `On most days the loss stays under ${pct(v, 2)}. On roughly one day in twenty it is larger.`,
    },
    var99: {
        name: "1-day VaR (99%)",
        what: "The same threshold at a stricter level, exceeded about one day in a hundred.",
        how: "The 1st percentile of daily returns, expressed as a loss.",
        read: (v) => `Losses beyond ${pct(v, 2)} happen on roughly one day in a hundred.`,
    },
    cvar95: {
        name: "Expected shortfall (CVaR 95%)",
        what: "The average loss on the worst 5% of days.",
        how: "Mean of daily returns at or below the 5th percentile, expressed as a loss.",
        read: (v) =>
            `On the worst days, the average loss is ${pct(v, 2)}. This is the number to size positions against.`,
    },
    skew: {
        name: "Skewness",
        what: "Whether the big moves lean toward gains or losses.",
        how: "Third standardized moment of daily returns. Negative means the left tail, the big losses, is longer.",
        read: (v) =>
            v < -0.2
                ? "Negative skew: the biggest moves have tended to be down."
                : v > 0.2
                    ? "Positive skew: the biggest moves have tended to be up."
                    : "Roughly symmetric.",
    },
    kurt: {
        name: "Excess kurtosis",
        what: "How heavy the tails are compared with a normal distribution.",
        how: "Fourth standardized moment of daily returns, minus 3. A normal distribution scores 0.",
        read: (v) =>
            v > 1
                ? "Fat tails: extreme days happen far more often than a normal model predicts."
                : "Tails close to normal.",
    },
    updays: {
        name: "Up days",
        what: "The share of trading days that closed higher than the previous close.",
        how: "Count of positive daily returns ÷ all daily returns.",
        read: (v) =>
            v > 0.5
                ? "More up days than down days, though a few large losses can still dominate."
                : "Fewer than half the days closed higher.",
    },
    best: {
        name: "Best day",
        what: "The largest single-day gain in the window.",
        how: "Largest daily log return, converted back to a simple percentage.",
        read: (v) =>
            `One day alone gained ${pct(v, 2)}. Missing the best few days can cut long-run returns sharply.`,
    },
    worst: {
        name: "Worst day",
        what: "The largest single-day loss in the window.",
        how: "Smallest daily log return, converted back to a simple percentage.",
        read: (v) =>
            `One day alone lost ${pct(-v, 2)}. Moves of this size are what normal-distribution models underweight.`,
    },
    ac1: {
        name: "Lag-1 autocorrelation",
        what: "Whether one day's move tends to be followed by a move in the same direction.",
        how: "Correlation between each day's return and the previous day's return.",
        read: (v) =>
            v > 0.05
                ? "Moves tend to continue the next day."
                : v < -0.05
                    ? "Moves tend to reverse the next day."
                    : "Essentially no day-to-day pattern.",
    },
    vr20: {
        name: "Variance ratio VR(20)",
        what: "The same persistence test over a month.",
        how: "Variance of 20-day returns ÷ (20 × variance of daily returns).",
        read: (v) =>
            v < 0.8
                ? "Strong reversal over a month, though this estimate is noisy."
                : v > 1.2
                    ? "Persistent moves over a month."
                    : "Close to a random walk over a month.",
    },
    perf: {
        name: "Period return",
        what: "The price change over a common lookback period.",
        how: "Price today ÷ price that many sessions ago − 1.",
        read: (v) => (v >= 0 ? `Up ${pct(v, 1)} over this period.` : `Down ${pct(-v, 1)} over this period.`),
    },
    correl: {
        name: "Correlation with SPY",
        what: "How closely the stock's daily moves track the S&P 500.",
        how: "Correlation of daily log returns with SPY's, from −1 to +1.",
        read: (v) =>
            `Squaring it gives ${pct(v * v, 0)}: that share of the stock's daily variation is explained by the market.`,
    },
    alpha: {
        name: "Alpha (annual)",
        what: "The return left over after accounting for market exposure.",
        how: "Stock's annual return − [risk-free rate + beta × (SPY return − risk-free rate)].",
        read: (v) =>
            v >= 0
                ? `Beat what its market exposure predicts by ${pct(v, 1)} a year.`
                : `Trailed what its market exposure predicts by ${pct(-v, 1)} a year.`,
    },
    ar: {
        name: "Autoregressive model, AR(5)",
        what: "A model that predicts tomorrow's return from the last five days' returns.",
        how: "Ordinary least squares fits return(t) = c + Σ a(k) × return(t−k) over the full window. The forecast rolls forward one day at a time.",
        read: (v) => `Projects a day-30 price of ${money(v)}.`,
    },
    holt: {
        name: "Damped trend (Holt)",
        what: "A smoothing model that tracks the level and slope of log price and lets the slope fade.",
        how: "Level and trend update each day with α = 0.35 and β = 0.10. The trend is damped by φ = 0.97, so projections flatten over time.",
        read: (v) => `Projects a day-30 price of ${money(v)} by extending the current slope with damping.`,
    },
    gbm: {
        name: "Geometric Brownian motion",
        what: "The standard stock-price model: a random walk with drift and volatility.",
        how: "Price(t) = Price(0) × exp((drift − ½σ²)·t + σ√t·Z), where Z is a standard normal draw. The median path uses Z = 0.",
        read: (v) => `The median day-30 price under the model's drift and volatility is ${money(v)}.`,
    },
    ens: {
        name: "Consensus forecast",
        what: "The average of the three models, a simple way to reduce any single model's bias.",
        how: "Arithmetic mean of the day-30 values from AR(5), damped Holt and GBM.",
        read: (v, c) =>
            c?.price
                ? `The average of the three models points to ${money(v)} on day 30, ${movePct(v / c.price - 1)} from today.`
                : `The average of the three models points to ${money(v)} on day 30.`,
    },
    up30: {
        name: "Chance of ending above today",
        what: "The model's odds that the price is higher in 30 sessions than it is today.",
        how: "Lognormal (GBM) probability that the day-30 price exceeds the current price.",
        read: (v) =>
            v > 0.55
                ? "Leans toward a higher price in 30 sessions."
                : v < 0.45
                    ? "Leans toward a lower price in 30 sessions."
                    : "Close to even odds.",
    },
    band30: {
        name: "Confidence band, day 30",
        what: "The range where the chosen share of simulated outcomes is expected to end.",
        how: "Median × e^(±z·σ√(30/252)). The z-score depends on the selected central confidence level; 67% uses z ≈ 0.974.",
        read: (v) =>
            `This share of simulated outcomes lands inside the band, a spread of about ±${pct(v, 1)} around the median.`,
    },
    spread30: {
        name: "Model disagreement",
        what: "How far apart the three models' day-30 estimates sit.",
        how: "(Highest − lowest day-30 estimate) ÷ today's price.",
        read: (v) =>
            v > 0.03
                ? "The models disagree noticeably, so treat the direction with caution."
                : "The models broadly agree on where the price goes.",
    },
};

const readOf = (id, raw, ctx) => {
    const g = GLOSSARY[id];
    if (!g) return "";
    if (raw == null || !Number.isFinite(raw)) return g.missing || "Not enough history yet to read this.";
    if (!g.read) return g.what;
    try {
        return g.read(raw, ctx);
    } catch {
        return g.what;
    }
};

/* ================================================================== */
/* MATH HELPERS                                                        */
/* ================================================================== */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const erf = (x) => {
    const sign = x >= 0 ? 1 : -1;
    const absX = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * absX);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
};

const normalCDF = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
const normalPDF = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

const variance = (arr) => {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
};

const stdev = (arr) => Math.sqrt(Math.max(variance(arr), 0));

const covariance = (a, b) => {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    const x = a.slice(a.length - n);
    const y = b.slice(b.length - n);
    const mx = mean(x);
    const my = mean(y);
    let s = 0;
    for (let i = 0; i < n; i++) s += (x[i] - mx) * (y[i] - my);
    return s / (n - 1);
};

const correlation = (a, b) => {
    const n = Math.min(a.length, b.length);
    const x = a.slice(a.length - n);
    const y = b.slice(b.length - n);
    const denom = stdev(x) * stdev(y);
    return denom > 0 ? covariance(x, y) / denom : null;
};

const betaOf = (stock, bench) => {
    const n = Math.min(stock.length, bench.length);
    const vb = variance(bench.slice(bench.length - n));
    return vb > 0 ? covariance(stock, bench) / vb : null;
};

const moments = (arr) => {
    const n = arr.length;
    if (n < 4) return { skew: 0, kurt: 0 };
    const m = mean(arr);
    let m2 = 0;
    let m3 = 0;
    let m4 = 0;
    for (const x of arr) {
        const d = x - m;
        m2 += d * d;
        m3 += d * d * d;
        m4 += d * d * d * d;
    }
    m2 /= n;
    m3 /= n;
    m4 /= n;
    if (m2 === 0) return { skew: 0, kurt: 0 };
    return { skew: m3 / Math.pow(m2, 1.5), kurt: m4 / (m2 * m2) - 3 };
};

const quantile = (sortedArr, p) => {
    if (!sortedArr.length) return NaN;
    const idx = (sortedArr.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * (idx - lo);
};

const autocorr1 = (arr) => {
    const m = mean(arr);
    let num = 0;
    let den = 0;
    for (let i = 0; i < arr.length; i++) {
        den += (arr[i] - m) ** 2;
        if (i > 0) num += (arr[i] - m) * (arr[i - 1] - m);
    }
    return den > 0 ? num / den : 0;
};

// Lo-MacKinlay variance ratio: >1 trending, <1 mean-reverting, ~1 random walk
const varianceRatio = (arr, q) => {
    const n = arr.length;
    if (n < q * 4) return null;
    const v1 = variance(arr);
    if (v1 <= 0) return null;
    const sums = [];
    for (let i = 0; i + q <= n; i++) {
        let s = 0;
        for (let j = 0; j < q; j++) s += arr[i + j];
        sums.push(s);
    }
    return variance(sums) / (q * v1);
};

const logReturnsOf = (prices) => {
    const out = [];
    for (let i = 1; i < prices.length; i++) {
        if (prices[i - 1] > 0 && prices[i] > 0) out.push(Math.log(prices[i] / prices[i - 1]));
    }
    return out;
};

// Seeded RNG so Monte Carlo results don't change on every render
const seededRandom = (seed) => {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

// Gaussian elimination with partial pivoting for small linear systems
const solveLinear = (A, b) => {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let i = 0; i < n; i++) {
        let piv = i;
        for (let r = i + 1; r < n; r++) {
            if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
        }
        if (Math.abs(M[piv][i]) < 1e-14) return null;
        [M[i], M[piv]] = [M[piv], M[i]];
        for (let r = 0; r < n; r++) {
            if (r === i) continue;
            const f = M[r][i] / M[i][i];
            for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
        }
    }
    return M.map((row, i) => row[n] / row[i]);
};

// AR(p) on daily log returns, fitted by ordinary least squares
const fitAR = (r, p = 5) => {
    const rows = [];
    const ys = [];
    for (let t = p; t < r.length; t++) {
        const x = [1];
        for (let k = 1; k <= p; k++) x.push(r[t - k]);
        rows.push(x);
        ys.push(r[t]);
    }
    const n = p + 1;
    if (rows.length <= n + 5) return null;
    const A = Array.from({ length: n }, () => new Array(n).fill(0));
    const b = new Array(n).fill(0);
    rows.forEach((x, i) => {
        for (let a = 0; a < n; a++) {
            b[a] += x[a] * ys[i];
            for (let c = 0; c < n; c++) A[a][c] += x[a] * x[c];
        }
    });
    const coef = solveLinear(A, b);
    if (!coef) return null;
    let ss = 0;
    rows.forEach((x, i) => {
        let yhat = 0;
        for (let a = 0; a < n; a++) yhat += coef[a] * x[a];
        ss += (ys[i] - yhat) ** 2;
    });
    const resSd = Math.sqrt(ss / Math.max(rows.length - n, 1));
    return { coef, resSd, p };
};

// Damped-trend (Holt) smoothing on log prices, returns H forecast prices
const holtDamped = (lp, H, alpha = 0.35, beta = 0.1, phi = 0.97) => {
    let level = lp[0];
    let trend = lp.length > 1 ? lp[1] - lp[0] : 0;
    for (let t = 1; t < lp.length; t++) {
        const prev = level;
        level = alpha * lp[t] + (1 - alpha) * (level + phi * trend);
        trend = beta * (level - prev) + (1 - beta) * phi * trend;
    }
    const out = [];
    let damp = 0;
    for (let h = 1; h <= H; h++) {
        damp += Math.pow(phi, h);
        out.push(Math.exp(level + damp * trend));
    }
    return out;
};

/* ================================================================== */
/* TECHNICAL SERIES (aligned index-for-index with priceData)           */
/* ================================================================== */

const sma = (values, n) =>
    values.map((_, i) => (i + 1 < n ? null : mean(values.slice(i + 1 - n, i + 1))));

const ema = (values, n) => {
    const out = new Array(values.length).fill(null);
    if (values.length < n) return out;
    const k = 2 / (n + 1);
    let prev = mean(values.slice(0, n));
    out[n - 1] = prev;
    for (let i = n; i < values.length; i++) {
        prev = values[i] * k + prev * (1 - k);
        out[i] = prev;
    }
    return out;
};

const rsi = (values, n = 14) => {
    const out = new Array(values.length).fill(null);
    if (values.length <= n) return out;
    let gain = 0;
    let loss = 0;
    for (let i = 1; i <= n; i++) {
        const d = values[i] - values[i - 1];
        if (d >= 0) gain += d;
        else loss -= d;
    }
    gain /= n;
    loss /= n;
    out[n] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    for (let i = n + 1; i < values.length; i++) {
        const d = values[i] - values[i - 1];
        gain = (gain * (n - 1) + Math.max(d, 0)) / n;
        loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
        out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
    }
    return out;
};

const macd = (values) => {
    const e12 = ema(values, 12);
    const e26 = ema(values, 26);
    const line = values.map((_, i) => (e12[i] != null && e26[i] != null ? e12[i] - e26[i] : null));
    const signal = new Array(values.length).fill(null);
    const firstIdx = line.findIndex((v) => v != null);
    if (firstIdx >= 0) {
        const sig = ema(line.slice(firstIdx), 9);
        sig.forEach((v, j) => {
            signal[firstIdx + j] = v;
        });
    }
    const hist = line.map((v, i) => (v != null && signal[i] != null ? v - signal[i] : null));
    return { line, signal, hist };
};

const bollinger = (values, n = 20, k = 2) => {
    const mid = sma(values, n);
    const upper = [];
    const lower = [];
    const pctB = [];
    values.forEach((v, i) => {
        if (i + 1 < n) {
            upper.push(null);
            lower.push(null);
            pctB.push(null);
            return;
        }
        const sd = stdev(values.slice(i + 1 - n, i + 1));
        const m = mid[i];
        upper.push(m + k * sd);
        lower.push(m - k * sd);
        pctB.push(sd > 0 ? (v - (m - k * sd)) / (2 * k * sd) : 0.5);
    });
    return { mid, upper, lower, pctB };
};

const drawdownSeries = (prices) => {
    let peak = -Infinity;
    return prices.map((p) => {
        peak = Math.max(peak, p);
        return p / peak - 1;
    });
};

const buildSeries = (prices) => {
    const logReturns = logReturnsOf(prices);
    const rollVol = prices.map((_, idx) =>
        idx < 20 ? null : stdev(logReturns.slice(idx - 20, idx)) * Math.sqrt(TRADING_DAYS)
    );
    return {
        logReturns,
        sma20: sma(prices, 20),
        sma50: sma(prices, 50),
        sma200: sma(prices, 200),
        bb: bollinger(prices, 20, 2),
        rsi: rsi(prices, 14),
        macd: macd(prices),
        drawdown: drawdownSeries(prices),
        rollVol,
    };
};

// Extra indicators built from closing prices only (the feed has no highs or lows)
const extraIndicators = (prices, logReturns) => {
    const last = prices.length - 1;
    const roc10 = prices.length > 10 ? prices[last] / prices[last - 10] - 1 : null;

    const w14 = prices.slice(-14);
    const hi14 = Math.max(...w14);
    const lo14 = Math.min(...w14);
    const stoch = hi14 > lo14 ? ((prices[last] - lo14) / (hi14 - lo14)) * 100 : null;

    const w20 = prices.slice(-20);
    const sd20 = stdev(w20);
    const z20 = sd20 > 0 ? (prices[last] - mean(w20)) / sd20 : null;

    let r2 = null;
    let slopeAnn = null;
    const seg = prices.slice(-60).map(Math.log);
    if (seg.length >= 20) {
        const xs = seg.map((_, i) => i);
        const mx = mean(xs);
        const my = mean(seg);
        let sxy = 0;
        let sxx = 0;
        let syy = 0;
        xs.forEach((x, i) => {
            const dx = x - mx;
            const dy = seg[i] - my;
            sxy += dx * dy;
            sxx += dx * dx;
            syy += dy * dy;
        });
        if (sxx > 0 && syy > 0) {
            r2 = (sxy * sxy) / (sxx * syy);
            slopeAnn = (sxy / sxx) * TRADING_DAYS;
        }
    }

    const atrp = logReturns.length >= 14 ? mean(logReturns.slice(-14).map(Math.abs)) : null;
    return { roc10, stoch, z20, r2, slopeAnn, atrp };
};

/* ================================================================== */
/* DATA EXTRACTION                                                     */
/* ================================================================== */

const extractPriceArray = (json) => {
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

const extractOBI = (json) => {
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

const extractVolumeBars = (json) => {
    const bars = json?.results ?? json?.bars ?? json?.data;
    if (!Array.isArray(bars)) return [];
    return bars
        .map((bar) => ({
            open: Number(bar?.o ?? bar?.open),
            close: Number(bar?.c ?? bar?.close),
            volume: Number(bar?.v ?? bar?.volume),
        }))
        .filter((bar) => Number.isFinite(bar.open) && Number.isFinite(bar.close) && Number.isFinite(bar.volume));
};

const volumeSummary = (bars) => {
    const recent = bars.slice(-30);
    return recent.reduce(
        (summary, bar) => {
            summary.count += 1;
            summary.total += bar.volume;
            if (bar.close > bar.open) summary.up += bar.volume;
            else if (bar.close < bar.open) summary.down += bar.volume;
            else summary.flat += bar.volume;
            return summary;
        },
        { count: 0, total: 0, up: 0, down: 0, flat: 0 }
    );
};

const parseOptionContract = (symbol) => {
    const match = String(symbol ?? "").match(/^(.{1,6}?)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
    if (!match) return null;
    const [, root, year, month, day, right, strikeValue] = match;
    const expiration = `${2000 + Number(year)}-${month}-${day}`;
    const expirationTime = Date.UTC(2000 + Number(year), Number(month) - 1, Number(day));
    if (
        new Date(expirationTime).getUTCMonth() !== Number(month) - 1
        || new Date(expirationTime).getUTCDate() !== Number(day)
    ) return null;
    return {
        underlying: root.trim(),
        expiration,
        daysToExpiry: Math.max(0, Math.ceil((expirationTime - Date.now()) / 86400000)),
        right,
        type: right === "C" ? "Call" : "Put",
        strike: Number(strikeValue) / 1000,
    };
};

const optionMark = (option) => {
    const bid = Number(option.quote?.bidPrice);
    const ask = Number(option.quote?.askPrice);
    if (Number.isFinite(bid) && Number.isFinite(ask) && bid >= 0 && ask >= bid && ask > 0) {
        return (bid + ask) / 2;
    }
    const trade = Number(option.trade?.price);
    return Number.isFinite(trade) && trade > 0 ? trade : null;
};

const blackScholesOptionValue = (spot, strike, years, rate, volatility, right) => {
    if (!(spot > 0) || !(strike > 0)) return null;
    if (!(years > 0) || !(volatility > 0)) {
        return right === "C" ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
    }
    const sigmaRootTime = volatility * Math.sqrt(years);
    const d1 = (Math.log(spot / strike) + (rate + volatility * volatility / 2) * years) / sigmaRootTime;
    const d2 = d1 - sigmaRootTime;
    if (right === "C") return spot * normalCDF(d1) - strike * Math.exp(-rate * years) * normalCDF(d2);
    return strike * Math.exp(-rate * years) * normalCDF(-d2) - spot * normalCDF(-d1);
};

const impliedVolFromPrice = (premium, spot, strike, days, rate, right) => {
    if (!(premium > 0) || !(spot > 0) || !(strike > 0) || !(days > 0)) return null;
    const years = days / 365;
    const intrinsic = right === "C" ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
    const upperBound = right === "C" ? spot : strike * Math.exp(-rate * years);
    if (premium <= intrinsic || premium >= upperBound) return null;

    let low = 0.001;
    let high = 5;
    for (let iteration = 0; iteration < 48; iteration++) {
        const mid = (low + high) / 2;
        const modelValue = blackScholesOptionValue(spot, strike, years, rate, mid, right);
        if (modelValue > premium) high = mid;
        else low = mid;
    }
    return (low + high) / 2;
};

const findIV = (optionsData, spot, rate) => {
    if (!Number.isFinite(spot) || spot <= 0) return null;

    const candidates = (optionsData?.options ?? [])
        .map((option) => {
            const contract = parseOptionContract(option.symbol);
            if (!contract || contract.daysToExpiry < 7) return null;

            const rawIv = Number(option.greeks?.iv);
            const quotedIv = Number.isFinite(rawIv) && rawIv > 0
                ? (rawIv > 1 ? rawIv / 100 : rawIv)
                : null;
            const mark = optionMark(option);
            const impliedVol = quotedIv
                ?? impliedVolFromPrice(mark, spot, contract.strike, contract.daysToExpiry, rate, contract.right);
            if (!Number.isFinite(impliedVol) || impliedVol <= 0 || impliedVol > 5) return null;

            return {
                impliedVol,
                distance: Math.abs(contract.strike / spot - 1),
                expiryDistance: Math.abs(contract.daysToExpiry - 42),
            };
        })
        .filter(Boolean)
        .sort((a, b) =>
            a.distance + a.expiryDistance / 42 * 0.02
            - (b.distance + b.expiryDistance / 42 * 0.02)
        )
        .slice(0, 12)
        .map((candidate) => candidate.impliedVol)
        .sort((a, b) => a - b);

    if (!candidates.length) return null;
    const middle = Math.floor(candidates.length / 2);
    return candidates.length % 2
        ? candidates[middle]
        : (candidates[middle - 1] + candidates[middle]) / 2;
};

const buildOptionRows = (options, metrics, horizon, rate) => {
    if (!metrics) return [];
    const forecastVol = Math.max(metrics.adaptedVol, 0.0001);
    return (options ?? [])
        .map((option) => {
            const contract = parseOptionContract(option.symbol);
            if (!contract) return null;
            const mark = optionMark(option);
            const rawIv = Number(option.greeks?.iv);
            const marketIv = Number.isFinite(rawIv) && rawIv > 0
                ? (rawIv > 1 ? rawIv / 100 : rawIv)
                : impliedVolFromPrice(mark, metrics.currentPrice, contract.strike, contract.daysToExpiry, rate, contract.right);
            const volatility = marketIv ?? forecastVol;
            const horizonCalendarDays = horizon * 7 / 5;
            const projectionDays = Math.min(horizon, Math.ceil(contract.daysToExpiry * 5 / 7));
            const projectedSpot = metrics.currentPrice * Math.exp(
                (metrics.adaptedDrift - 0.5 * forecastVol * forecastVol) * projectionDays / TRADING_DAYS
            );
            const remainingDays = Math.max(0, contract.daysToExpiry - horizonCalendarDays);
            const predictedValue = blackScholesOptionValue(
                projectedSpot,
                contract.strike,
                remainingDays / 365,
                rate,
                volatility,
                contract.right
            );
            const tradeTimestamp = option.trade?.timestamp;
            return {
                ...option,
                ...contract,
                mark,
                marketIv,
                volatilitySource: marketIv == null ? "forecast volatility fallback" : "market or price-implied IV",
                predictedValue,
                projectedSpot,
                tradeTimestamp,
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            const relevance = (row) =>
                Math.abs(row.strike - metrics.currentPrice) / metrics.currentPrice
                + Math.abs(row.daysToExpiry - horizon * 7 / 5) / 100;
            return relevance(a) - relevance(b);
        })
        .slice(0, 20);
};

/* ================================================================== */
/* PROBABILITY MODELS                                                  */
/* ================================================================== */

// Analytic lognormal (GBM) terminal and barrier-touch probabilities
const probabilityFor = (metrics, horizon, target) => {
    if (!metrics) return null;
    const h = Number(horizon);
    const K = Number(target);
    if (!(h > 0) || !(K > 0)) return null;

    const S0 = metrics.currentPrice;
    const T = h / TRADING_DAYS;
    const sigma = Math.max(metrics.adaptedVol, 1e-6);
    const mu = metrics.adaptedDrift;

    const logDrift = mu - 0.5 * sigma * sigma;
    const distance = Math.log(K / S0);
    const denom = sigma * Math.sqrt(T);
    const z = (distance - logDrift * T) / denom;

    const above = clamp(1 - normalCDF(z), 0, 1);
    const up = K >= S0;
    const terminal = up ? above : 1 - above;

    const a = Math.abs(distance);
    const signedDrift = up ? logDrift : -logDrift;
    const touch = clamp(
        normalCDF((signedDrift * T - a) / denom) +
        Math.exp(clamp((2 * signedDrift * a) / (sigma * sigma), -50, 50)) *
        normalCDF((-signedDrift * T - a) / denom),
        0,
        1
    );

    return { terminal, above, touch, requiredZ: z };
};

// Monte Carlo that resamples the stock's own standardized daily returns
const simulateBootstrap = ({ S0, K, up, h, sigma, mu, zPool }) => {
    if (!zPool || zPool.length === 0 || !(h > 0) || !(K > 0)) return null;

    const rng = seededRandom(1000 + h);
    const dailySigma = sigma / Math.sqrt(TRADING_DAYS);
    const dailyDrift = (mu - 0.5 * sigma * sigma) / TRADING_DAYS;
    const barrier = Math.log(K / S0);

    let terminalHits = 0;
    let touchHits = 0;

    for (let p = 0; p < MC_PATHS; p++) {
        let x = 0;
        let minX = 0;
        let maxX = 0;
        for (let t = 0; t < h; t++) {
            const z = zPool[Math.floor(rng() * zPool.length)];
            x += dailyDrift + dailySigma * z;
            if (x > maxX) maxX = x;
            if (x < minX) minX = x;
        }
        if (up) {
            if (x >= barrier) terminalHits++;
            if (maxX >= barrier) touchHits++;
        } else {
            if (x <= barrier) terminalHits++;
            if (minX <= barrier) touchHits++;
        }
    }

    return { terminal: terminalHits / MC_PATHS, touch: touchHits / MC_PATHS };
};

// What actually happened: share of rolling h-day windows that reached the target
const empiricalProbability = (prices, h, S0, K, up) => {
    const n = prices.length;
    if (!(h > 0) || n <= h) return null;

    const ratio = K / S0;
    let terminalHits = 0;
    let touchHits = 0;
    let count = 0;

    for (let i = 0; i + h < n; i++) {
        count++;
        const end = prices[i + h] / prices[i];
        let extreme = up ? -Infinity : Infinity;
        for (let j = i + 1; j <= i + h; j++) {
            const r = prices[j] / prices[i];
            extreme = up ? Math.max(extreme, r) : Math.min(extreme, r);
        }
        if (up ? end >= ratio : end <= ratio) terminalHits++;
        if (up ? extreme >= ratio : extreme <= ratio) touchHits++;
    }

    return count ? { terminal: terminalHits / count, touch: touchHits / count, windows: count } : null;
};

const probabilityToColor = (probability, isUp, mode) => {
    const t = clamp(probability, 0, 100) / 100;
    if (mode === "above") {
        return `rgb(${Math.round(245 - 160 * t)}, ${Math.round(248 - 100 * t)}, 255)`;
    }
    const a = Math.min(1, t * 1.6);
    const [r, g, b] = isUp ? [47, 125, 91] : [180, 73, 63];
    const mix = (c) => Math.round(255 - (255 - c) * a);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

/* ================================================================== */
/* METRICS                                                             */
/* ================================================================== */

const buildMetrics = ({ prices, series, optionsData, obi, rfRate, benchPrices }) => {
    const returns = series.logReturns;
    if (prices.length < 6 || returns.length < 5) return null;

    const last = prices.length - 1;
    const currentPrice = prices[last];

    /* ---- short-term volatility & momentum ---- */
    const recent5 = returns.slice(-5);
    const recent20 = returns.slice(-20);
    const vol5 = stdev(recent5);
    const baselineVol = stdev(recent20);

    let ewmaVariance = Math.pow(baselineVol || vol5, 2);
    const lambda = 0.94;
    for (const r of returns.slice(-60)) {
        ewmaVariance = lambda * ewmaVariance + (1 - lambda) * r * r;
    }
    const ewmaVol = Math.sqrt(Math.max(ewmaVariance, 0));

    const momentum = clamp(mean(recent5) / Math.max(ewmaVol, 1e-6), -1, 1);
    const sma20Now = series.sma20[last] ?? currentPrice;
    const trend = clamp((currentPrice / sma20Now - 1) * 10, -1, 1);
    const volShock = baselineVol > 0 ? vol5 / baselineVol - 1 : 0;

    /* ---- annualized vol blend & options ---- */
    const impliedVol = findIV(optionsData, currentPrice, rfRate);
    const longRunVol = stdev(returns.slice(-TRADING_DAYS));
    const annualEwma = ewmaVol * Math.sqrt(TRADING_DAYS);
    const annualLong = longRunVol * Math.sqrt(TRADING_DAYS);
    const blendedRealized = 0.5 * annualEwma + 0.5 * annualLong;
    const ivVsRealized = impliedVol !== null && blendedRealized > 0 ? impliedVol / blendedRealized - 1 : null;
    const baseAnnualVol = impliedVol !== null ? 0.6 * impliedVol + 0.4 * blendedRealized : blendedRealized;
    const adaptedVol = baseAnnualVol * (1 + Math.max(volShock, 0) * 0.5);

    /* ---- annualized drift ---- */
    const directionalScore = 0.45 * obi + 0.25 * momentum + 0.3 * trend;
    const recommendedDrift = clamp(directionalScore * 0.1, -0.1, 0.1);
    const adaptedDrift = clamp(rfRate + recommendedDrift, -0.25, 0.35);

    /* ---- full-window risk & return ---- */
    const years = returns.length / TRADING_DAYS;
    const annualReturn = mean(returns) * TRADING_DAYS;
    const annualVol = stdev(returns) * Math.sqrt(TRADING_DAYS);
    const cagr = years > 0 ? Math.pow(currentPrice / prices[0], 1 / years) - 1 : 0;
    const downsideDev =
        Math.sqrt(returns.reduce((s, r) => s + Math.min(r, 0) ** 2, 0) / returns.length) * Math.sqrt(TRADING_DAYS);
    const sharpe = annualVol > 0 ? (annualReturn - rfRate) / annualVol : null;
    const sortino = downsideDev > 0 ? (annualReturn - rfRate) / downsideDev : null;

    const drawdown = series.drawdown;
    const maxDrawdown = Math.min(...drawdown);
    const currentDrawdown = drawdown[last];
    const calmar = maxDrawdown < 0 ? cagr / Math.abs(maxDrawdown) : null;

    /* ---- tail risk & shape ---- */
    const sorted = [...returns].sort((a, b) => a - b);
    const q05 = quantile(sorted, 0.05);
    const q01 = quantile(sorted, 0.01);
    const var95 = -Math.expm1(q05);
    const var99 = -Math.expm1(q01);
    const cvar95 = -mean(sorted.filter((r) => r <= q05).map((r) => Math.expm1(r)));
    const { skew, kurt } = moments(returns);
    const winRate = returns.filter((r) => r > 0).length / returns.length;
    const bestDay = Math.expm1(sorted[sorted.length - 1]);
    const worstDay = Math.expm1(sorted[0]);
    const ac1 = autocorr1(returns);
    const vr5 = varianceRatio(returns, 5);
    const vr20 = varianceRatio(returns, 20);

    /* ---- volatility regime ---- */
    const rollHistory = series.rollVol.filter((v) => v != null);
    const currentRollVol = rollHistory.length ? rollHistory[rollHistory.length - 1] : null;
    const volPercentile =
        currentRollVol != null
            ? (rollHistory.filter((v) => v <= currentRollVol).length / rollHistory.length) * 100
            : null;

    /* ---- performance ---- */
    const ret = (arr, n) => (arr.length - 1 - n >= 0 ? arr[arr.length - 1] / arr[arr.length - 1 - n] - 1 : null);
    const perf = {
        w1: ret(prices, 5),
        m1: ret(prices, 21),
        m3: ret(prices, 63),
        m6: ret(prices, 126),
        y1: ret(prices, 252),
        all: currentPrice / prices[0] - 1,
    };

    /* ---- benchmark (SPY) ---- */
    const benchReturns = logReturnsOf(benchPrices);
    const benchPerf3m = ret(benchPrices, 63);
    let beta = null;
    let correl = null;
    let alpha = null;
    if (benchReturns.length >= 20) {
        beta = betaOf(returns, benchReturns);
        correl = correlation(returns, benchReturns);
        const n = Math.min(returns.length, benchReturns.length);
        const rStock = mean(returns.slice(-n)) * TRADING_DAYS;
        const rBench = mean(benchReturns.slice(-n)) * TRADING_DAYS;
        alpha = beta !== null ? rStock - (rfRate + beta * (rBench - rfRate)) : null;
    }

    /* ---- standardized returns for the bootstrap ---- */
    const sd = stdev(returns);
    const mu = mean(returns);
    const zReturns = sd > 0 ? returns.map((r) => (r - mu) / sd) : [];

    return {
        returns,
        zReturns,
        currentPrice,
        vol5,
        baselineVol,
        ewmaVol,
        momentum,
        trend,
        volShock,
        impliedVol,
        ivVsRealized,
        directionalScore,
        recommendedDrift,
        adaptedDrift,
        adaptedVol,
        annualReturn,
        annualVol,
        cagr,
        sharpe,
        sortino,
        maxDrawdown,
        currentDrawdown,
        calmar,
        var95,
        var99,
        cvar95,
        skew,
        kurt,
        winRate,
        bestDay,
        worstDay,
        ac1,
        vr5,
        vr20,
        volPercentile,
        perf,
        benchPerf3m,
        beta,
        correl,
        alpha,
    };
};

/* ================================================================== */
/* FORECAST, INDICATORS, VERDICT (pure functions)                      */
/* ================================================================== */

// Three projections of the next FORECAST_DAYS sessions, plus a consensus
const buildForecast = ({ metrics, prices, level = 80 }) => {
    const Zb = zForLevel(level);
    const S0 = metrics.currentPrice;
    const sigma = Math.max(metrics.adaptedVol, 1e-6);
    const mu = metrics.adaptedDrift;

    // 1) AR(5) rolled forward on daily log returns
    const ar = fitAR(metrics.returns, 5);
    const arPath = [];
    if (ar) {
        const ext = [...metrics.returns];
        let cum = 0;
        for (let h = 1; h <= FORECAST_DAYS; h++) {
            let next = ar.coef[0];
            for (let k = 1; k <= ar.p; k++) next += ar.coef[k] * ext[ext.length - k];
            ext.push(next);
            cum += next;
            arPath.push(S0 * Math.exp(cum));
        }
    }

    // 2) Damped Holt on log prices
    const holtPath = holtDamped(prices.map(Math.log), FORECAST_DAYS);

    // 3) GBM median and the selected central confidence band
    const gbmPath = [];
    const gbmLow = [];
    const gbmHigh = [];
    for (let h = 1; h <= FORECAST_DAYS; h++) {
        const t = h / TRADING_DAYS;
        const med = S0 * Math.exp((mu - 0.5 * sigma * sigma) * t);
        const band = Zb * sigma * Math.sqrt(t);
        gbmPath.push(med);
        gbmLow.push(med * Math.exp(-band));
        gbmHigh.push(med * Math.exp(band));
    }

    const ensPath = gbmPath.map((_, i) => {
        const parts = [gbmPath[i]];
        if (arPath[i] != null) parts.push(arPath[i]);
        if (holtPath[i] != null) parts.push(holtPath[i]);
        return mean(parts);
    });

    const last = FORECAST_DAYS - 1;
    const ens30 = ensPath[last];
    const endVals = [gbmPath[last], arPath[last], holtPath[last]].filter((v) => v != null);
    const spread = (Math.max(...endVals) - Math.min(...endVals)) / S0;
    const chanceUp = probabilityFor(metrics, FORECAST_DAYS, S0)?.above ?? null;
    const band30Sd = Zb * sigma * Math.sqrt(FORECAST_DAYS / TRADING_DAYS);

    // Chart rows: 59 sessions of history, today, then 30 projected sessions
    const tail = prices.slice(-60);
    const rows = tail.slice(0, -1).map((p, i) => ({ x: i - (tail.length - 1), price: p }));
    rows.push({ x: 0, price: S0, ens: S0, ar: S0, holt: S0, gbm: S0, gbmLow: S0, gbmHigh: S0 });
    for (let h = 1; h <= FORECAST_DAYS; h++) {
        const i = h - 1;
        rows.push({
            x: h,
            ens: ensPath[i],
            ar: arPath[i] ?? null,
            holt: holtPath[i],
            gbm: gbmPath[i],
            gbmLow: gbmLow[i],
            gbmHigh: gbmHigh[i],
        });
    }
    rows.forEach((r) => {
        if (r.gbmLow != null) {
            r.bandBase = r.gbmLow;
            r.bandWidth = r.gbmHigh - r.gbmLow;
        }
    });

    const dir = Math.abs(ens30 / S0 - 1) < 0.005 ? "close to flat" : ens30 >= S0 ? "higher" : "lower";
    const outlook =
        `The models lean ${dir}: the consensus is ${money(ens30)} on day 30, ${movePct(ens30 / S0 - 1)} from today. ` +
        `${level}%  of simulated outcomes land between ${money(gbmLow[last])} and ${money(gbmHigh[last])}, and the chance of finishing above ${money(S0)} is ${pct(chanceUp, 0)}. ` +
        (spread > 0.03
            ? "The three models disagree noticeably, so the direction deserves less confidence than the consensus suggests."
            : "The three models broadly agree, which gives the consensus more weight.");

    return {
        rows,
        arPath,
        holtPath,
        gbmPath,
        ensPath,
        ens30,
        gbmLow30: gbmLow[last],
        gbmHigh30: gbmHigh[last],
        band30Sd,
        spread,
        level,
        chanceUp,
        outlook,
    };
};

const buildIndicators = ({ metrics, series, extras, obi, obiAvailable }) => {
    const i = series.rsi.length - 1;
    const px = metrics.currentPrice;
    const out = [];
    const add = (id, label, value, raw, tone) => out.push({ id, label, value, raw, tone });

    const rsiNow = series.rsi[i];
    if (rsiNow != null) {
        add("rsi", "RSI (14)", rsiNow.toFixed(1), rsiNow, rsiNow > 70 || rsiNow < 30 ? "warn" : rsiNow >= 50 ? "bull" : "bear");
    }

    const histNow = series.macd.hist[i];
    if (histNow != null) add("macd", "MACD histogram", histNow.toFixed(3), histNow, histNow > 0 ? "bull" : "bear");

    const sma50Now = series.sma50[i];
    const sma200Now = series.sma200[i];
    if (sma50Now != null) {
        const d = px / sma50Now - 1;
        add("sma50", "Price vs 50-day avg", movePct(d), d, d > 0 ? "bull" : "bear");
    }
    if (sma50Now != null && sma200Now != null) {
        const g = sma50Now / sma200Now - 1;
        add("cross", "50 vs 200-day avg", g > 0 ? "Golden cross" : "Death cross", g, g > 0 ? "bull" : "bear");
    }

    const pb = series.bb.pctB[i];
    if (pb != null) add("pctb", "Bollinger %B", `${Math.round(pb * 100)}%`, pb, pb > 1 || pb < 0 ? "warn" : "neutral");

    if (metrics.volPercentile != null) {
        const p = metrics.volPercentile / 100;
        add("volregime", "Volatility regime", `${Math.round(metrics.volPercentile)}th pct`, p, p > 0.8 ? "warn" : "neutral");
    }

    if (metrics.vr5 != null) add("vr5", "Trend persistence VR(5)", num(metrics.vr5), metrics.vr5, "neutral");

    if (extras?.r2 != null) {
        const tone = extras.r2 > 0.6 ? (extras.slopeAnn > 0 ? "bull" : "bear") : "neutral";
        add("r2", "Trend cleanliness R²", num(extras.r2), extras.r2, tone);
    }

    if (extras?.roc10 != null) {
        add("roc", "Rate of change (10)", movePct(extras.roc10), extras.roc10, extras.roc10 > 0 ? "bull" : "bear");
    }

    if (extras?.stoch != null) {
        const s = extras.stoch;
        add("stoch", "Stochastic %K (14)", s.toFixed(0), s, s > 80 || s < 20 ? "warn" : s >= 50 ? "bull" : "bear");
    }

    if (extras?.z20 != null) {
        add("z20", "Z-score (20)", `${signed(extras.z20, 2)}σ`, extras.z20, Math.abs(extras.z20) > 2 ? "warn" : "neutral");
    }

    if (extras?.atrp != null) add("atr", "Average daily move (14)", pct(extras.atrp, 2), extras.atrp, "neutral");

    if (metrics.beta != null) {
        add("beta", "Beta vs SPY", num(metrics.beta), metrics.beta, metrics.beta > 1.2 ? "warn" : "neutral");
    }

    if (metrics.perf.m3 != null && metrics.benchPerf3m != null) {
        const rel = metrics.perf.m3 - metrics.benchPerf3m;
        add("rel3m", "3-month vs SPY", movePct(rel), rel, rel >= 0 ? "bull" : "bear");
    }

    if (metrics.sharpe != null) {
        add(
            "sharpe",
            "Sharpe ratio",
            num(metrics.sharpe),
            metrics.sharpe,
            metrics.sharpe > 1 ? "bull" : metrics.sharpe < 0 ? "bear" : "neutral"
        );
    }

    if (obiAvailable) {
        add("obi", "Order book imbalance", num(obi, 3), obi, obi > 0.1 ? "bull" : obi < -0.1 ? "bear" : "neutral");
    }

    if (metrics.ivVsRealized != null) {
        add("ivrv", "Implied vs realized vol", movePct(metrics.ivVsRealized, 0), metrics.ivVsRealized, "neutral");
    }

    const ds = metrics.directionalScore;
    add("dirscore", "Directional score", signed(ds), ds, ds > 0.1 ? "bull" : ds < -0.1 ? "bear" : "neutral");

    return out;
};

const buildLevels = ({ metrics, series, prices }) => {
    const i = prices.length - 1;
    const px = metrics.currentPrice;
    const sma50Now = series.sma50[i];
    const sma200Now = series.sma200[i];
    return {
        support: sma50Now ?? px * 0.95,
        resistance: series.bb.upper[i] ?? px * 1.05,
        invalid: sma200Now ?? px * 0.9,
        high52: Math.max(...prices.slice(-TRADING_DAYS)),
    };
};

// A model read: a blend of the indicator tally and the 30-session consensus
const buildVerdict = ({ metrics, indicators, forecast, levels }) => {
    const bull = indicators.filter((i) => i.tone === "bull").length;
    const bear = indicators.filter((i) => i.tone === "bear").length;
    const warn = indicators.filter((i) => i.tone === "warn").length;
    const tech = (bull - bear) / Math.max(bull + bear + warn, 1);
    const forecastMove = forecast.ens30 / metrics.currentPrice - 1;
    const fc = clamp(forecastMove / 0.05, -1, 1);
    const score = 0.5 * tech + 0.5 * fc;

    const extended = indicators.some((i) => (i.id === "rsi" && i.raw > 70) || (i.id === "pctb" && i.raw > 1));
    const tone = score > 0.2 ? "bull" : score < -0.2 ? "bear" : "neutral";
    const label =
        tone === "bull" ? (extended ? "Constructive, stretched" : "Constructive") : tone === "bear" ? "Weak" : "Neutral";

    const action =
        label === "Constructive, stretched"
            ? `Constructive, but stretched. The model favors waiting for a pullback toward the 50-day average near ${money(levels.support)} rather than chasing strength.`
            : label === "Constructive"
                ? `Constructive. The model favors buying dips toward the 50-day average near ${money(levels.support)}, and treats a close below ${money(levels.invalid)} as the point to step aside.`
                : label === "Weak"
                    ? `Weak. The model favors staying out until price reclaims the 50-day average near ${money(levels.support)}.`
                    : `No clear edge. The model favors waiting for a decisive break above ${money(levels.resistance)} or below ${money(levels.support)}.`;

    return { label, tone, score, bull, bear, warn, tech, fc, forecastMove, extended, action };
};

// Written from the numbers alone: used when the AI route isn't available
const buildRuleNarrative = ({ ticker, metrics, forecast, verdict, selected, horizon, targetK, hasTarget }) => {
    const S0 = metrics.currentPrice;
    const parts = [];
    parts.push(`${ticker} closed at ${money(S0)}. ${verdict.action}`);
    parts.push(
        `Across the three models, the consensus for day 30 is ${money(forecast.ens30)} (${movePct(
            forecast.ens30 / S0 - 1
        )}), with a ${forecast.level}% range from ${money(forecast.gbmLow30)} to ${money(forecast.gbmHigh30)}.`
    );
    if (hasTarget && selected) {
        parts.push(
            `The ${money(targetK)} target has a ${pct(selected.terminal, 0)} chance of being met on day ${horizon} and a ${pct(
                selected.touch,
                0
            )} chance of being touched at some point before then.`
        );
    }
    const risks = [];
    if (metrics.maxDrawdown < -0.25) {
        risks.push(`the stock has already suffered a ${pct(-metrics.maxDrawdown, 0)} drawdown in this window`);
    }
    if (metrics.beta > 1.2) risks.push(`a beta of ${num(metrics.beta)} means market selloffs hit harder`);
    if (metrics.kurt > 1) risks.push(`the average loss on the worst 5% of days is ${pct(metrics.cvar95, 1)}`);
    parts.push(risks.length ? `Main risks: ${risks.join("; ")}.` : "No single risk dominates the window.");
    parts.push("This summarizes historical data through simple models. ");
    return parts.join(" ");
};

const POS_WORDS = ["beat", "surge", "record", "upgrade", "growth", "raises", "strong", "gain", "rally", "approval", "partnership", "profit", "wins", "tops"];
const NEG_WORDS = ["miss", "falls", "drop", "downgrade", "lawsuit", "probe", "cut", "slump", "warning", "decline", "recall", "fine", "sues", "plunge", "tumble"];

const newsToneOf = (items) => {
    let pos = 0;
    let neg = 0;
    items.forEach((it) => {
        const text = `${it.headline || ""}`.toLowerCase();
        POS_WORDS.forEach((w) => {
            if (text.includes(w)) pos++;
        });
        NEG_WORDS.forEach((w) => {
            if (text.includes(w)) neg++;
        });
    });
    if (pos + neg === 0) return { label: "No clear tone", tone: "neutral" };
    if (pos > neg * 1.5) return { label: "Mostly positive", tone: "bull" };
    if (neg > pos * 1.5) return { label: "Mostly negative", tone: "bear" };
    return { label: "Mixed tone", tone: "warn" };
};

/* BACKEND HELPERS (news + AI)                                         */
/* ================================================================== */

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");



const GENERIC_WORDS = new Set([
    "class", "group", "holding", "holdings", "platforms", "corp", "corporation", "inc",
    "etf", "fund", "market", "markets", "total", "index", "emerging", "international",
    "trust", "company", "ltd", "nasdaq", "russell", "stock", "bank", "america", "jones",
    "dollar", "british", "japanese", "swiss", "canadian", "australian", "mexican", "pound",
    "natural", "crude", "metals", "agriculture", "services",
]);
// Matches headlines on the company name, its main word, known aliases and the ticker
const fetchNews = async (symbol, name) => {
    const fullName = name && name !== symbol ? name : "";
    const brandWords = fullName
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w.toLowerCase()));
    const terms = [
        ...new Set([fullName, ...brandWords, ...(NEWS_ALIASES[symbol] || [])].filter(Boolean)),
    ];
    const patterns = terms.map((t) => new RegExp(`\\b${escapeRe(t)}\\b`, "i"));
    const symbolRe = symbol.length >= 3 ? new RegExp(`\\b${escapeRe(symbol)}\\b`) : null;

    const feeds = ["HomePage", "Business", "Economy", "Technology", "Dealbook"];
    const settled = await Promise.allSettled(
        feeds.map(async (feed) => {
            const res = await fetch(`${BACKEND_URL}/NYT/rss/${feed}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
    );
    if (!settled.some((s) => s.status === "fulfilled")) {
        throw new Error("No NYT feed responded.");
    }

    const seen = new Set();
    const matches = [];
    settled.forEach((s) => {
        if (s.status !== "fulfilled") return;
        (s.value.items || []).forEach((it) => {
            if (!it.link || seen.has(it.link)) return;
            seen.add(it.link);
            const text = `${it.title || ""} ${it.description || ""}`;
            const hit = patterns.some((p) => p.test(text)) || (symbolRe && symbolRe.test(text));
            if (hit) matches.push(it);
        });
    });

    return matches
        .sort((a, b) => (Date.parse(b.published) || 0) - (Date.parse(a.published) || 0))
        .slice(0, 12)
        .map((it) => ({
            headline: it.title,
            summary: it.description,
            source: "The New York Times",
            url: it.link,
            created_at: it.published,
        }));
};
// Turns the forecast context into plain text for /ai-interpret
const contextAsText = (c) =>
    [
        `Ticker: ${c.ticker}. Price today: ${money(c.price)}. Horizon: ${c.horizonDays} trading days.`,
        c.target
            ? `Target: ${money(c.target)}. Chance of finishing at or beyond it: ${pct(c.targetChance.terminal, 1)}. Chance of touching it at some point: ${pct(c.targetChance.touch, 1)}.`
            : "No target set.",
        `Setup read: ${c.verdict.label} (score ${num(c.verdict.score)}). ${c.verdict.action}`,
        `30-session forecast: consensus ${money(c.forecast30.consensus)}, ${c.forecast30.bandLevel}% range ${money(c.forecast30.confidenceRange[0])} to ${money(c.forecast30.confidenceRange[1])}, chance of finishing above today ${pct(c.forecast30.chanceAbove, 0)}, model disagreement ${pct(c.forecast30.modelDisagreement, 1)}. AR(5) ${money(c.forecast30.models.ar)}, damped trend ${money(c.forecast30.models.dampedTrend)}, GBM ${money(c.forecast30.models.gbm)}.`,
        "Indicators:",
        ...c.indicators.map((i) => `- ${i.name}: ${i.reading} (${i.tone})`),
        `Risk: Sharpe ${num(c.risk.sharpe)}, max drawdown ${pct(c.risk.maxDrawdown, 1)}, current drawdown ${pct(c.risk.currentDrawdown, 1)}, 1-day VaR 95% ${pct(c.risk.var95, 2)}, expected shortfall 95% ${pct(c.risk.expectedShortfall95, 2)}, beta ${num(c.risk.beta)}, annual volatility ${pct(c.risk.annualVol, 1)}.`,
        "Recent headlines:",
        ...(c.headlines.length ? c.headlines.map((h) => `- ${h.headline}`) : ["- none"]),
        "Write a plain-English market commentary for this stock: what the setup looks like now, where the models point over the next 30 sessions and how much they agree, and the main risks. Use the numbers exactly as given. Three short paragraphs, no bullet points.",
    ].join("\n");

// Renders the numbered briefing returned by /ai-analyze-article
const Briefing = ({ text }) => {
    const blocks = [];
    let current = null;
    text.split("\n").forEach((raw) => {
        const line = raw.trim();
        if (!line || line.startsWith("CATEGORY:")) return;
        if (line.startsWith("###")) {
            current = { title: line.replace(/^###\s*(\d+\.\s*)?/, ""), body: [] };
            blocks.push(current);
            return;
        }
        if (!current) {
            current = { title: "", body: [] };
            blocks.push(current);
        }
        current.body.push(line);
    });
    return (
        <div style={{ display: "grid", gap: 16 }}>
            {blocks.map((b, i) => (
                <div key={i}>
                    {b.title && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 4 }}>{b.title}</div>
                    )}
                    {b.body.map((p, j) => (
                        <p key={j} style={{ margin: "0 0 6px", fontSize: 14, lineHeight: 1.65, color: "#2c2f36" }}>
                            {p}
                        </p>
                    ))}
                </div>
            ))}
        </div>
    );
};

/* ================================================================== */
/* UI PIECES                                                         */
/* ================================================================== */

const tipCard = {
    background: "rgba(255,255,255,0.97)",
    border: `1px solid ${LINE}`,
    borderRadius: 12,
    boxShadow: "0 24px 48px -16px rgba(16,24,40,0.28)",
    color: INK,
    fontFamily: SANS,
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: "left",
};

const Para = ({ label, text }) => (
    <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, color: FAINT, marginBottom: 1 }}>{label}</div>
        <div>{text}</div>
    </div>
);

const TipBubble = ({ pos, tip }) => {
    const width = 330;
    const flip = pos.y > window.innerHeight * 0.55;
    const left = Math.max(12, Math.min(pos.x + 18, window.innerWidth - width - 12));
    return (
        <div
            style={{
                ...tipCard,
                position: "fixed",
                left,
                top: flip ? pos.y - 14 : pos.y + 18,
                transform: flip ? "translateY(-100%)" : "none",
                width,
                zIndex: 9999,
                pointerEvents: "none",
                padding: "14px 16px",
            }}
        >
            <div style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.25 }}>{tip.title}</div>
            {tip.value && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
                    Current reading: <span style={{ color: INK, fontWeight: 600 }}>{tip.value}</span>
                </div>
            )}
            {tip.what && <Para label="What it is" text={tip.what} />}
            {tip.how && <Para label="How it's calculated" text={tip.how} />}
            {tip.reading && <Para label="What it implies" text={tip.reading} />}
        </div>
    );
};

// Shows a museum-style placard next to the cursor while hovering its children
const Hoverable = ({ tip, children, block = false }) => {
    const [pos, setPos] = useState(null);
    if (!tip) return <span style={{ display: block ? "block" : "inline" }}>{children}</span>;
    const track = (e) => setPos({ x: e.clientX, y: e.clientY });
    return (
        <span
            onMouseEnter={track}
            onMouseMove={track}
            onMouseLeave={() => setPos(null)}
            style={{ display: block ? "block" : "inline-block", cursor: "help" }}
        >
            {children}
            {pos && createPortal(<TipBubble pos={pos} tip={tip} />, document.body)}
        </span>
    );
};

// Name and value of any figure. Hover the name for the method, the value for its meaning.
const Metric = ({ id, label, value, raw, ctx, tone, sub, big = false, panel = true, accent = false }) => {
    const g = GLOSSARY[id] || {};
    const title = g.name || label;
    const shown = label || g.name;
    return (
        <div
            style={{
                ...(panel ? panelStyle : {}),
                ...(accent && tone ? { borderLeft: `3px solid ${TONE[tone]}` } : {}),
            }}
        >
            <Hoverable tip={{ title, what: g.what, how: g.how }} block>
                <span style={hintLabel}>{shown}</span>
            </Hoverable>
            <Hoverable tip={{ title, value, reading: readOf(id, raw, ctx) }} block>
                <div
                    style={{
                        fontFamily: big ? SERIF : SANS,
                        fontSize: big ? 30 : 22,
                        fontWeight: big ? 500 : 600,
                        color: tone ? TONE[tone] : INK,
                        marginTop: 6,
                        fontVariantNumeric: "tabular-nums",
                        overflowWrap: "anywhere",
                        lineHeight: 1.15,
                        letterSpacing: big ? "-0.01em" : 0,
                    }}
                >
                    {value}
                </div>
            </Hoverable>
            {sub && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sub}</div>}
        </div>
    );
};

const Card = ({ children, style }) => <section style={{ ...cardBase, ...style }}>{children}</section>;

const SectionHeader = ({ title, subtitle, right }) => (
    <div
        style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
        }}
    >
        <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 500, fontSize: 23, letterSpacing: "-0.01em" }}>
                {title}
            </h2>
            {subtitle && (
                <div style={{ fontSize: 13, color: MUTED, marginTop: 4, lineHeight: 1.55, maxWidth: 760 }}>
                    {subtitle}
                </div>
            )}
        </div>
        {right}
    </div>
);

const Pill = ({ tone = "neutral", children }) => (
    <span
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 11px",
            borderRadius: 999,
            border: `1px solid ${LINE}`,
            background: "#fff",
            color: TONE[tone],
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
        }}
    >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: TONE[tone] }} />
        {children}
    </span>
);

const Segmented = ({ options, value, onChange }) => (
    <div
        style={{
            display: "inline-flex",
            padding: 3,
            background: PAPER,
            borderRadius: 10,
            border: `1px solid ${LINE}`,
            gap: 2,
        }}
    >
        {options.map(([key, label]) => (
            <button
                key={key}
                onClick={() => onChange(key)}
                style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: value === key ? "#fff" : "transparent",
                    boxShadow: value === key ? SHADOW : "none",
                    color: value === key ? INK : MUTED,
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: SANS,
                    cursor: "pointer",
                }}
            >
                {label}
            </button>
        ))}
    </div>
);

const ChartBox = ({ height, children }) => (
    <div style={{ width: "100%", height, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
            {children}
        </ResponsiveContainer>
    </div>
);

const Field = ({ label, minWidth = 150, children }) => (
    <div style={{ minWidth }}>
        <label style={labelStyle}>{label}</label>
        {children}
    </div>
);

const Swatches = ({ label, isUp, mode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ minWidth: 40 }}>{label}</span>
        {[0, 25, 50, 75, 100].map((v) => (
            <div key={v} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                    style={{
                        width: 34,
                        height: 10,
                        background: probabilityToColor(v, isUp, mode),
                        border: `1px solid ${LINE}`,
                    }}
                />
                <span>{v}%</span>
            </div>
        ))}
    </div>
);

const ForecastTip = ({ active, payload, label, level = 80 }) => {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload;
    const when = label === 0 ? "Today" : label > 0 ? `Day +${label}` : `${Math.abs(label)} sessions ago`;
    return (
        <div style={{ ...tipCard, padding: "10px 12px", minWidth: 190 }}>
            <div style={{ fontFamily: SERIF, fontSize: 15, marginBottom: 4 }}>{when}</div>
            {r.price != null && (
                <div style={{ fontSize: 12, color: MUTED }}>
                    Close: <b style={{ color: INK }}>{money(r.price)}</b>
                </div>
            )}
            {r.ens != null && (
                <div style={{ fontSize: 12, color: MUTED }}>
                    Consensus: <b style={{ color: INK }}>{money(r.ens)}</b>
                </div>
            )}
            {r.gbmLow != null && (
                <div style={{ fontSize: 12, color: MUTED }}>
                    {level}% range:{" "}
                    <b style={{ color: INK }}>
                        {money(r.gbmLow)} – {money(r.gbmHigh)}
                    </b>
                </div>
            )}
        </div>
    );
};

/* ================================================================== */
/* COMPONENT                                                           */
/* ================================================================== */

const TrajectoryTip = ({ active, payload, label, level }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 12px", boxShadow: SHADOW }}>
            <div style={{ color: MUTED, fontSize: 11, marginBottom: 5 }}>Day {label}</div>
            <div style={{ fontSize: 12 }}>Median: <strong>{money(point.median)}</strong></div>
            <div style={{ fontSize: 12 }}>{level}% range: <strong>{money(point.pLow)} – {money(point.pHigh)}</strong></div>
        </div>
    );
};

export default function Forecast({ initialTicker = "" }) {
    const requestedTicker = typeof initialTicker === "string" ? initialTicker.trim().toUpperCase() : "";
    const [ticker, setTicker] = useState(requestedTicker || "GOOGL");
    const [categoryOverride, setCategoryOverride] = useState(null);
    const [customTicker, setCustomTicker] = useState("");
    const [targetPrice, setTargetPrice] = useState(null);
    const [targetDay, setTargetDay] = useState(30);
    const [rfPercent, setRfPercent] = useState(4);
    const [chartWindow, setChartWindow] = useState(730);
    const [spectrumMode, setSpectrumMode] = useState("move");
    const [bandLevel, setBandLevel] = useState(67);
    const [priceData, setPriceData] = useState([]);
    const [volumeBars, setVolumeBars] = useState([]);
    const [benchPrices, setBenchPrices] = useState([]);
    const [optionsData, setOptionsData] = useState(null);
    const [optionsError, setOptionsError] = useState(null);
    const [marketContext, setMarketContext] = useState(null);
    const [obi, setObi] = useState(0);
    const [obiAvailable, setObiAvailable] = useState(false);
    const [news, setNews] = useState([]);
    const [newsError, setNewsError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [aiText, setAiText] = useState(null);
    const [aiSource, setAiSource] = useState("idle");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiNonce, setAiNonce] = useState(0);
    const [articleAI, setArticleAI] = useState({});
    const [companyNames, setCompanyNames] = useState({});
    const [aiError, setAiError] = useState(null);

    const rfRate = rfPercent / 100;
    const horizon = Number(targetDay);
    const targetK = Number(targetPrice);
    const hasTarget = Number.isFinite(targetK) && targetK > 0;
    const activeTicker = useMemo(() => customTicker.trim().toUpperCase() || ticker, [ticker, customTicker]);
    const companyName = companyNames[activeTicker] || TICKERS.find((t) => t.symbol === activeTicker)?.name || activeTicker;
    const dayChange =
        priceData.length > 1 ? priceData[priceData.length - 1] / priceData[priceData.length - 2] - 1 : null;
    const currentCategory = categoryOverride ?? TICKERS.find((t) => t.symbol === ticker)?.category ?? "stocks";
    const groupedItems = groupedFor(currentCategory);
    /* ------------------------------ FETCH ------------------------------ */

    useEffect(() => {
        if (!requestedTicker) return;
        setTicker(requestedTicker);
        setCategoryOverride(null);
        setCustomTicker("");
    }, [requestedTicker]);

    // Company names from the backend's market universe (feeds the header and news matching)
    useEffect(() => {
        let cancelled = false;
        fetch(`${BACKEND_URL}/alpaca/marketUniverse`)
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                if (cancelled || !json?.markets) return;
                const map = {};
                Object.values(json.markets).forEach((list) => {
                    if (Array.isArray(list)) {
                        list.forEach((it) => {
                            if (it?.symbol) map[it.symbol] = it.name;
                        });
                    }
                });
                setCompanyNames(map);
            })
            .catch(() => { });
        return () => {
            cancelled = true;
        };
    }, []);

    // Headlines follow the ticker and its company name
    useEffect(() => {
        let cancelled = false;
        fetchNews(activeTicker, companyName)
            .then((items) => {
                if (!cancelled) {
                    setNews(items);
                    setNewsError(null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setNews([]);
                    setNewsError("The NYT feeds couldn't be reached. Check that the backend's /NYT routes respond.");
                }
            });
        return () => {
            cancelled = true;
        };
    }, [activeTicker, companyName]);

    // Prices, options, order book and benchmark
    useEffect(() => {
        let cancelled = false;

        const readJson = async (result) => {
            if (result.status !== "fulfilled") return null;
            try {
                return await result.value.json();
            } catch {
                return null;
            }
        };

        const load = async () => {
            setLoading(true);
            setError(null);
            setOptionsError(null);
            setOptionsData(null);
            setMarketContext(null);
            try {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 730);
                const from = start.toISOString().split("T")[0];
                const to = end.toISOString().split("T")[0];
                const sym = encodeURIComponent(activeTicker);
                const bench = encodeURIComponent(BENCHMARK);

                const settled = await Promise.allSettled([
                    fetch(`${BACKEND_URL}/getData/${sym}/${from}/${to}`),
                    fetch(`${BACKEND_URL}/alpaca/options/${sym}?limit=1000`),
                    fetch(`${BACKEND_URL}/market/overview/${sym}?feed=iex`),
                    fetch(`${BACKEND_URL}/getData/${bench}/${from}/${to}`),
                ]);
                if (cancelled) return;

                const [priceJson, optionsJson, contextJson, benchJson] = await Promise.all(settled.map(readJson));
                if (cancelled) return;

                const nextPrices = extractPriceArray(priceJson);
                if (nextPrices.length === 0) {
                    throw new Error(priceJson?.error || `No price data returned for ${activeTicker}.`);
                }

                const nextObi = extractOBI(contextJson?.quote);
                setPriceData(nextPrices);
                setVolumeBars(extractVolumeBars(priceJson));
                setMarketContext(contextJson);
                const optionRequest = settled[1];
                if (optionRequest.status === "rejected") {
                    setOptionsError(optionRequest.reason?.message || "Options data request failed.");
                    setOptionsData(null);
                } else if (!optionRequest.value.ok || !optionsJson?.options?.length) {
                    setOptionsError(
                        optionsJson?.error
                            || (optionRequest.value.ok
                                ? `No listed options were returned for ${activeTicker}.`
                                : `Options data unavailable (HTTP ${optionRequest.value.status}).`)
                    );
                    setOptionsData(null);
                } else {
                    setOptionsError(null);
                    setOptionsData(optionsJson);
                }
                setObi(Number.isFinite(nextObi) ? nextObi : 0);
                setObiAvailable(Number.isFinite(nextObi));
                setBenchPrices(activeTicker === BENCHMARK ? nextPrices : extractPriceArray(benchJson));
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Unable to load market data.");
                    setPriceData([]);
                    setVolumeBars([]);
                    setBenchPrices([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [activeTicker]);

    /* ----------------------------- DERIVED ----------------------------- */

    const series = useMemo(() => (priceData.length ? buildSeries(priceData) : null), [priceData]);

    const metrics = useMemo(
        () =>
            series
                ? buildMetrics({ prices: priceData, series, optionsData, obi, rfRate, benchPrices })
                : null,
        [series, priceData, optionsData, obi, rfRate, benchPrices]
    );

    const extras = useMemo(
        () => (series && priceData.length >= 30 ? extraIndicators(priceData, series.logReturns) : null),
        [series, priceData]
    );

    const levels = useMemo(
        () => (metrics && series ? buildLevels({ metrics, series, prices: priceData }) : null),
        [metrics, series, priceData]
    );

    const indicators = useMemo(
        () =>
            metrics && series && extras
                ? buildIndicators({ metrics, series, extras, obi, obiAvailable })
                : [],
        [metrics, series, extras, obi, obiAvailable]
    );

    const forecast = useMemo(
        () => (metrics && priceData.length >= 60 ? buildForecast({ metrics, prices: priceData, level: bandLevel }) : null),
        [metrics, priceData, bandLevel]
    );

    const verdict = useMemo(
        () =>
            metrics && forecast && levels && indicators.length
                ? buildVerdict({ metrics, indicators, forecast, levels })
                : null,
        [metrics, forecast, levels, indicators]
    );

    const tally = indicators.reduce((acc, it) => {
        acc[it.tone] = (acc[it.tone] || 0) + 1;
        return acc;
    }, {});

    useEffect(() => {
        if (metrics && Number.isFinite(metrics.currentPrice)) {
            setTargetPrice(Number((metrics.currentPrice * TARGET_MULTIPLIER).toFixed(2)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTicker, metrics?.currentPrice]);

    const ctx = useMemo(
        () => ({ price: metrics?.currentPrice, horizon, confidence: bandLevel }),
        [metrics, horizon, bandLevel]
    );

    const horizonStats = useMemo(() => {
        if (!metrics) return null;
        const T = horizon / TRADING_DAYS;
        const sigma = metrics.adaptedVol;
        const sd = zForLevel(bandLevel) * sigma * Math.sqrt(T);
        const median = metrics.currentPrice * Math.exp((metrics.adaptedDrift - 0.5 * sigma * sigma) * T);
        return { median, low: median * Math.exp(-sd), high: median * Math.exp(sd), sd };
    }, [metrics, horizon, bandLevel]);

    const optionRows = useMemo(
        () => buildOptionRows(optionsData?.options, metrics, horizon, rfRate),
        [optionsData, metrics, horizon, rfRate]
    );
    const optionChartRows = useMemo(
        () => optionRows
            .filter((option) => option.mark > 0 && Number.isFinite(option.predictedValue))
            .slice(0, 12)
            .map((option) => ({
                symbol: `${option.right === "C" ? "Call" : "Put"} ${money(option.strike)} · ${option.expiration}`,
                change: (option.predictedValue / option.mark - 1) * 100,
            })),
        [optionRows]
    );
    const optionAnalysisDate = new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const recentVolume = useMemo(() => volumeSummary(volumeBars), [volumeBars]);

    const selected = useMemo(() => probabilityFor(metrics, horizon, targetK), [metrics, horizon, targetK]);

    /* ------------------------ TARGET PROBABILITY CURVE ------------------------ */

    const curveData = useMemo(() => {
        if (!metrics) return [];
        const maxH = Math.max(horizon || 1, 360);
        const hs = [...new Set([...HORIZONS, horizon])].filter((h) => h > 0 && h <= maxH).sort((a, b) => a - b);
        return hs.map((h) => {
            const r = probabilityFor(metrics, h, targetK);
            return { horizon: h, terminal: r ? r.terminal * 100 : 0, touch: r ? r.touch * 100 : 0 };
        });
    }, [metrics, targetK, horizon]);

    const curveYMax = useMemo(() => {
        const maxVal = Math.max(0, ...curveData.map((d) => Math.max(d.terminal, d.touch)));
        return Math.min(100, Math.max(10, Math.ceil(maxVal / 10) * 10));
    }, [curveData]);

    /* ------------------------------ MODEL COMPARISON ------------------------------ */

    const comparisonHorizons = useMemo(
        () =>
            [...new Set([5, 20, 60, 120, 252, horizon])]
                .filter((h) => h > 0 && h <= MAX_HORIZON)
                .sort((a, b) => a - b),
        [horizon]
    );

    const comparison = useMemo(() => {
        if (!metrics || !hasTarget) return [];
        const S0 = metrics.currentPrice;
        const up = targetK >= S0;
        const pc = (x) => (x == null ? null : x * 100);

        return comparisonHorizons.map((h) => {
            const analytic = probabilityFor(metrics, h, targetK);
            const mc = simulateBootstrap({
                S0,
                K: targetK,
                up,
                h,
                sigma: metrics.adaptedVol,
                mu: metrics.adaptedDrift,
                zPool: metrics.zReturns,
            });
            const emp = empiricalProbability(priceData, h, S0, targetK, up);
            return {
                horizon: h,
                analyticT: pc(analytic?.terminal),
                analyticTouch: pc(analytic?.touch),
                mcT: pc(mc?.terminal),
                mcTouch: pc(mc?.touch),
                histT: pc(emp?.terminal),
                histTouch: pc(emp?.touch),
                histWindows: emp?.windows ?? 0,
            };
        });
    }, [metrics, hasTarget, targetK, comparisonHorizons, priceData]);

    const comparisonSelected = comparison.find((r) => r.horizon === horizon) ?? null;

    /* ------------------------------ SPECTRUM ------------------------------ */

    const spectrum = useMemo(() => {
        if (!metrics) return null;
        const current = metrics.currentPrice;
        const target = hasTarget ? targetK : current * TARGET_MULTIPLIER;
        const horizons = [...new Set([...HORIZONS, horizon])]
            .filter((h) => h > 0 && h <= MAX_HORIZON)
            .sort((a, b) => a - b);

        const low = Math.min(current * 0.75, target * 0.7);
        const high = Math.max(current * 1.25, target * 1.2);
        const rows = 18;
        const step = (high - low) / (rows - 1);
        const prices = Array.from({ length: rows }, (_, i) => high - i * step);

        const cells = new Map();
        horizons.forEach((h) => {
            prices.forEach((p, i) => {
                const r = probabilityFor(metrics, h, p);
                if (!r) return;
                const above = r.above * 100;
                const value = spectrumMode === "above" ? above : p >= current ? above : 100 - above;
                cells.set(`${i}-${h}`, value);
            });
        });

        const nearest = (x) =>
            prices.reduce((best, p, i) => (Math.abs(p - x) < Math.abs(prices[best] - x) ? i : best), 0);

        return {
            horizons,
            prices,
            cells,
            current,
            target,
            currentIndex: nearest(current),
            targetIndex: nearest(target),
        };
    }, [metrics, targetK, horizon, hasTarget, spectrumMode]);

    /* ------------------------------ TIME SERIES ------------------------------ */

    const windowN = Math.min(chartWindow, priceData.length);

    const windowData = useMemo(() => {
        if (!series || priceData.length === 0) return [];
        const start = priceData.length - windowN;
        const out = [];
        for (let i = start; i < priceData.length; i++) {
            const h = series.macd.hist[i];
            out.push({
                day: i - start + 1,
                price: priceData[i],
                sma20: series.sma20[i],
                sma50: series.sma50[i],
                sma200: series.sma200[i],
                bbUpper: series.bb.upper[i],
                bbLower: series.bb.lower[i],
                rsi: series.rsi[i],
                macd: series.macd.line[i],
                macdSignal: series.macd.signal[i],
                histPos: h != null && h > 0 ? h : 0,
                histNeg: h != null && h < 0 ? h : 0,
                drawdown: series.drawdown[i] * 100,
                rollVol: series.rollVol[i] != null ? series.rollVol[i] * 100 : null,
            });
        }
        return out;
    }, [series, priceData, windowN]);

    const relativeData = useMemo(() => {
        if (priceData.length < 5 || benchPrices.length < 5) return [];
        const n = Math.min(windowN, priceData.length, benchPrices.length);
        const a = priceData.slice(priceData.length - n);
        const b = benchPrices.slice(benchPrices.length - n);
        return a.map((p, i) => ({
            day: i + 1,
            stock: (p / a[0]) * 100,
            bench: (b[i] / b[0]) * 100,
        }));
    }, [priceData, benchPrices, windowN]);

    /* ------------------------------ DISTRIBUTION ------------------------------ */

    const histogram = useMemo(() => {
        if (!metrics) return [];
        const r = metrics.returns;
        const s = stdev(r);
        const m = mean(r);
        if (!(s > 0)) return [];
        const bins = 36;
        const lo = m - 4 * s;
        const hi = m + 4 * s;
        const width = (hi - lo) / bins;
        const counts = new Array(bins).fill(0);
        for (const x of r) {
            const idx = Math.floor((x - lo) / width);
            if (idx >= 0 && idx < bins) counts[idx] += 1;
        }
        return counts.map((count, i) => {
            const center = lo + (i + 0.5) * width;
            return {
                ret: Number((center * 100).toFixed(2)),
                count,
                normal: r.length * width * (normalPDF((center - m) / s) / s),
            };
        });
    }, [metrics]);

    /* ------------------------------ FORWARD FUNNEL ------------------------------ */

    const funnel = useMemo(() => {
        if (!metrics) return [];
        const days = clamp(horizon || 1, 1, MAX_HORIZON);
        const S0 = metrics.currentPrice;
        const sigma = metrics.adaptedVol;
        const mu = metrics.adaptedDrift;
        const bandZ = zForLevel(bandLevel);
        const nodes = [];
        for (let i = 1; i <= days; i++) {
            const t = i / TRADING_DAYS;
            const median = S0 * Math.exp((mu - 0.5 * sigma * sigma) * t);
            const halfBand = bandZ * sigma * Math.sqrt(t);
            const lower = median * Math.exp(-halfBand);
            const upper = median * Math.exp(halfBand);
            nodes.push({
                day: i,
                pLow: lower,
                pHigh: upper,
                median,
                bandBase: lower,
                bandWidth: upper - lower,
            });
        }
        return nodes;
    }, [metrics, horizon, bandLevel]);

    /* ------------------------------ LISTS ------------------------------ */

    const coreCards = metrics
        ? [
            ["price", "Current price", money(metrics.currentPrice), metrics.currentPrice],
            ["vol5", "5-day volatility", pct(metrics.vol5), metrics.vol5],
            ["baseline", "20-day volatility", pct(metrics.baselineVol), metrics.baselineVol],
            ["ewma", "EWMA volatility", pct(metrics.ewmaVol), metrics.ewmaVol],
            ["momentum", "Momentum", signed(metrics.momentum), metrics.momentum],
            ["trend", "Trend", signed(metrics.trend), metrics.trend],
            ["dirscore", "Directional score", signed(metrics.directionalScore), metrics.directionalScore],
            ["fvol", "Forecast volatility (annual)", pct(metrics.adaptedVol), metrics.adaptedVol],
        ]
        : [];
    const headlineCards = coreCards.filter(([id]) => ["price", "baseline", "fvol", "dirscore"].includes(id));
    const additionalCoreCards = coreCards.filter(([id]) => !["price", "baseline", "fvol", "dirscore"].includes(id));

    const riskItems = metrics
        ? [
            ["annret", "Annualized log return", pct(metrics.annualReturn, 1), metrics.annualReturn],
            ["cagr", "CAGR", pct(metrics.cagr, 1), metrics.cagr],
            ["realvol", "Realized volatility (annual)", pct(metrics.annualVol, 1), metrics.annualVol],
            ["sortino", "Sortino ratio", num(metrics.sortino), metrics.sortino],
            ["calmar", "Calmar ratio", num(metrics.calmar), metrics.calmar],
            ["maxdd", "Maximum drawdown", pct(metrics.maxDrawdown, 1), metrics.maxDrawdown, "bear"],
            ["curdd", "Current drawdown", pct(metrics.currentDrawdown, 1), metrics.currentDrawdown],
            ["var95", "1-day VaR (95%)", pct(metrics.var95, 2), metrics.var95],
            ["var99", "1-day VaR (99%)", pct(metrics.var99, 2), metrics.var99],
            ["cvar95", "Expected shortfall (CVaR 95%)", pct(metrics.cvar95, 2), metrics.cvar95],
            ["skew", "Skewness", num(metrics.skew), metrics.skew],
            ["kurt", "Excess kurtosis", num(metrics.kurt), metrics.kurt],
            ["updays", "Up days", pct(metrics.winRate, 1), metrics.winRate],
            ["best", "Best day", movePct(metrics.bestDay, 2), metrics.bestDay, "bull"],
            ["worst", "Worst day", movePct(metrics.worstDay, 2), metrics.worstDay, "bear"],
            ["ac1", "Lag-1 autocorrelation", num(metrics.ac1, 3), metrics.ac1],
            ["vr20", "Variance ratio VR(20)", num(metrics.vr20), metrics.vr20],
        ]
        : [];

    const perfItems = metrics
        ? [
            ["1 week", metrics.perf.w1],
            ["1 month", metrics.perf.m1],
            ["3 months", metrics.perf.m3],
            ["6 months", metrics.perf.m6],
            ["1 year", metrics.perf.y1],
            ["Full window", metrics.perf.all],
        ]
        : [];

    const modelRows = forecast
        ? [
            { id: "ar", label: "AR(5)", path: forecast.arPath },
            { id: "holt", label: "Damped trend", path: forecast.holtPath },
            { id: "gbm", label: "GBM", path: forecast.gbmPath },
            { id: "ens", label: "Consensus", path: forecast.ensPath },
        ]
        : [];

    const newsTone = useMemo(() => newsToneOf(news), [news]);

    const ruleText = useMemo(
        () =>
            metrics && forecast && verdict
                ? buildRuleNarrative({
                    ticker: activeTicker,
                    metrics,
                    forecast,
                    verdict,
                    selected,
                    horizon,
                    targetK,
                    hasTarget,
                })
                : "Commentary appears once the market data has loaded.",
        [metrics, forecast, verdict, selected, horizon, targetK, hasTarget, activeTicker]
    );

    const aiContext = useMemo(() => {
        if (!metrics || !forecast || !verdict) return null;
        return {
            ticker: activeTicker,
            price: metrics.currentPrice,
            horizonDays: horizon,
            target: hasTarget ? targetK : null,
            targetChance: { terminal: selected?.terminal ?? null, touch: selected?.touch ?? null },
            forecast30: {
                consensus: forecast.ens30,
                confidenceRange: [forecast.gbmLow30, forecast.gbmHigh30],
                bandLevel: forecast.level,
                chanceAbove: forecast.chanceUp,
                modelDisagreement: forecast.spread,
                models: {
                    ar: forecast.arPath[FORECAST_DAYS - 1] ?? null,
                    dampedTrend: forecast.holtPath[FORECAST_DAYS - 1],
                    gbm: forecast.gbmPath[FORECAST_DAYS - 1],
                },
            },
            verdict: { label: verdict.label, score: verdict.score, action: verdict.action },
            indicators: indicators.map((i) => ({ name: i.label, reading: i.value, tone: TONE_WORD[i.tone] })),
            risk: {
                sharpe: metrics.sharpe,
                maxDrawdown: metrics.maxDrawdown,
                currentDrawdown: metrics.currentDrawdown,
                var95: metrics.var95,
                expectedShortfall95: metrics.cvar95,
                beta: metrics.beta,
                annualVol: metrics.annualVol,
            },
            headlines: news.slice(0, 6).map((n) => ({ headline: n.headline, created: n.created_at })),
        };
    }, [metrics, forecast, verdict, activeTicker, horizon, hasTarget, targetK, selected, indicators, news]);

    const stockChatContext = useMemo(() => {
        if (!aiContext) return null;
        return {
            capturedAt: new Date().toISOString(),
            company: companyName,
            dashboard: aiContext,
            dashboardMetrics: metrics,
            forecastPaths: forecast ? {
                ar: forecast.arPath,
                dampedTrend: forecast.holtPath,
                gbm: forecast.gbmPath,
                consensus: forecast.ensPath,
            } : null,
            settings: {
                historicalWindowSessions: chartWindow,
                forecastHorizonSessions: horizon,
                targetPrice: hasTarget ? targetK : null,
                forecastBand: bandLevel,
            },
            recentPriceHistory: priceData.slice(-chartWindow).map((close, index) => ({
                session: Math.max(1, priceData.length - chartWindow + index + 1),
                close,
            })),
            benchmark: {
                ticker: BENCHMARK,
                recentCloses: benchPrices.slice(-chartWindow),
            },
            relatedInfo: news.slice(0, 8).map((item) => {
                const key = item.url || item.headline;
                const briefing = articleAI[key];
                return {
                    headline: item.headline,
                    source: item.source,
                    published: item.created_at,
                    summary: item.summary,
                    url: item.url,
                    aiBriefing: briefing?.status === "done" ? briefing.text : null,
                    relatedCoverage: briefing?.status === "done" ? briefing.sources : [],
                };
            }),
        };
    }, [
        aiContext, companyName, metrics, forecast, chartWindow, horizon, hasTarget, targetK,
        bandLevel, priceData, benchPrices, news, articleAI,
    ]);
    // Writes the commentary from every number on the page, the news, and any article briefings
    const generateCommentary = async () => {
        if (!aiContext) return;
        setAiLoading(true);
        setAiError(null);
        try {
            const articles = news.slice(0, 8).map((n) => {
                const b = articleAI[n.url || n.headline];
                return {
                    headline: n.headline,
                    source: n.source,
                    date: n.created_at,
                    summary: n.summary,
                    briefing: b?.status === "done" ? b.text : null,
                };
            });
            const res = await fetch(`${BACKEND_URL}/ai-forecast-commentary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker: activeTicker,
                    company: companyName,
                    dataText: contextAsText(aiContext),
                    articles,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.reply) {
                throw new Error(json.error || `Backend answered with HTTP ${res.status}`);
            }
            setAiText(json.reply);
            setAiSource("ai");
        } catch (err) {
            setAiError(err.message);
        } finally {
            setAiLoading(false);
        }
    };

    // Clear the previous ticker's commentary when the ticker changes
    useEffect(() => {
        setAiText(null);
        setAiSource("idle");
        setAiError(null);
    }, [activeTicker]);
    /* ================================================================== */
    /* RENDER                                                              */
    /* ================================================================== */

    // Runs the AI briefing for one story, with the dashboard's numbers attached
    const runArticleAI = async (item) => {
        const key = item.url || item.headline;
        setArticleAI((prev) => ({ ...prev, [key]: { status: "loading" } }));

        const snapshot = aiContext
            ? `Stock context from this dashboard for ${activeTicker}: price ${money(aiContext.price)}, setup read "${aiContext.verdict.label}", 30-session consensus ${money(aiContext.forecast30.consensus)} with a ${aiContext.forecast30.bandLevel}% range of ${money(aiContext.forecast30.confidenceRange[0])} to ${money(aiContext.forecast30.confidenceRange[1])}, chance of finishing above today ${pct(aiContext.forecast30.chanceAbove, 0)}, beta ${num(aiContext.risk.beta)}, maximum drawdown ${pct(aiContext.risk.maxDrawdown, 1)}.`
            : `Stock context: ${activeTicker}.`;

        try {
            const res = await fetch(`${BACKEND_URL}/ai-analyze-article`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: item.url || "",
                    title: item.headline || "",
                    abstract: `${item.summary || ""}\n\n${snapshot}`,
                    section: "Business",
                    byline: item.source || "",
                    published: item.created_at || "",
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.reply) throw new Error(json.error || `HTTP ${res.status}`);
            setArticleAI((prev) => ({
                ...prev,
                [key]: {
                    status: "done",
                    text: json.reply,
                    sources: json.related_sources || [],
                    fullBody: json.fetched_full_body,
                },
            }));
        } catch (err) {
            setArticleAI((prev) => ({ ...prev, [key]: { status: "error", message: err.message } }));
        }
    };

    const commentary = aiSource === "ai" && aiText ? aiText : ruleText;

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100vh",
                padding: "40px 28px 64px",
                background: PAPER,
                boxSizing: "border-box",
                fontFamily: SANS,
                color: INK,
                textAlign: "left",
            }}
        >
            <style>{GLOBAL_CSS}</style>

            <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexDirection: "column" }}>
                {/* HEADER */}
                <header
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        flexWrap: "wrap",
                        gap: 16,
                        marginBottom: 28,
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: MUTED }}>Market forecast</div>
                        <h1
                            style={{
                                margin: "4px 0 0",
                                fontFamily: SERIF,
                                fontWeight: 500,
                                fontSize: 44,
                                letterSpacing: "-0.02em",
                                lineHeight: 1.1,
                            }}
                        >
                            {companyName}
                        </h1>
                        <div style={{ fontSize: 15, color: MUTED, marginTop: 8 }}>
                            {metrics ? (
                                <>
                                    <strong style={{ color: INK, fontWeight: 600 }}>{activeTicker}</strong> at{" "}
                                    {money(metrics.currentPrice)},{" "}
                                    <span
                                        style={{
                                            color: dayChange == null ? MUTED : dayChange >= 0 ? TONE.bull : TONE.bear,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {movePct(dayChange)}
                                    </span>{" "}
                                    from the last close and {movePct(metrics.perf.y1)} over the past year.
                                </>
                            ) : (
                                "Loading market data"
                            )}
                        </div>
                    </div>
                    {verdict && <Pill tone={verdict.tone}>{verdict.label}</Pill>}
                </header>
                {/* CONTROLS */}
                <Card style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", padding: 20 }}>
                    <Field label="Category" minWidth={160}>
                        <select
                            value={currentCategory}
                            onChange={(e) => {
                                setCategoryOverride(e.target.value);
                                setTicker(MARKET_CATEGORIES[e.target.value].items[0].symbol);
                            }}
                            style={inputStyle}
                        >
                            {Object.entries(MARKET_CATEGORIES).map(([key, cat]) => (
                                <option key={key} value={key}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Instrument" minWidth={260}>
                        <select value={ticker} onChange={(e) => setTicker(e.target.value)} style={inputStyle}>
                            {groupedItems.map(([group, items]) => (
                                <optgroup key={group} label={group}>
                                    {items.map((item) => (
                                        <option key={item.symbol} value={item.symbol}>
                                            {item.display ?? item.symbol} — {item.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </Field>
                    <Field label="Custom ticker">
                        <input
                            value={customTicker}
                            onChange={(e) => setCustomTicker(e.target.value)}
                            placeholder="e.g. AMD"
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="Target price">
                        <input
                            type="number"
                            value={targetPrice ?? ""}
                            onChange={(e) => setTargetPrice(e.target.value === "" ? null : Number(e.target.value))}
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="Horizon (days)">
                        <input
                            type="number"
                            min="1"
                            max={MAX_HORIZON}
                            value={targetDay}
                            onChange={(e) => setTargetDay(clamp(Number(e.target.value) || 1, 1, MAX_HORIZON))}
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="Risk-free baseline (%)">
                        <input
                            type="number"
                            min="-10"
                            max="25"
                            step="0.1"
                            value={rfPercent}
                            onChange={(e) => setRfPercent(clamp(Number(e.target.value) || 0, -10, 25))}
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="Chart window">
                        <select
                            value={chartWindow}
                            onChange={(e) => setChartWindow(Number(e.target.value))}
                            style={inputStyle}
                        >
                            {WINDOW_OPTIONS.map((w) => (
                                <option key={w} value={w}>
                                    {w === 730 ? "2 years" : `${w} days`}
                                </option>
                            ))}
                        </select>
                    </Field>
                </Card>

                {marketContext && (
                    <Card>
                        <SectionHeader
                            title="Market context"
                            subtitle="Company size, current session activity, and top-of-book liquidity from Polygon and Alpaca."
                            right={
                                marketContext.available
                                    ? <Pill tone="bull">Live data returned</Pill>
                                    : <Pill tone="warn">Provider data unavailable</Pill>
                            }
                        />
                        <div style={grid(150)}>
                            {[
                                ["Market capitalization", compactMoney(marketContext.company?.marketCap)],
                                ["Session volume", compactNumber(marketContext.session?.volume)],
                                ["Session trades", compactNumber(marketContext.session?.tradeCount)],
                                ["Top-book imbalance", marketContext.quote?.obi != null && Number.isFinite(Number(marketContext.quote.obi))
                                    ? signed(Number(marketContext.quote.obi), 3)
                                    : "Unavailable"],
                            ].map(([label, value]) => (
                                <div key={label} style={{ ...panelStyle, padding: "12px 14px" }}>
                                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 7 }}>{label}</div>
                                    <div style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                                </div>
                            ))}
                        </div>
                        <details style={{ marginTop: 12 }}>
                            <summary style={{ cursor: "pointer", color: MUTED, fontSize: 12 }}>
                                More liquidity and volume breakdown
                            </summary>
                            <div style={{ ...grid(170), marginTop: 10 }}>
                                {[
                                    ["Session VWAP", money(marketContext.session?.vwap)],
                                    ["Bid size", compactNumber(marketContext.quote?.bidSize)],
                                    ["Ask size", compactNumber(marketContext.quote?.askSize)],
                                    ["Shares outstanding", compactNumber(marketContext.company?.sharesOutstanding)],
                                    ["Up-candle volume · 30 sessions", recentVolume.count ? compactNumber(recentVolume.up) : "Unavailable"],
                                    ["Down-candle volume · 30 sessions", recentVolume.count ? compactNumber(recentVolume.down) : "Unavailable"],
                                    ["Total volume · 30 sessions", recentVolume.count ? compactNumber(recentVolume.total) : "Unavailable"],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ padding: "8px 4px", color: MUTED, fontSize: 12 }}>
                                        <span>{label}: </span><strong style={{ color: INK }}>{value}</strong>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 5, color: MUTED, fontSize: 11, lineHeight: 1.5 }}>
                                Up/down candle volume groups share volume by whether each daily candle closed above or below its open; it is not exchange-classified buyer/seller-initiated volume. Bid/ask sizes are current top-of-book liquidity.
                            </div>
                        </details>
                        {Object.entries(marketContext.errors ?? {}).length > 0 && (
                            <div style={{ marginTop: 10, color: MUTED, fontSize: 11, lineHeight: 1.5 }}>
                                {Object.entries(marketContext.errors).map(([source, message]) => (
                                    <div key={source}><strong>{source}:</strong> {message}</div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {loading && (
                    <div
                        style={{
                            marginBottom: 20,
                            padding: "12px 16px",
                            background: "#fff",
                            border: `1px solid ${LINE}`,
                            borderRadius: 12,
                            color: MUTED,
                            fontSize: 14,
                        }}
                    >
                        Fetching market data for <strong style={{ color: INK }}>{activeTicker}</strong>…
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            marginBottom: 20,
                            padding: "12px 16px",
                            background: "#fff",
                            border: "1px solid #f1cfc9",
                            borderRadius: 12,
                            color: TONE.bear,
                            fontSize: 14,
                        }}
                    >
                        {error}
                    </div>
                )}

                <div style={{ order: 999, width: "100%" }}>
                    {optionsError && (
                        <div
                            role="status"
                            style={{
                                marginBottom: 20,
                                padding: "10px 14px",
                                background: "#fff",
                                border: `1px solid ${LINE}`,
                                borderRadius: 12,
                                color: MUTED,
                                fontSize: 12,
                            }}
                        >
                            Options chain: {optionsError}
                        </div>
                    )}

                    {optionsData?.options?.length > 0 && optionRows.length === 0 && (
                        <div role="status" style={{ marginBottom: 20, color: MUTED, fontSize: 12 }}>
                            The provider returned option snapshots, but their symbols could not be decoded as standard listed contracts.
                        </div>
                    )}

                    {optionRows.length > 0 && (
                        <Card style={{ marginBottom: 20 }}>
                            <SectionHeader
                                title={`Options: calls, puts, expiry and scenario value — ${activeTicker}`}
                                subtitle={`Nearest-to-the-money listed contracts. Analysis date: ${optionAnalysisDate}. The model value is an estimated option price at day ${horizon}, using the stock's forecast median and Black–Scholes (no dividends or early exercise).`}
                                right={<Pill tone="neutral">{optionsData.count ?? optionsData.options.length} contracts</Pill>}
                            />
                            <p style={{ margin: "0 0 12px", color: MUTED, fontSize: 12, lineHeight: 1.55 }}>
                                CALL = right to buy at the strike; PUT = right to sell. The chart compares each contract's latest available mark with its modeled value at the selected horizon; this is a scenario estimate, not personal position performance. If provider IV/Greeks are missing, the model estimates IV from the quote or falls back to forecast volatility.
                            </p>
                            {optionChartRows.length > 0 ? (
                                <div style={{ marginBottom: 18 }}>
                                    <SectionHeader
                                        title="Estimated option value change"
                                        subtitle={`Modeled percent change from each contract's latest mark to day ${horizon}.`}
                                    />
                                    <ChartBox height={Math.max(190, optionChartRows.length * 30 + 56)}>
                                        <BarChart
                                            data={optionChartRows}
                                            layout="vertical"
                                            margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                                        >
                                            <CartesianGrid strokeDasharray="2 4" stroke={LINE} horizontal={false} />
                                            <XAxis
                                                type="number"
                                                tick={{ fontSize: 10, fill: MUTED }}
                                                tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="symbol"
                                                width={150}
                                                tick={{ fontSize: 10, fill: MUTED }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <ReferenceLine x={0} stroke={FAINT} />
                                            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Modeled change"]} />
                                            <Bar dataKey="change" name="Modeled change" radius={[0, 4, 4, 0]}>
                                                {optionChartRows.map((row) => (
                                                    <Cell key={row.symbol} fill={row.change >= 0 ? TONE.bull : TONE.bear} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ChartBox>
                                </div>
                            ) : (
                                <div role="status" style={{ marginBottom: 14, color: MUTED, fontSize: 12 }}>
                                    Current option marks are unavailable, so a meaningful modeled-change chart cannot be shown.
                                </div>
                            )}
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 850 }}>
                                    <thead>
                                        <tr>
                                            {["Option / strike", "Expiration", "Last trade", "Bid / ask", "IV / delta", `Model value · day ${horizon}`].map((label) => (
                                                <th key={label} style={{ padding: "9px 10px", borderBottom: `1px solid ${LINE}`, color: MUTED, textAlign: "left", whiteSpace: "nowrap" }}>
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {optionRows.map((option) => {
                                            const formatOptionValue = (value) =>
                                                value == null || !Number.isFinite(Number(value)) ? "—" : `$${Number(value).toFixed(2)}`;
                                            const tradeTime = Date.parse(option.tradeTimestamp);
                                            const predictedChange = option.mark > 0 ? option.predictedValue / option.mark - 1 : null;
                                            return (
                                                <tr key={option.symbol} style={{ borderBottom: `1px solid ${LINE}` }}>
                                                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                                                        <div style={{ color: option.right === "C" ? TONE.bull : TONE.bear, fontWeight: 700 }}>
                                                            {option.type.toUpperCase()} · {money(option.strike)}
                                                        </div>
                                                        <div style={{ marginTop: 3, color: MUTED, fontSize: 10 }}>{option.symbol}</div>
                                                    </td>
                                                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                                                        {option.expiration}<div style={{ marginTop: 3, color: MUTED }}>{option.daysToExpiry} calendar days left</div>
                                                    </td>
                                                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                                                        {formatOptionValue(option.trade?.price)}
                                                        <div style={{ marginTop: 3, color: MUTED, fontSize: 10 }}>
                                                            {Number.isFinite(tradeTime) ? new Date(tradeTime).toLocaleString() : "Trade time unavailable"}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                                                        {formatOptionValue(option.quote?.bidPrice)} / {formatOptionValue(option.quote?.askPrice)}
                                                    </td>
                                                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                                                        {option.marketIv == null ? "—" : `${(option.marketIv * 100).toFixed(1)}%`}
                                                        <div style={{ marginTop: 3, color: MUTED }}>Δ {Number.isFinite(Number(option.greeks?.delta)) ? Number(option.greeks.delta).toFixed(2) : "—"}</div>
                                                    </td>
                                                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                                                        <strong>{formatOptionValue(option.predictedValue)}</strong>
                                                        <div style={{ marginTop: 3, color: predictedChange == null ? MUTED : predictedChange >= 0 ? TONE.bull : TONE.bear }}>
                                                            {movePct(predictedChange)} vs current mark
                                                        </div>
                                                        <div style={{ marginTop: 3, color: MUTED, fontSize: 10 }}>{option.volatilitySource}</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>

                {/* SETUP READ + COMMENTARY */}
                {verdict && levels && (
                    <div style={{ ...grid(440), marginBottom: 20 }}>
                        <Card style={{ marginBottom: 0 }}>
                            <SectionHeader

                                title="Setup read"
                                subtitle="The shaded band is the chosen confidence range. "
                                right={
                                    <Segmented
                                        options={BAND_LEVELS.map((p) => [p, `${p}%`])}
                                        value={bandLevel}
                                        onChange={setBandLevel}
                                    />
                                }
                            />
                            <p
                                style={{
                                    fontFamily: SERIF,
                                    fontSize: 21,
                                    lineHeight: 1.45,
                                    margin: "0 0 22px",
                                    color: INK,
                                }}
                            >
                                {verdict.action}
                            </p>

                            <div style={{ position: "relative", height: 6, background: LINE, borderRadius: 3 }}>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: -4,
                                        width: 1,
                                        height: 14,
                                        background: FAINT,
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        left: `${((clamp(verdict.score, -1, 1) + 1) / 2) * 100}%`,
                                        top: -5,
                                        width: 16,
                                        height: 16,
                                        borderRadius: "50%",
                                        background: TONE[verdict.tone],
                                        border: "3px solid #fff",
                                        boxShadow: SHADOW,
                                        transform: "translateX(-50%)",
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 11,
                                    color: FAINT,
                                    marginTop: 8,
                                }}
                            >
                                <span>Bearish</span>
                                <span>Neutral</span>
                                <span>Bullish</span>
                            </div>

                            <div style={{ ...grid(140), marginTop: 20 }}>
                                <Metric id="support" value={money(levels.support)} raw={levels.support} ctx={ctx} />
                                <Metric id="resistance" value={money(levels.resistance)} raw={levels.resistance} ctx={ctx} />
                                <Metric id="high52" value={money(levels.high52)} raw={levels.high52} ctx={ctx} />
                                <Metric id="invalid" value={money(levels.invalid)} raw={levels.invalid} ctx={ctx} />
                            </div>

                            <div style={{ fontSize: 13, color: MUTED, marginTop: 18, lineHeight: 1.6 }}>
                                Technical tally: {verdict.bull} bullish, {verdict.bear} bearish, {verdict.warn} to
                                watch. Forecast tilt: {movePct(verdict.forecastMove)} by day 30.
                            </div>
                        </Card>
                        <Card style={{ marginBottom: 0 }}>
                            <SectionHeader
                                title="Commentary"
                                subtitle="One read that weighs the price data, the forecast, the indicators, and every headline and briefing on this page."
                                right={
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <Pill tone={aiLoading ? "warn" : aiSource === "ai" ? "bull" : "neutral"}>
                                            {aiLoading ? "Writing" : aiSource === "ai" ? "AI generated" : "Rule-based"}
                                        </Pill>
                                        <button onClick={generateCommentary} disabled={aiLoading || !aiContext} style={ghostBtn}>
                                            {aiLoading ? "Writing…" : aiSource === "ai" ? "Regenerate" : "Generate with AI"}
                                        </button>
                                    </div>
                                }
                            />
                            {commentary.split("\n\n").map((para, i) => (
                                <p key={i} style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.75, color: "#2c2f36" }}>
                                    {para}
                                </p>
                            ))}
                            {aiError && (
                                <div style={{ fontSize: 12, color: TONE.bear, marginTop: 8 }}>AI commentary failed: {aiError}</div>
                            )}
                            {aiSource !== "ai" && !aiLoading && (
                                <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                                    Showing the rule-based summary. Press Generate with AI to write from all the data and headlines.
                                </div>
                            )}
                        </Card>
                        {/* <Card style={{ marginBottom: 0 }}>
                            <SectionHeader
                                title="Commentary"
                                subtitle="Written from the indicators, forecast and headlines on this page."
                                right={
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <Pill tone={aiSource === "ai" ? "bull" : "neutral"}>
                                            {aiSource === "ai" ? "AI generated" : "Rule-based"}
                                        </Pill>
                                        <button onClick={() => setAiNonce((n) => n + 1)} style={ghostBtn}>
                                            {aiLoading ? "Writing…" : "Regenerate"}
                                        </button>
                                    </div>
                                }
                            />
                            {commentary.split("\n\n").map((para, i) => (
                                <p key={i} style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.75, color: "#2c2f36" }}>
                                    {para}
                                </p>
                            ))}
                            {aiSource === "fallback" && (
                                <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                                    The AI route isn't reachable, so this is a rule-based summary. Check that /ai-interpret is running
                                    on the backend, then press Regenerate.
                                </div>
                            )}
                        </Card> */}
                    </div>
                )}

                {/* NEWS */}
                {/* NEWS */}
                <Card>
                    <SectionHeader
                        title="News"
                        subtitle={`New York Times headlines that mention ${activeTicker}. Press Analyze on a story for an AI briefing that also weighs this stock's numbers.`}
                        right={news.length ? <Pill tone={newsTone.tone}>{newsTone.label}</Pill> : null}
                    />
                    {newsError && <div style={{ fontSize: 13, color: MUTED }}>{newsError}</div>}
                    {!newsError && news.length === 0 && (
                        <div style={{ fontSize: 13, color: MUTED }}>No recent headlines mention {activeTicker} in the feeds.</div>
                    )}
                    {news.slice(0, 8).map((n, i) => {
                        const key = n.url || n.headline;
                        const ai = articleAI[key];
                        return (
                            <div key={key} style={{ padding: "16px 0", borderTop: i ? `1px solid ${LINE}` : "none" }}>
                                <a href={n.url} target="_blank" rel="noreferrer" style={{ color: INK, textDecoration: "none" }}>
                                    <div style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.35 }}>{n.headline}</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 5, fontSize: 12, color: FAINT }}>
                                        <span>{n.source}</span>
                                        <span>{timeAgo(n.created_at)}</span>
                                    </div>
                                    {n.summary && (
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: MUTED,
                                                marginTop: 6,
                                                lineHeight: 1.55,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {n.summary}
                                        </div>
                                    )}
                                </a>

                                <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                                    <button onClick={() => runArticleAI(n)} disabled={ai?.status === "loading"} style={ghostBtn}>
                                        {ai?.status === "loading" ? "Analyzing…" : ai?.status === "done" ? "Run again" : "Analyze with AI"}
                                    </button>
                                    {ai?.status === "error" && <span style={{ fontSize: 12, color: TONE.bear }}>{ai.message}</span>}
                                </div>

                                {ai?.status === "done" && (
                                    <div style={{ marginTop: 14, padding: 20, background: PAPER, borderRadius: 14, border: `1px solid ${LINE}` }}>
                                        <Briefing text={ai.text} />
                                        {ai.sources?.length > 0 && (
                                            <div style={{ marginTop: 14, fontSize: 12, color: MUTED }}>
                                                Related coverage:{" "}
                                                {ai.sources.map((s, j) => (
                                                    <span key={j}>
                                                        {j > 0 && "; "}
                                                        <a href={s.link} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>
                                                            {s.source}
                                                        </a>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {!ai.fullBody && (
                                            <div style={{ marginTop: 8, fontSize: 12, color: MUTED }}>
                                                The full article wasn't retrievable (likely paywalled), so this uses the headline, summary and stock numbers.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </Card>

                {stockChatContext && (
                    <AIChatPanel
                        title={`Ask AI about ${activeTicker}`}
                        description="Explore the forecast, displayed indicators, risks, related headlines and any AI article briefings. A JSON data sheet of this snapshot is available to download."
                        contextType="forecast"
                        context={stockChatContext}
                        contextKey={`${activeTicker}:${chartWindow}:${horizon}:${targetK}:${bandLevel}`}
                        downloadName={`${activeTicker.toLowerCase()}-forecast-data.json`}
                        side="right"
                    />
                )}

                {/* INDICATORS */}
                {indicators.length > 0 && (
                    <Card>
                        <details>
                            <summary style={{ cursor: "pointer", fontWeight: 600, color: INK, fontSize: 15 }}>
                                All technical indicators ({indicators.length}) · {tally.bull || 0} bullish, {tally.bear || 0} bearish, {tally.warn || 0} to watch
                            </summary>
                            <p style={{ margin: "12px 0 16px", color: MUTED, fontSize: 12, lineHeight: 1.6 }}>
                                Hover a name to see how the figure is built and its reading to see what it implies. Indicators describe the current state; they are not trade signals.
                            </p>
                            <div style={grid(200)}>
                                {indicators.map((it) => (
                                    <Metric
                                        key={it.id}
                                        id={it.id}
                                        label={it.label}
                                        value={it.value}
                                        raw={it.raw}
                                        ctx={ctx}
                                        tone={it.tone}
                                        sub={TONE_WORD[it.tone]}
                                        accent
                                    />
                                ))}
                            </div>
                        </details>
                    </Card>
                )}

                {/* CORE METRICS */}
                {metrics && (
                    <div className="forecast-overview-grid">
                        <div>
                            <div style={{ ...grid(180), marginBottom: 12 }}>
                                {headlineCards.map(([id, label, value, raw]) => (
                                    <Metric key={id} id={id} label={label} value={value} raw={raw} ctx={ctx} />
                                ))}
                            </div>
                            {windowData.length > 0 && (
                                <Card>
                                    <SectionHeader
                                        title="MACD (12, 26, 9)"
                                        subtitle="A positive histogram means MACD sits above its signal line."
                                    />
                                    <ChartBox height={240}>
                                        <ComposedChart data={windowData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: LINE }} />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: MUTED }}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v) => Number(v).toFixed(1)}
                                            />
                                            <Tooltip formatter={(v, name) => [Number(v).toFixed(3), name]} labelFormatter={(v) => `Day ${v}`} />
                                            <Legend wrapperStyle={{ fontSize: 12 }} />
                                            <ReferenceLine y={0} stroke={FAINT} />
                                            <Bar dataKey="histPos" name="Histogram +" stackId="hist" fill="#9fd3b8" />
                                            <Bar dataKey="histNeg" name="Histogram −" stackId="hist" fill="#e6aaa3" />
                                            <Line type="monotone" dataKey="macd" name="MACD" stroke={ACCENT} strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="macdSignal" name="Signal" stroke="#c28a2c" strokeWidth={1.5} dot={false} />
                                        </ComposedChart>
                                    </ChartBox>
                                </Card>
                            )}
                        </div>
                        {windowData.length > 0 && (
                            <div style={{ display: "grid", gap: 12, alignContent: "start", minWidth: 0 }}>
                                <Card style={{ padding: 16, marginBottom: 0 }}>
                                    <SectionHeader title="RSI (14)" subtitle="Above 70 is overbought; below 30 is oversold." />
                                    <ChartBox height={130}>
                                        <LineChart data={windowData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                            <XAxis dataKey="day" tick={{ fontSize: 9, fill: MUTED }} tickLine={false} axisLine={{ stroke: LINE }} />
                                            <YAxis domain={[0, 100]} ticks={[30, 70]} tick={{ fontSize: 9, fill: MUTED }} tickLine={false} axisLine={false} />
                                            <Tooltip formatter={(v) => Number(v).toFixed(1)} labelFormatter={(v) => `Day ${v}`} />
                                            <ReferenceLine y={70} stroke={TONE.bear} strokeDasharray="4 4" />
                                            <ReferenceLine y={30} stroke={TONE.bull} strokeDasharray="4 4" />
                                            <Line type="monotone" dataKey="rsi" name="RSI" stroke="#7b61c4" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ChartBox>
                                </Card>
                                <Card style={{ padding: 16, marginBottom: 0 }}>
                                    <SectionHeader title="Drawdown" subtitle="Distance below the previous peak." />
                                    <ChartBox height={130}>
                                        <AreaChart data={windowData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                            <XAxis dataKey="day" tick={{ fontSize: 9, fill: MUTED }} tickLine={false} axisLine={{ stroke: LINE }} />
                                            <YAxis tick={{ fontSize: 9, fill: MUTED }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />
                                            <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} labelFormatter={(v) => `Day ${v}`} />
                                            <Area type="monotone" dataKey="drawdown" name="Drawdown" stroke={TONE.bear} fill="#f5dcd8" strokeWidth={1.8} />
                                        </AreaChart>
                                    </ChartBox>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {/* TARGET RESULTS */}
                {metrics && selected && horizonStats && (
                    <>
                    <div style={{ ...grid(200), marginBottom: 12 }}>
                        <Metric
                            id="target"
                            big
                            label="Target"
                            value={hasTarget ? money(targetK) : "—"}
                            raw={targetK}
                            ctx={ctx}
                            sub={`Day ${horizon}`}
                        />
                        <Metric
                            id="terminal"
                            big
                            label="Terminal probability"
                            value={pct(selected.terminal, 1)}
                            raw={selected.terminal}
                            ctx={ctx}
                        />
                        <Metric
                            id="median"
                            big
                            label="Median at horizon"
                            value={money(horizonStats.median)}
                            raw={horizonStats.median}
                            ctx={ctx}
                        />
                    </div>
                    <Card>
                        <details>
                            <summary style={{ cursor: "pointer", fontWeight: 600, color: INK, fontSize: 14 }}>
                                More target probabilities and confidence range
                            </summary>
                            <div style={{ ...grid(200), marginTop: 14 }}>
                                <Metric id="touch" big label="Touch probability" value={pct(selected.touch, 1)} raw={selected.touch} ctx={ctx} />
                                <Metric id="reqz" big label="Required z-score" value={num(selected.requiredZ, 3)} raw={selected.requiredZ} ctx={ctx} />
                                <Metric
                                    id="tmove"
                                    big
                                    label="Target move"
                                    value={hasTarget ? movePct(targetK / metrics.currentPrice - 1) : "—"}
                                    raw={hasTarget ? targetK / metrics.currentPrice - 1 : null}
                                    ctx={ctx}
                                />
                                <Metric
                                    id="band"
                                    big
                                    label={`${bandLevel}% range at horizon`}
                                    value={`${money(horizonStats.low)} – ${money(horizonStats.high)}`}
                                    raw={horizonStats.sd}
                                    ctx={ctx}
                                    sub={`±${pct(horizonStats.sd, 1)} expected move`}
                                />
                            </div>
                        </details>
                    </Card>
                    </>
                )}

                {/* PRICE & MOVING AVERAGES */}
                {windowData.length > 0 && (
                    <Card>
                        <SectionHeader
                            title="Price and moving averages"
                            subtitle="Closing prices with 20, 50 and 200-day averages and 2σ Bollinger Bands."
                        />
                        <ChartBox height={380}>
                            <LineChart data={windowData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: LINE }} />
                                <YAxis
                                    domain={["auto", "auto"]}
                                    tick={{ fontSize: 11, fill: MUTED }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                                />
                                <Tooltip formatter={(v, name) => [money(Number(v)), name]} labelFormatter={(v) => `Day ${v}`} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="bbUpper" name="Bollinger upper" stroke="#b9bdc4" strokeDasharray="4 4" strokeWidth={1} dot={false} />
                                <Line type="monotone" dataKey="bbLower" name="Bollinger lower" stroke="#b9bdc4" strokeDasharray="4 4" strokeWidth={1} dot={false} />
                                <Line type="monotone" dataKey="sma20" name="SMA 20" stroke="#c28a2c" strokeWidth={1.5} dot={false} />
                                <Line type="monotone" dataKey="sma50" name="SMA 50" stroke="#7b61c4" strokeWidth={1.5} dot={false} />
                                <Line type="monotone" dataKey="sma200" name="SMA 200" stroke="#2f7d6b" strokeWidth={1.5} dot={false} />
                                <Line type="monotone" dataKey="price" name="Close" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                                {hasTarget && (
                                    <ReferenceLine
                                        y={targetK}
                                        stroke={TONE.bear}
                                        strokeDasharray="5 5"
                                        ifOverflow="extendDomain"
                                        label={{ value: "Target", position: "insideTopRight", fontSize: 11, fill: TONE.bear }}
                                    />
                                )}
                            </LineChart>
                        </ChartBox>
                    </Card>
                )}

                {/* NEXT 30 SESSIONS */}
                {forecast && (
                    <Card>
                        <SectionHeader
                            title="Next 30 sessions"
                            subtitle={`Three models project forward from the same history. The consensus is their average. The shaded band is the selected ${bandLevel}% range from the volatility model.`}
                        />
                        <div className="forecast-next-grid">
                            <div style={{ ...grid(180), alignContent: "start" }}>
                                <Metric
                                    id="ens"
                                    big
                                    label="Consensus, day 30"
                                    value={money(forecast.ens30)}
                                    raw={forecast.ens30}
                                    ctx={ctx}
                                />
                                <Metric
                                    id="band30"
                                    label={`${bandLevel}% range, day 30`}
                                    value={`${money(forecast.gbmLow30)} – ${money(forecast.gbmHigh30)}`}
                                    raw={forecast.band30Sd}
                                    ctx={ctx}
                                />
                                <Metric
                                    id="up30"
                                    label="Chance of ending above today"
                                    value={pct(forecast.chanceUp, 0)}
                                    raw={forecast.chanceUp}
                                    ctx={ctx}
                                />
                                <Metric
                                    id="spread30"
                                    label="Model disagreement"
                                    value={pct(forecast.spread, 1)}
                                    raw={forecast.spread}
                                    ctx={ctx}
                                />
                            </div>
                            <ChartBox height={320}>
                                <ComposedChart data={forecast.rows} margin={{ top: 10, right: 16, left: 4, bottom: 6 }}>
                                    <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                    <XAxis
                                        dataKey="x"
                                        tick={{ fontSize: 11, fill: MUTED }}
                                        tickLine={false}
                                        axisLine={{ stroke: LINE }}
                                        minTickGap={24}
                                        interval="preserveStartEnd"
                                        tickFormatter={(v) => (v === 0 ? "Today" : v > 0 ? `+${v}` : `${v}`)}
                                    />
                                    <YAxis
                                        domain={["auto", "auto"]}
                                        tick={{ fontSize: 11, fill: MUTED }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={64}
                                        tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                                    />
                                    <Tooltip content={<ForecastTip level={bandLevel} />} />
                                    <Area type="monotone" dataKey="bandBase" stackId="band" stroke="none" fill="transparent" legendType="none" isAnimationActive={false} />
                                    <Area type="monotone" dataKey="bandWidth" stackId="band" stroke="none" fill={ACCENT} fillOpacity={0.1} name={`${bandLevel}% range`} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="price" name="Close" stroke={INK} strokeWidth={2} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="ens" name="Consensus" stroke={ACCENT} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="ar" name="AR(5)" stroke="#8a6fd1" strokeWidth={1.2} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="holt" name="Damped trend" stroke="#2f7d6b" strokeWidth={1.2} dot={false} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="gbm" name="GBM" stroke="#b7791f" strokeWidth={1.2} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                                    <ReferenceLine x={0} stroke={FAINT} strokeDasharray="3 3" />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                </ComposedChart>
                            </ChartBox>
                        </div>

                        <div style={{ overflowX: "auto", marginTop: 18 }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: 13,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                <thead>
                                    <tr>
                                        {["Model", "Day 5", "Day 10", "Day 20", "Day 30", "Versus today"].map((h) => (
                                            <th
                                                key={h}
                                                style={{
                                                    textAlign: h === "Model" ? "left" : "right",
                                                    padding: "10px 12px",
                                                    borderBottom: `1px solid ${LINE}`,
                                                    color: MUTED,
                                                    fontWeight: 500,
                                                    fontSize: 12,
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {modelRows.map((r) => {
                                        const d30 = r.path[FORECAST_DAYS - 1];
                                        const chg = d30 / metrics.currentPrice - 1;
                                        const g = GLOSSARY[r.id];
                                        return (
                                            <tr key={r.id}>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        borderBottom: `1px solid ${LINE}`,
                                                        fontWeight: r.id === "ens" ? 600 : 400,
                                                    }}
                                                >
                                                    <Hoverable tip={{ title: g.name, what: g.what, how: g.how }}>
                                                        <span style={hintLabel}>{r.label}</span>
                                                    </Hoverable>
                                                </td>
                                                {[4, 9, 19, 29].map((i) => (
                                                    <td
                                                        key={i}
                                                        style={{
                                                            padding: "12px",
                                                            textAlign: "right",
                                                            borderBottom: `1px solid ${LINE}`,
                                                        }}
                                                    >
                                                        {money(r.path[i])}
                                                    </td>
                                                ))}
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "right",
                                                        borderBottom: `1px solid ${LINE}`,
                                                        color: chg >= 0 ? TONE.bull : TONE.bear,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {movePct(chg)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <p
                            style={{
                                fontFamily: SERIF,
                                fontSize: 17,
                                lineHeight: 1.65,
                                margin: "20px 0 0",
                                color: "#2c2f36",
                            }}
                        >
                            {forecast.outlook}
                        </p>
                    </Card>
                )}

                {/* TARGET PROBABILITY CURVE */}
                {metrics && (
                    <Card>
                        <SectionHeader
                            title="Target probability curve"
                            subtitle="The chance of finishing at or beyond the target (terminal) and of touching it at any point (touch), across horizons."
                            right={
                                <div style={{ fontSize: 13, color: MUTED }}>
                                    Target <strong style={{ color: INK }}>{hasTarget ? money(targetK) : "—"}</strong>
                                </div>
                            }
                        />
                        <ChartBox height={360}>
                            <LineChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                <XAxis
                                    dataKey="horizon"
                                    tick={{ fontSize: 11, fill: MUTED }}
                                    tickLine={false}
                                    axisLine={{ stroke: LINE }}
                                    label={{ value: "Trading days", position: "insideBottom", offset: -12, fill: MUTED, fontSize: 12 }}
                                />
                                <YAxis
                                    domain={[0, curveYMax]}
                                    tick={{ fontSize: 11, fill: MUTED }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <Tooltip
                                    formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
                                    labelFormatter={(value) => `Horizon: ${value} days`}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <ReferenceLine x={horizon} stroke={INK} strokeDasharray="4 4" />
                                <Line
                                    type="monotone"
                                    dataKey="terminal"
                                    name="Terminal"
                                    stroke={ACCENT}
                                    strokeWidth={2.5}
                                    dot={{ r: 3.5, strokeWidth: 0, fill: ACCENT }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="touch"
                                    name="Touch"
                                    stroke={TONE.bull}
                                    strokeWidth={2.5}
                                    dot={{ r: 3.5, strokeWidth: 0, fill: TONE.bull }}
                                />
                            </LineChart>
                        </ChartBox>
                    </Card>
                )}

                {/* PROBABILITY SPECTRUM */}
                {spectrum && (
                    <Card>
                        <SectionHeader
                            title="Probability spectrum"
                            subtitle={
                                spectrumMode === "move"
                                    ? "The chance of ending at least this far up (green) or down (red) from today, by horizon."
                                    : "The chance of finishing above each price, by horizon."
                            }
                            right={
                                <Segmented
                                    options={[
                                        ["move", "Move size"],
                                        ["above", "Finish above"],
                                    ]}
                                    value={spectrumMode}
                                    onChange={setSpectrumMode}
                                />
                            }
                        />

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "150px minmax(0, 1fr)",
                                gap: 10,
                                alignItems: "stretch",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    padding: "6px 0",
                                    fontSize: 11,
                                    color: MUTED,
                                }}
                            >
                                {spectrum.prices.map((price, index) => {
                                    const p = (price / spectrum.current - 1) * 100;
                                    const isNow = index === spectrum.currentIndex;
                                    const isTarget = index === spectrum.targetIndex;
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                textAlign: "right",
                                                paddingRight: 6,
                                                whiteSpace: "nowrap",
                                                fontWeight: isNow || isTarget ? 600 : 400,
                                                color: isTarget ? TONE.bear : isNow ? INK : MUTED,
                                            }}
                                        >
                                            {money(price)}{" "}
                                            <span style={{ opacity: 0.75 }}>
                                                ({p >= 0 ? "+" : ""}
                                                {p.toFixed(0)}%)
                                            </span>
                                            {isNow ? " now" : isTarget ? " target" : ""}
                                        </div>
                                    );
                                })}
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${spectrum.horizons.length}, minmax(0, 1fr))`,
                                    gridTemplateRows: `repeat(${spectrum.prices.length}, minmax(22px, 1fr))`,
                                    border: `1px solid ${LINE}`,
                                    minHeight: 430,
                                    borderRadius: 10,
                                    overflow: "hidden",
                                }}
                            >
                                {spectrum.prices.map((price, priceIndex) =>
                                    spectrum.horizons.map((h) => {
                                        const probability = spectrum.cells.get(`${priceIndex}-${h}`) ?? 0;
                                        const isUp = price >= spectrum.current;
                                        const outline =
                                            priceIndex === spectrum.currentIndex
                                                ? `inset 0 2px 0 ${INK}, inset 0 -2px 0 ${INK}`
                                                : priceIndex === spectrum.targetIndex
                                                    ? `inset 0 2px 0 ${TONE.bear}, inset 0 -2px 0 ${TONE.bear}`
                                                    : "none";
                                        return (
                                            <div
                                                key={`${priceIndex}-${h}`}
                                                title={`${h} days • ${money(price)} • ${probability.toFixed(1)}%`}
                                                style={{
                                                    backgroundColor: probabilityToColor(probability, isUp, spectrumMode),
                                                    boxShadow: outline,
                                                    borderRight: "1px solid rgba(255,255,255,0.7)",
                                                    borderBottom: "1px solid rgba(255,255,255,0.7)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 10,
                                                    color: probability > 60 ? "#ffffff" : "#374151",
                                                    fontWeight: probability > 60 ? 600 : 400,
                                                    minWidth: 0,
                                                    cursor: "default",
                                                }}
                                            >
                                                {probability.toFixed(0)}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div
                            style={{
                                marginLeft: 160,
                                display: "grid",
                                gridTemplateColumns: `repeat(${spectrum.horizons.length}, minmax(0, 1fr))`,
                                marginTop: 8,
                                fontSize: 11,
                                color: MUTED,
                            }}
                        >
                            {spectrum.horizons.map((h) => (
                                <div key={h} style={{ textAlign: "center" }}>
                                    {h}d
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                marginLeft: 160,
                                marginTop: 14,
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 16,
                                fontSize: 11,
                                color: MUTED,
                            }}
                        >
                            {spectrumMode === "move" ? (
                                <>
                                    <Swatches label="Up" isUp mode="move" />
                                    <Swatches label="Down" isUp={false} mode="move" />
                                </>
                            ) : (
                                <Swatches label="Above" isUp mode="above" />
                            )}
                        </div>

                        <div style={{ marginTop: 12, fontSize: 12, color: MUTED }}>
                            Current price <strong style={{ color: INK }}>{money(spectrum.current)}</strong> · target{" "}
                            <strong style={{ color: INK }}>{money(spectrum.target)}</strong>
                        </div>
                    </Card>
                )}

                {/* MODEL COMPARISON */}
                {metrics && (
                    <Card>
                        <SectionHeader
                            title="Model comparison"
                            subtitle="Three estimates of the same probability: a formula, a simulation that resamples the stock's own returns, and the stock's actual history."
                        />

                        {!hasTarget && (
                            <div style={{ fontSize: 13, color: MUTED }}>Enter a target price to see the comparison.</div>
                        )}

                        {hasTarget && (
                            <>
                                <ChartBox height={300}>
                                    <ComposedChart data={comparison} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                        <XAxis
                                            dataKey="horizon"
                                            tick={{ fontSize: 11, fill: MUTED }}
                                            tickLine={false}
                                            axisLine={{ stroke: LINE }}
                                            tickFormatter={(h) => `${h}d`}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 11, fill: MUTED }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => `${v}%`}
                                        />
                                        <Tooltip
                                            formatter={(v, name) => [v == null ? "—" : `${Number(v).toFixed(1)}%`, name]}
                                            labelFormatter={(h) => `Horizon: ${h} days`}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="analyticT" name="Analytic (GBM)" fill={ACCENT} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="mcT" name="Monte Carlo (fat tails)" fill="#8a6fd1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="histT" name="Historical windows" fill={TONE.bull} radius={[4, 4, 0, 0]} />
                                    </ComposedChart>
                                </ChartBox>

                                {comparisonSelected && (
                                    <div style={{ overflowX: "auto", marginTop: 14 }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                            <thead>
                                                <tr>
                                                    {[`Day ${horizon}`, "Analytic", "Monte Carlo", "Historical"].map((h) => (
                                                        <th
                                                            key={h}
                                                            style={{
                                                                textAlign: "left",
                                                                padding: "10px 12px",
                                                                borderBottom: `1px solid ${LINE}`,
                                                                color: MUTED,
                                                                fontWeight: 500,
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    ["Finish at or past target", "analyticT", "mcT", "histT"],
                                                    ["Touch target at any point", "analyticTouch", "mcTouch", "histTouch"],
                                                ].map(([label, a, m, h]) => (
                                                    <tr key={label}>
                                                        <td style={{ padding: "10px 12px", borderBottom: `1px solid ${LINE}` }}>
                                                            {label}
                                                        </td>
                                                        {[a, m, h].map((k) => (
                                                            <td
                                                                key={k}
                                                                style={{
                                                                    padding: "10px 12px",
                                                                    borderBottom: `1px solid ${LINE}`,
                                                                    fontWeight: 600,
                                                                    fontVariantNumeric: "tabular-nums",
                                                                }}
                                                            >
                                                                {comparisonSelected[k] == null
                                                                    ? "—"
                                                                    : `${comparisonSelected[k].toFixed(1)}%`}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div style={{ marginTop: 14, fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
                                    Analytic assumes normal returns. Monte Carlo resamples the stock's own daily returns, so it
                                    captures fat tails, but it uses the same drift and volatility. Historical counts how often a
                                    move this size happened across rolling windows
                                    {comparisonSelected ? ` (${comparisonSelected.histWindows} windows)` : ""}. Those windows
                                    overlap, so long horizons rest on few independent samples.
                                </div>
                            </>
                        )}
                    </Card>
                )}

                {/* ROLLING VOLATILITY & MACD */}
                {windowData.length > 0 && (
                    <div className="forecast-indicator-pair">
                        <Card style={{ marginBottom: 0 }}>
                            <SectionHeader
                                title="Rolling 20-day volatility"
                                subtitle="Annualized realized volatility against the level the model uses."
                            />
                            <ChartBox height={240}>
                                <LineChart data={windowData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: LINE }} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: MUTED }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
                                    />
                                    <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} labelFormatter={(v) => `Day ${v}`} />
                                    {metrics && (
                                        <ReferenceLine
                                            y={metrics.adaptedVol * 100}
                                            stroke={INK}
                                            strokeDasharray="4 4"
                                            label={{ value: "Model vol", position: "insideTopRight", fontSize: 11, fill: MUTED }}
                                        />
                                    )}
                                    <Line type="monotone" dataKey="rollVol" name="20-day vol" stroke="#0891b2" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ChartBox>
                        </Card>
                        <Card style={{ marginBottom: 0 }}>
                            <SectionHeader
                                title={`Volatility and momentum metrics`}
                                subtitle="Additional realized volatility and trend indicators."
                            />
                            <div style={grid(150)}>
                                {additionalCoreCards.map(([id, label, value, raw]) => (
                                    <Metric key={id} id={id} label={label} value={value} raw={raw} ctx={ctx} />
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* RETURN DISTRIBUTION & RISK */}
                {histogram.length > 0 && (
                    <Card>
                        <SectionHeader
                            title="Daily return distribution"
                            subtitle="Bars are actual daily returns. The line is what a normal distribution would predict. Bars that run past the line in the tails are fat-tail risk."
                        />
                        <ChartBox height={300}>
                            <ComposedChart data={histogram} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                <XAxis
                                    dataKey="ret"
                                    tick={{ fontSize: 10, fill: MUTED }}
                                    tickLine={false}
                                    axisLine={{ stroke: LINE }}
                                    tickFormatter={(v) => `${v}%`}
                                    interval={5}
                                />
                                <YAxis tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    formatter={(v, name) => [Number(v).toFixed(1), name === "count" ? "Actual days" : "Normal model"]}
                                    labelFormatter={(v) => `Daily return ≈ ${v}%`}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="count" name="count" fill="#a9c4f0" />
                                <Line type="monotone" dataKey="normal" name="normal" stroke={INK} strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ChartBox>
                        {metrics && (
                            <details style={{ marginTop: 18 }}>
                                <summary style={{ cursor: "pointer", color: INK, fontWeight: 600, fontSize: 13 }}>
                                    Detailed risk and return statistics ({riskItems.length})
                                </summary>
                                <div style={{ ...grid(170), marginTop: 14 }}>
                                    {riskItems.map(([id, label, value, raw, tone]) => (
                                        <Metric
                                            key={id}
                                            id={id}
                                            label={label}
                                            value={value}
                                            raw={raw}
                                            ctx={ctx}
                                            tone={tone}
                                            panel={false}
                                        />
                                    ))}
                                </div>
                            </details>
                        )}
                    </Card>
                )}

                {/* PERFORMANCE */}
                {metrics && (
                    <Card>
                        <SectionHeader title="Performance" subtitle="Price change over common lookback periods." />
                        <div style={grid(150)}>
                            {perfItems.map(([label, v]) => (
                                <Metric
                                    key={label}
                                    id="perf"
                                    label={label}
                                    value={movePct(v)}
                                    raw={v}
                                    ctx={ctx}
                                    tone={v == null ? undefined : v >= 0 ? "bull" : "bear"}
                                    panel={false}
                                />
                            ))}
                        </div>
                    </Card>
                )}

                {/* RELATIVE STRENGTH */}
                {relativeData.length > 0 && (
                    <Card>
                        <SectionHeader
                            title={`Relative strength against ${BENCHMARK}`}
                            subtitle="Both lines are rebased to 100 at the start of the window. The stock above the benchmark has outperformed."
                        />
                        <ChartBox height={300}>
                            <LineChart data={relativeData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: LINE }} />
                                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(v, name) => [Number(v).toFixed(1), name]} labelFormatter={(v) => `Day ${v}`} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="stock" name={activeTicker} stroke={ACCENT} strokeWidth={2.5} dot={false} />
                                <Line type="monotone" dataKey="bench" name={BENCHMARK} stroke="#b9bdc4" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ChartBox>
                        {metrics && (
                            <div style={{ ...grid(170), marginTop: 22 }}>
                                <Metric
                                    id="beta"
                                    label="Beta vs SPY"
                                    value={num(metrics.beta)}
                                    raw={metrics.beta}
                                    ctx={ctx}
                                    tone={metrics.beta > 1.2 ? "warn" : undefined}
                                    panel={false}
                                />
                                <Metric id="correl" label="Correlation" value={num(metrics.correl)} raw={metrics.correl} ctx={ctx} panel={false} />
                                <Metric
                                    id="alpha"
                                    label="Alpha (annual)"
                                    value={pct(metrics.alpha, 1)}
                                    raw={metrics.alpha}
                                    ctx={ctx}
                                    tone={metrics.alpha == null ? undefined : metrics.alpha >= 0 ? "bull" : "bear"}
                                    panel={false}
                                />
                                <Metric
                                    id="rel3m"
                                    label="3-month vs SPY"
                                    value={
                                        metrics.perf.m3 != null && metrics.benchPerf3m != null
                                            ? movePct(metrics.perf.m3 - metrics.benchPerf3m)
                                            : "—"
                                    }
                                    raw={
                                        metrics.perf.m3 != null && metrics.benchPerf3m != null
                                            ? metrics.perf.m3 - metrics.benchPerf3m
                                            : null
                                    }
                                    ctx={ctx}
                                    panel={false}
                                />
                            </div>
                        )}
                    </Card>
                )}

                {/* FORWARD TRAJECTORY */}
                {funnel.length > 0 && (
                    <Card>
                        <SectionHeader
                            title="Forward trajectory"
                            subtitle={`A ${bandLevel}% model confidence cone over ${horizon} sessions. The shaded area is the selected range around the median; the dashed line is your target.`}
                        />
                        <ChartBox height={400}>
                            <AreaChart data={funnel} margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke={LINE} vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: LINE }} />
                                <YAxis
                                    domain={["auto", "auto"]}
                                    tick={{ fontSize: 11, fill: MUTED }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                                />
                                <Tooltip content={<TrajectoryTip level={bandLevel} />} />
                                <Area type="monotone" dataKey="bandBase" stackId="confidence" stroke="none" fill="transparent" />
                                <Area type="monotone" dataKey="bandWidth" stackId="confidence" stroke={ACCENT} fill={ACCENT} fillOpacity={0.12} name={`${bandLevel}% range`} />
                                <Line type="monotone" dataKey="median" stroke={INK} strokeWidth={2.5} dot={false} name="Median" />
                                {hasTarget && (
                                    <ReferenceLine
                                        y={targetK}
                                        stroke={TONE.bear}
                                        strokeDasharray="5 5"
                                        ifOverflow="extendDomain"
                                        label={{ value: "Target", position: "right", fontSize: 11, fill: TONE.bear }}
                                    />
                                )}
                            </AreaChart>
                        </ChartBox>
                    </Card>
                )}

                {/* MODEL STATE */}
                {metrics && (
                    <Card>
                        <SectionHeader
                            title="Model state"
                            subtitle="The inputs behind the probability and trajectory estimates."
                        />
                        <div style={grid(170)}>
                            <Metric
                                id="recdrift"
                                label="Recommended drift (annual)"
                                value={pct(metrics.recommendedDrift)}
                                raw={metrics.recommendedDrift}
                                ctx={ctx}
                                panel={false}
                            />
                            <Metric
                                id="volshock"
                                label="Volatility shock"
                                value={pct(metrics.volShock)}
                                raw={metrics.volShock}
                                ctx={ctx}
                                panel={false}
                            />
                            <Metric
                                id="impliedvol"
                                label="Implied volatility"
                                value={metrics.impliedVol !== null ? pct(metrics.impliedVol) : "Unavailable"}
                                raw={metrics.impliedVol}
                                ctx={ctx}
                                panel={false}
                            />
                            <Metric
                                id="ivrv"
                                label="Implied vs realized"
                                value={metrics.ivVsRealized !== null ? movePct(metrics.ivVsRealized, 0) : "Unavailable"}
                                raw={metrics.ivVsRealized}
                                ctx={ctx}
                                panel={false}
                            />
                            <Metric
                                id="volregime"
                                label="Volatility percentile"
                                value={metrics.volPercentile != null ? `${Math.round(metrics.volPercentile)}th` : "—"}
                                raw={metrics.volPercentile != null ? metrics.volPercentile / 100 : null}
                                ctx={ctx}
                                panel={false}
                            />
                            <Metric
                                id="obi"
                                label="Order book imbalance"
                                value={obiAvailable ? num(obi, 4) : "Unavailable"}
                                raw={obiAvailable ? obi : null}
                                ctx={ctx}
                                panel={false}
                            />
                        </div>
                        <div style={{ marginTop: 22, fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
                            Volatility blends implied volatility (when available) with EWMA and one-year realized volatility.
                            Drift is capped at ±10% a year. Every probability assumes returns are roughly lognormal, so treat
                            the outputs as rough estimates of risk, not a forecast.
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
