import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ArticleAIAnalysis from '../ArticleAIAnalysis';

const BACKEND_URL = 'http://localhost:5000';

const normalizeArticle = (item) => ({
  title: item?.title || item?.headline?.main || 'Untitled',
  abstract: item?.abstract || item?.description || item?.snippet || '',
  url: item?.url || item?.web_url || item?.link || '',
  published: item?.published || item?.published_date || item?.pub_date || '',
  source: item?.source || 'News provider',
  provider: item?.provider || '',
  note: item?.note || '',
});

export default function CountryNews({ countryName, onArticlesLoaded, maxItems = 8 }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      setArticles([]);
      onArticlesLoaded?.([]);
      try {
        const response = await axios.get(`${BACKEND_URL}/news/country`, {
          params: { country: countryName },
          timeout: 30000,
        });
        if (cancelled) return;
        const items = (response.data?.articles || []).map(normalizeArticle);
        setArticles(items.slice(0, maxItems));
        const errors = response.data?.errors || [];
        if (errors.length) {
          setError(`Some news sources were unavailable: ${errors.map((item) => item.source).filter(Boolean).join(', ')}`);
        }
        onArticlesLoaded?.(items.slice(0, maxItems));
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError.response?.data?.error || loadError.message || 'Country news could not be loaded.');
        setArticles([]);
        onArticlesLoaded?.([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [countryName, maxItems, onArticlesLoaded]);

  const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(countryName)}&hl=en-US&gl=US&ceid=US:en`;

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>{countryName} — News</h3>
          <div style={styles.subtitle}>Country-specific headlines from NewsData.io, Google News, and matching regional RSS coverage</div>
        </div>
        <a href={searchUrl} target="_blank" rel="noreferrer" style={styles.searchLink}>Search live news ↗</a>
      </div>

      {loading && <div style={styles.status}>Loading news while the economic dashboard remains available…</div>}
      {error && <div style={styles.error}>{error}</div>}

      {!loading && articles.length === 0 && !error && (
        <div style={styles.status}>
          No country-matched article appeared in the latest RSS items. Use the live news search for a wider country-specific result.
        </div>
      )}

      {articles.map((article, index) => (
        <article key={article.url || `${article.title}-${index}`} style={styles.article}>
          <div style={styles.meta}>{[article.provider, article.source, article.published, article.note].filter(Boolean).join(' · ')}</div>
          <a href={article.url || searchUrl} target="_blank" rel="noreferrer" style={styles.headline}>{article.title}</a>
          {article.abstract && <p style={styles.abstract}>{article.abstract}</p>}
          <div style={styles.actions}>
            <a href={article.url || searchUrl} target="_blank" rel="noreferrer" style={styles.articleLink}>Open original ↗</a>
            <ArticleAIAnalysis article={article} subject={`Country: ${countryName}`} />
          </div>
        </article>
      ))}

      <div style={styles.footer}>Regional RSS matching can miss articles that mention the country only in the full text. NewsData.io and Google News availability depends on provider coverage and service limits.</div>
    </section>
  );
}

const styles = {
  section: { background: '#fff', border: '1px solid #dbe3ed', borderRadius: 10, padding: 16, margin: '0 0 20px', color: '#0f172a' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 10 },
  title: { margin: 0, fontSize: 18 },
  subtitle: { marginTop: 5, color: '#64748b', fontSize: 11, lineHeight: 1.45 },
  searchLink: { color: '#2563eb', fontSize: 12, whiteSpace: 'nowrap' },
  status: { padding: 12, background: '#f8fafc', borderRadius: 7, color: '#475569', fontSize: 12, lineHeight: 1.5 },
  error: { padding: 10, background: '#fff1f2', color: '#9f1239', fontSize: 12, borderRadius: 6 },
  article: { padding: '12px 0', borderTop: '1px solid #e2e8f0' },
  meta: { color: '#64748b', textTransform: 'uppercase', fontSize: 9, fontWeight: 700, marginBottom: 4 },
  headline: { color: '#0f172a', fontSize: 14, fontWeight: 700, textDecoration: 'none', lineHeight: 1.4 },
  abstract: { color: '#475569', fontSize: 12, lineHeight: 1.5, margin: '5px 0' },
  actions: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  articleLink: { color: '#2563eb', fontSize: 11 },
  footer: { marginTop: 10, color: '#94a3b8', fontSize: 10, lineHeight: 1.4 },
};
