import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";
import astronaut from "../../../variable/assets/fotos/space-dance-nasa.gif";
import "./MacroInsightMascot.css";

function compactContext(context, contextType) {
  if (!context || typeof context !== "object") return {};
  if (contextType === "commodity") {
    return {
      commodity: context.commodity,
      recentPriceHistory: context.recentPriceHistory?.slice(-30),
      relatedNews: context.relatedNews?.slice(0, 6).map((article) => ({
        title: article.title,
        abstract: article.abstract?.slice(0, 500),
        published: article.published,
        source: article.source,
      })),
      countryDistribution: context.countryDistribution
        ? { ...context.countryDistribution, items: context.countryDistribution.items?.slice(0, 8) }
        : null,
    };
  }
  if (contextType === "country-profile") {
    return {
      country: context.country,
      indicators: context.indicators?.map((indicator) => ({
        name: indicator.name,
        value: indicator.value,
        unit: indicator.unit,
        year: indicator.year,
        changeVsPreviousObservationPct: indicator.changeVsPreviousObservationPct,
        recentObservations: indicator.recentObservations?.slice(-8),
      })),
      selectedIndicator: context.selectedIndicator
        ? { ...context.selectedIndicator, observations: context.selectedIndicator.observations?.slice(-60) }
        : null,
      relatedNews: context.relatedNews?.slice(0, 6).map((article) => ({
        title: article.title,
        abstract: article.abstract?.slice(0, 500),
        published: article.published,
        source: article.source,
      })),
      assessment: context.assessment?.slice(0, 1000),
    };
  }
  if (contextType === "country-comparison") {
    return {
      analysis: context.analysis?.slice(0, 1000),
      selectedIndicator: context.selectedIndicator
        ? { ...context.selectedIndicator, chartData: context.selectedIndicator.chartData?.slice(-60) }
        : null,
      indicatorRankings: context.indicatorRankings?.slice(0, 6),
      regionalGroups: context.regionalGroups?.slice(0, 3),
      countries: context.countries?.slice(0, 6).map((country) => ({
        name: country.name,
        country: country.country,
        relativeEconomicScale: country.relativeEconomicScale,
        indicators: Object.fromEntries(
          Object.entries(country.indicators || {}).map(([key, indicator]) => [
            key,
            { latest: indicator.latest, recentObservations: indicator.recentObservations?.slice(-6) },
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

function readSessionValue(key, fallback) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function readConversationValue(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) return JSON.parse(stored) ?? fallback;
  } catch (storageError) {
    console.warn("Unable to read the saved Orbit conversation.", storageError);
  }

  try {
    const legacyStored = sessionStorage.getItem(key);
    if (legacyStored === null) return fallback;
    const conversation = JSON.parse(legacyStored) ?? fallback;
    try {
      localStorage.setItem(key, legacyStored);
    } catch (storageError) {
      console.warn("Unable to keep the Orbit conversation between visits.", storageError);
    }
    return conversation;
  } catch (storageError) {
    console.warn("Unable to read the Orbit conversation for this tab.", storageError);
    return fallback;
  }
}

function getRequestError(requestError, fallback) {
  if (requestError.response?.data?.error) return requestError.response.data.error;
  if (requestError.code === "ERR_NETWORK") {
    return `Cannot reach the API at ${BACKEND_URL}. Start the Flask API with start.bat or set VITE_BACKEND_URL.`;
  }
  return requestError.message || fallback;
}

function createInsightSubjectKey(page, focus, countries, context) {
  const commodity = context?.commodity;
  const commodityName = commodity && typeof commodity === "object"
    ? commodity.name || commodity.symbol || ""
    : commodity || "";
  return JSON.stringify([
    page,
    focus,
    countries.filter((name) => typeof name === "string").map((name) => name.toLowerCase()).sort(),
    String(commodityName).slice(0, 120),
  ]);
}

function getVisibleSection() {
  if (typeof document === "undefined") return "";
  const headings = [...document.querySelectorAll("h1, h2, h3")]
    .filter((heading) => {
      if (heading.closest(".macro-insight-stage, .ai-chat-widget")) return false;
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
      if (element.closest(".macro-insight-stage, .ai-chat-widget")) return false;
      const rect = element.getBoundingClientRect();
      return rect.bottom > 70 && rect.top < window.innerHeight - 50 && element.textContent?.trim();
    })
    .map((element) => element.textContent.trim().replace(/\s+/g, " ").slice(0, 240))
    .filter((text) => {
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    })
    .slice(0, 24)
    .join("\n")
    .slice(0, 4000);
}

export default function MacroInsightMascot({
  context,
  contextType,
  contextKey,
  countries = [],
  globeRef,
  globeFocus,
  targetCountry,
}) {
  const pageKey = window.location.pathname;
  const focusKeyForStorage = contextType || "global economy";
  const countriesKey = countries.filter((name) => typeof name === "string").slice().sort().join("|");
  const insightHistoryKey = `macro-insight-history:${pageKey}`;
  const insightCacheKey = `macro-insight-cache:${pageKey}:${focusKeyForStorage}:${countriesKey}`;
  const conversationStorageKey = `macro-insight-chat:${pageKey}:${focusKeyForStorage}:${countriesKey}`;
  const insightCache = useRef(null);
  const insightHistory = useRef(null);
  const conversationHistory = useRef(null);
  if (insightCache.current === null) {
    const storedCache = readSessionValue(insightCacheKey, {});
    insightCache.current = typeof storedCache?.insight === "string" ? storedCache : {};
  }
  if (insightHistory.current === null) {
    const storedHistory = readSessionValue(insightHistoryKey, []);
    insightHistory.current = Array.isArray(storedHistory)
      ? storedHistory.filter((entry) => typeof entry?.insight === "string").slice(-8)
      : [];
  }
  if (conversationHistory.current === null) {
    const storedConversation = readConversationValue(conversationStorageKey, []);
    conversationHistory.current = Array.isArray(storedConversation)
      ? storedConversation.filter((message) =>
        ["user", "assistant"].includes(message?.role) && typeof message.content === "string"
      ).slice(-14)
      : [];
  }
  const [insight, setInsight] = useState(() => insightCache.current.insight || "");
  const [chatMessages, setChatMessages] = useState(() => conversationHistory.current);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [chatMode, setChatMode] = useState("closed");
  const requestActive = useRef(false);
  const flightRef = useRef(null);
  const bubbleRef = useRef(null);
  const messagesRef = useRef(null);
  const flightPosition = useRef(null);
  const activeTarget = useRef("");
  const approachPath = useRef(null);
  const compactedContext = useMemo(() => compactContext(context, contextType), [context, contextType]);
  const targetKey = targetCountry
    ? `${targetCountry.name}:${targetCountry.lat}:${targetCountry.lng}`
    : "";
  const focusKey = `${globeFocus?.lat ?? 0}:${globeFocus?.lng ?? 0}`;
  const requestContext = useRef(null);
  requestContext.current = { compactedContext, contextType, countries };

  const persistConversation = useCallback((messages) => {
    conversationHistory.current = messages.slice(-14);
    setChatMessages(conversationHistory.current);
    try {
      localStorage.setItem(conversationStorageKey, JSON.stringify(conversationHistory.current));
    } catch (storageError) {
      console.warn("Unable to keep the Orbit conversation between visits.", storageError);
    }
  }, [conversationStorageKey]);

  const refreshInsight = useCallback(async () => {
    if (requestActive.current || document.visibilityState === "hidden") return;
    requestActive.current = true;
    setLoading(true);
    setError("");
    try {
      const currentContext = requestContext.current;
      const focus = currentContext.contextType || "global economy";
      const page = window.location.pathname;
      const cacheSubjectKey = createInsightSubjectKey(
        page, focus, currentContext.countries, currentContext.compactedContext
      );
      const cacheGeneratedAt = insightCache.current.generatedAt || new Date().toISOString();
      const response = await axios.post(`${BACKEND_URL}/AI/macro-insight`, {
        page,
        currentDate: new Date().toISOString(),
        visibleSection: getVisibleSection(),
        visibleScreenText: getVisibleScreenText(),
        focus,
        countries: currentContext.countries,
        context: currentContext.compactedContext,
        recentInsights: insightHistory.current,
        cachedInsight: insightCache.current.insight,
        cachedFingerprint: insightCache.current.fingerprint,
        cachedSubject: insightCache.current.subject,
        cachedSubjectKey: cacheSubjectKey,
        cachedGeneratedAt: cacheGeneratedAt,
      }, { timeout: 90000, headers: { "Content-Type": "application/json" } });
      if (!response.data?.insight) throw new Error("DeepSeek returned no insight.");
      const freshInsight = response.data.insight;
      setInsight(freshInsight);
      insightCache.current = {
        insight: freshInsight,
        fingerprint: response.data.fingerprint,
        subject: response.data.subject,
        subjectKey: cacheSubjectKey,
        generatedAt: response.data.generatedAt || cacheGeneratedAt,
      };
      try {
        sessionStorage.setItem(insightCacheKey, JSON.stringify(insightCache.current));
      } catch (storageError) {
        console.warn("Unable to persist the latest Orbit insight for this tab.", storageError);
      }
      if (!insightHistory.current.some((entry) => entry.insight === freshInsight)) {
        insightHistory.current = [
          ...insightHistory.current,
          { insight: freshInsight, focus: currentContext.contextType, at: new Date().toISOString() },
        ].slice(-8);
      }
      try {
        sessionStorage.setItem(insightHistoryKey, JSON.stringify(insightHistory.current));
      } catch (storageError) {
        console.warn("Unable to persist recent macro insights for this tab.", storageError);
      }
      if (!conversationHistory.current.some((message) =>
        message.role === "assistant" && message.content === freshInsight
      )) {
        persistConversation([
          ...conversationHistory.current,
          { role: "assistant", content: freshInsight, kind: "insight" },
        ]);
      }
      setExpanded(true);
    } catch (requestError) {
      setError(getRequestError(requestError, "The macro insight could not be loaded."));
    } finally {
      requestActive.current = false;
      setLoading(false);
    }
  }, [insightCacheKey, insightHistoryKey, persistConversation]);

  const submitQuestion = useCallback(async (event) => {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || requestActive.current || document.visibilityState === "hidden") return;
    requestActive.current = true;
    setChatLoading(true);
    setError("");
    try {
      const currentContext = requestContext.current;
      const response = await axios.post(`${BACKEND_URL}/AI/macro-insight`, {
        page: pageKey,
        currentDate: new Date().toISOString(),
        visibleSection: getVisibleSection(),
        visibleScreenText: getVisibleScreenText(),
        focus: currentContext.contextType || "global economy",
        countries: currentContext.countries,
        context: currentContext.compactedContext,
        recentInsights: insightHistory.current,
        question,
        conversationHistory: conversationHistory.current.slice(-12).map(({ role, content }) => ({ role, content })),
      }, { timeout: 90000, headers: { "Content-Type": "application/json" } });
      if (!response.data?.reply) throw new Error("DeepSeek returned no chat response.");
      const reply = response.data.reply;
      persistConversation([
        ...conversationHistory.current,
        { role: "user", content: question },
        { role: "assistant", content: reply, kind: response.data.mode === "insight" ? "insight" : "answer" },
      ]);
      setChatInput("");
      if (response.data.mode === "insight") {
        setInsight(reply);
        insightCache.current = {
          insight: reply,
          fingerprint: response.data.fingerprint,
          subject: response.data.subject,
          subjectKey: createInsightSubjectKey(
            pageKey,
            currentContext.contextType || "global economy",
            currentContext.countries,
            currentContext.compactedContext,
          ),
          generatedAt: response.data.generatedAt,
        };
        try {
          sessionStorage.setItem(insightCacheKey, JSON.stringify(insightCache.current));
        } catch (storageError) {
          console.warn("Unable to persist the latest Orbit insight for this tab.", storageError);
        }
        insightHistory.current = [
          ...insightHistory.current,
          { insight: reply, focus: currentContext.contextType, at: new Date().toISOString() },
        ].slice(-8);
        try {
          sessionStorage.setItem(insightHistoryKey, JSON.stringify(insightHistory.current));
        } catch (storageError) {
          console.warn("Unable to persist recent macro insights for this tab.", storageError);
        }
      }
      setExpanded(true);
    } catch (requestError) {
      setError(getRequestError(requestError, "Orbit could not answer that question."));
    } finally {
      requestActive.current = false;
      setChatLoading(false);
    }
  }, [chatInput, insightCacheKey, insightHistoryKey, pageKey, persistConversation]);

  useEffect(() => {
    const storedCache = readSessionValue(insightCacheKey, {});
    insightCache.current = typeof storedCache?.insight === "string" ? storedCache : {};
    setInsight(insightCache.current.insight || "");

    const storedConversation = readConversationValue(conversationStorageKey, []);
    const messages = Array.isArray(storedConversation)
      ? storedConversation.filter((message) =>
        ["user", "assistant"].includes(message?.role) && typeof message.content === "string"
      ).slice(-14)
      : [];
    if (!messages.length && insightCache.current.insight) {
      messages.push({ role: "assistant", content: insightCache.current.insight, kind: "insight" });
    }
    conversationHistory.current = messages;
    setChatMessages(messages);
  }, [insightCacheKey, conversationStorageKey]);

  useEffect(() => {
    const updateChatMode = () => {
      const panel = document.querySelector(".ai-chat-panel");
      const widget = panel?.closest(".ai-chat-widget");
      if (!panel || !widget) {
        setChatMode("closed");
      } else if (window.innerWidth < 700) {
        setChatMode("mobile");
      } else if (widget.classList.contains("ai-chat-left")) {
        setChatMode("left");
      } else {
        setChatMode("right");
      }
    };
    const observer = new MutationObserver(updateChatMode);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("resize", updateChatMode);
    updateChatMode();
    const initial = window.setTimeout(() => refreshInsight(), 1200);
    const interval = window.setInterval(() => refreshInsight(), 300000);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateChatMode);
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [refreshInsight, contextKey]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [chatMessages, loading, chatLoading]);

  useEffect(() => {
    let frameId;
    const startTime = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animateFlight = (timestamp) => {
      const flight = flightRef.current;
      if (flight && chatMode !== "mobile") {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const canvasRect = document.querySelector(".macro-v2-shell canvas")?.getBoundingClientRect();
        const globeArea = canvasRect && canvasRect.width && canvasRect.height
          ? canvasRect
          : { left: 0, top: 0, width, height };
        const centerX = globeArea.left + globeArea.width / 2;
        const centerY = globeArea.top + globeArea.height / 2;
        const radiusX = Math.max(24, Math.min(globeArea.width * 0.39, globeArea.height * 0.46) - 33);
        const radiusY = Math.max(24, Math.min(globeArea.height * 0.42, globeArea.width * 0.4) - 33);
        const progress = reducedMotion ? 0.75 : ((timestamp - startTime) % 52000) / 52000;
        const angle = progress * Math.PI * 2;
        const screenOrbitPoint = () => {
          let x = centerX + radiusX * Math.cos(angle);
          if (chatMode === "left") {
            x = Math.max(480, x);
          } else if (chatMode === "right") {
            x = Math.min(width - 538, x);
          }
          return {
            x: Math.max(18, Math.min(width - 84, x)),
            y: centerY + radiusY * Math.sin(angle),
          };
        };
        const globeOrbitPoint = (routeAngle) => {
          if (!globeRef?.current?.getScreenCoords) return null;
          const latitude = Math.max(-78, Math.min(
            78,
            (globeFocus?.lat ?? 0) + 24 * Math.sin(routeAngle)
          ));
          const longitude = (globeFocus?.lng ?? 0) + 58 * Math.cos(routeAngle);
          const projected = globeRef.current.getScreenCoords(latitude, longitude, 0.06);
          if (!projected || !Number.isFinite(projected.x) || !Number.isFinite(projected.y)) return null;
          return {
            x: Math.max(globeArea.left + 18, Math.min(globeArea.right - 84, globeArea.left + projected.x - 33)),
            y: Math.max(globeArea.top + 18, Math.min(globeArea.bottom - 84, globeArea.top + projected.y - 33)),
          };
        };

        let point = chatMode === "closed" ? globeOrbitPoint(angle) : null;
        if (!point) point = screenOrbitPoint();
        if (chatMode === "closed" && globeRef?.current?.getScreenCoords) {
          const chatButton = document.querySelector(".ai-chat-bubble");
          const chatBox = chatButton?.getBoundingClientRect();
          if (chatBox) {
            for (let step = 1; step <= 24; step += 1) {
              const shipBox = {
                left: point.x,
                top: point.y,
                right: point.x + 66,
                bottom: point.y + 66,
              };
              if (!(shipBox.left < chatBox.right && shipBox.right > chatBox.left
                && shipBox.top < chatBox.bottom && shipBox.bottom > chatBox.top)) break;
              point = globeOrbitPoint(angle + step * 0.12) || screenOrbitPoint();
            }
          }
        }
        let isParked = false;
        if (targetCountry && globeRef?.current?.getScreenCoords) {
          if (activeTarget.current !== targetKey) {
            activeTarget.current = targetKey;
            const from = flightPosition.current || point;
            approachPath.current = {
              startAt: timestamp + (reducedMotion ? 0 : 1250),
              from,
            };
          }
          const projected = globeRef.current.getScreenCoords(targetCountry.lat, targetCountry.lng, 0.04);
          if (projected && Number.isFinite(projected.x) && Number.isFinite(projected.y)) {
            const destination = {
              x: globeArea.left + projected.x - 33,
              y: globeArea.top + projected.y - 33,
            };
            const approach = approachPath.current;
            if (approach && timestamp < approach.startAt) {
              approach.from = chatMode === "closed"
                ? globeOrbitPoint(angle) || screenOrbitPoint()
                : screenOrbitPoint();
              point = approach.from;
            } else if (approach) {
              const rawProgress = reducedMotion ? 1 : Math.min(1, (timestamp - approach.startAt) / 2600);
              const eased = rawProgress * rawProgress * (3 - 2 * rawProgress);
              const midpointX = (approach.from.x + destination.x) / 2;
              const midpointY = (approach.from.y + destination.y) / 2;
              const directionX = midpointX - centerX;
              const directionY = midpointY - centerY;
              const directionLength = Math.max(1, Math.hypot(directionX, directionY));
              const controlX = midpointX + (directionX / directionLength) * 72;
              const controlY = midpointY + (directionY / directionLength) * 72;
              const remaining = 1 - eased;
              point = {
                x: remaining * remaining * approach.from.x
                  + 2 * remaining * eased * controlX
                  + eased * eased * destination.x,
                y: remaining * remaining * approach.from.y
                  + 2 * remaining * eased * controlY
                  + eased * eased * destination.y,
              };
              isParked = rawProgress === 1;
            }
          }
        } else {
          activeTarget.current = "";
          approachPath.current = null;
        }

        flightPosition.current = point;
        flight.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
        flight.classList.toggle("parked", isParked);

        const bubble = bubbleRef.current;
        if (bubble && chatMode === "closed") {
          const bubbleWidth = bubble.offsetWidth || Math.min(350, width - 24);
          const bubbleHeight = bubble.offsetHeight || 120;
          const bounds = (left, top) => ({
            left: Math.max(12, Math.min(width - bubbleWidth - 12, left)),
            top: Math.max(12, Math.min(height - bubbleHeight - 12, top)),
          });
          const candidates = [
            bounds(point.x + 78, point.y),
            bounds(point.x - bubbleWidth - 12, point.y),
            bounds(point.x + (66 - bubbleWidth) / 2, point.y - bubbleHeight - 12),
            bounds(point.x + (66 - bubbleWidth) / 2, point.y + 78),
          ];
          const overlaps = (a, b) => (
            a.left < b.right && a.left + bubbleWidth > b.left
            && a.top < b.bottom && a.top + bubbleHeight > b.top
          );
          const shipBox = {
            left: point.x,
            top: point.y,
            right: point.x + 66,
            bottom: point.y + 66,
          };
          const chatButton = document.querySelector(".ai-chat-bubble");
          const chatBox = chatButton?.getBoundingClientRect();
          const placement = candidates.find((candidate) => {
            const box = { ...candidate, right: candidate.left + bubbleWidth, bottom: candidate.top + bubbleHeight };
            return !overlaps(box, shipBox) && (!chatBox || !overlaps(box, chatBox));
          });
          bubble.style.visibility = placement ? "visible" : "hidden";
          if (placement) {
              bubble.style.transform = `translate3d(${placement.left}px, ${placement.top}px, 0)`;
          }
        }
      }
      frameId = window.requestAnimationFrame(animateFlight);
    };
    frameId = window.requestAnimationFrame(animateFlight);
    return () => window.cancelAnimationFrame(frameId);
  }, [chatMode, focusKey, globeRef, targetKey]);

  return (
    <aside
      className={`macro-insight-stage${chatMode !== "closed" ? ` chat-open-${chatMode}` : ""}`}
      aria-label="Orbit DeepSeek chat"
    >
      {expanded && chatMode === "closed" && (
        <section className="macro-insight-bubble" aria-live="polite" ref={bubbleRef}>
          <header>
            <strong>Orbit · DeepSeek chat</strong>
            <div>
              <button type="button" onClick={refreshInsight} disabled={loading || chatLoading} aria-label="Refresh insight">
                {loading ? "…" : "↻"}
              </button>
              <button type="button" onClick={() => setExpanded(false)} aria-label="Hide insight">
                ×
              </button>
            </div>
          </header>
          <div className="macro-insight-messages" aria-live="polite" ref={messagesRef}>
            {chatMessages.length ? chatMessages.slice(-10).map((message, index) => (
              <div className={`macro-insight-message ${message.role}`} key={`${message.role}-${index}-${message.content.slice(0, 24)}`}>
                <strong>{message.role === "user" ? "You" : "Orbit"}</strong>
                <span>{message.content}</span>
              </div>
            )) : (
              <p>{loading ? "Reading the data on this screen…" : insight || error || "I’ll share an evidence-based insight about this screen."}</p>
            )}
            {loading && <small>Checking the latest information…</small>}
            {chatLoading && <small>Orbit is thinking…</small>}
            {error && <small role="alert">{error}</small>}
          </div>
          <form className="macro-insight-chat-form" onSubmit={submitQuestion}>
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about what you’re seeing…"
              aria-label="Ask Orbit a question about this screen"
              maxLength={1200}
              disabled={loading || chatLoading}
            />
            <button type="submit" disabled={!chatInput.trim() || loading || chatLoading} aria-label="Send question">
              {chatLoading ? "…" : "↗"}
            </button>
          </form>
          <footer>{loading ? "Checking for new information…" : "Remembers this conversation · fresh insights only when evidence changes"}</footer>
        </section>
      )}
      <div className="macro-insight-flight" ref={flightRef}>
        <button
          className="macro-insight-avatar"
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-label={expanded ? "Hide Orbit chat" : "Open Orbit chat"}
          title={targetCountry ? `Orbit parked over ${targetCountry.name}` : "Open DeepSeek macro insight"}
        >
          <img src={astronaut} alt="" aria-hidden="true" />
          {!expanded && <span>{loading ? "…" : "Insight"}</span>}
        </button>
      </div>
    </aside>
  );
}
