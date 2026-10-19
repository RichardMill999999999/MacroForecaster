import { BACKEND_URL } from "../../../apiUrl.js";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./ArticleAIAnalysis.css";


export default function ArticleAIAnalysis({ article, subject }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => () => {
    if (utteranceRef.current) {
      window.speechSynthesis?.cancel();
      utteranceRef.current = null;
    }
  }, []);

  const analyzeArticle = async () => {
    if (loading) return;
    setLoading(true);
    setSummary("");
    setError("");
    try {
      const response = await axios.post(`${BACKEND_URL}/ai-analyze-article`, {
        url: article.url || "",
        title: article.title || "",
        abstract: article.abstract || article.summary || article.description || "",
        section: subject,
        published: article.published || "",
        byline: article.byline || "",
        summary_only: true,
      }, { timeout: 60000 });
      const result = response.data?.reply?.trim();
      if (!result) throw new Error("The AI service returned an empty article analysis.");
      setSummary(result);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
        requestError.message ||
        "Article analysis failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const readSummary = () => {
    if (!summary) return;
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setError("Read aloud is not supported by this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = "en-US";
    utterance.onend = () => {
      utteranceRef.current = null;
      setSpeaking(false);
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setSpeaking(false);
      setError("The summary could not be read aloud.");
    };
    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  };

  return (
    <div className="article-ai-analysis">
      <button
        type="button"
        className="article-ai-analyze-button"
        onClick={analyzeArticle}
        disabled={loading}
      >
        {loading ? "Analyzing article…" : "AI analyze article"}
      </button>
      {error && <p className="article-ai-error" role="alert">{error}</p>}
      {summary && (
        <section className="article-ai-result" aria-live="polite">
          <h4>AI summary</h4>
          <p>{summary}</p>
          <button type="button" onClick={speaking ? stopReading : readSummary}>
            {speaking ? "Stop reading" : "Read summary aloud"}
          </button>
        </section>
      )}
    </div>
  );
}
