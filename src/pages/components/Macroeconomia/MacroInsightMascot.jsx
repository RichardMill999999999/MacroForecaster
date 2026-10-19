import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import astronaut from "../../../variable/assets/fotos/space-dance-nasa.gif";
import "./MacroInsightMascot.css";

const BACKEND_URL = "http://localhost:5000";
const ROAM_POSITIONS = ["right", "left"];

function compactContext(context, contextType) {
  if (!context || typeof context !== "object") return {};
  if (contextType === "commodity") {
    return {
      commodity: context.commodity,
      recentPriceHistory: context.recentPriceHistory?.slice(-30),
      relatedNews: context.relatedNews?.slice(0, 6),
      countryDistribution: context.countryDistribution
        ? { ...context.countryDistribution, items: context.countryDistribution.items?.slice(0, 8) }
        : null,
      loading: context.loading,
      errors: context.errors,
    };
  }
  if (contextType === "country-profile") {
    return {
      country: context.country,
      indicators: context.indicators?.slice(0, 16),
      selectedIndicator: context.selectedIndicator
        ? { ...context.selectedIndicator, observations: context.selectedIndicator.observations?.slice(-15) }
        : null,
      relatedNews: context.relatedNews?.slice(0, 8),
      assessment: context.assessment?.slice(0, 1800),
      loading: context.loading,
      dataError: context.dataError,
    };
  }
  if (contextType === "country-comparison") {
    return {
      analysis: context.analysis?.slice(0, 1800),
      selectedIndicator: context.selectedIndicator
        ? { ...context.selectedIndicator, chartData: context.selectedIndicator.chartData?.slice(-15) }
        : null,
      indicatorRankings: context.indicatorRankings?.slice(0, 8),
      regionalGroups: context.regionalGroups?.slice(0, 5),
      countries: context.countries?.slice(0, 6).map((country) => ({
        name: country.name,
        country: country.country,
        relativeEconomicScale: country.relativeEconomicScale,
        indicators: Object.fromEntries(
          Object.entries(country.indicators || {}).slice(0, 14).map(([key, indicator]) => [
            key,
            { latest: indicator.latest, recentObservations: indicator.recentObservations?.slice(-8) },
          ])
        ),
      })),
    };
  }
  return {
    selectedCountries: context.selectedCountries?.slice(0, 6),
    workspace: context.workspace,
  };
}

function getVisibleSection() {
  if (typeof document === "undefined") return "";
  const headings = [...document.querySelectorAll("h1, h2, h3")]
    .filter((heading) => {
      const rect = heading.getBoundingClientRect();
      return rect.bottom > 80 && rect.top < window.innerHeight - 60 && heading.textContent?.trim();
    })
    .slice(0, 3)
    .map((heading) => heading.textContent.trim().replace(/\s+/g, " ").slice(0, 100));
  return headings.join(" · ");
}

function getVisibleScreenText() {
  if (typeof document === "undefined") return "";
  const seen = new Set();
  return [...document.querySelectorAll("h1, h2, h3, p, th, td, button, [role=heading]")]
    .filter((element) => {
      if (element.closest(".macro-insight-mascot")) return false;
      const rect = element.getBoundingClientRect();
      return rect.bottom > 70 && rect.top < window.innerHeight - 50 && element.textContent?.trim();
    })
    .map((element) => element.textContent.trim().replace(/\s+/g, " ").slice(0, 240))
    .filter((text) => {
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    })
    .slice(0, 35)
    .join("\n")
    .slice(0, 6000);
}

export default function MacroInsightMascot({ context, contextType, contextKey, countries = [] }) {
  const [insight, setInsight] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [positionIndex, setPositionIndex] = useState(0);
  const requestActive = useRef(false);
  const compactedContext = useMemo(() => compactContext(context, contextType), [context, contextType]);

  const refreshInsight = useCallback(async () => {
    if (requestActive.current || document.visibilityState === "hidden") return;
    requestActive.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${BACKEND_URL}/AI/macro-insight`, {
        page: window.location.pathname,
        visibleSection: getVisibleSection(),
        visibleScreenText: getVisibleScreenText(),
        focus: contextType || "global economy",
        countries,
        context: compactedContext,
      }, { timeout: 90000, headers: { "Content-Type": "application/json" } });
      if (!response.data?.insight) throw new Error("DeepSeek returned no insight.");
      setInsight(response.data.insight);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "The macro insight could not be loaded.");
    } finally {
      requestActive.current = false;
      setLoading(false);
    }
  }, [compactedContext, contextType, countries]);

  useEffect(() => {
    const initial = window.setTimeout(refreshInsight, 1200);
    const interval = window.setInterval(refreshInsight, 60000);
    const roam = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setPositionIndex((index) => (index + 1) % ROAM_POSITIONS.length);
      }
    }, 22000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.clearInterval(roam);
    };
  }, [refreshInsight, contextKey]);

  const position = ROAM_POSITIONS[positionIndex];

  return (
    <aside className={`macro-insight-mascot ${position}`} aria-label="DeepSeek macro insight">
      {expanded && (
        <section className="macro-insight-bubble" aria-live="polite">
          <header>
            <strong>Orbit · DeepSeek insight</strong>
            <div>
              <button type="button" onClick={refreshInsight} disabled={loading} aria-label="Refresh insight">
                {loading ? "…" : "↻"}
              </button>
              <button type="button" onClick={() => setExpanded(false)} aria-label="Hide insight">
                ×
              </button>
            </div>
          </header>
          <p>{loading && !insight ? "Reading the data on this screen…" : insight || error || "I’ll share a short, evidence-based insight about this screen."}</p>
          {error && insight && <small>{error}</small>}
          <footer>{loading ? "Updating" : "Refreshes every minute · based on displayed data and available news"}</footer>
        </section>
      )}
      <button
        className="macro-insight-avatar"
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-label={expanded ? "Hide DeepSeek insight" : "Show DeepSeek insight"}
        title="Open DeepSeek macro insight"
      >
        <img src={astronaut} alt="" aria-hidden="true" />
        {!expanded && <span>{loading ? "…" : "Insight"}</span>}
      </button>
    </aside>
  );
}
