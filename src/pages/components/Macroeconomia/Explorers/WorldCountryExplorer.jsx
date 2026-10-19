import { BACKEND_URL } from "../../../../apiUrl.js";
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import CountryNews from './CountryNews';
import CountryAnalysisText from './CountryAnalysisText';

const WORLD_BANK_URL = 'https://api.worldbank.org/v2';
const COUNTRY_AI_ENDPOINT = `${BACKEND_URL}/AI/analyzeCountry`;

const INDICATORS = [
  { code: 'NY.GDP.MKTP.CD', id: 'gdp', label: 'GDP', group: 'Output', unit: 'current US$', format: 'currency' },
  { code: 'NY.GDP.MKTP.PP.CD', id: 'gdpPpp', label: 'GDP (PPP)', group: 'Output', unit: 'current international $', format: 'currency' },
  { code: 'NY.GDP.PCAP.CD', id: 'gdpPerCapita', label: 'GDP per capita', group: 'Living standards', unit: 'current US$', format: 'currency' },
  { code: 'NY.GDP.PCAP.PP.CD', id: 'gdpPerCapitaPpp', label: 'GDP per capita (PPP)', group: 'Living standards', unit: 'current international $', format: 'currency' },
  { code: 'NY.GDP.MKTP.KD.ZG', id: 'growth', label: 'Real GDP growth', group: 'Growth', unit: '% annual', format: 'percent' },
  { code: 'FP.CPI.TOTL.ZG', id: 'inflation', label: 'Inflation', group: 'Prices', unit: '% annual', format: 'percent' },
  { code: 'FP.CPI.TOTL', id: 'cpiIndex', label: 'Consumer price index', group: 'Prices', unit: '2010 = 100', format: 'decimal' },
  { code: 'PA.NUS.FCRF', id: 'exchangeRate', label: 'Official exchange rate', group: 'Foreign exchange', unit: 'local currency per US$', format: 'decimal' },
  { code: 'PA.NUS.PPP', id: 'pppConversion', label: 'PPP conversion factor', group: 'Purchasing power', unit: 'local per international $', format: 'decimal' },
  { code: 'SL.UEM.TOTL.ZS', id: 'unemployment', label: 'Unemployment', group: 'Labor', unit: '% of labor force', format: 'percent' },
  { code: 'SP.POP.TOTL', id: 'population', label: 'Population', group: 'Demographics', unit: 'people', format: 'number' },
  { code: 'NE.TRD.GNFS.ZS', id: 'trade', label: 'Trade (% of GDP)', group: 'External sector', unit: '% of GDP', format: 'percent' },
  { code: 'BX.KLT.DINV.WD.GD.ZS', id: 'fdi', label: 'FDI net inflows', group: 'External sector', unit: '% of GDP', format: 'percent' },
  { code: 'SP.DYN.LE00.IN', id: 'lifeExpectancy', label: 'Life expectancy', group: 'Social outcomes', unit: 'years', format: 'decimal' },
  { code: 'GC.DOD.TOTL.GD.ZS', id: 'debt', label: 'Central government debt', group: 'Public finance', unit: '% of GDP', format: 'percent' },
  { code: 'derived:gold-reserves', id: 'goldReserves', label: 'Gold reserves', group: 'Reserves', unit: 'current US$', format: 'currency' },
  { code: 'FI.RES.TOTL.CD', id: 'totalReserves', label: 'Total reserves incl. gold', group: 'Reserves', unit: 'current US$', format: 'currency' },
  { code: 'FI.RES.TOTL.MO', id: 'reserveMonths', label: 'Reserve cover', group: 'Reserves', unit: 'months of imports', format: 'decimal' },
  { code: 'SI.POV.GINI', id: 'gini', label: 'Gini index', group: 'Distribution', unit: '0 = equality; 100 = inequality', format: 'decimal' },
  { code: 'SI.DST.FRST.20', id: 'incomeBottom20', label: 'Income share: bottom 20%', group: 'Distribution', unit: '% of income', format: 'percent' },
  { code: 'SI.DST.10TH.10', id: 'incomeTop10', label: 'Income share: top 10%', group: 'Distribution', unit: '% of income', format: 'percent' },
  { code: 'SI.POV.NAHC', id: 'povertyNational', label: 'Poverty at national line', group: 'Poverty', unit: '% of population', format: 'percent' },
  { code: 'SI.POV.DDAY', id: 'povertyExtreme', label: 'Extreme poverty ($3.00/day)', group: 'Poverty', unit: '% at 2021 PPP', format: 'percent' },
  { code: 'SI.POV.UMIC', id: 'povertyUpperMiddle', label: 'Poverty ($8.30/day)', group: 'Poverty', unit: '% at 2021 PPP', format: 'percent' },
];

