
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import axios from "axios";

const BACKEND_URL = "http://localhost:5000";

const RSS_FEEDS = {
  Home: "HomePage",
  UnitedStates: "US",
  World: "World",
  Politics: "Politics",
  Business: "Business",
  Economy: "Economy",
  Technology: "Technology",
  Science: "Science",
  Health: "Health",
  DealBook: "Dealbook",
  Energy: "EnergyEnvironment",
  SmallBusiness: "SmallBusiness",
  PersonalTech: "PersonalTech",
  Sports: "Sports",
};

/* Quick tabs — all use the RSS endpoint so they always work */
const FEED_TABS = [
  { key: "Home", label: "Home" },
  { key: "World", label: "World" },
  { key: "UnitedStates", label: "US" },
  { key: "Politics", label: "Politics" },
  { key: "Business", label: "Business" },
  { key: "Economy", label: "Economy" },
  { key: "Technology", label: "Tech" },
  { key: "Science", label: "Science" },
  { key: "Health", label: "Health" },
  { key: "Sports", label: "Sports" },
  { key: "DealBook", label: "DealBook" },
  { key: "Energy", label: "Energy" },
  { key: "SmallBusiness", label: "Small Biz" },
  { key: "PersonalTech", label: "Personal Tech" },
];

const MIN_WIDTH = 320;
const MIN_HEIGHT = 220;

const CURSORS = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

const RESIZE_HANDLES = [
  { dir: "n", style: { top: 0, left: 0, right: 0, height: 6 } },
  { dir: "s", style: { bottom: 0, left: 0, right: 0, height: 6 } },
  { dir: "w", style: { left: 0, top: 0, bottom: 0, width: 6 } },
  { dir: "e", style: { right: 0, top: 0, bottom: 0, width: 6 } },
  { dir: "nw", style: { top: 0, left: 0, width: 16, height: 16 } },
  { dir: "ne", style: { top: 0, right: 0, width: 16, height: 16 } },
  { dir: "sw", style: { bottom: 0, left: 0, width: 16, height: 16 } },
  { dir: "se", style: { bottom: 0, right: 0, width: 16, height: 16 } },
];

function computeResize(direction, start, dx, dy) {
  let { x, y, width, height } = start;

  const right = start.x + start.width;
  const bottom = start.y + start.height;

  const maxWidth = Math.max(MIN_WIDTH, window.innerWidth);
  const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight);

  if (direction.includes("e")) {
    width = Math.min(
      Math.max(start.width + dx, MIN_WIDTH),
      maxWidth
    );
  }
  if (direction.includes("w")) {
    width = Math.min(
      Math.max(start.width - dx, MIN_WIDTH),
      maxWidth
    );
    x = right - width;
  }
  if (direction.includes("s")) {
    height = Math.min(
      Math.max(start.height + dy, MIN_HEIGHT),
      maxHeight
    );
  }
  if (direction.includes("n")) {
    height = Math.min(
      Math.max(start.height - dy, MIN_HEIGHT),
      maxHeight
    );
    y = bottom - height;
  }

  if (x < 0) {
    width = right;
    x = 0;
  }
  if (y < 0) {
    height = bottom;
    y = 0;
  }

  if (x + width > window.innerWidth) {
    width = Math.max(window.innerWidth - x, MIN_WIDTH);
  }
  if (y + height > window.innerHeight) {
    height = Math.max(window.innerHeight - y, MIN_HEIGHT);
  }

  return { x, y, width, height };
}

