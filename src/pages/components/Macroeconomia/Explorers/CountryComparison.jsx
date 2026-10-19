import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CountryAnalysisText from './CountryAnalysisText';
import './CountryComparison.css';

const BACKEND_URL = 'http://localhost:5000';
const COLORS = ['#167d72', '#3569ad', '#b56827', '#9257a0', '#c34b59', '#5c7480'];
const countryProfileCache = new Map();
const countryProfileRequests = new Map();
const COMPARE_INDICATORS = [
  ['gdp', 'GDP, current US$'],
  ['gdp_ppp', 'GDP, PPP'],
  ['gdp_per_capita', 'GDP per capita'],
  ['gdp_per_capita_ppp', 'GDP per capita, PPP'],
  ['gdp_growth', 'Real GDP growth'],
  ['inflation', 'Inflation'],
  ['cpi_index', 'Consumer price index'],
  ['exchange_rate', 'Official FX rate'],
  ['ppp_conversion', 'PPP conversion'],
  ['gold_reserves', 'Gold reserves'],
  ['total_reserves', 'Total reserves'],
  ['reserves_months_imports', 'Reserve cover'],
  ['population', 'Population'],
  ['trade', 'Trade (% GDP)'],
  ['fdi', 'FDI inflows (% GDP)'],
  ['current_account', 'Current account (% GDP)'],
  ['government_debt', 'Government debt (% GDP)'],
  ['unemployment', 'Unemployment'],
  ['life_expectancy', 'Life expectancy'],
  ['gini', 'Gini index'],
  ['poverty_national', 'National poverty'],
  ['poverty_300', 'Extreme poverty ($3.00/day)'],
  ['poverty_830', 'Poverty ($8.30/day)'],
  ['income_share_bottom_20', 'Income share: bottom 20%'],
  ['income_share_top_10', 'Income share: top 10%'],
];
const SNAPSHOT_INDICATORS = [
  ['gdp', 'GDP, current US$'],
  ['gdp_ppp', 'GDP, PPP'],
  ['gdp_per_capita', 'GDP per capita'],
  ['gdp_per_capita_ppp', 'GDP per capita, PPP'],
  ['gdp_growth', 'Real GDP growth'],
  ['inflation', 'Inflation'],
  ['cpi_index', 'Consumer price index'],
  ['exchange_rate', 'Official FX rate'],
  ['ppp_conversion', 'PPP conversion'],
  ['gold_reserves', 'Gold reserves'],
  ['total_reserves', 'Total reserves'],
  ['reserves_months_imports', 'Reserve cover'],
  ['population', 'Population'],
  ['trade', 'Trade (% GDP)'],
  ['fdi', 'FDI inflows (% GDP)'],
  ['current_account', 'Current account (% GDP)'],
  ['government_debt', 'Government debt (% GDP)'],
  ['unemployment', 'Unemployment'],
  ['life_expectancy', 'Life expectancy'],
  ['gini', 'Gini index'],
  ['poverty_national', 'National poverty'],
  ['poverty_300', 'Extreme poverty ($3.00/day)'],
  ['poverty_830', 'Poverty ($8.30/day)'],
  ['income_share_bottom_20', 'Income share: bottom 20%'],
  ['income_share_top_10', 'Income share: top 10%'],
];

function loadCountryProfile(name) {
  if (countryProfileCache.has(name)) return Promise.resolve(countryProfileCache.get(name));
  if (countryProfileRequests.has(name)) return countryProfileRequests.get(name);

  const request = axios.get(
    `${BACKEND_URL}/macro/country-profile/${encodeURIComponent(name)}`,
    { timeout: 90000 }
  ).then(({ data }) => {
    countryProfileCache.set(name, data);
    return data;
  }).finally(() => {
    countryProfileRequests.delete(name);
  });
  countryProfileRequests.set(name, request);
  return request;
}

function latest(indicator) {
  return indicator?.latest?.value ?? null;
}

