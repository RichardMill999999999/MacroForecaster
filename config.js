const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
export const BACKEND_URL = (
    configuredBackendUrl || (import.meta.env.DEV ? "http://localhost:5000" : "")
).replace(/\/+$/, "");
export const BENCHMARK = "SPY";
export const TRADING_DAYS = 252;
export const MAX_HORIZON = 360;
export const MC_PATHS = 2000;
export const FORECAST_DAYS = 30;
export const TARGET_MULTIPLIER = 1.1;
export const BAND_LEVELS = [50, 68, 80, 90, 95];
export const HORIZONS = [1, 5, 10, 20, 30, 60, 90, 120, 180, 252, 360];
export const WINDOW_OPTIONS = [30, 90, 180, 360, 730];

export const zForLevel = (p) => ({ 50: 0.6745, 68: 1.0, 80: 1.2816, 90: 1.6449, 95: 1.96 })[p] ?? 1.2816;

// Order of the Category dropdown. Add a key here and in the backend to add a new category.
export const CATEGORY_LABELS = {
    stocks: "Stocks",
    etfs: "ETFs",
    bonds: "Bonds",
    indexes: "Indexes",
    commodities: "Commodities",
    forex: "Forex",
    crypto: "Crypto",
};
export const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

export const TONE = { bull: "#2f7d5b", bear: "#b4493f", warn: "#b7791f", neutral: "#6b6f76" };
export const TONE_WORD = { bull: "Bullish", bear: "Bearish", warn: "To watch", neutral: "Neutral" };
