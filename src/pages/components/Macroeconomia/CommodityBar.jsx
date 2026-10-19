import { BACKEND_URL } from "../../../apiUrl.js";
// import { useEffect, useState } from "react";
// import axios from "axios";

// export default function CommoditiesBar() {
//   const [commodities, setCommodities] = useState([
//     { name: "Gold", icon: "/src/variable/assets/fotos/gold.png" },
//     { name: "Silver", icon: "/src/variable/assets/fotos/silver.png" },
//     { name: "Platinum", icon: "/src/variable/assets/fotos/lithium.png" },
//     { name: "WTI Oil", icon: "/src/variable/assets/fotos/iron.png" },
//     { name: "Brent Oil", icon: "/src/variable/assets/fotos/oil.png" }
//   ]);

//   const [prices, setPrices] = useState({}); // stores latest prices

//   useEffect(() => {
//     const fetchPrices = async () => {
//       try {
//         const res = await axios.get(`${BACKEND_URL}/resourcePrices`);
//         setPrices(res.data); // { Gold: 4676.285, Silver: 94.579, ... }
//       } catch (err) {
//         console.error("Failed to fetch prices:", err);
//       }
//     };

//     fetchPrices(); // initial fetch
//     const interval = setInterval(fetchPrices, 30000); // poll every 30s

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div style ={{position:'absolute', top: '0px', right: '0px'}}className="commodities-bar">
//       {commodities.map(c => (
//         <div key={c.name} className="commodity-item">
//          <img
//   src={c.icon}
//   alt={c.name}
//   style={{ width: "35px", height: "35px" }}
// /><span className="name">{c.name}</span>  
//           <div className="info">
           
//            <br /> <span className="price">
//               {prices[c.name] !== undefined ? prices[c.name].toFixed(2) : "—"}
//             </span>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./CommodityBar.css";
import goldIcon from "../../../variable/assets/fotos/gold-icon.webp";
import silverIcon from "../../../variable/assets/fotos/silver-icon.webp";
import platinumIcon from "../../../variable/assets/fotos/lithium-icon.webp";
import oilIcon from "../../../variable/assets/fotos/oil-icon.webp";
import copperIcon from "../../../variable/assets/fotos/copper-icon.webp";
import wheatIcon from "../../../variable/assets/fotos/Wheat-icon.webp";
import ArticleAIAnalysis from "./ArticleAIAnalysis";

const HISTORY_RANGES = [
  ["1w", "1 week"],
  ["30d", "30 days"],
  ["90d", "90 days"],
  ["180d", "180 days"],
  ["365d", "365 days"],
  ["max", "Max available"],
];
const COMMODITIES = [
  { name: "Gold", icon: goldIcon, symbol: "OANDA:XAU_USD", forecastTicker: "GLD", distribution: "gold" },
  { name: "Silver", icon: silverIcon, symbol: "OANDA:XAG_USD", forecastTicker: "SLV", distribution: "silver" },
  { name: "Platinum", icon: platinumIcon, symbol: "OANDA:XPT_USD", forecastTicker: "PPLT", distribution: "platinum" },
  { name: "Palladium", icon: platinumIcon, symbol: "OANDA:XPD_USD", forecastTicker: "PALL", distribution: "palladium" },
  { name: "WTI Oil", icon: oilIcon, symbol: "OANDA:WTICO_USD", forecastTicker: "USO", distribution: "oil" },
  { name: "Brent Oil", icon: oilIcon, symbol: "OANDA:BCO_USD", forecastTicker: "BNO", distribution: "oil" },
  { name: "Natural Gas", icon: oilIcon, symbol: "OANDA:NATGAS_USD", forecastTicker: "UNG", distribution: "natural_gas" },
  { name: "Copper", icon: copperIcon, symbol: "OANDA:XCU_USD", forecastTicker: "CPER", distribution: "copper" },
  { name: "Aluminum", icon: copperIcon, symbol: "OANDA:ALUMINUM_USD", forecastTicker: "DBB", distribution: "aluminum" },
  { name: "Wheat", icon: wheatIcon, symbol: "OANDA:WHEAT_USD", forecastTicker: "WEAT", distribution: "wheat" },
  { name: "Corn", icon: wheatIcon, symbol: "OANDA:CORN_USD", forecastTicker: "CORN", distribution: "maize" },
  { name: "Soybeans", icon: wheatIcon, symbol: "OANDA:SOYBN_USD", forecastTicker: "SOYB", distribution: "soybeans" },
  { name: "Coffee", icon: wheatIcon, symbol: "OANDA:COFFEE_USD", forecastTicker: "JO", distribution: "coffee" },
  { name: "Cocoa", icon: wheatIcon, symbol: "OANDA:COCOA_USD", forecastTicker: "NIB", distribution: "cocoa" },
  { name: "Sugar", icon: wheatIcon, symbol: "OANDA:SUGAR_USD", forecastTicker: "CANE", distribution: "sugar" },
  { name: "Rice", icon: wheatIcon, symbol: "OANDA:RICE_USD", forecastTicker: "DBA", distribution: "rice" },
  { name: "Oats", icon: wheatIcon, symbol: "OANDA:OATS_USD", forecastTicker: "DBA", distribution: "oats" },
  { name: "Cotton", icon: wheatIcon, symbol: "OANDA:COTTON_USD", forecastTicker: "BAL", distribution: "cotton" },
];
const SERIES_CACHE = new Map();
const SERIES_REQUESTS = new Map();
const NEWS_CACHE = new Map();
const NEWS_REQUESTS = new Map();

