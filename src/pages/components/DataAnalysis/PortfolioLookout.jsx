import { BACKEND_URL } from "../../../apiUrl.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./PortfolioLookout.css";

const STORAGE_KEY = "market-portfolio-lookout-v1";
const PROFILE_STORAGE_KEY = "market-portfolio-profiles-v1";
const SESSION_STORAGE_KEY = "market-portfolio-sessions-v1";
const CATEGORIES = [
  ["stocks", "Stocks"],
  ["etfs", "ETFs"],
  ["bonds", "Bonds"],
  ["indexes", "Indexes"],
  ["commodities", "Commodities"],
  ["forex", "Forex"],
  ["crypto", "Crypto"],
];
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES);
const TYPE_LABELS = { CS: "Common stock", ETF: "ETF", ETN: "Exchange-traded note", CRYPTO: "Crypto", CURRENCY: "Currency", INDEX: "Index" };
const COLORS = ["#39776b", "#d88a4c", "#54749a", "#a76973", "#8c7fb4", "#78955b", "#c1a34c", "#5d8791"];
const HISTORY_CACHE = new Map();
const DEFAULT_PROFILE = {
  id: "balanced",
  name: "Balanced investor",
  initialCapital: 10000,
  riskTolerance: "Moderate",
  investmentGoal: "Long-term growth",
  horizonYears: 5,
  monthlyContribution: 0,
  benchmark: "SPY",
  rebalanceFrequency: "Annually",
};
const today = () => new Date().toISOString().slice(0, 10);
const oneYearAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 10);
};
const formatMoney = (value) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })
    : "—";
const formatPercent = (value, digits = 1) => Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "—";
const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const assetClassification = (asset) =>
  [CATEGORY_LABELS[asset.category] || asset.category, TYPE_LABELS[asset.type] || asset.type]
    .filter(Boolean)
    .join(" · ");

function readPortfolios() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) throw new Error("Saved portfolio data has an unexpected format.");
    if (parsed.some((item) =>
      !item || typeof item.id !== "string" || typeof item.name !== "string" || !Array.isArray(item.holdings)
    )) {
      throw new Error("One or more saved portfolios are incomplete.");
    }
    return { portfolios: parsed, error: "" };
  } catch (error) {
    return { portfolios: [], error: `Saved portfolios could not be read: ${error.message}` };
  }
}

function readSavedArray(key, label) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) throw new Error(`${label} data has an unexpected format.`);
    return { items: parsed, error: "" };
  } catch (error) {
    return { items: [], error: `Saved ${label} could not be read: ${error.message}` };
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseAllocation(value, capital) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const isPercent = text.endsWith("%");
  const parsed = Number(text.replace(/[$,%\s]/g, "").replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  if (isPercent) return parsed <= 100 ? (capital * parsed) / 100 : null;
  return parsed;
}

async function fetchHistory(ticker, startDate, endDate) {
  const cacheKey = `${ticker}:${startDate}:${endDate}`;
  if (HISTORY_CACHE.has(cacheKey)) return HISTORY_CACHE.get(cacheKey);
  const request = fetch(
    `${BACKEND_URL}/getData/${encodeURIComponent(ticker)}/${startDate}/${endDate}`
  ).then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error || `Price history failed for ${ticker} (${response.status}).`);
    }
    if (body?.status === "ERROR" || body?.error) {
      throw new Error(body.error || `The price provider rejected the request for ${ticker}.`);
    }

    const rawBars = body?.results ?? body?.bars ?? body?.data;
    const bars = Array.isArray(rawBars)
      ? rawBars.flatMap((bar) => {
          const close = Number(bar?.c ?? bar?.close ?? bar?.price);
          const timestamp = bar?.t ?? bar?.timestamp ?? bar?.time ?? bar?.date;
          if (!Number.isFinite(close) || close <= 0 || timestamp == null || timestamp === "") return [];
          const timestampNumber = Number(timestamp);
          const timestampMs = Number.isFinite(timestampNumber) ? timestampNumber : Date.parse(timestamp);
          if (!Number.isFinite(timestampMs)) return [];
          return [{ date: new Date(timestampMs).toISOString().slice(0, 10), close }];
        })
      : [];
    if (!bars.length) {
      const providerStatus = body?.status ? ` (provider status: ${body.status})` : "";
      throw new Error(`No usable historical prices were returned for ${ticker} from ${startDate} to ${endDate}${providerStatus}.`);
    }
    return bars;
  }).catch((error) => {
    HISTORY_CACHE.delete(cacheKey);
    throw error;
  });
  HISTORY_CACHE.set(cacheKey, request);
  return request;
}

function createPortfolio(name) {
  return {
    id: createId(),
    name,
    startDate: oneYearAgo(),
    initialCapital: 10000,
    forecastYears: 1,
    holdings: [],
  };
}