function formatValue(value, key) {
  if (!Number.isFinite(value)) return 'No data';
  if (['gdp', 'gdp_ppp', 'gdp_per_capita', 'gdp_per_capita_ppp', 'gold_reserves', 'total_reserves'].includes(key)) {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function groupRegionalProfiles(profiles) {
  const groups = new Map();
  profiles.forEach((profile) => {
    const country = profile?.country;
    const region = country?.region;
    const regionId = country?.regionId;
    const gdp = profile?.indicators?.gdp;
    if (!regionId || !gdp?.observations?.length) return;
    const years = new Set(gdp.observations.map((item) => item.year));
    const key = `${regionId}:${region}`;
    if (!groups.has(key)) groups.set(key, { regionId, region, profiles: [], sharedYears: null });
    const group = groups.get(key);
    group.profiles.push(profile);
    group.sharedYears = group.sharedYears === null
      ? years
      : new Set([...group.sharedYears].filter((year) => years.has(year)));
  });

  return [...groups.values()]
    .filter((group) => group.profiles.length > 1 && group.sharedYears?.size)
    .map((group) => {
      const year = [...group.sharedYears].sort().at(-1);
      const combinedGdp = group.profiles.reduce((sum, profile) => {
        const row = profile.indicators.gdp.observations.find((item) => item.year === year);
        return sum + (row?.value || 0);
      }, 0);
      const regionalTotal = group.profiles.find(
        (profile) => profile.relativeEconomicScale?.year === year
      )?.relativeEconomicScale?.regionalGdpCurrentUsd;
      return {
        region: group.region,
        year,
        countries: group.profiles.map((profile) => profile.country.name),
        combinedGdp,
        regionalShare: regionalTotal ? (combinedGdp / regionalTotal) * 100 : null,
      };
    });
}

export default function CountryComparison({ countryNames, onRemoveCountry, onChatContextChange }) {
  const [profiles, setProfiles] = useState([]);
  const [loadErrors, setLoadErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [indicatorKey, setIndicatorKey] = useState('gdp_growth');
  const [analysis, setAnalysis] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisVersion, setAnalysisVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const selectedNames = new Set(countryNames);
    setProfiles((current) => current.filter(({ name }) => selectedNames.has(name)));
    setLoadErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([name]) => selectedNames.has(name))
    ));
    setAnalysis('');
    setAnalysisError('');
    if (!countryNames.length) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    const missingProfiles = countryNames.filter((name) => !countryProfileCache.has(name));
    setLoading(missingProfiles.length > 0);
    countryNames.forEach((name) => {
      if (countryProfileCache.has(name)) {
        const profile = countryProfileCache.get(name);
        setProfiles((current) => current.some((item) => item.name === name)
          ? current
          : [...current, { name, profile }]);
        return;
      }

      loadCountryProfile(name).then((profile) => {
        if (cancelled) return;
        setProfiles((current) => current.some((item) => item.name === name)
          ? current.map((item) => item.name === name ? { name, profile } : item)
          : [...current, { name, profile }]);
        setLoadErrors((current) => {
          const { [name]: _removed, ...remaining } = current;
          return remaining;
        });
      }).catch((error) => {
        if (cancelled) return;
        setLoadErrors((current) => ({
          ...current,
          [name]: error.response?.data?.error || error.message || 'Profile unavailable.',
        }));
      }).finally(() => {
        if (cancelled) return;
        setLoading([...selectedNames].some((selectedName) => (
          !countryProfileCache.has(selectedName) && countryProfileRequests.has(selectedName)
        )));
      });
    });

    return () => { cancelled = true; };
  }, [countryNames]);

  const selectedProfiles = useMemo(
    () => profiles.filter(({ name }) => countryNames.includes(name)),
    [profiles, countryNames]
  );
  const indicatorRankings = useMemo(() => SNAPSHOT_INDICATORS.map(([key, label]) => {
    const countries = selectedProfiles.map(({ name, profile }) => ({
      name,
      value: latest(profile.indicators?.[key]),
      year: profile.indicators?.[key]?.latest?.year || null,
    }));
    countries.sort((a, b) => {
      const aMissing = a.value === null || a.value === undefined;
      const bMissing = b.value === null || b.value === undefined;
      if (aMissing && bMissing) return a.name.localeCompare(b.name);
      if (aMissing) return 1;
      if (bMissing) return -1;
      return b.value - a.value;
    });
    return { key, label, countries };
  }), [selectedProfiles]);
  const regionalGroups = useMemo(() => groupRegionalProfiles(selectedProfiles.map((item) => item.profile)), [selectedProfiles]);
  const nationalIndicators = useMemo(() => (
    ['gdp_growth', 'inflation', 'unemployment', 'policy_rate'].map((key) => ({
      key,
      countries: selectedProfiles.map(({ name, profile }) => ({
        name,
        entry: profile.nationalData?.indicators?.find((item) => item.indicator === key) || null,
        provider: profile.nationalData?.provider?.name || null,
      })),
    }))
  ), [selectedProfiles]);
  const chartData = useMemo(() => {
    const byYear = new Map();
    selectedProfiles.forEach(({ name, profile }) => {
      const series = profile.indicators?.[indicatorKey]?.observations || [];
      series.forEach(({ year, value }) => {
        if (!byYear.has(year)) byYear.set(year, { year });
        byYear.get(year)[name] = value;
      });
    });
    return [...byYear.values()].sort((a, b) => Number(a.year) - Number(b.year));
  }, [selectedProfiles, indicatorKey]);

  const runComparison = async () => {
    if (selectedProfiles.length < 2) return;
    setAnalysisVersion((version) => version + 1);
    setAnalysisLoading(true);
    setAnalysisError('');
    setAnalysis('');
    try {
      const response = await axios.post(
        `${BACKEND_URL}/AI/compareCountries`,
        { countryProfiles: selectedProfiles },
        { timeout: 120000, headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.data?.reply) throw new Error('The AI endpoint returned no comparison.');
      setAnalysis(response.data.reply);
    } catch (error) {
      setAnalysisError(error.response?.data?.error || error.message || 'AI comparison failed.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const countryChatContext = useMemo(() => {
    if (!selectedProfiles.length) return null;
    return {
      capturedAt: new Date().toISOString(),
      analysis: analysis || null,
      selectedIndicator: {
        key: indicatorKey,
        label: COMPARE_INDICATORS.find(([key]) => key === indicatorKey)?.[1] || indicatorKey,
        chartData,
      },
      indicatorRankings,
      regionalGroups,
      countries: selectedProfiles.map(({ name, profile }) => ({
        name,
        country: profile.country,
        relativeEconomicScale: profile.relativeEconomicScale,
        indicators: Object.fromEntries(
          Object.entries(profile.indicators || {}).map(([key, indicator]) => [
            key,
            {
              latest: indicator.latest,
              recentObservations: (indicator.observations || []).slice(-12),
            },
          ])
        ),
      })),
    };
  }, [analysis, indicatorKey, chartData, indicatorRankings, regionalGroups, selectedProfiles]);

  useEffect(() => {
    onChatContextChange?.('comparison', countryChatContext ? {
      title: `Ask AI about ${countryNames.join(' and ')}`,
      description: 'Explore the selected countries, published indicators, comparison chart, and AI assessment.',
      contextType: 'country-comparison',
      context: countryChatContext,
      contextKey: `comparison:${analysisVersion}:${countryNames.join('|')}:${indicatorKey}`,
      downloadName: 'country-comparison-data.json',
    } : null);
    return () => onChatContextChange?.('comparison', null);
  }, [countryChatContext, countryNames, onChatContextChange]);

  return (
    <div className="country-compare">
      <header className="country-compare-header">
        <div>
          <div className="country-compare-eyebrow">MULTI-COUNTRY MACRO</div>
          <h2>Economic comparison</h2>
          <p>Comparable annual data, reserves, currencies, purchasing power and distribution indicators.</p>
        </div>
        <span className="country-compare-count">{countryNames.length} selected</span>
      </header>

      <div className="country-compare-selected">
        {countryNames.map((name, index) => (
          <button key={name} type="button" onClick={() => onRemoveCountry(name)} title={`Remove ${name}`}>
            <span className="country-compare-dot" style={{ background: COLORS[index % COLORS.length] }} />
            {name}<span aria-hidden="true">×</span>
          </button>
        ))}
      </div>

      {countryNames.length < 2 && (
        <div className="country-compare-notice">Select at least two countries on the globe to compare their data and generate an AI synthesis.</div>
      )}
      {loading && <div className="country-compare-notice">Loading World Bank / IMF profiles and national-source releases…</div>}
      {Object.entries(loadErrors).map(([name, message]) => (
        <div className="country-compare-error" key={name}>{name}: {message}</div>
      ))}

      {profiles.length > 0 && (
        <>
          <section className="country-compare-section">
            <div className="country-compare-section-title">
              <div><h3>Indicator rankings</h3><p>Each box ranks selected countries highest-to-lowest by the latest published observation; values include their data year.</p></div>
            </div>
            <div className="country-compare-rank-grid">
              {indicatorRankings.map(({ key, label, countries }) => (
                <section className="country-compare-rank-box" key={key}>
                  <h4>{label}</h4>
                  <ol>
                    {countries.map(({ name, value, year }, index) => (
                      <li className={value === null || value === undefined ? 'unavailable' : ''} key={name}>
                        <span className="country-compare-rank-number">{value === null || value === undefined ? '—' : `#${index + 1}`}</span>
                        <span className="country-compare-rank-country">
                          <span
                            className="country-compare-dot"
                            style={{ background: COLORS[Math.max(0, countryNames.indexOf(name)) % COLORS.length] }}
                          />
                          {name}
                        </span>
                        <strong>{formatValue(value, key)}</strong>
                        <small>{year || 'No observation'}</small>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
            <div className="country-compare-scale">
              <span>Share of world GDP (latest comparable country year)</span>
              <div className="country-compare-scale-list">
                {[...selectedProfiles]
                  .sort((a, b) => {
                    const aShare = a.profile.relativeEconomicScale?.worldGdpSharePct;
                    const bShare = b.profile.relativeEconomicScale?.worldGdpSharePct;
                    if (!Number.isFinite(aShare) && !Number.isFinite(bShare)) return a.name.localeCompare(b.name);
                    if (!Number.isFinite(aShare)) return 1;
                    if (!Number.isFinite(bShare)) return -1;
                    return bShare - aShare;
                  })
                  .map(({ name, profile }, index) => (
                  <span key={name}>
                    <small>#{index + 1}</small>
                    <i className="country-compare-dot" style={{ background: COLORS[Math.max(0, countryNames.indexOf(name)) % COLORS.length] }} />
                    {name}
                    <strong>{Number.isFinite(profile.relativeEconomicScale?.worldGdpSharePct)
                      ? `${profile.relativeEconomicScale.worldGdpSharePct.toFixed(2)}%`
                      : 'No data'}</strong>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="country-compare-section">
            <div className="country-compare-section-title">
              <div>
                <h3>Latest national releases</h3>
                <p>Country-specific official feeds where available. Publication dates and frequencies differ; source and observation date are shown for each value.</p>
              </div>
            </div>
            <div className="country-compare-rank-grid">
              {nationalIndicators.map(({ key, countries }) => (
                <section className="country-compare-rank-box" key={`national-${key}`}>
                  <h4>{SNAPSHOT_INDICATORS.find(([indicator]) => indicator === key)?.[1] || key}</h4>
                  <ol>
                    {countries.map(({ name, entry, provider }) => (
                      <li className={!entry ? 'unavailable' : ''} key={name}>
                        <span className="country-compare-national-country">{name}</span>
                        <strong>
                          {entry
                            ? `${Number(entry.value).toLocaleString('en-US', { maximumFractionDigits: 2 })}${entry.units ? ` ${entry.units}` : ''}`
                            : 'No national series'}
                        </strong>
                        <small>
                          {entry
                            ? `${entry.date} · ${entry.source} · ${entry.frequency}`
                            : provider || 'No configured national provider'}
                        </small>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </section>

          <section className="country-compare-section">
            <div className="country-compare-section-title country-compare-chart-title">
              <div><h3>Historical comparison</h3><p>Annual series show each country’s published observations; compare units before interpreting magnitude.</p></div>
              <select value={indicatorKey} onChange={(event) => setIndicatorKey(event.target.value)} aria-label="Indicator for country comparison chart">
                {COMPARE_INDICATORS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            {chartData.length ? (
              <div className="country-compare-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 18, bottom: 8, left: 8 }}>
                    <CartesianGrid stroke="#e7edf0" strokeDasharray="3 3" />
                    <XAxis dataKey="year" minTickGap={30} tick={{ fontSize: 10, fill: '#65747b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#65747b' }} />
                    <Tooltip />
                    <Legend />
                    {selectedProfiles.map(({ name }, index) => (
                      <Line key={name} type="monotone" dataKey={name} connectNulls={false} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="country-compare-notice">No common published observations are available for this indicator.</div>}
          </section>

          {regionalGroups.map((group) => (
            <section className="country-compare-region" key={group.regionId}>
              <div>
                <div className="country-compare-eyebrow">REGIONAL ECONOMIC SCALE · {group.year}</div>
                <h3>{group.region}</h3>
                <p>{group.countries.join(' + ')}</p>
              </div>
              <strong>{formatValue(group.combinedGdp, 'gdp')}</strong>
              <span>{Number.isFinite(group.regionalShare) ? `${group.regionalShare.toFixed(1)}% of regional GDP` : 'Regional aggregate unavailable for the shared year'}</span>
            </section>
          ))}
          <p className="country-compare-caveat">Regional strength here means economic scale only. World Bank surveys may be years apart; reserves and FX are reported values, not real-time market quotes. Missing observations are left blank rather than estimated.</p>

          <section className="country-compare-section country-compare-ai">
            <div className="country-compare-section-title">
              <div><h3>AI comparative assessment</h3><p>Contrasts the selected countries’ economic trajectory, regional weight, exposure and distributional outcomes using dated indicators and current country news.</p></div>
            </div>
            <button type="button" className="country-compare-button" onClick={runComparison} disabled={selectedProfiles.length < 2 || analysisLoading}>
              {analysisLoading ? 'Analyzing the selected countries…' : 'Generate AI country comparison'}
            </button>
            {analysisError && <div className="country-compare-error">{analysisError}</div>}
            {analysis && <div className="country-compare-analysis"><CountryAnalysisText text={analysis} /></div>}
          </section>
        </>
      )}
    </div>
  );
}