const COUNTRY_ALIASES = {
  'United States of America': ['United States'],
  Russia: ['Russian Federation'],
  'South Korea': ['Korea, Rep.', 'Korea, Republic of'],
  'Korea, South': ['Korea, Rep.', 'Korea, Republic of'],
  'North Korea': ["Korea, Dem. People's Rep.", 'Korea, Dem. Rep.'],
  'Iran': ['Iran, Islamic Rep.'],
  'Egypt': ['Egypt, Arab Rep.'],
  'Venezuela': ['Venezuela, RB'],
  'Vietnam': ['Viet Nam'],
  'Laos': ['Lao PDR'],
  'Syria': ['Syrian Arab Republic'],
  'Bolivia': ['Bolivia'],
  'Congo, Democratic Republic of the': ['Congo, Dem. Rep.'],
  'Democratic Republic of the Congo': ['Congo, Dem. Rep.'],
  'Congo, Republic of the': ['Congo, Rep.'],
  'Ivory Coast': ["Cote d'Ivoire"],
  'Czech Republic': ['Czechia'],
  'Turkey': ['Turkiye', 'Türkiye'],
  'Türkiye': ['Turkiye', 'Türkiye'],
  'The Gambia': ['Gambia, The'],
  'The Bahamas': ['Bahamas, The'],
  'Kyrgyzstan': ['Kyrgyz Republic'],
  'Brunei': ['Brunei Darussalam'],
  'Cape Verde': ['Cabo Verde'],
  'Micronesia': ['Micronesia, Fed. Sts.'],
  'East Timor': ['Timor-Leste'],
  'Slovakia': ['Slovak Republic'],
  'Moldova': ['Moldova'],
};

let countryCatalogPromise = null;
const indicatorCache = new Map();

const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