function calculatePortfolio(portfolio, history, benchmarkSymbol = "SPY") {
  const capital = Number(portfolio.initialCapital);
  if (!Number.isFinite(capital) || capital <= 0) return { error: "Enter a positive initial investment amount." };
  if (!portfolio.holdings.length) return { error: "Add at least one asset to calculate this portfolio." };

  const holdings = portfolio.holdings.map((holding) => {
    const allocation = parseAllocation(holding.allocationInput, capital);
    return { ...holding, allocation };
  });
  if (holdings.some((holding) => holding.allocation === null)) {
    return { error: "Each holding needs a valid dollar amount or percentage (for example, $1,000 or 25%)." };
  }
  const allocated = holdings.reduce((sum, holding) => sum + holding.allocation, 0);
  if (allocated > capital + 0.005) {
    return { error: "Holding allocations exceed the portfolio's initial investment." };
  }
  if (holdings.some((holding) => {
    const forecastReturn = Number(holding.forecastReturn);
    return !Number.isFinite(forecastReturn) || forecastReturn < -100 || forecastReturn > 1000;
  })) {
    return { error: "Annual return assumptions must be between -100% and 1,000%." };
  }

  const allDates = [...new Set(holdings.flatMap(({ symbol }) => history[symbol] || []).map(({ date }) => date))].sort();
  if (allDates.length < 2) return { error: "There is not enough price history to calculate performance." };

  const firstClose = {};
  const latestClose = {};
  const nav = [];
  const unallocatedCash = capital - allocated;
  for (const date of allDates) {
    let value = unallocatedCash;
    for (const holding of holdings) {
      const bar = (history[holding.symbol] || []).find((item) => item.date === date);
      if (bar) {
        if (firstClose[holding.symbol] === undefined) firstClose[holding.symbol] = bar.close;
        latestClose[holding.symbol] = bar.close;
      }
      if (firstClose[holding.symbol] !== undefined && latestClose[holding.symbol] !== undefined) {
        value += (holding.allocation / firstClose[holding.symbol]) * latestClose[holding.symbol];
      } else {
        value += holding.allocation;
      }
    }
    nav.push({ date, value });
  }
  if (holdings.some(({ symbol }) => latestClose[symbol] === undefined)) {
    return { error: "At least one holding has no usable price history." };
  }

  const returns = nav.slice(1).map((point, index) => point.value / nav[index].value - 1);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(returns.length - 1, 1);
  const first = nav[0];
  const last = nav[nav.length - 1];
  const years = Math.max((Date.parse(`${last.date}T00:00:00Z`) - Date.parse(`${first.date}T00:00:00Z`)) / 31557600000, 1 / 365);
  const observationsPerYear = returns.length / years;
  const volatility = Math.sqrt(variance * observationsPerYear);
  const dailyRiskFree = Math.pow(1.04, 1 / observationsPerYear) - 1;
  const sharpe = volatility > 0 ? ((mean - dailyRiskFree) * observationsPerYear) / volatility : null;
  const downside = returns.filter((value) => value < dailyRiskFree);
  const downsideDeviation = downside.length
    ? Math.sqrt(downside.reduce((sum, value) => sum + (value - dailyRiskFree) ** 2, 0) / downside.length) * Math.sqrt(observationsPerYear)
    : null;
  const sortino = downsideDeviation > 0 ? ((mean - dailyRiskFree) * observationsPerYear) / downsideDeviation : null;
  const benchmark = history[benchmarkSymbol] || [];
  const benchmarkCloses = new Map(benchmark.map((bar) => [bar.date, bar.close]));
  const navByDate = new Map(nav.map(({ date, value }) => [date, value]));
  const pairedReturns = [];
  let previousBenchmark;
  let previousPortfolioValue;
  benchmark.forEach(({ date, close }) => {
    const portfolioValue = navByDate.get(date);
    if (
      Number.isFinite(portfolioValue) &&
      Number.isFinite(previousBenchmark) &&
      Number.isFinite(previousPortfolioValue) &&
      previousBenchmark > 0
    ) {
      pairedReturns.push({
        portfolio: portfolioValue / previousPortfolioValue - 1,
        market: close / previousBenchmark - 1,
      });
    }
    if (Number.isFinite(portfolioValue)) {
      previousBenchmark = close;
      previousPortfolioValue = portfolioValue;
    }
  });
  const marketMean = pairedReturns.length
    ? pairedReturns.reduce((sum, value) => sum + value.market, 0) / pairedReturns.length : 0;
  const portfolioMean = pairedReturns.length
    ? pairedReturns.reduce((sum, value) => sum + value.portfolio, 0) / pairedReturns.length : 0;
  const marketVariance = pairedReturns.length
    ? pairedReturns.reduce((sum, value) => sum + (value.market - marketMean) ** 2, 0) / pairedReturns.length : 0;
  const portfolioVariance = pairedReturns.length
    ? pairedReturns.reduce((sum, value) => sum + (value.portfolio - portfolioMean) ** 2, 0) / pairedReturns.length : 0;
  const marketCovariance = pairedReturns.length
    ? pairedReturns.reduce((sum, value) => sum + (value.portfolio - portfolioMean) * (value.market - marketMean), 0) / pairedReturns.length : 0;
  let peak = nav[0].value;
  let maxDrawdown = 0;
  nav.forEach(({ value }) => {
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, value / peak - 1);
  });
  const totalReturn = last.value / capital - 1;
  const cagr = last.value > 0 ? (last.value / capital) ** (1 / years) - 1 : null;

  const holdingValues = holdings.map((holding) => ({
    ...holding,
    currentValue: latestClose[holding.symbol] === undefined
      ? holding.allocation
      : (holding.allocation / firstClose[holding.symbol]) * latestClose[holding.symbol],
    currentPrice: latestClose[holding.symbol],
  }));
  const currentValue = last.value;
  const allocation = holdingValues.map((holding) => ({
    name: holding.name || holding.symbol,
    value: holding.currentValue,
    weight: currentValue > 0 ? holding.currentValue / currentValue : 0,
    group: holding.industry || [holding.category, holding.type].filter(Boolean).join(" · ") || "Other",
  }));
  if (unallocatedCash > 0) {
    allocation.push({ name: "Unallocated cash", value: unallocatedCash, weight: currentValue > 0 ? unallocatedCash / currentValue : 0, group: "Cash" });
  }
  const industryMap = new Map();
  allocation.forEach((item) => industryMap.set(item.group, (industryMap.get(item.group) || 0) + item.value));
  const industries = [...industryMap.entries()]
    .map(([name, value]) => ({ name, value, weight: currentValue > 0 ? value / currentValue : 0 }))
    .sort((a, b) => b.value - a.value);
  const hhi = allocation.reduce((sum, item) => sum + item.weight ** 2, 0);
  const largestHolding = [...allocation].sort((a, b) => b.weight - a.weight)[0];
  const effectiveHoldings = hhi > 0 ? 1 / hhi : 0;
  const diversificationScore = allocation.length > 1
    ? Math.max(0, Math.min(100, ((1 - hhi) / (1 - 1 / allocation.length)) * 100))
    : 0;

  const forecastYears = Math.max(1, Number(portfolio.forecastYears) || 1);
  const forecastBreakdown = holdingValues.map((holding) => {
    const annualReturn = Number(holding.forecastReturn);
    const estimate = Number.isFinite(annualReturn) ? annualReturn / 100 : 0.08;
    const projectedValue = holding.currentValue * (1 + estimate) ** forecastYears;
    return { ...holding, projectedValue, projectedChange: projectedValue - holding.currentValue };
  });
  const forecastValue = forecastBreakdown.reduce((sum, holding) => sum + holding.projectedValue, unallocatedCash);

  return {
    nav,
    holdingValues,
    allocation,
    industries,
    currentValue,
    totalReturn,
    cagr,
    volatility,
    sharpe,
    sortino,
    beta: marketVariance > 0 ? marketCovariance / marketVariance : null,
    correlation: marketVariance > 0 && portfolioVariance > 0
      ? marketCovariance / Math.sqrt(marketVariance * portfolioVariance) : null,
    maxDrawdown,
    hhi,
    effectiveHoldings,
    diversificationScore,
    largestHolding,
    forecastBreakdown,
    forecastValue,
    forecastYears,
    startDate: first.date,
    endDate: last.date,
  };
}