function getCachedRequest(cache, requests, key, request) {
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (requests.has(key)) return requests.get(key);
  const pending = request().then((result) => {
    cache.set(key, result);
    return result;
  }).finally(() => requests.delete(key));
  requests.set(key, pending);
  return pending;
}

function errorMessage(error, fallback) {
  return error.response?.data?.error || error.message || fallback;
}

export default function CommoditiesBar({ onChatContextChange }) {
  const [prices, setPrices] = useState({});
  const [dailyChanges, setDailyChanges] = useState({});
  const [priceError, setPriceError] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [historyRange, setHistoryRange] = useState("365d");
  const [details, setDetails] = useState({ loading: false, series: [], news: [], errors: [] });
  const [distribution, setDistribution] = useState({ loading: false, data: null, error: "" });
  const activeSymbol = useRef(null);

  const commodityChatContext = useMemo(() => {
    if (!selectedCommodity) return null;
    return {
      capturedAt: new Date().toISOString(),
      commodity: {
        name: selectedCommodity.name,
        marketSymbol: selectedCommodity.symbol,
        forecastProxy: selectedCommodity.forecastTicker,
        latestPriceUsd: prices[selectedCommodity.name] ?? null,
        dailyChangePct: dailyChanges[selectedCommodity.name] ?? null,
      },
      recentPriceHistory: details.series.slice(-90),
      relatedNews: details.news.map((article) => ({
        title: article.title,
        abstract: article.abstract || article.summary || null,
        source: article.source,
        published: article.published,
        url: article.url,
      })),
      countryDistribution: distribution.data,
      loading: {
        marketDetails: details.loading,
        countryDistribution: distribution.loading,
      },
      errors: [...details.errors, distribution.error].filter(Boolean),
    };
  }, [selectedCommodity, prices, dailyChanges, details, distribution]);

  useEffect(() => {
    onChatContextChange?.('commodity', commodityChatContext ? {
      title: `Ask AI about ${selectedCommodity.name}`,
      description: 'Explore this commodity’s live quote, price history, country production/reserves, and related news.',
      contextType: 'commodity',
      context: commodityChatContext,
      contextKey: `commodity:${selectedCommodity.symbol}`,
      downloadName: `${selectedCommodity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-commodity-data.json`,
    } : null);
    return () => onChatContextChange?.('commodity', null);
  }, [commodityChatContext, selectedCommodity, onChatContextChange]);

  useEffect(() => {
    let active = true;
    const fetchPrices = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/resourcePrices`, { timeout: 10000 });
        if (!active) return;
        if (!response.data || typeof response.data !== "object" || Array.isArray(response.data)) {
          throw new Error("The commodity price service returned an empty response.");
        }
        const nextPrices = response.data.prices;
        const nextChanges = response.data.changes;
        if (!nextPrices || typeof nextPrices !== "object" || Array.isArray(nextPrices)) {
          throw new Error(response.data.error || "The commodity price service returned no price data.");
        }
        setPrices(nextPrices);
        setDailyChanges(nextChanges && typeof nextChanges === "object" ? nextChanges : {});
        setPriceError(response.data.available === false
          ? response.data.error || "Live commodity quotes are unavailable."
          : "");
      } catch (err) {
        if (active) {
          setPrices({});
          setDailyChanges({});
          setPriceError(errorMessage(err, "Live commodity prices are unavailable."));
        }
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const showCommodityDetails = (commodity, range = historyRange) => {
    activeSymbol.current = commodity.symbol;
    setSelectedCommodity(commodity);
    setDetails({ loading: true, series: [], news: [], errors: [] });
    setDistribution({ loading: false, data: null, error: "" });
    const seriesKey = `${commodity.symbol}:${range}`;
    const series = getCachedRequest(SERIES_CACHE, SERIES_REQUESTS, seriesKey, async () => {
      const response = await axios.get(
        `${BACKEND_URL}/resourceSeries/${encodeURIComponent(commodity.symbol)}?range=${encodeURIComponent(range)}`,
        { timeout: 30000 }
      );
      const prices = Array.isArray(response.data) ? response.data : response.data?.prices;
      if (!Array.isArray(prices)) {
        throw new Error(response.data?.error || "Commodity price history returned no price series.");
      }
      return prices.filter((item) => (
        item
        && typeof item.date === "string"
        && Number.isFinite(Number(item.value))
      ));
    });
    const news = getCachedRequest(NEWS_CACHE, NEWS_REQUESTS, commodity.name, async () => {
      const response = await axios.get(`${BACKEND_URL}/news/commodity`, {
        params: { q: commodity.name },
        timeout: 20000,
      });
      return response.data.articles || [];
    });
    Promise.allSettled([series, news]).then(([seriesResult, newsResult]) => {
      if (activeSymbol.current !== commodity.symbol) return;
      const errors = [];
      if (seriesResult.status === "rejected") {
        errors.push(errorMessage(seriesResult.reason, "Commodity price history is unavailable."));
      }
      if (newsResult.status === "rejected") {
        errors.push(errorMessage(newsResult.reason, "Commodity news is unavailable."));
      }
      setDetails({
        loading: false,
        series: seriesResult.status === "fulfilled" ? seriesResult.value : [],
        news: newsResult.status === "fulfilled" ? newsResult.value : [],
        errors,
      });
    });
  };

  const loadDistribution = async (commodity) => {
    const symbol = commodity.symbol;
    setDistribution({ loading: true, data: null, error: "" });
    try {
      const response = await axios.get(
        `${BACKEND_URL}/macro/commodity-distribution/${encodeURIComponent(commodity.distribution)}`,
        { timeout: 30000 }
      );
      if (activeSymbol.current !== symbol) return;
      setDistribution({ loading: false, data: response.data, error: "" });
    } catch (error) {
      if (activeSymbol.current !== symbol) return;
      setDistribution({
        loading: false,
        data: null,
        error: errorMessage(error, "Country distribution data is unavailable."),
      });
    }
  };

  return (
    <>
      <section className="macro-commodity-bar" aria-label="Live commodity prices">
        {COMMODITIES.map((commodity) => (
          <button
            className={`macro-commodity-tile${selectedCommodity?.name === commodity.name ? " active" : ""}`}
            key={commodity.name}
            type="button"
            onClick={() => showCommodityDetails(commodity)}
            aria-expanded={selectedCommodity?.name === commodity.name}
          >
            <span className="macro-commodity-name">
              <img src={commodity.icon} alt="" aria-hidden="true" />
              <span>{commodity.name}</span>
            </span>
            <span className="macro-commodity-quote">
              <strong>
                {Number.isFinite(Number(prices[commodity.name]))
                  ? `$${Number(prices[commodity.name]).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                  : "—"}
              </strong>
              {Number.isFinite(Number(dailyChanges[commodity.name])) && (
                <span className={`macro-commodity-change${Number(dailyChanges[commodity.name]) < 0 ? " down" : " up"}`}>
                  <span aria-hidden="true">{Number(dailyChanges[commodity.name]) < 0 ? "▼" : "▲"}</span>
                  {Math.abs(Number(dailyChanges[commodity.name])).toFixed(2)}%
                </span>
              )}
            </span>
          </button>
        ))}
        {priceError && <span className="macro-commodity-error">{priceError}</span>}
      </section>

      {selectedCommodity && (
        <section className="macro-commodity-details" aria-label={`${selectedCommodity.name} market details`}>
          <div className="macro-commodity-details-header">
            <div>
              <span className="macro-commodity-kicker">COMMODITY MARKETS</span>
              <h2>{selectedCommodity.name}</h2>
            </div>
            <button type="button" onClick={() => {
              activeSymbol.current = null;
              setSelectedCommodity(null);
            }} aria-label="Close commodity details">×</button>
          </div>

          {details.loading && <p className="macro-commodity-status">Loading price history and related news…</p>}
          {details.errors.map((error) => <p className="macro-commodity-error" key={error}>{error}</p>)}
          <div className="macro-commodity-range-picker" role="group" aria-label="Commodity chart range">
            <span>Chart range</span>
            {HISTORY_RANGES.map(([range, label]) => (
              <button
                key={range}
                type="button"
                className={historyRange === range ? "active" : ""}
                aria-pressed={historyRange === range}
                onClick={() => {
                  setHistoryRange(range);
                  showCommodityDetails(selectedCommodity, range);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {details.series.length > 0 && (
            <div className="macro-commodity-chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <LineChart data={details.series} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid stroke="#253746" strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={36} tick={{ fill: "#a8bac6", fontSize: 10 }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fill: "#a8bac6", fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`, "Price"]} />
                  <Line type="monotone" dataKey="value" name={`${selectedCommodity.name} (USD)`} stroke="#69d6c3" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {!details.loading && details.series.length === 0 && !details.errors.length && (
            <p className="macro-commodity-status">No price history was returned for this range.</p>
          )}

          <div className="macro-commodity-forecast-link">
            <span>Forecast proxy: {selectedCommodity.forecastTicker}</span>
            <Link to={`/?ticker=${encodeURIComponent(selectedCommodity.forecastTicker)}`}>
              Open commodity forecaster
            </Link>
          </div>

          <section className="macro-commodity-distribution">
            <button
              type="button"
              onClick={() => loadDistribution(selectedCommodity)}
              disabled={distribution.loading}
            >
              {distribution.loading ? "Loading country data…" : "Global reserves / production by country"}
            </button>
            {distribution.error && <p className="macro-commodity-error">{distribution.error}</p>}
            {distribution.data && (
              <>
                <h3>{distribution.data.title}</h3>
                <p className="macro-commodity-status">
                  {distribution.data.measure} · {distribution.data.year} · {distribution.data.source}
                </p>
                {distribution.data.note && <p className="macro-commodity-status">{distribution.data.note}</p>}
                {distribution.data.items?.length > 0 ? (
                  <ol className="macro-commodity-distribution-list">
                    {distribution.data.items.map((item) => (
                      <li key={`${item.country}-${item.year}`}>
                        <span>{item.country}</span>
                        <strong>
                          {Number(item.value).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                          {distribution.data.unit ? ` ${distribution.data.unit}` : ""}
                        </strong>
                        <small>
                          {[
                            item.year,
                            item.share_of_total != null && `${Number(item.share_of_total).toFixed(1)}% of listed global amount`,
                            item.reserve_share != null && `${Number(item.reserve_share).toFixed(1)}% of national reserves`,
                            item.global_share != null && `${Number(item.global_share).toFixed(1)}% of listed production`,
                          ].filter(Boolean).join(" · ")}
                        </small>
                      </li>
                    ))}
                  </ol>
                ) : <p className="macro-commodity-status">No country observations were returned.</p>}
                {distribution.data.url && (
                  <a href={distribution.data.url} target="_blank" rel="noreferrer" className="macro-commodity-source">
                    Open data source
                  </a>
                )}
              </>
            )}
          </section>

          <div className="macro-commodity-news">
            <h3>Related news</h3>
            {details.news.length ? details.news.map((article, index) => (
              <div className="macro-commodity-news-item" key={article.url || `${article.title}-${index}`}>
                <a href={article.url} target="_blank" rel="noreferrer">
                  <strong>{article.title}</strong>
                  <span>{article.source}{article.published ? ` · ${new Date(article.published).toLocaleDateString()}` : ""}</span>
                </a>
                <ArticleAIAnalysis article={article} subject={`Commodity: ${selectedCommodity.name}`} />
              </div>
            )) : !details.loading && !details.errors.some((error) => error.toLowerCase().includes("news")) && (
              <p className="macro-commodity-status">No related headlines found.</p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