export default function NYTExplorer({ onAnalyzeArticle }) {
  /* =========================================================
     PANEL GEOMETRY
  ========================================================= */

  const [rect, setRect] = useState(() => {
    const width = 500;
    const height = Math.max(
      MIN_HEIGHT,
      window.innerHeight - 100
    );

    return {
      x: Math.max(window.innerWidth - width - 20, 20),
      y: 50,
      width,
      height,
    };
  });

  const [maximized, setMaximized] = useState(false);
  const savedRectRef = useRef(null);

  const panelRef = useRef(null);

  const draggingRef = useRef(false);
  const resizingRef = useRef(false);

  const dragStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    panelX: 0,
    panelY: 0,
    width: 500,
    height: 600,
  });

  const resizeStartRef = useRef({
    direction: null,
    mouseX: 0,
    mouseY: 0,
    rect: null,
  });

  /* =========================================================
     NYT STATE
  ========================================================= */

  const [feed, setFeed] = useState("Home");
  const [articles, setArticles] = useState([]);
  const rssControllerRef = useRef(null);

  const [selectedArticle, setSelectedArticle] =
    useState(null);

  const [search, setSearch] = useState("");
const [showAnalysisFull, setShowAnalysisFull] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [autoRefresh, setAutoRefresh] = useState(true);

  /* =========================================================
     AI ANALYSIS
  ========================================================= */

  const [analysis, setAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] =
    useState(false);
  const [analysisError, setAnalysisError] = useState("");
const [speaking, setSpeaking] = useState(false);
const [speechPaused, setSpeechPaused] = useState(false);
  /* =========================================================
     DRAG + RESIZE
  ========================================================= */