function historicalStrategyResults(portfolio, history) {
  if (!portfolio?.holdings?.length) return [];
  const statistics = portfolio.holdings.map((holding) => {
    const bars = history[holding.symbol] || [];
    const returns = bars.slice(1).map((bar, index) => bar.close / bars[index].close - 1);
    const mean = returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0;
    const variance = returns.length
      ? returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length
      : 0;
    return {
      holding,
      volatility: Math.sqrt(variance * 252),
      totalReturn: bars.length > 1 ? bars[bars.length - 1].close / bars[0].close - 1 : 0,
    };
  });
  const valid = statistics.filter(({ holding }) => (history[holding.symbol] || []).length > 1);
  if (!valid.length) return [];
  const currentAmounts = portfolio.holdings.map((holding) =>
    parseAllocation(holding.allocationInput, Number(portfolio.initialCapital)) || 0
  );
  const totalCurrent = currentAmounts.reduce((sum, value) => sum + value, 0);
  const currentWeights = portfolio.holdings.map((holding, index) =>
    totalCurrent > 0 ? currentAmounts[index] / totalCurrent : 1 / portfolio.holdings.length
  );
  const equalWeight = 1 / valid.length;
  const inverseVolatility = valid.map(({ volatility }) => 1 / Math.max(volatility, 0.0001));
  const inverseTotal = inverseVolatility.reduce((sum, value) => sum + value, 0);
  const topReturn = [...valid].sort((a, b) => b.totalReturn - a.totalReturn)[0];
  const topVolatility = [...valid].sort((a, b) => b.volatility - a.volatility)[0];
  const lowVolatility = [...valid].sort((a, b) => a.volatility - b.volatility)[0];
  const makeTilt = (target) => valid.map(({ holding }) =>
    valid.length === 1 ? 1 : holding.symbol === target.holding.symbol ? 0.7 : 0.3 / (valid.length - 1)
  );
  const strategies = [
    { name: "Current allocation", weights: currentWeights },
    { name: "Equal weight", weights: portfolio.holdings.map((holding) => valid.some((item) => item.holding.symbol === holding.symbol) ? equalWeight : 0) },
    { name: "Lower-volatility tilt", weights: portfolio.holdings.map((holding) => {
      const index = valid.findIndex((item) => item.holding.symbol === holding.symbol);
      return index < 0 ? 0 : inverseVolatility[index] / inverseTotal;
    }) },
    { name: "Highest historical return tilt", weights: portfolio.holdings.map((holding) => {
      const index = valid.findIndex((item) => item.holding.symbol === holding.symbol);
      return index < 0 ? 0 : makeTilt(topReturn)[index];
    }) },
    { name: "Higher-volatility tilt", weights: portfolio.holdings.map((holding) => {
      const index = valid.findIndex((item) => item.holding.symbol === holding.symbol);
      return index < 0 ? 0 : makeTilt(topVolatility)[index];
    }) },
    { name: "Lowest-volatility asset", weights: portfolio.holdings.map((holding) => holding.symbol === lowVolatility.holding.symbol ? 1 : 0) },
  ];
  return strategies.map(({ name, weights }) => {
    if (name === "Current allocation") {
      return { name, ...calculatePortfolio(portfolio, history) };
    }
    const candidate = {
      ...portfolio,
      holdings: portfolio.holdings.map((holding, index) => ({
        ...holding,
        allocationInput: `${(weights[index] * 100).toFixed(4)}%`,
      })),
    };
    return { name, ...calculatePortfolio(candidate, history) };
  }).filter((result) => !result.error);
}

function projectScenario(calculations, returnShift) {
  if (!calculations) return 0;
  return calculations.forecastBreakdown.reduce((sum, holding) => {
    const annualReturn = Math.max(-1, Number(holding.forecastReturn) / 100 + returnShift);
    return sum + holding.currentValue * (1 + annualReturn) ** calculations.forecastYears;
  }, Math.max(0, calculations.currentValue - calculations.holdingValues.reduce((sum, item) => sum + item.currentValue, 0)));
}