async function getCountryCatalog() {
  if (!countryCatalogPromise) {
    countryCatalogPromise = fetch(`${WORLD_BANK_URL}/country?format=json&per_page=400`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`World Bank country catalog returned HTTP ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload?.[1])) throw new Error('Unexpected World Bank country catalog response');
        return payload[1].filter((country) => country?.id && country?.name && country?.region?.value !== 'Aggregates');
      })
      .catch((error) => {
        countryCatalogPromise = null;
        throw error;
      });
  }
  return countryCatalogPromise;
}

async function resolveCountry(countryName) {
  const catalog = await getCountryCatalog();
  const aliases = [countryName, ...(COUNTRY_ALIASES[countryName] || [])];
  for (const alias of aliases) {
    const target = normalize(alias);
    const exact = catalog.find((item) => normalize(item.name) === target);
    if (exact) return exact;
  }
  return null;
}

function normalizeObservations(payload) {
  const raw = Array.isArray(payload?.[1]) ? payload[1] : [];
  return raw
    .filter((row) => row && row.value !== null && row.value !== undefined && Number.isFinite(Number(row.value)))
    .map((row) => ({ year: String(row.date), value: Number(row.value) }))
    .sort((a, b) => Number(a.year) - Number(b.year));
}

async function fetchIndicator(countryId, indicator) {
  const cacheKey = `${countryId}:${indicator.code}`;
  const cached = indicatorCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = (async () => {
    const sourceCodes = indicator.id === 'goldReserves'
      ? ['FI.RES.TOTL.CD', 'FI.RES.XGLD.CD']
      : [indicator.code];
    const responses = await Promise.all(sourceCodes.map(async (code) => {
      const url = `${WORLD_BANK_URL}/country/${encodeURIComponent(countryId)}/indicator/${encodeURIComponent(code)}?format=json&per_page=100`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }));
    let series = normalizeObservations(responses[0]);
    if (indicator.id === 'goldReserves') {
      const reservesExcludingGold = new Map(
        normalizeObservations(responses[1]).map((item) => [item.year, item.value])
      );
      series = series
        .filter((item) => reservesExcludingGold.has(item.year))
        .map((item) => ({ ...item, value: item.value - reservesExcludingGold.get(item.year) }));
    }
    if (!series.length) {
      return { ...indicator, value: null, change: null, year: null, series: [], error: true, loading: false, errorMessage: 'No published observations for this indicator.' };
    }

    const latest = series[series.length - 1];
    const previous = series.length > 1 ? series[series.length - 2] : null;
    let change = null;
    if (previous && previous.value !== 0) change = ((latest.value - previous.value) / Math.abs(previous.value)) * 100;

    return { ...indicator, value: latest.value, change, year: latest.year, previousYear: previous?.year || null, series, error: false, loading: false, errorMessage: '', derived: indicator.id === 'goldReserves' };
  })();

  indicatorCache.set(cacheKey, { promise, expiresAt: Date.now() + 10 * 60 * 1000 });
  try {
    return await promise;
  } catch (error) {
    indicatorCache.delete(cacheKey);
    throw error;
  }
}

function formatValue(value, format) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (format === 'currency') {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  if (format === 'number') {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function initialIndicators() {
  return INDICATORS.map((item) => ({ ...item, value: null, change: null, year: null, series: [], error: false, loading: true, errorMessage: '' }));
}

export default function WorldCountryExplorer({ countryName, onChatContextChange }) {
  const [country, setCountry] = useState(null);
  const [summary, setSummary] = useState(initialIndicators);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [countryError, setCountryError] = useState('');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState('growth');
  const [newsItems, setNewsItems] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setCountry(null);
    setCountryError('');
    setCatalogLoading(true);
    setSummaryLoading(true);
    setSummary(initialIndicators());
    setAnalysis('');
    setAnalysisError('');
    setNewsItems([]);

    const load = async () => {
      try {
        const resolved = await resolveCountry(countryName);
        if (cancelled) return;
        if (!resolved) {
          setCountryError(`World Bank does not have a matching country record for "${countryName}". Economic cards cannot load until a name alias or data source is added.`);
          setCatalogLoading(false);
          setSummaryLoading(false);
          setSummary((prev) => prev.map((item) => ({ ...item, loading: false, error: true, errorMessage: 'Country not matched.' })));
          return;
        }

        setCountry(resolved);
        setCatalogLoading(false);

        await Promise.all(INDICATORS.map(async (indicator) => {
          let result;
          try {
            result = await fetchIndicator(resolved.id, indicator);
          } catch (error) {
            result = { ...indicator, value: null, change: null, year: null, series: [], error: true, loading: false, errorMessage: error.message || 'Request failed.' };
          }
          if (cancelled) return;
          setSummary((prev) => prev.map((item) => item.id === indicator.id ? result : item));
        }));
      } catch (error) {
        if (!cancelled) {
          setCountryError(error.message || 'Unable to load World Bank country data.');
          setCatalogLoading(false);
          setSummaryLoading(false);
          setSummary((prev) => prev.map((item) => ({ ...item, loading: false, error: true, errorMessage: 'Country data unavailable.' })));
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
          setSummaryLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [countryName]);

  const selectedIndicator = useMemo(
    () => summary.find((item) => item.id === selectedIndicatorId) || summary[0],
    [summary, selectedIndicatorId]
  );
  const countryChatContext = useMemo(() => ({
    capturedAt: new Date().toISOString(),
    country: {
      name: countryName,
      worldBankId: country?.id || null,
      region: country?.region?.value || null,
      incomeLevel: country?.incomeLevel?.value || null,
    },
    indicators: summary.map((item) => ({
      name: item.label,
      value: item.value,
      unit: item.unit,
      year: item.year,
      changeVsPreviousObservationPct: item.change,
      recentObservations: (item.series || []).slice(-30),
      loading: item.loading,
      error: item.error ? item.errorMessage : null,
    })),
    selectedIndicator: selectedIndicator ? {
      name: selectedIndicator.label,
      unit: selectedIndicator.unit,
      observations: (selectedIndicator.series || []).slice(-60),
    } : null,
    relatedNews: newsItems.map((item) => ({
      title: item.title,
      abstract: item.abstract,
      published: item.published,
      source: item.source,
      url: item.url,
      note: item.note,
    })),
    assessment: analysis || null,
    loading: { catalog: catalogLoading, indicators: summaryLoading },
    dataError: countryError || null,
  }), [
    countryName, country, summary, selectedIndicator, newsItems, analysis,
    catalogLoading, summaryLoading, countryError,
  ]);

  useEffect(() => {
    onChatContextChange?.('country', {
      title: `Ask AI about ${countryName}`,
      description: 'Ask about this country’s indicators, historical series, assessment, and related news.',
      contextType: 'country-profile',
      context: countryChatContext,
      contextKey: `country:${countryName}`,
      downloadName: `${countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-country-data.json`,
    });
    return () => onChatContextChange?.('country', null);
  }, [countryName, countryChatContext, onChatContextChange]);

  const runPoliticalAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysis('');
    const completedIndicators = summary
      .filter((item) => !item.loading && !item.error && item.value !== null)
      .map((item) => ({ indicator: item.label, value: item.value, unit: item.unit, latestYear: item.year, changeVsPreviousObservationPct: item.change }));
    const headlines = newsItems.map((item) => ({
      title: item.title,
      abstract: item.abstract,
      published: item.published,
      url: item.url,
      source: item.source,
      provider: item.provider,
      note: item.note,
    }));

    try {
      const response = await axios.post(COUNTRY_AI_ENDPOINT, {
        country: countryName,
        countryMetadata: country ? { worldBankId: country.id, region: country.region?.value, incomeLevel: country.incomeLevel?.value } : null,
        indicators: completedIndicators,
        headlines,
        requestedSections: [
          'current national leadership and government structure',
          'regime type and ideology, distinguishing official doctrine from observed policy',
          'how the government pursues its objectives',
          'regional and global power and relative capabilities',
          'strengths, vulnerabilities and current constraints',
          'historical economic and social trajectory: improving or worsening versus prior periods',
          'evidence quality, source dates, uncertainty and competing interpretations',
        ],
      }, { timeout: 90000, headers: { 'Content-Type': 'application/json' } });
      const reply = response.data?.reply || response.data?.analysis || response.data?.result;
      if (!reply) throw new Error('The endpoint responded without a reply/analysis field.');
      if (response.data?.news?.articles) setNewsItems(response.data.news.articles);
      setAnalysis(typeof reply === 'string' ? reply : JSON.stringify(reply, null, 2));
    } catch (error) {
      setAnalysisError(error.response?.data?.error || error.message || 'Country analysis failed.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const formatChange = (value) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return '—';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>GLOBAL MACROECONOMIC PROFILE</div>
          <h2 style={styles.title}>{countryName}</h2>
          <div style={styles.subtitle}>
            {country ? [country.region?.value, country.incomeLevel?.value, country.id].filter(Boolean).join(' · ') : 'Country overview loads first; datasets populate independently as they arrive.'}
          </div>
        </div>
        <div style={styles.sourceBadge}>World Bank API</div>
      </header>

      {(catalogLoading || summaryLoading) && (
        <div style={styles.loadingBar}>
          {catalogLoading ? 'Matching the country to the World Bank catalog…' : `Loading indicators independently… ${summary.filter((item) => !item.loading).length}/${INDICATORS.length} ready`}
        </div>
      )}
      {countryError && <div style={styles.error}>{countryError}</div>}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Economic and social indicators</h3>
            <p style={styles.sectionSub}>Latest available World Bank observation. Publication years vary by indicator; percentage changes compare adjacent published observations and positive does not always mean better. The FX series is an annual official average, not a live quote.</p>
          </div>
          <span style={styles.small}>{summary.filter((item) => !item.loading && !item.error).length}/{INDICATORS.length} loaded</span>
        </div>

        <div style={styles.grid}>
          {summary.map((item) => {
            const positive = item.change > 0;
            const negative = item.change < 0;
            return (
              <button key={item.id} type="button" onClick={() => setSelectedIndicatorId(item.id)} style={{ ...styles.card, borderColor: selectedIndicatorId === item.id ? '#2563eb' : '#dbe3ed', background: selectedIndicatorId === item.id ? '#eff6ff' : '#fff' }}>
                <div style={styles.cardTop}><span style={styles.cardLabel}>{item.label}</span><span style={styles.cardGroup}>{item.group}</span></div>
                <div style={styles.valueRow}>
                  <strong style={styles.value}>{item.loading ? 'Loading…' : item.error ? '—' : formatValue(item.value, item.format)}</strong>
                  <span style={{ ...styles.change, color: positive ? '#15803d' : negative ? '#b91c1c' : '#64748b' }}>{item.loading ? '…' : item.error ? 'N/A' : formatChange(item.change)}</span>
                </div>
                <div style={styles.cardFoot}>{item.loading ? 'Fetching this series' : item.error ? item.errorMessage : `${item.year || 'Date n/a'} · ${item.id === 'exchangeRate' && country?.currencyUnit ? `${country.currencyUnit} per US$` : item.unit}${item.derived ? ' · World Bank reserves including gold minus reserves excluding gold' : ''}`}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>{selectedIndicator?.label || 'Historical series'}</h3>
            <p style={styles.sectionSub}>Historical observations from the selected indicator.</p>
          </div>
        </div>
        {selectedIndicator?.series?.length > 0 ? (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedIndicator.series} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" minTickGap={28} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={72} />
                <Tooltip formatter={(value) => [formatValue(Number(value), selectedIndicator.format), selectedIndicator.label]} />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={styles.status}>{selectedIndicator?.loading ? 'Fetching historical series…' : selectedIndicator?.error ? 'No usable time series is available for this indicator.' : 'Historical observations will appear here as soon as the series arrives.'}</div>
        )}
        <div style={styles.sourceNote}>Source: World Bank Indicators API. Annual indicators can have publication lags; the observation year may not be the current year.</div>
      </section>

      <CountryNews countryName={countryName} onArticlesLoaded={setNewsItems} />

      <section style={styles.politicsSection}>
        <div style={styles.sectionHeader}>
          <div>
            <h3 style={styles.sectionTitle}>Political and strategic assessment</h3>
            <p style={styles.sectionSub}>Leadership, regime, ideology, policy execution, regional/global leverage, constraints, and whether outcomes have improved relative to historical baselines.</p>
          </div>
        </div>
        <div style={styles.assessmentNotice}>The assessment should distinguish verified facts from interpretation and cite dated sources. The frontend sends the available economic observations and country-matched headlines to the backend for synthesis.</div>
        <button type="button" onClick={runPoliticalAnalysis} disabled={analysisLoading} style={styles.analyzeButton}>
          {analysisLoading ? 'Building country assessment…' : 'Generate political + macroeconomic assessment'}
        </button>
        {analysisError && <div style={styles.error}>{analysisError}</div>}
        {analysis && <div style={styles.analysis}><CountryAnalysisText text={analysis} /></div>}
      </section>
    </div>
  );
}

const styles = {
  container: { width: '100%', maxWidth: 1100, margin: '0 auto', padding: 16, boxSizing: 'border-box', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  eyebrow: { color: '#64748b', fontWeight: 800, letterSpacing: 1.2, fontSize: 9, marginBottom: 4 },
  title: { margin: 0, fontSize: 25, lineHeight: 1.15 },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 6 },
  sourceBadge: { background: '#e0f2fe', color: '#075985', borderRadius: 6, padding: '6px 9px', fontWeight: 700, fontSize: 10 },
  loadingBar: { padding: 9, borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, marginBottom: 12 },
  error: { padding: 10, background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3', borderRadius: 7, fontSize: 11, lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-wrap' },
  section: { padding: 14, marginBottom: 16, background: '#fff', border: '1px solid #dbe3ed', borderRadius: 10 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 10 },
  sectionTitle: { margin: 0, fontSize: 16 },
  sectionSub: { margin: '4px 0 0', color: '#64748b', fontSize: 10, lineHeight: 1.45, maxWidth: 800 },
  small: { fontSize: 10, color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 },
  card: { textAlign: 'left', border: '1px solid #dbe3ed', borderRadius: 8, padding: 10, cursor: 'pointer', minWidth: 0, color: '#0f172a' },
  cardTop: { display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'flex-start' },
  cardLabel: { color: '#1e40af', fontSize: 11, fontWeight: 800 },
  cardGroup: { fontSize: 8, color: '#64748b', background: '#f1f5f9', padding: '3px 5px', borderRadius: 4, whiteSpace: 'nowrap' },
  valueRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginTop: 9 },
  value: { fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  change: { fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' },
  cardFoot: { fontSize: 9, color: '#94a3b8', marginTop: 6, minHeight: 13 },
  status: { padding: 12, background: '#f8fafc', borderRadius: 7, color: '#64748b', fontSize: 11 },
  sourceNote: { fontSize: 9, color: '#94a3b8', marginTop: 8, lineHeight: 1.4 },
  politicsSection: { padding: 14, marginBottom: 14, background: '#fff', border: '1px solid #dbe3ed', borderRadius: 10 },
  assessmentNotice: { color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', padding: 10, borderRadius: 7, fontSize: 11, lineHeight: 1.5, marginBottom: 9 },
  analyzeButton: { width: '100%', padding: '10px 12px', background: '#0f172a', color: '#fff', border: 0, borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 800 },
  analysis: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, color: '#1e293b', fontFamily: 'inherit', fontSize: 11, lineHeight: 1.6, marginBottom: 0 },
};