useEffect(() => {
  return () => {
    rssControllerRef.current?.abort();
    window.speechSynthesis.cancel();
  };
}, []);
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingRef.current) {
        const d = dragStartRef.current;

        const dx = e.clientX - d.mouseX;
        const dy = e.clientY - d.mouseY;

        const maxX = Math.max(
          window.innerWidth - d.width,
          0
        );
        const maxY = Math.max(
          window.innerHeight - 40,
          0
        );

        setRect((prev) => ({
          ...prev,
          x: Math.min(
            Math.max(d.panelX + dx, 0),
            maxX
          ),
          y: Math.min(
            Math.max(d.panelY + dy, 0),
            maxY
          ),
        }));
      }

      if (resizingRef.current) {
        const r = resizeStartRef.current;
        if (!r.rect) return;

        const dx = e.clientX - r.mouseX;
        const dy = e.clientY - r.mouseY;

        setRect(
          computeResize(r.direction, r.rect, dx, dy)
        );
      }
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      resizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );
      window.removeEventListener(
        "mouseup",
        handleMouseUp
      );
    };
  }, []);

  /* Keep panel inside viewport on window resize (non-maximized) */
  useEffect(() => {
    const handleWindowResize = () => {
      if (maximized) return;
      setRect((prev) => {
        const width = Math.min(
          prev.width,
          Math.max(window.innerWidth, MIN_WIDTH)
        );
        const height = Math.min(
          prev.height,
          Math.max(window.innerHeight, MIN_HEIGHT)
        );
        const x = Math.min(
          prev.x,
          Math.max(window.innerWidth - width, 0)
        );
        const y = Math.min(
          prev.y,
          Math.max(window.innerHeight - 40, 0)
        );
        return { x, y, width, height };
      });
    };

    window.addEventListener("resize", handleWindowResize);
    return () =>
      window.removeEventListener(
        "resize",
        handleWindowResize
      );
  }, [maximized]);

  /* Read live bounding box from DOM (fixes first-drag glitch) */
  const startDrag = (e) => {
    if (maximized) return;

    if (
      e.target.closest("button") ||
      e.target.closest("select") ||
      e.target.closest("input") ||
      e.target.closest("[data-resize-handle]")
    ) {
      return;
    }

    const el = panelRef.current;
    if (!el) return;
    const bbox = el.getBoundingClientRect();

    draggingRef.current = true;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panelX: bbox.left,
      panelY: bbox.top,
      width: bbox.width,
      height: bbox.height,
    };

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };

  const startResize = (direction) => (e) => {
    if (maximized) return;

    e.preventDefault();
    e.stopPropagation();

    const el = panelRef.current;
    if (!el) return;
    const bbox = el.getBoundingClientRect();

    resizingRef.current = true;

    resizeStartRef.current = {
      direction,
      mouseX: e.clientX,
      mouseY: e.clientY,
      rect: {
        x: bbox.left,
        y: bbox.top,
        width: bbox.width,
        height: bbox.height,
      },
    };

    document.body.style.cursor =
      CURSORS[direction] || "nwse-resize";
    document.body.style.userSelect = "none";
  };

  /* =========================================================
     MAXIMIZE / RESTORE
  ========================================================= */

  const toggleMaximize = () => {
    if (!maximized) {
      savedRectRef.current = { ...rect };
      setMaximized(true);
    } else {
      if (savedRectRef.current) {
        setRect(savedRectRef.current);
      }
      setMaximized(false);
    }
  };

  /* =========================================================
     RSS (single source of truth — all tabs use this)
  ========================================================= */

  const loadRSS = async () => {
    rssControllerRef.current?.abort();
    const controller = new AbortController();
    rssControllerRef.current = controller;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${BACKEND_URL}/NYT/rss-stream/${RSS_FEEDS[feed]}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error(`RSS request failed (HTTP ${response.status}).`);
      }

      if (!response.body?.getReader) {
        const fallback = await axios.get(
          `${BACKEND_URL}/NYT/rss/${RSS_FEEDS[feed]}`,
          { signal: controller.signal }
        );
        setArticles(fallback.data.items || []);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const applyEvent = (line) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === "error") {
          throw new Error(event.error || "The RSS stream failed.");
        }
        if (event.type !== "item" || !event.item) return;

        const item = event.item;
        const key = item.link || item.guid || item.title;
        setArticles((current) => {
          const existingIndex = current.findIndex(
            (article) =>
              (article.link || article.guid || article.title) === key
          );
          if (existingIndex < 0) return [...current, item];
          const next = [...current];
          next[existingIndex] = item;
          return next;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        lines.forEach(applyEvent);
        if (done) break;
      }
      applyEvent(buffer);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setError(err.message || "Unable to load NYT RSS feed.");
    } finally {
      if (rssControllerRef.current === controller) {
        rssControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setArticles([]);
    loadRSS();
    return () => rssControllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed]);

  /* Auto-refresh */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadRSS();
    }, 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, feed]);

  /* =========================================================
     ARTICLE NORMALIZATION
  ========================================================= */

  const normalizeArticle = (article) => {
    return {
      title:
        article.title ||
        article.headline?.main ||
        "Untitled",

      abstract:
        article.abstract ||
        article.description ||
        article.snippet ||
        "",

      url:
        article.url ||
        article.web_url ||
        article.link ||
        "",

      published:
        article.published ||
        article.published_date ||
        article.pub_date ||
        "",

      section:
        article.section ||
        article.section_name ||
        "",

      byline:
        typeof article.byline === "string"
          ? article.byline
          : article.byline?.original || "",

      image:
        article.image ||
        article.multimedia?.find(
          (m) =>
            m.url &&
            (m.type === "image" ||
              m.subtype === "photo")
        )?.url ||
        "",
    };
  };

  /* =========================================================
     CLIENT-SIDE SEARCH FILTER
  ========================================================= */

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();

    return articles.filter((article) => {
      const a = normalizeArticle(article);
      return (
        a.title.toLowerCase().includes(q) ||
        a.abstract.toLowerCase().includes(q) ||
        a.section.toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, search]);

  /* =========================================================
     SELECT / OPEN
  ========================================================= */

  const handleArticleClick = (article) => {
    const normalized = normalizeArticle(article);
    setSelectedArticle(normalized);
    setAnalysis("");
    setAnalysisError("");
  };

  const openArticle = (article) => {
    const normalized = normalizeArticle(article);

    let url = normalized.url;

    if (!url) {
      url =
        `https://www.google.com/search?q=` +
        encodeURIComponent(normalized.title);
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* =========================================================
     ANALYZE — sends PLAIN TEXT body (with 404 fallback to
     legacy URL-param style so both backends work).
  ========================================================= */

const analyzeArticle = async (article) => {
  const normalized = normalizeArticle(article);

  setSelectedArticle(normalized);
  setAnalysis("");
  setAnalysisError("");
  setAnalysisLoading(true);

  try {
    const response = await axios.post(
      `${BACKEND_URL}/ai-analyze-article`,
      {
        url:       normalized.url,
        title:     normalized.title,
        abstract:  normalized.abstract,
        section:   normalized.section,
        byline:    normalized.byline,
        published: normalized.published,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000, // fetching + AI can take a while
      }
    );

    const reply = response.data?.reply || "No analysis returned.";
    setAnalysis(reply);
  } catch (err) {
    console.error("Article analysis error:", err);
    setAnalysisError(
      err.response?.data?.error ||
        err.message ||
        "Article analysis failed."
    );
  } finally {
    setAnalysisLoading(false);
  }
};
  /* =========================================================
     RENDER
  ========================================================= */

  const panelStyle = maximized
    ? {
        position: "fixed",
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
      }
    : {
        position: "fixed",
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        minWidth: `${MIN_WIDTH}px`,
        minHeight: `${MIN_HEIGHT}px`,
        zIndex: 150,
      };
const [voices, setVoices] = useState([]);

useEffect(() => {
  const load = () => {
    const v = window.speechSynthesis.getVoices();
    if (v.length) setVoices(v);
  };
  load();
  window.speechSynthesis.onvoiceschanged = load;
  return () => {
    window.speechSynthesis.onvoiceschanged = null;
  };
}, []);

const pickBestVoice = () => {
  if (!voices.length) return null;

  // Ranked list — first match wins
  const priority = [
    "Microsoft Sonia Online (Natural)",
    "Microsoft Libby Online (Natural)",
    "Microsoft Hazel Online (Natural)",
    "Google UK English Female",
    "Serena",
    "Moira",
    "Fiona",
    "Kate",
    "Microsoft Aria Online (Natural)",
    "Microsoft Jenny Online (Natural)",
    "Samantha",
    "Microsoft Zira",
  ];

  for (const name of priority) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  const britishNatural = voices.find(
    (voice) =>
      voice.lang?.toLowerCase().startsWith("en-gb")
      && /natural|neural|premium|enhanced/i.test(voice.name)
  );
  if (britishNatural) return britishNatural;

  const britishEnglish = voices.find((voice) =>
    voice.lang?.toLowerCase().startsWith("en-gb")
  );
  if (britishEnglish) return britishEnglish;

  // Prefer a natural-sounding female English voice if British voices are unavailable.
  const neural = voices.find(
    (v) => /natural|neural|premium|enhanced/i.test(v.name)
      && /^en-/i.test(v.lang)
      && !/\b(guy|andrew|david|alex)\b/i.test(v.name)
  );
  if (neural) return neural;

  return voices.find((v) => /^en-/i.test(v.lang)) || voices[0];
};

const speakAnalysis = () => {
  if (!analysis) return;

  window.speechSynthesis.cancel();

  // Clean up markers so it reads naturally
  const clean = analysis
    .replace(/^###\s+\d+\.\s+/gm, "")
    .replace(/^###\s+/gm, "")
    .replace(/CATEGORY:\s*B/gi, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

  // Split into sections so we get natural pauses between them
  const sections = clean
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!sections.length) return;

  const voice = pickBestVoice();

  setSpeaking(true);
  setSpeechPaused(false);

  let index = 0;

  const speakNext = () => {
    if (index >= sections.length) {
      setSpeaking(false);
      setSpeechPaused(false);
      return;
    }

    const utter = new SpeechSynthesisUtterance(sections[index]);

    if (voice) utter.voice = voice;
    utter.rate = 0.96;
    utter.pitch = 1.08;
    utter.volume = 1.0;
    utter.lang = voice?.lang || "en-GB";

    utter.onend = () => {
      index++;
      // 350ms pause between paragraphs
      setTimeout(speakNext, 350);
    };

    utter.onerror = () => {
      setSpeaking(false);
      setSpeechPaused(false);
    };

    window.speechSynthesis.speak(utter);
  };

  speakNext();
};

const stopSpeech = () => {
  window.speechSynthesis.cancel();
  setSpeaking(false);
  setSpeechPaused(false);
};

const togglePauseSpeech = () => {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    setSpeechPaused(false);
  } else {
    window.speechSynthesis.pause();
    setSpeechPaused(true);
  }
};
  return (
    <div
      ref={panelRef}
      style={{
        ...panelStyle,
        background: "#f7f7f7",
        color: "#111",
        display: "flex",
        flexDirection: "column",
        boxShadow: maximized
          ? "none"
          : "0 8px 30px rgba(0,0,0,0.35)",
        overflow: "hidden",
        fontFamily:
          "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* RESIZE HANDLES (hidden while maximized) */}
      {!maximized &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle.dir}
            data-resize-handle={handle.dir}
            onMouseDown={startResize(handle.dir)}
            style={{
              position: "absolute",
              zIndex:
                handle.dir.length === 2 ? 401 : 400,
              cursor: CURSORS[handle.dir],
              background: "transparent",
              ...handle.style,
            }}
          />
        ))}

      {/* HEADER / DRAG */}
      <div
        onMouseDown={startDrag}
        style={{
          borderBottom: "1px solid #bdbdbd",
          padding: "8px 10px",
          background: "#fff",
          cursor: maximized ? "default" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              letterSpacing: "-0.5px",
            }}
          >
            NYT Research
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#666",
              marginTop: "3px",
            }}
          >
            NEWS & MARKET INTELLIGENCE
          </div>
        </div>

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggleMaximize();
          }}
          title={
            maximized
              ? "Restore panel"
              : "Maximize panel"
          }
          style={{
            border: "1px solid #aaa",
            background: "#fff",
            color: "#111",
            cursor: "pointer",
            padding: "5px 8px",
            fontSize: "14px",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {maximized ? "❐" : "⛶"}
        </button>
      </div>

      {/* NAVIGATION — all tabs use RSS so they all work */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          borderBottom: "1px solid #ccc",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        {FEED_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFeed(tab.key)}
            style={{
              border: "none",
              background:
                feed === tab.key
                  ? "#111"
                  : "transparent",
              color:
                feed === tab.key ? "#fff" : "#111",
              padding: "10px 14px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTROLS */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #ccc",
          background: "#fafafa",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter loaded articles…"
          style={{
            width: "100%",
            padding: "7px",
            border: "1px solid #aaa",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) =>
                setAutoRefresh(e.target.checked)
              }
            />
            {" Live refresh"}
          </label>

          <button
            onClick={loadRSS}
            style={{
              border: "1px solid #aaa",
              background: "#fff",
              padding: "3px 8px",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ARTICLE LIST */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
        }}
      >
        {loading && articles.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              fontFamily: "Arial, sans-serif",
              color: "#777",
            }}
          >
            Loading…
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px",
              background: "#fee",
              border: "1px solid #d88",
              color: "#900",
              fontFamily: "Arial, sans-serif",
              fontSize: "12px",
              marginBottom: "10px",
            }}
          >
            {error}
          </div>
        )}

        {filteredArticles.map((article, index) => {
            const a = normalizeArticle(article);

            return (
              <div
                key={a.url || `${a.title}-${index}`}
                onClick={() =>
                  handleArticleClick(article)
                }
                style={{
                  display: "flex",
                  gap: "10px",
                  padding: "12px 4px",
                  borderBottom: "1px solid #ccc",
                  cursor: "pointer",
                  background:
                    selectedArticle?.url === a.url
                      ? "#ececec"
                      : "transparent",
                }}
              >
                {a.image && (
                  <img
                    src={a.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "145px",
                      height: "95px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {a.section && (
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        color: "#777",
                        marginBottom: "3px",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      {a.section}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "29px",
                      fontWeight: "bold",
                      lineHeight: "1.15",
                    }}
                  >
                    {a.title}
                  </div>

                  {a.abstract && (
                    <div
                      style={{
                        fontSize: "20px",
                        color: "#444",
                        marginTop: "5px",
                        lineHeight: "1.3",
                      }}
                    >
                      {a.abstract}
                    </div>
                  )}

                  <div
                    style={{
                      fontFamily: "Arial, sans-serif",
                      fontSize: "11px",
                      color: "#888",
                      marginTop: "5px",
                    }}
                  >
                    {a.published}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                      marginTop: "8px",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        analyzeArticle(article);
                      }}
                      style={{
                        border: "1px solid #111",
                        background: "#111",
                        color: "#fff",
                        padding: "5px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Analyze
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openArticle(article);
                      }}
                      style={{
                        border: "1px solid #aaa",
                        background: "#fff",
                        color: "#111",
                        padding: "5px 8px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Open Article ↗
                    </button>
                  </div>
                </div>
              </div>
            );
        })}
      </div>

      {/* SELECTED ARTICLE / ANALYSIS OVERLAY */}
     {selectedArticle && (
  <div
    style={{
      position: "absolute",
      inset: "0",
      background: "#fff",
      zIndex: 500,
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* HEADER BAR */}
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid #ccc",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => {
          setSelectedArticle(null);
          setAnalysis("");
          setAnalysisError("");
          setShowAnalysisFull(false);
        }}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        ←
      </button>

      <span style={{ fontSize: "11px", fontWeight: "bold" }}>
        ARTICLE ANALYSIS
      </span>

      <div style={{ width: "25px" }} />
    </div>

    {/* SCROLL AREA */}
    <div style={{ overflowY: "auto", padding: "18px", flex: 1 }}>

      {/* ARTICLE HEADER */}
      <div
        style={{
          fontSize: "30px",
          fontWeight: "bold",
          lineHeight: "1.1",
          marginBottom: "10px",
        }}
      >
        {selectedArticle.title}
      </div>

      <div
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          color: "#777",
          marginBottom: "15px",
        }}
      >
        {selectedArticle.byline}
        <br />
        {selectedArticle.published}
      </div>

      {selectedArticle.image && (
        <img
          src={selectedArticle.image}
          alt=""
          style={{
            width: "100%",
            maxHeight: "300px",
            objectFit: "cover",
            marginBottom: "15px",
          }}
        />
      )}

      <div
        style={{
          fontSize: "17px",
          lineHeight: "1.55",
          marginBottom: "20px",
        }}
      >
        {selectedArticle.abstract}
      </div>

      {/* RESEARCH TOOLS */}
      <div
        style={{
          borderTop: "1px solid #ccc",
          paddingTop: "15px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "13px",
            marginBottom: "10px",
          }}
        >
          RESEARCH TOOLS
        </div>

        {/* ANALYZE BUTTON */}
        <button
          onClick={() => analyzeArticle(selectedArticle)}
          disabled={analysisLoading}
          style={{
            width: "100%",
            padding: "12px",
            background: analysisLoading ? "#555" : "#111",
            color: "#fff",
            border: "none",
            cursor: analysisLoading ? "wait" : "pointer",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {analysisLoading ? "Analyzing..." : "Analyze Article"}
        </button>
{analysis && !analysisLoading && (
  <div
    style={{
      display: "flex",
      gap: "6px",
      marginBottom: "8px",
    }}
  >
    {!speaking ? (
      <button
        onClick={speakAnalysis}
        style={{
          flex: 1,
          padding: "10px",
          background: "#1a5fb4",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "bold",
        }}
      >
        🔊 Read Aloud
      </button>
    ) : (
      <>
        <button
          onClick={togglePauseSpeech}
          style={{
            flex: 1,
            padding: "10px",
            background: speechPaused ? "#0a7d3a" : "#c47d00",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
          }}
        >
          {speechPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button
          onClick={stopSpeech}
          style={{
            flex: 1,
            padding: "10px",
            background: "#8a0000",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "bold",
          }}
        >
          ⏹ Stop
        </button>
      </>
    )}
  </div>
)}
        {/* ★ READ ANALYSIS BUTTON — appears once analysis exists ★ */}
        {analysis && !analysisLoading && (
          <button
            onClick={() => setShowAnalysisFull(true)}
            style={{
              width: "100%",
              padding: "12px",
              background: "#0a7d3a",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            📖 Read Full Analysis
          </button>
        )}

        {/* OPEN ORIGINAL */}
        <button
          onClick={() => openArticle(selectedArticle)}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #aaa",
            background: "#fff",
            color: "#111",
            cursor: "pointer",
            fontSize: "13px",
            marginBottom: "15px",
          }}
        >
          Open Original Article ↗
        </button>

        {/* INLINE PREVIEW */}
        {analysisLoading && (
          <div
            style={{
              padding: "12px",
              background: "#f4f4f4",
              border: "1px solid #ccc",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            Analyzing article...
          </div>
        )}

        {analysisError && (
          <div
            style={{
              padding: "12px",
              background: "#fff0f0",
              border: "1px solid #d88",
              color: "#900",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            {analysisError}
          </div>
        )}

        {!analysisLoading && !analysisError && analysis && (
          <div
            style={{
              padding: "14px",
              background: "#f4f4f4",
              border: "1px solid #ccc",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "11px",
                marginBottom: "10px",
                letterSpacing: "0.5px",
              }}
            >
              AI ANALYSIS (preview — click “📖 Read Full Analysis” for the full view)
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: "#333" }}>
              {analysis.slice(0, 400)}
              {analysis.length > 400 ? "…" : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{/* ★ FULL-SCREEN READ ANALYSIS OVERLAY ★ */}
{showAnalysisFull && analysis && (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "#fff",
      zIndex: 700,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #ccc",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: "bold" }}>
        FULL ANALYSIS
      </span>
      <button
        onClick={() => setShowAnalysisFull(false)}
        style={{
          border: "1px solid #aaa",
          background: "#fff",
          cursor: "pointer",
          fontSize: "16px",
          padding: "4px 10px",
          lineHeight: 1,
        }}
      >
        Close ×
      </button>
    </div>

    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 60px 60px",
        maxWidth: "900px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "18px",
        lineHeight: "1.75",
        color: "#222",
      }}
    >
      <div
        style={{
          fontSize: "22px",
          fontWeight: "bold",
          marginBottom: "6px",
          lineHeight: "1.2",
        }}
      >
        {selectedArticle.title}
      </div>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          color: "#777",
          marginBottom: "28px",
          paddingBottom: "16px",
          borderBottom: "1px solid #ddd",
        }}
      >
        {selectedArticle.section} · {selectedArticle.published}
      </div>

      {analysis
        .split(/\n(?=###\s)/)
        .map((chunk, i) => {
          const trimmed = chunk.trim();
          if (!trimmed) return null;

          const headerMatch = trimmed.match(/^###\s+(.+)/);

          if (headerMatch) {
            const headerText = headerMatch[1];
            const body = trimmed.replace(/^###\s+.+\n?/, "").trim();

            return (
              <div key={i} style={{ marginBottom: "26px" }}>
                <div
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "13px",
                    fontWeight: "bold",
                    color: "#0a7d3a",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "8px",
                  }}
                >
                  {headerText}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{body}</div>
              </div>
            );
          }

          return (
            <div
              key={i}
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#666",
                marginBottom: "20px",
              }}
            >
              {trimmed}
            </div>
          );
        })}
    </div>
  </div>
)}
    </div>
  );
}