export default function PortfolioLookout() {
  const [savedState] = useState(readPortfolios);
  const [portfolios, setPortfolios] = useState(savedState.portfolios);
  const [selectedId, setSelectedId] = useState(savedState.portfolios[0]?.id || "");
  const [storageError, setStorageError] = useState(savedState.error);
  const [savedProfilesState] = useState(() => readSavedArray(PROFILE_STORAGE_KEY, "profiles"));
  const [profiles, setProfiles] = useState(() => {
    const validProfiles = savedProfilesState.items.filter((item) =>
      item && typeof item.id === "string" && typeof item.name === "string"
    );
    return validProfiles.length ? validProfiles : [{ ...DEFAULT_PROFILE }];
  });
  const [profileId, setProfileId] = useState(() => {
    const validProfile = savedProfilesState.items.find((item) =>
      item && typeof item.id === "string" && typeof item.name === "string"
    );
    return validProfile?.id || DEFAULT_PROFILE.id;
  });
  const [profileError, setProfileError] = useState(savedProfilesState.error);
  const [savedSessionsState] = useState(() => readSavedArray(SESSION_STORAGE_KEY, "simulation sessions"));
  const [sessions, setSessions] = useState(savedSessionsState.items.filter((item) =>
    item && typeof item.id === "string" && item.portfolio && Array.isArray(item.portfolio.holdings)
  ));
  const [sessionError, setSessionError] = useState(savedSessionsState.error);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceLoadAttempt, setWorkspaceLoadAttempt] = useState(0);
  const [workspaceStatus, setWorkspaceStatus] = useState("loading");
  const [workspaceError, setWorkspaceError] = useState("");
  const workspaceSaveQueue = useRef(Promise.resolve());
  const [compareIds, setCompareIds] = useState([]);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [strategyMetric, setStrategyMetric] = useState("sharpe");
  const [newProfileName, setNewProfileName] = useState("");
  const [newName, setNewName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0][0]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [history, setHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const portfolio = portfolios.find((item) => item.id === selectedId) || portfolios[0] || null;
  const profile = profiles.find((item) => item.id === profileId) || profiles[0] || DEFAULT_PROFILE;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setWorkspaceLoaded(false);
    setWorkspaceStatus("loading");
    setWorkspaceError("");

    fetch(`${BACKEND_URL}/portfolio/workspace`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
        if (!Array.isArray(body.profiles) || !Array.isArray(body.portfolios) || !Array.isArray(body.sessions)) {
          throw new Error("The MongoDB workspace returned invalid data.");
        }
        return body;
      })
      .then((workspace) => {
        if (cancelled || !workspace.exists) return;
        const nextProfiles = workspace.profiles.length ? workspace.profiles : [{ ...DEFAULT_PROFILE }];
        setProfiles(nextProfiles);
        setPortfolios(workspace.portfolios);
        setSessions(workspace.sessions.filter((item) =>
          item && typeof item.id === "string" && item.portfolio && Array.isArray(item.portfolio.holdings)
        ));
        setProfileId((current) => nextProfiles.some((item) => item.id === current) ? current : nextProfiles[0].id);
        setSelectedId((current) => workspace.portfolios.some((item) => item.id === current)
          ? current
          : workspace.portfolios[0]?.id || "");
      })
      .catch((error) => {
        if (cancelled || error.name === "AbortError") return;
        setWorkspaceStatus("error");
        setWorkspaceError(`MongoDB workspace could not be loaded: ${error.message}. Local browser data is still available.`);
      })
      .finally(() => {
        if (!cancelled) setWorkspaceLoaded(true);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [workspaceLoadAttempt]);

  useEffect(() => {
    if (!workspaceLoaded) return undefined;
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      workspaceSaveQueue.current = workspaceSaveQueue.current.catch(() => {}).then(async () => {
        if (cancelled) return;
        setWorkspaceStatus("saving");
        try {
          const response = await fetch(`${BACKEND_URL}/portfolio/workspace`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profiles, portfolios, sessions }),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
          if (!cancelled) {
            setWorkspaceStatus("synced");
            setWorkspaceError("");
          }
        } catch (error) {
          if (!cancelled) {
            setWorkspaceStatus("error");
            setWorkspaceError(`MongoDB workspace could not be saved: ${error.message}. Changes remain in this browser.`);
          }
        }
      });
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [portfolios, profiles, sessions, workspaceLoaded]);

  useEffect(() => {
    if (savedState.error) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
      setStorageError("");
    } catch (error) {
      setStorageError(`Portfolio changes could not be saved in this browser: ${error.message}`);
    }
  }, [portfolios, savedState.error]);

  useEffect(() => {
    if (savedProfilesState.error) return;
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
      setProfileError("");
    } catch (error) {
      setProfileError(`Profile changes could not be saved in this browser: ${error.message}`);
    }
  }, [profiles, savedProfilesState.error]);

  useEffect(() => {
    if (savedSessionsState.error) return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      setSessionError("");
    } catch (error) {
      setSessionError(`Simulation sessions could not be saved in this browser: ${error.message}`);
    }
  }, [sessions, savedSessionsState.error]);

  useEffect(() => {
    if (!portfolio?.holdings?.length) {
      setHistory({});
      setHistoryError("");
      setHistoryLoading(false);
      return undefined;
    }
    let cancelled = false;
    const startDate = portfolio.startDate || oneYearAgo();
    const endDate = today();
    const symbols = [...new Set([...portfolio.holdings.map((item) => item.symbol), profile.benchmark || "SPY"])];
    setHistoryLoading(true);
    setHistoryError("");
    setHistory({});
    Promise.all(symbols.map(async (symbol) => [symbol, await fetchHistory(symbol, startDate, endDate)]))
      .then((entries) => {
        if (!cancelled) setHistory(Object.fromEntries(entries));
      })
      .catch((error) => {
        if (!cancelled) {
          setHistory({});
          setHistoryError(error.message || "Portfolio price history could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [portfolio?.id, portfolio?.startDate, portfolio?.holdings?.map((item) => item.symbol).join("|"), profile.benchmark]);

  const calculations = useMemo(
    () => portfolio && Object.keys(history).length ? calculatePortfolio(portfolio, history, profile.benchmark) : null,
    [portfolio, history, profile.benchmark]
  );

  const chartData = useMemo(() => {
    if (!calculations || calculations.error) return [];
    const benchmark = history[profile.benchmark] || [];
    const firstBenchmarkClose = benchmark[0]?.close;
    const benchmarkByDate = new Map(benchmark.map((bar) => [bar.date, bar.close]));
    let latestBenchmark = null;
    return calculations.nav.map((point) => {
      if (benchmarkByDate.has(point.date)) latestBenchmark = benchmarkByDate.get(point.date);
      return {
        ...point,
        benchmark: firstBenchmarkClose && latestBenchmark
          ? Number(portfolio.initialCapital) * latestBenchmark / firstBenchmarkClose
          : null,
      };
    });
  }, [calculations, history, portfolio?.initialCapital, profile.benchmark]);

  const historicalStrategies = useMemo(
    () => calculations && !calculations.error
      ? historicalStrategyResults(portfolio, history)
      : [],
    [calculations, history, portfolio]
  );
  const rankedStrategies = useMemo(() => [...historicalStrategies].sort((left, right) => {
    if (strategyMetric === "volatility") return left.volatility - right.volatility;
    if (strategyMetric === "maxDrawdown") return right.maxDrawdown - left.maxDrawdown;
    return (right[strategyMetric] ?? -Infinity) - (left[strategyMetric] ?? -Infinity);
  }), [historicalStrategies, strategyMetric]);
  const forecastAnnualReturn = calculations && !calculations.error && calculations.currentValue > 0
    ? (calculations.forecastValue / calculations.currentValue) ** (1 / calculations.forecastYears) - 1
    : 0;
  const monthlyRate = (1 + forecastAnnualReturn) ** (1 / 12) - 1;
  const contributionCount = Math.max(0, Number(calculations?.forecastYears) || 0) * 12;
  const monthlyContribution = Math.max(0, Number(profile.monthlyContribution) || 0);
  const futureContributionValue = monthlyContribution * (
    monthlyRate === 0 ? contributionCount : ((1 + monthlyRate) ** contributionCount - 1) / monthlyRate
  );
  const forecastWithContributions = calculations && !calculations.error
    ? calculations.forecastValue + futureContributionValue
    : 0;
  const forecastBreakdownSorted = calculations && !calculations.error
    ? [...calculations.forecastBreakdown].sort((left, right) => right.projectedChange - left.projectedChange)
    : [];

  const updatePortfolio = (updater) => {
    if (!portfolio) return;
    setPortfolios((current) => current.map((item) => item.id === portfolio.id ? updater(item) : item));
  };

  const updateProfile = (updates) => {
    setProfiles((current) => current.map((item) =>
      item.id === profile.id ? { ...item, ...updates } : item
    ));
  };

  const createProfile = (event) => {
    event.preventDefault();
    const name = newProfileName.trim();
    if (!name) return;
    const created = { ...DEFAULT_PROFILE, id: createId(), name };
    setProfiles((current) => [...current, created]);
    setProfileId(created.id);
    setNewProfileName("");
  };

  const createNewPortfolio = () => {
    const name = newName.trim();
    if (!name) return;
    const created = { ...createPortfolio(name), initialCapital: Number(profile.initialCapital) || 10000 };
    setPortfolios((current) => [...current, created]);
    setSelectedId(created.id);
    setNewName("");
  };

  const saveSession = () => {
    if (!portfolio) return;
    const session = {
      id: createId(),
      name: `${portfolio.name} · ${new Date().toLocaleString()}`,
      savedAt: new Date().toISOString(),
      profileId: profile.id,
      portfolio: JSON.parse(JSON.stringify(portfolio)),
    };
    setSessions((current) => [session, ...current]);
  };

  const restoreSession = (session) => {
    setPortfolios((current) => {
      const exists = current.some((item) => item.id === session.portfolio.id);
      return exists
        ? current.map((item) => item.id === session.portfolio.id ? session.portfolio : item)
        : [...current, session.portfolio];
    });
    setSelectedId(session.portfolio.id);
    if (profiles.some((item) => item.id === session.profileId)) setProfileId(session.profileId);
  };

  const comparePortfolios = async () => {
    const selected = portfolios.filter((item) => compareIds.includes(item.id));
    if (!selected.length) {
      setComparisonError("Select at least one portfolio to compare.");
      setComparisonResults([]);
      return;
    }
    setComparisonLoading(true);
    setComparisonError("");
    try {
      const results = await Promise.all(selected.map(async (item) => {
        const startDate = item.startDate || oneYearAgo();
        const symbols = [...new Set([...item.holdings.map((holding) => holding.symbol), profile.benchmark || "SPY"])];
        const entries = await Promise.all(symbols.map(async (symbol) =>
          [symbol, await fetchHistory(symbol, startDate, today())]
        ));
        return { name: item.name, id: item.id, ...calculatePortfolio(item, Object.fromEntries(entries), profile.benchmark) };
      }));
      setComparisonResults(results);
    } catch (error) {
      setComparisonResults([]);
      setComparisonError(error.message || "Selected portfolios could not be compared.");
    } finally {
      setComparisonLoading(false);
    }
  };

  const searchMarket = async (event) => {
    event.preventDefault();
    setSearching(true);
    setSearchError("");
    try {
      const params = new URLSearchParams({ category, q: query.trim() });
      const response = await fetch(`${BACKEND_URL}/portfolio/market-search?${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || `Market search failed (${response.status}).`);
      setSearchResults(body.assets || []);
      if (!body.assets?.length) setSearchError("No matching assets were returned. Try another search term or category.");
    } catch (error) {
      setSearchResults([]);
      setSearchError(error.message || "Market search failed.");
    } finally {
      setSearching(false);
    }
  };

  const addHolding = (asset) => {
    if (!portfolio || portfolio.holdings.some((item) => item.symbol === asset.symbol)) return;
    updatePortfolio((item) => ({
      ...item,
      holdings: [...item.holdings, {
        symbol: asset.symbol,
        name: asset.name || asset.symbol,
        category: asset.category,
        type: asset.type,
        industry: asset.industry || "",
        allocationInput: "1000",
        forecastReturn: 8,
      }],
    }));
  };

  const removePortfolio = () => {
    if (!portfolio || !window.confirm(`Delete portfolio "${portfolio.name}" from your MongoDB workspace?`)) return;
    const remaining = portfolios.filter((item) => item.id !== portfolio.id);
    setPortfolios(remaining);
    setSelectedId(remaining[0]?.id || "");
  };

  const riskLevel = calculations && !calculations.error
    ? profile.riskTolerance === "Conservative"
      ? calculations.volatility >= 0.2 || calculations.maxDrawdown <= -0.25 ? "High"
        : calculations.volatility >= 0.1 || calculations.maxDrawdown <= -0.12 ? "Moderate" : "Lower"
      : profile.riskTolerance === "Aggressive"
        ? calculations.volatility >= 0.4 || calculations.maxDrawdown <= -0.5 ? "High"
          : calculations.volatility >= 0.25 || calculations.maxDrawdown <= -0.3 ? "Moderate" : "Lower"
        : calculations.volatility >= 0.3 || calculations.maxDrawdown <= -0.35 ? "High"
          : calculations.volatility >= 0.18 || calculations.maxDrawdown <= -0.2 ? "Moderate" : "Lower"
    : "—";

  return (
    <section className="portfolio-lookout">
      <header className="portfolio-header">
        <div>
          <span className="portfolio-eyebrow">MARKET WORKSPACE</span>
          <h2>Portfolio lookout</h2>
          <p>Build and monitor multiple hypothetical portfolios with market history, risk measures, allocation, and editable return assumptions.</p>
        </div>
        <span className="portfolio-local-badge" role="status" aria-live="polite">
          {workspaceStatus === "loading" ? "Loading MongoDB…"
            : workspaceStatus === "saving" ? "Saving to MongoDB…"
              : workspaceStatus === "error" ? "MongoDB unavailable"
                : "Saved to MongoDB"}
        </span>
      </header>

      {storageError && <div className="portfolio-alert" role="alert">{storageError}</div>}
      {profileError && <div className="portfolio-alert" role="alert">{profileError}</div>}
      {sessionError && <div className="portfolio-alert" role="alert">{sessionError}</div>}
      {workspaceError && (
        <div className="portfolio-alert" role="alert">
          {workspaceError}{" "}
          <button
            className="portfolio-secondary-button"
            type="button"
            onClick={() => setWorkspaceLoadAttempt((attempt) => attempt + 1)}
          >
            Retry MongoDB
          </button>
        </div>
      )}

      <div className="portfolio-workspace">
        <aside className="portfolio-sidebar">
          <div className="portfolio-sidebar-title">
            <div><strong>Your portfolios</strong><span>{portfolios.length} saved</span></div>
          </div>
          <div className="portfolio-list">
            {portfolios.map((item) => (
              <button
                className={`portfolio-list-item${portfolio?.id === item.id ? " active" : ""}`}
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                type="button"
              >
                <span>{item.name}</span><small>{item.holdings.length} assets</small>
              </button>
            ))}
            {!portfolios.length && <p className="portfolio-empty-list">Create a portfolio to start tracking a mix of assets.</p>}
          </div>
          <form
            className="portfolio-create-form"
            onSubmit={(event) => { event.preventDefault(); createNewPortfolio(); }}
          >
            <label htmlFor="portfolio-new-name">New portfolio</label>
            <div><input id="portfolio-new-name" value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={60} placeholder="e.g. Long-term mix" />
              <button type="submit" disabled={!newName.trim()}>Create</button></div>
          </form>
        </aside>

        {portfolio ? (
          <main className="portfolio-main">
            <section className="portfolio-panel">
              <div className="portfolio-panel-head">
                <div><span className="portfolio-eyebrow">SIMULATION CONTEXT</span><h3>Profiles and saved sessions</h3></div>
                <button className="portfolio-secondary-button" type="button" onClick={saveSession}>Save current session</button>
              </div>
              <div className="portfolio-context-grid">
                <div className="portfolio-context-block">
                  <label>Active investor profile
                    <select value={profile.id} onChange={(event) => setProfileId(event.target.value)}>
                      {profiles.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <form className="portfolio-inline-form" onSubmit={createProfile}>
                    <label htmlFor="portfolio-profile-name">Create profile</label>
                    <input id="portfolio-profile-name" value={newProfileName} onChange={(event) => setNewProfileName(event.target.value)} maxLength={50} placeholder="e.g. Retirement, Growth" />
                    <button type="submit" disabled={!newProfileName.trim()}>Add profile</button>
                  </form>
                  <div className="portfolio-settings-grid portfolio-profile-settings">
                    <label>Risk tolerance
                      <select value={profile.riskTolerance} onChange={(event) => updateProfile({ riskTolerance: event.target.value })}>
                        {["Conservative", "Moderate", "Aggressive"].map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </label>
                    <label>Investment goal
                      <select value={profile.investmentGoal} onChange={(event) => updateProfile({ investmentGoal: event.target.value })}>
                        {["Capital preservation", "Income", "Long-term growth", "Maximum growth"].map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </label>
                    <label>Profile starting capital (USD)
                      <input type="number" min="1" step="100" value={profile.initialCapital ?? 10000} onChange={(event) => updateProfile({ initialCapital: event.target.value })} />
                    </label>
                    <label>Target horizon (years)
                      <input type="number" min="1" max="60" value={profile.horizonYears ?? 5} onChange={(event) => updateProfile({ horizonYears: event.target.value })} />
                    </label>
                    <label>Monthly contribution (USD)
                      <input type="number" min="0" step="25" value={profile.monthlyContribution ?? 0} onChange={(event) => updateProfile({ monthlyContribution: event.target.value })} />
                    </label>
                    <label>Comparison benchmark
                      <select value={profile.benchmark || "SPY"} onChange={(event) => updateProfile({ benchmark: event.target.value })}>
                        {["SPY", "QQQ", "IWM", "AGG"].map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <label>Rebalance assumption
                      <select value={profile.rebalanceFrequency || "Annually"} onChange={(event) => updateProfile({ rebalanceFrequency: event.target.value })}>
                        {["Never", "Quarterly", "Annually"].map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </label>
                  </div>
                  <p className="portfolio-chart-note">Profiles are saved with your MongoDB workspace. Risk labels use your selected tolerance; the target horizon and rebalance preference are context only. Forecast duration is set per portfolio, and contribution projections use that duration.</p>
                </div>
                <div className="portfolio-context-block">
                  <div className="portfolio-subhead"><strong>Saved simulation sessions</strong><span>{sessions.length} saved</span></div>
                  {sessions.length ? (
                    <div className="portfolio-session-list">
                      {sessions.map((session) => (
                        <div className="portfolio-session-row" key={session.id}>
                          <div><strong>{session.name || session.portfolio.name}</strong><small>{session.savedAt ? new Date(session.savedAt).toLocaleString() : "Saved session"}</small></div>
                          <button type="button" onClick={() => restoreSession(session)}>Restore</button>
                          <button className="portfolio-session-delete" type="button" aria-label={`Delete saved session ${session.name || session.portfolio.name}`} onClick={() => setSessions((current) => current.filter((item) => item.id !== session.id))}>×</button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="portfolio-empty-list">Save a session to preserve this portfolio, its holdings, assumptions, and active profile for later.</p>}
                </div>
              </div>
            </section>

            <section className="portfolio-panel portfolio-settings">
              <div className="portfolio-panel-head">
                <div><span className="portfolio-eyebrow">PORTFOLIO SETUP</span><h3>{portfolio.name}</h3></div>
                <button className="portfolio-danger-button" type="button" onClick={removePortfolio}>Delete portfolio</button>
              </div>
              <div className="portfolio-settings-grid">
                <label>Initial investment (USD)
                  <input type="number" min="1" step="100" value={portfolio.initialCapital} onChange={(event) => updatePortfolio((item) => ({ ...item, initialCapital: event.target.value }))} />
                </label>
                <label>Historical start date
                  <input type="date" max={today()} value={portfolio.startDate} onChange={(event) => updatePortfolio((item) => ({ ...item, startDate: event.target.value }))} />
                </label>
                <label>Forecast horizon
                  <select value={portfolio.forecastYears} onChange={(event) => updatePortfolio((item) => ({ ...item, forecastYears: Number(event.target.value) }))}>
                    {[1, 3, 5, 10].map((years) => <option key={years} value={years}>{years} year{years > 1 ? "s" : ""}</option>)}
                  </select>
                </label>
              </div>
              <p className="portfolio-help">Enter a dollar amount or a percentage for each asset (for example, <strong>$1,000</strong> or <strong>25%</strong>). Percentages use the initial investment. Unallocated cash is held flat.</p>
            </section>

            <section className="portfolio-panel">
              <div className="portfolio-panel-head">
                <div><span className="portfolio-eyebrow">SIDE-BY-SIDE REVIEW</span><h3>Compare portfolios</h3></div>
                <button className="portfolio-secondary-button" type="button" onClick={comparePortfolios} disabled={comparisonLoading || !portfolios.length}>{comparisonLoading ? "Comparing…" : "Run comparison"}</button>
              </div>
              <div className="portfolio-compare-select">
                {portfolios.map((item) => (
                  <label key={item.id}><input type="checkbox" checked={compareIds.includes(item.id)} onChange={(event) => setCompareIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span>{item.name}</span><small>{item.holdings.length} assets</small></label>
                ))}
              </div>
              {comparisonError && <p className="portfolio-inline-error" role="alert">{comparisonError}</p>}
              {comparisonResults.length > 0 && (
                <div className="portfolio-table-wrap">
                  <table className="portfolio-compare-table">
                    <thead><tr><th>Portfolio</th><th>Value</th><th>Total return</th><th>CAGR</th><th>Volatility</th><th>Max drawdown</th><th>Sharpe</th><th>HHI</th></tr></thead>
                    <tbody>{comparisonResults.map((result) => (
                      <tr key={result.id}>
                        <th scope="row">{result.name}</th>
                        {result.error
                          ? <td colSpan="7">{result.error}</td>
                          : <><td>{formatMoney(result.currentValue)}</td><td>{formatPercent(result.totalReturn)}</td><td>{formatPercent(result.cagr)}</td><td>{formatPercent(result.volatility)}</td><td>{formatPercent(result.maxDrawdown)}</td><td>{Number.isFinite(result.sharpe) ? result.sharpe.toFixed(2) : "—"}</td><td>{(result.hhi * 10000).toFixed(0)}</td></>}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="portfolio-panel">
              <div className="portfolio-panel-head"><div><span className="portfolio-eyebrow">POLYGON MARKET SEARCH</span><h3>Add assets</h3></div></div>
              <form className="portfolio-search" onSubmit={searchMarket}>
                <label>Category
                  <select value={category} disabled={searching} onChange={(event) => { setCategory(event.target.value); setSearchResults([]); setSearchError(""); }}>
                    {CATEGORIES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <label>Company, ticker, or asset
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this market category" maxLength={120} disabled={searching} />
                </label>
                <button type="submit" disabled={searching}>{searching ? "Searching…" : "Search market"}</button>
              </form>
              {searchError && <p className="portfolio-inline-error" role="status">{searchError}</p>}
              {!!searchResults.length && (
                <div className="portfolio-search-results">
                  {searchResults.map((asset) => (
                    <div className="portfolio-search-result" key={asset.symbol}>
                      <div><strong>{asset.symbol}</strong><span>{asset.name}</span><small>{asset.industry || assetClassification(asset)}</small></div>
                      <button type="button" onClick={() => addHolding(asset)} disabled={portfolio.holdings.some((item) => item.symbol === asset.symbol)}>
                        {portfolio.holdings.some((item) => item.symbol === asset.symbol) ? "Added" : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="portfolio-panel">
              <div className="portfolio-panel-head"><div><span className="portfolio-eyebrow">HOLDINGS</span><h3>Assets and assumptions</h3></div><span className="portfolio-count">{portfolio.holdings.length} holdings</span></div>
              {portfolio.holdings.length ? (
                <div className="portfolio-holdings">
                  {portfolio.holdings.map((holding, index) => (
                    <div className="portfolio-holding-row" key={holding.symbol}>
                      <div className="portfolio-holding-name"><span className="portfolio-holding-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{holding.symbol}</strong><span>{holding.name}</span><small>{holding.industry || assetClassification(holding)}</small></div></div>
                      <label>Allocation
                        <input value={holding.allocationInput} onChange={(event) => updatePortfolio((item) => ({ ...item, holdings: item.holdings.map((row) => row.symbol === holding.symbol ? { ...row, allocationInput: event.target.value } : row) }))} aria-label={`${holding.symbol} allocation in dollars or percent`} />
                      </label>
                      <label>Annual return assumption
                        <div className="portfolio-percent-input"><input type="number" min="-100" max="1000" step="0.5" value={holding.forecastReturn} onChange={(event) => updatePortfolio((item) => ({ ...item, holdings: item.holdings.map((row) => row.symbol === holding.symbol ? { ...row, forecastReturn: event.target.value } : row) }))} aria-label={`${holding.symbol} annual return assumption`} /><span>%</span></div>
                      </label>
                      <button className="portfolio-remove-button" type="button" onClick={() => updatePortfolio((item) => ({ ...item, holdings: item.holdings.filter((row) => row.symbol !== holding.symbol) }))} aria-label={`Remove ${holding.symbol}`}>×</button>
                    </div>
                  ))}
                </div>
              ) : <p className="portfolio-empty-list">Search for a company or asset above, then add it to this portfolio.</p>}
            </section>

            {historyLoading && <div className="portfolio-status">Loading historical market prices for this portfolio…</div>}
            {historyError && <div className="portfolio-alert" role="alert">{historyError}</div>}
            {calculations?.error && !historyLoading && <div className="portfolio-alert" role="status">{calculations.error}</div>}

            {calculations && !calculations.error && (
              <>
                <section className="portfolio-metric-grid">
                  <article className="portfolio-metric-card portfolio-metric-primary"><span>Current portfolio value</span><strong>{formatMoney(calculations.currentValue)}</strong><small>{formatPercent(calculations.totalReturn)} since {formatDate(calculations.startDate)}</small></article>
                  <article className="portfolio-metric-card"><span>Annualized return (CAGR)</span><strong>{formatPercent(calculations.cagr)}</strong><small>Historical buy-and-hold estimate</small></article>
                  <article className="portfolio-metric-card"><span>Annualized volatility</span><strong>{formatPercent(calculations.volatility)}</strong><small>Risk level: <b>{riskLevel}</b></small></article>
                  <article className="portfolio-metric-card"><span>Maximum drawdown</span><strong>{formatPercent(calculations.maxDrawdown)}</strong><small>Largest peak-to-trough decline</small></article>
                  <article className="portfolio-metric-card"><span>Sharpe ratio</span><strong>{Number.isFinite(calculations.sharpe) ? calculations.sharpe.toFixed(2) : "—"}</strong><small>Return per unit of volatility</small></article>
                  <article className="portfolio-metric-card"><span>Market beta</span><strong>{Number.isFinite(calculations.beta) ? calculations.beta.toFixed(2) : "—"}</strong><small>Relative to {profile.benchmark}</small></article>
                  <article className="portfolio-metric-card"><span>Diversification score</span><strong>{calculations.diversificationScore.toFixed(0)} / 100</strong><small>HHI-normalized across current positions</small></article>
                  <article className="portfolio-metric-card"><span>Effective holdings</span><strong>{calculations.effectiveHoldings.toFixed(1)}</strong><small>Inverse concentration index</small></article>
                </section>

                <section className="portfolio-panel">
                  <div className="portfolio-panel-head"><div><span className="portfolio-eyebrow">HISTORICAL PERFORMANCE</span><h3>Portfolio value over time</h3></div><span className="portfolio-date-range">{formatDate(calculations.startDate)} – {formatDate(calculations.endDate)}</span></div>
                  <div className="portfolio-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 14, left: 4, bottom: 0 }}>
                        <CartesianGrid stroke="#e9efed" strokeDasharray="3 5" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "2-digit" })} tickLine={false} axisLine={false} minTickGap={28} />
                        <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} width={50} />
                        <Tooltip labelFormatter={formatDate} formatter={(value, name) => [formatMoney(value), name === "benchmark" ? `${profile.benchmark} (same initial capital)` : "Portfolio"]} />
                        <Line type="monotone" dataKey="value" name="Portfolio" stroke="#32766b" strokeWidth={2.5} dot={false} connectNulls />
                        <Line type="monotone" dataKey="benchmark" name="benchmark" stroke="#c18b52" strokeWidth={1.7} strokeDasharray="5 4" dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="portfolio-chart-note">Historical simulation uses the first available adjusted close on or after the selected date, then holds each position. It excludes taxes, fees, slippage, and any dividends not reflected in the provider's adjusted prices.</p>
                </section>

                <div className="portfolio-analysis-grid">
                  <section className="portfolio-panel">
                    <div className="portfolio-panel-head"><div><span className="portfolio-eyebrow">CURRENT MIX</span><h3>Asset allocation</h3></div></div>
                    <div className="portfolio-allocation-layout">
                      <div className="portfolio-donut">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={calculations.allocation} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={2}>{calculations.allocation.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => formatMoney(value)} /></PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="portfolio-allocation-legend">
                        {calculations.allocation.map((item, index) => <div key={item.name}><i style={{ background: COLORS[index % COLORS.length] }} /><span>{item.name}</span><strong>{formatPercent(item.weight)}</strong></div>)}
                      </div>
                    </div>
                  </section>

                  <section className="portfolio-panel">
                    <div className="portfolio-panel-head"><div><span className="portfolio-eyebrow">INDUSTRY / ASSET CLASS</span><h3>Concentration by group</h3></div></div>
                    <div className="portfolio-industry-list">
                      {calculations.industries.map((item) => <div className="portfolio-industry-row" key={item.name}><span>{item.name}</span><div><i style={{ width: `${Math.min(100, item.weight * 100)}%` }} /></div><strong>{formatPercent(item.weight)}</strong></div>)}
                    </div>
                    <p className="portfolio-chart-note">Industry labels use Polygon company classifications when present; otherwise exposure is grouped by market and instrument type.</p>
                    <div className="portfolio-risk-details">
                      <span>Sharpe ratio <strong>{Number.isFinite(calculations.sharpe) ? calculations.sharpe.toFixed(2) : "—"}</strong></span>
                      <span>Sortino ratio <strong>{Number.isFinite(calculations.sortino) ? calculations.sortino.toFixed(2) : "—"}</strong></span>
                      <span>Beta vs. {profile.benchmark} <strong>{Number.isFinite(calculations.beta) ? calculations.beta.toFixed(2) : "—"}</strong></span>
                      <span>Market correlation <strong>{Number.isFinite(calculations.correlation) ? calculations.correlation.toFixed(2) : "—"}</strong></span>
                      <span>Concentration (HHI) <strong>{(calculations.hhi * 10000).toFixed(0)}</strong></span>
                      <span>Largest exposure <strong>{calculations.largestHolding?.name || "—"} {formatPercent(calculations.largestHolding?.weight)}</strong></span>
                    </div>
                  </section>
                </div>

                <section className="portfolio-panel">
                  <div className="portfolio-panel-head"><div><span className="portfolio-eyebrow">USER-DEFINED SCENARIOS</span><h3>Forecast and return breakdown</h3></div></div>
                  <div className="portfolio-projection">
                    <strong>{formatMoney(calculations.forecastValue)}</strong>
                    <span>Estimated change of {formatMoney(calculations.forecastValue - calculations.currentValue)} over {calculations.forecastYears} year{calculations.forecastYears > 1 ? "s" : ""}, based on the annual return assumptions entered for each holding.</span>
                  </div>
                  <div className="portfolio-scenario-grid">
                    <article><span>Lower-return scenario</span><strong>{formatMoney(projectScenario(calculations, -0.1))}</strong><small>Each assumption reduced by 10 percentage points</small></article>
                    <article><span>Entered assumptions</span><strong>{formatMoney(calculations.forecastValue)}</strong><small>Per-holding inputs as entered above</small></article>
                    <article><span>Higher-return scenario</span><strong>{formatMoney(projectScenario(calculations, 0.1))}</strong><small>Each assumption increased by 10 percentage points</small></article>
                    <article><span>With monthly contributions</span><strong>{formatMoney(forecastWithContributions)}</strong><small>{formatMoney(monthlyContribution)} per month; contributions are not included in historical results</small></article>
                  </div>
                  <div className="portfolio-table-wrap">
                    <table className="portfolio-compare-table portfolio-forecast-table">
                      <thead><tr><th>Forecast driver</th><th>Current weight</th><th>Annual assumption</th><th>Projected value</th><th>Change contribution</th></tr></thead>
                      <tbody>{forecastBreakdownSorted.map((holding) => (
                        <tr key={holding.symbol}><th scope="row"><strong>{holding.symbol}</strong><small>{holding.name}</small></th><td>{formatPercent(holding.weight)}</td><td>{formatPercent(Number(holding.forecastReturn) / 100)}</td><td>{formatMoney(holding.projectedValue)}</td><td className={holding.projectedChange < 0 ? "negative" : ""}>{formatMoney(holding.projectedChange)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <p className="portfolio-chart-note">Scenarios are sensitivities around your assumptions, not probability-weighted forecasts. Cash is assumed to earn 0%; outputs exclude taxes and fees. Recurring contributions are projected with monthly compounding using the entered portfolio assumptions. Historical results do not predict future returns.</p>
                </section>

                <section className="portfolio-panel">
                  <div className="portfolio-panel-head">
                    <div><span className="portfolio-eyebrow">HISTORICAL WHAT-IF ANALYZER</span><h3>Compare diversification strategies</h3></div>
                    <label className="portfolio-ranking-control">Rank by
                      <select value={strategyMetric} onChange={(event) => setStrategyMetric(event.target.value)}>
                        <option value="sharpe">Highest Sharpe ratio</option>
                        <option value="cagr">Highest annualized return</option>
                        <option value="volatility">Lowest volatility</option>
                        <option value="maxDrawdown">Shallowest max drawdown</option>
                      </select>
                    </label>
                  </div>
                  {rankedStrategies.length ? (
                    <div className="portfolio-table-wrap">
                      <table className="portfolio-compare-table">
                        <thead><tr><th>Rank</th><th>Historical allocation rule</th><th>Ending value</th><th>CAGR</th><th>Volatility</th><th>Max drawdown</th><th>Sharpe</th></tr></thead>
                        <tbody>{rankedStrategies.map((strategy, index) => (
                          <tr key={strategy.name}><td>{index + 1}</td><th scope="row">{strategy.name}</th><td>{formatMoney(strategy.currentValue)}</td><td>{formatPercent(strategy.cagr)}</td><td>{formatPercent(strategy.volatility)}</td><td>{formatPercent(strategy.maxDrawdown)}</td><td>{Number.isFinite(strategy.sharpe) ? strategy.sharpe.toFixed(2) : "—"}</td></tr>
                        ))}</tbody>
                      </table>
                    </div>
                  ) : <p className="portfolio-empty-list">Historical strategy comparisons require valid price history for the selected holdings.</p>}
                  <p className="portfolio-chart-note">What-if backtests apply each allocation rule to your current holdings over the selected historical window, without future knowledge. Return-tilt rules use that same window to select assets and therefore have look-ahead bias; all results exclude taxes, fees, rebalancing costs, and slippage. Past performance is not predictive.</p>
                </section>
              </>
            )}
          </main>
        ) : (
          <main className="portfolio-main portfolio-welcome">
            <div><span className="portfolio-eyebrow">START A PORTFOLIO</span><h3>Create your first portfolio</h3><p>Save multiple baskets locally, search supported Polygon market categories, and review simulated history and risk measures.</p></div>
          </main>
        )}
      </div>
    </section>
  );
}
