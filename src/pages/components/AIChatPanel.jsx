import { BACKEND_URL } from "../../apiUrl.js";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CountryAnalysisText from './Macroeconomia/Explorers/CountryAnalysisText';
import './AIChatPanel.css';

export default function AIChatPanel({
  title,
  description,
  contextType,
  context,
  contextKey,
  downloadName,
  side = 'right',
}) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [searchOnline, setSearchOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    requestIdRef.current += 1;
    setMessages([]);
    setQuestion('');
    setError('');
    setLoading(false);
    setIsOpen(false);
  }, [contextKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  const downloadDataSheet = () => {
    const blob = new Blob([JSON.stringify(context, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const capturePageSnapshot = () => {
    const page = document.body.cloneNode(true);
    page.querySelectorAll('.ai-chat-widget').forEach((widget) => widget.remove());
    return {
      url: window.location.href,
      title: document.title,
      visibleText: (page.innerText || page.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 12000),
    };
  };

  const sendQuestion = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    const conversation = [...messages, { role: 'user', content: trimmedQuestion }];
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setMessages(conversation);
    setQuestion('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/AI/contextChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType,
          context: {
            ...context,
            pageSnapshot: capturePageSnapshot(),
          },
          history: conversation.slice(-8, -1),
          question: trimmedQuestion,
          searchOnline,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.reply) {
        throw new Error(result.error || `AI chat failed (HTTP ${response.status}).`);
      }
      if (requestId !== requestIdRef.current) return;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: result.reply,
          sources: Array.isArray(result.sources) ? result.sources : [],
        },
      ]);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      setError(requestError.message || 'Unable to reach the AI chat service.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  return createPortal(
    <aside className={`ai-chat-widget ai-chat-${side}`} aria-label={title}>
      {isOpen ? (
        <section className="ai-chat-panel">
          <div className="ai-chat-heading">
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <div className="ai-chat-heading-actions">
              <button type="button" className="ai-chat-download" onClick={downloadDataSheet}>
                Download data
              </button>
              <button
                type="button"
                className="ai-chat-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI chat"
              >
                ×
              </button>
            </div>
          </div>

          <div className="ai-chat-messages" aria-live="polite">
            {messages.length === 0 && (
              <p className="ai-chat-empty">Ask a follow-up question about the data and analysis shown here.</p>
            )}
            {messages.map((message, index) => (
              <div className={`ai-chat-message ai-chat-${message.role}`} key={`${index}-${message.role}`}>
                <span>{message.role === 'user' ? 'You' : 'AI'}</span>
                {message.role === 'assistant'
                  ? <CountryAnalysisText text={message.content} />
                  : <p>{message.content}</p>}
                {message.sources?.length > 0 && (
                  <ul className="ai-chat-sources" aria-label="Online sources">
                    {message.sources.map((source) => (
                      <li key={source.url}>
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {source.title}
                        </a>
                        {source.source && <span> — {source.source}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {loading && <p className="ai-chat-loading">Thinking…</p>}
            <div ref={messagesEndRef} />
          </div>

          {error && <p className="ai-chat-error" role="alert">{error}</p>}
          <form className="ai-chat-form" onSubmit={sendQuestion}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) sendQuestion(event);
              }}
              maxLength={3000}
              rows={2}
              placeholder="Ask about a number, trend, risk, or claim…"
              aria-label="Ask a follow-up question"
            />
            <button type="submit" disabled={loading || !question.trim()}>
              {loading ? 'Sending…' : 'Ask AI'}
            </button>
          </form>
          <label className="ai-chat-search-toggle">
            <input
              type="checkbox"
              checked={searchOnline}
              onChange={(event) => setSearchOnline(event.target.checked)}
            />
            Search current news online
          </label>
          <div className="ai-chat-hint">
            Page text and supplied data are shared with the AI. Online search sends your question to Google News. Press Ctrl+Enter to send.
          </div>
        </section>
      ) : (
        <button
          type="button"
          className="ai-chat-bubble"
          onClick={() => setIsOpen(true)}
          aria-label={`Open chat: ${title}`}
          aria-expanded="false"
        >
          <span aria-hidden="true">✦</span>
          Ask AI
        </button>
      )}
    </aside>,
    document.body
  );
}
