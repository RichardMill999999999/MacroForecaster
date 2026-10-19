// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
// } from 'recharts';


// export default function FredCategoryExplorer() {
//   const [history, setHistory] = useState([{ id: 0, name: 'Root Categories' }]);
//   const [subcategories, setSubcategories] = useState([]);
//   const [seriesList, setSeriesList] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const [selectedSeries, setSelectedSeries] = useState(null);
//   const [seriesData, setSeriesData] = useState(null);
//   const [loadingData, setLoadingData] = useState(false);

//   const currentCategory = history[history.length - 1];

//   useEffect(() => {
//     fetchCategoryContents(currentCategory.id);
//   }, [currentCategory.id]);

//   const fetchCategoryContents = async (categoryId) => {
//     setLoading(true);
//     setError(null);
//     setSubcategories([]);
//     setSeriesList([]);
//     setSelectedSeries(null);
//     setSeriesData(null);

//     try {
//       const subCatRes = await fetch(`${BACKEND_URL}/FRED/categories/children/${categoryId}`);
//       if (!subCatRes.ok) throw new Error(`HTTP error! status: ${subCatRes.status}`);
//       const subCatData = await subCatRes.json();
//       setSubcategories(subCatData.categories || []);

//       const seriesRes = await fetch(`${BACKEND_URL}/FRED/categories/series/${categoryId}`);
//       if (!seriesRes.ok) throw new Error(`HTTP error! status: ${seriesRes.status}`);
//       const seriesData = await seriesRes.json();
//       const filteredSeries = (seriesData.seriess || []).filter(s => {
//     const title = (s.title || "").toLowerCase();
//     const units = (s.units || "").toLowerCase();

//     // remove discontinued
//     if (title.includes("discontinued")) return false;

//     // remove book values
//     if (title.includes("book value")) return false;

//     // remove display-only series
//     if (title.includes("on display")) return false;

//     // remove values in dollars instead of quantities
//     if (
//         units.includes("u.s. dollars") ||
//         units.includes("dollars")
//     )
//         return false;

//     return true;
// });

// setSeriesList(filteredSeries);
//     } catch (err) {
//       setError(`Failed to fetch FRED data: ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectSeries = async (series) => {
//     setSelectedSeries(series);
//     setSeriesData(null);
//     setLoadingData(true);

//     try {
//       const res = await fetch(`${BACKEND_URL}/FRED/series/${series.id}`);
//       if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//       const json = await res.json();
//       setSeriesData(json.data);
//     } catch (err) {
//       setError(`Failed to fetch data for ${series.id}: ${err.message}`);
//     } finally {
//       setLoadingData(false);
//     }
//   };

//   // Process raw data points into structured chart objects with period-to-period variations
//   const chartData = useMemo(() => {
//     if (!seriesData) return [];
//     const entries = Object.entries(seriesData);

//     return entries.map(([date, value], index) => {
//       const numValue = parseFloat(value);
//       let change = 0;
//       let percentChange = 0;

//       if (index > 0) {
//         const prevValue = parseFloat(entries[index - 1][1]);
//         change = numValue - prevValue;
//         percentChange = prevValue !== 0 ? (change / prevValue) * 100 : 0;
//       }

//       return {
//         date,
//         value: isNaN(numValue) ? null : numValue,
//         change: Number(change.toFixed(2)),
//         percentChange: Number(percentChange.toFixed(2)),
//       };
//     });
//   }, [seriesData]);
// const BACKEND_URL = 'http://localhost:5000';

//   return (
//     <div style={styles.container}>
//       <h2 style={styles.heading}>United States Of America</h2>
//       <div class = 'countrySummary' >
//       </div>
//       {/* Breadcrumbs */}
//       <nav style={styles.breadcrumb}>
//         {history.map((step, idx) => (
//           <span key={`${step.id}-${idx}`}>
//             <button
//               onClick={() => setHistory((prev) => prev.slice(0, idx + 1))}
//               style={{
//                 ...styles.breadcrumbBtn,
//                 fontWeight: idx === history.length - 1 ? 'bold' : 'normal',
//                 color: idx === history.length - 1 ? '#1a202c' : '#2b6cb0',
//               }}
//             >
//               {step.name}
//             </button>
//             {idx < history.length - 1 && <span style={styles.separator}>/</span>}
//           </span>
//         ))}
//       </nav>

//       {loading && <div style={styles.loading}>Loading categories from FRED...</div>}
//       {error && <div style={styles.error}>{error}</div>}

//       {!loading && !error && (
//         <>
//           {/* Subcategories */}
//           {subcategories.length > 0 && (
//             <div style={styles.section}>
//               <h3 style={styles.subHeading}>Subcategories ({subcategories.length})</h3>
//               <div style={styles.buttonGrid}>
//                 {subcategories.map((cat) => (
//                   <button
//                     key={cat.id}
//                     onClick={() => setHistory((prev) => [...prev, { id: cat.id, name: cat.name }])}
//                     style={styles.categoryBtn}
//                   >
//                     📁 {cat.name}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Available Indicators Grid */}
//           {seriesList.length > 0 && (
//             <div style={styles.section}>
//               <h3 style={styles.subHeading}>Available Indicators ({seriesList.length})</h3>
//               <div style={styles.seriesGrid}>
//                 {seriesList.map((s) => (
//                   <button
//                     key={s.id}
//                     onClick={() => handleSelectSeries(s)}
//                     style={{
//                       ...styles.seriesCard,
//                       borderColor: selectedSeries?.id === s.id ? '#3182ce' : '#cbd5e0',
//                       backgroundColor: selectedSeries?.id === s.id ? '#ebf8ff' : '#ffffff',
//                     }}
//                   >
//                     <strong style={{ color: '#2d3748' }}>{s.id}</strong> — {s.title}
//                     <div style={styles.unitBadge}>{s.units || 'N/A'}</div>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Indicator Details & Interactive Charts */}
//           {selectedSeries && (
//             <div style={styles.detailCard}>
//               <h3 style={styles.detailTitle}>{selectedSeries.title} ({selectedSeries.id})</h3>
//               <p style={styles.detailUnits}><strong>Units:</strong> {selectedSeries.units || 'N/A'}</p>

//               {loadingData && <div style={styles.loading}>Fetching observation points...</div>}

//               {chartData.length > 0 && (
//                 <div style={styles.analyticsContainer}>
//                   {/* Graph 1: Level Values */}
//              {/* Graph 1: Level Values */}
// <div style={styles.chartWrapper}>
//   <h4 style={styles.chartTitle}>Historical Trend (Level Values)</h4>

//   <div style={styles.chartContainer}>
//     <LineChart
//       width={1030}
//       height={360}
//       data={chartData}
//       margin={{
//         top: 10,
//         right: 20,
//         left: 10,
//         bottom: 10,
//       }}
//     >
//       <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

//       <XAxis
//         dataKey="date"
//         interval="preserveStartEnd"
//         minTickGap={60}
//         tick={{ fill: '#4a5568', fontSize: 11 }}
//       />

//       <YAxis
//         tick={{ fill: '#4a5568', fontSize: 12 }}
//       />

//       <Tooltip
//         contentStyle={{
//           backgroundColor: '#ffffff',
//           borderRadius: '6px',
//           border: '1px solid #cbd5e0',
//         }}
//       />

//       <Line
//         type="monotone"
//         dataKey="value"
//         stroke="#3182ce"
//         strokeWidth={2}
//         dot={false}
//         isAnimationActive={false}
//         name="Value"
//       />
//     </LineChart>
//   </div>
// </div>

// {/* Graph 2: Period Variation (% Change) */}
// <div style={styles.chartWrapper}>
//   <h4 style={styles.chartTitle}>Period-to-Period Variation (%)</h4>

//   <div style={styles.chartContainer}>
//     <LineChart
//       width={1030}
//       height={360}
//       data={chartData.slice(1)}
//       margin={{
//         top: 10,
//         right: 20,
//         left: 10,
//         bottom: 10,
//       }}
//     >
//       <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

//       <XAxis
//         dataKey="date"
//         interval="preserveStartEnd"
//         minTickGap={60}
//         tick={{ fill: '#4a5568', fontSize: 11 }}
//       />

//       <YAxis
//         tick={{ fill: '#4a5568', fontSize: 12 }}
//         unit="%"
//       />

//       <Tooltip
//         contentStyle={{
//           backgroundColor: '#ffffff',
//           borderRadius: '6px',
//           border: '1px solid #cbd5e0',
//         }}
//       />

//       <Line
//         type="monotone"
//         dataKey="percentChange"
//         stroke="#dd6b20"
//         strokeWidth={2}
//         dot={false}
//         isAnimationActive={false}
//         name="% Change"
//       />
//     </LineChart>
//   </div>
// </div>

//                   {/* High-Contrast Summary Table */}
//                   <div style={styles.tableWrapper}>
//                     <h4 style={styles.chartTitle}>Recent Observations & Changes</h4>
//                     <div style={styles.tableScroll}>
//                       <table style={styles.table}>
//                         <thead>
//                           <tr style={styles.tableHeaderRow}>
//                             <th style={styles.th}>Date</th>
//                             <th style={styles.th}>Value</th>
//                             <th style={styles.th}>Abs. Change</th>
//                             <th style={styles.th}>% Variation</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {chartData.slice(-12).map((row) => (
//                             <tr key={row.date} style={styles.tableRow}>
//                               <td style={styles.td}>{row.date}</td>
//                               <td style={styles.tdStrong}>{row.value}</td>
//                               <td
//                                 style={{
//                                   ...styles.td,
//                                   color: row.change > 0 ? '#2f855a' : row.change < 0 ? '#c53030' : '#4a5568',
//                                 }}
//                               >
//                                 {row.change > 0 ? `+${row.change}` : row.change}
//                               </td>
//                               <td
//                                 style={{
//                                   ...styles.td,
//                                   color: row.percentChange > 0 ? '#2f855a' : row.percentChange < 0 ? '#c53030' : '#4a5568',
//                                 }}
//                               >
//                                 {row.percentChange > 0 ? `+${row.percentChange}%` : `${row.percentChange}%`}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// const styles = {


// detailCard: {
//   marginTop: '20px',
//   padding: '24px',
//   border: '1px solid #cbd5e0',
//   borderRadius: '12px',
//   backgroundColor: '#ffffff',
//   boxSizing: 'border-box',
//   width: '100%',
// },

// analyticsContainer: {
//   display: 'flex',
//   flexDirection: 'column',
//   gap: '28px',
//   width: '100%',
// },

// chartWrapper: {
//   width: '100%',
//   boxSizing: 'border-box',
//   backgroundColor: '#ffffff',
//   border: '1px solid #e2e8f0',
//   padding: '16px',
//   borderRadius: '8px',
//   overflowX: 'auto',
// },

// chartContainer: {
//   width: '100%',
//   display: 'block',
//   textAlign: 'left',
//   margin: '0',
//   padding: '0',
// },
//    container: {
//   fontFamily: 'system-ui, -apple-system, sans-serif',
//   maxWidth: '1100px',
//   width: '100%',
//   boxSizing: 'border-box',
//   padding: '24px',
//   margin: '0 auto',
//   backgroundColor: '#f8fafc',
// },
//   heading: { fontSize: '24px', marginBottom: '16px', color: '#0f172a' },
//   subHeading: { fontSize: '18px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' },
//   breadcrumb: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px', padding: '12px 18px', backgroundColor: '#e2e8f0', borderRadius: '8px' },
//   breadcrumbBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' },
//   separator: { margin: '0 6px', color: '#64748b' },
//   section: { marginBottom: '28px' },
//   buttonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' },
//   categoryBtn: { padding: '12px 16px', backgroundColor: '#ffffff', border: '1px solid #cbd5e0', borderRadius: '8px', color: '#1e293b', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '600' },
//   seriesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px', marginTop: '12px' },
//   seriesCard: { padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#334155' },
//   unitBadge: { fontSize: '11px', color: '#64748b', marginTop: '4px' },
//   detailTitle: { margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a' },
//   detailUnits: { margin: '0 0 20px 0', color: '#475569', fontSize: '14px' },

//   chartTitle: { margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b' },
//   tableWrapper: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' },
//   tableScroll: { overflowX: 'auto' },
//   table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
//   tableHeaderRow: { backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e0' },
//   th: { padding: '10px 14px', color: '#0f172a', fontWeight: '700' },
//   tableRow: { borderBottom: '1px solid #e2e8f0' },
//   td: { padding: '10px 14px', color: '#334155' },
//   tdStrong: { padding: '10px 14px', color: '#0f172a', fontWeight: '700' },
//   loading: { padding: '12px', color: '#475569' },
//   error: { color: '#991b1b', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px' },
// };

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const BACKEND_URL = 'http://localhost:5000';

/* =========================================================
   COUNTRY SUMMARY INDICATORS
========================================================= */

const SUMMARY_INDICATORS = [
  // FED / MONETARY POLICY
  { id: 'DFF', label: 'Federal Funds Rate', group: 'Fed' },
  { id: 'DFEDTARU', label: 'Fed Funds Target Upper', group: 'Fed' },
  { id: 'DFEDTARL', label: 'Fed Funds Target Lower', group: 'Fed' },
  { id: 'WALCL', label: 'Fed Total Assets', group: 'Fed' },
  { id: 'RRPONTSYD', label: 'Fed ON RRP', group: 'Fed' },

  // TREASURY / INTEREST RATES
  { id: 'DGS2', label: '2Y Treasury Yield', group: 'Rates' },
  { id: 'DGS5', label: '5Y Treasury Yield', group: 'Rates' },
  { id: 'DGS10', label: '10Y Treasury Yield', group: 'Rates' },
  { id: 'DGS30', label: '30Y Treasury Yield', group: 'Rates' },
  { id: 'T10Y2Y', label: '10Y–2Y Yield Spread', group: 'Rates' },
  { id: 'T10Y3M', label: '10Y–3M Yield Spread', group: 'Rates' },

  // INFLATION
  { id: 'CPIAUCSL', label: 'CPI', group: 'Inflation' },
  { id: 'CPILFESL', label: 'Core CPI', group: 'Inflation' },
  { id: 'PCEPI', label: 'PCE Price Index', group: 'Inflation' },
  { id: 'PCEPILFE', label: 'Core PCE', group: 'Inflation' },

  // LABOR
  { id: 'UNRATE', label: 'Unemployment Rate', group: 'Labor' },
  { id: 'PAYEMS', label: 'Nonfarm Payrolls', group: 'Labor' },
  { id: 'JTSJOL', label: 'Job Openings', group: 'Labor' },

  // ECONOMIC ACTIVITY
  { id: 'GDPC1', label: 'Real GDP', group: 'Growth' },
  { id: 'INDPRO', label: 'Industrial Production', group: 'Growth' },
  { id: 'PCE', label: 'Personal Consumption', group: 'Growth' },
  { id: 'RSAFS', label: 'Retail Sales', group: 'Growth' },
  { id: 'UMCSENT', label: 'Consumer Sentiment', group: 'Growth' },

  // HOUSING
  { id: 'HOUST', label: 'Housing Starts', group: 'Housing' },
  { id: 'PERMIT', label: 'Building Permits', group: 'Housing' },

  // INTERNATIONAL TRADE
  { id: 'BOPGSTB', label: 'Trade Balance', group: 'Trade' },
  { id: 'BOPGTB', label: 'Goods Trade Balance', group: 'Trade' },
  { id: 'EXPGS', label: 'Exports', group: 'Trade' },
  { id: 'IMPGS', label: 'Imports', group: 'Trade' },

  // FOREIGN EXCHANGE
  { id: 'DEXUSEU', label: 'USD / EUR', group: 'FX' },
  { id: 'DEXJPUS', label: 'JPY / USD', group: 'FX' },
  { id: 'DEXCHUS', label: 'CNY / USD', group: 'FX' },
  { id: 'DEXMXUS', label: 'MXN / USD', group: 'FX' },
  { id: 'DTWEXBGS', label: 'Trade Weighted USD', group: 'FX' },

  // MONEY
  { id: 'M2SL', label: 'M2 Money Supply', group: 'Money' },
];

/*
  IMPORTANT:
  These exist outside the React component.

  If the component is accidentally mounted/remounted by a parent,
  React will NOT launch another 36-request batch while the first
  batch is already running.
*/
let summaryCache = null;
let summaryPromise = null;

/* =========================================================
   SUMMARY FETCHER
========================================================= */

const fetchSummaryIndicators = async (onIndicator = () => {}) => {
  if (summaryCache) {
    summaryCache.forEach(onIndicator);
    return summaryCache;
  }

  if (summaryPromise) {
    const data = await summaryPromise;
    data.forEach(onIndicator);
    return data;
  }

  summaryPromise = Promise.all(
    SUMMARY_INDICATORS.map(async (indicator) => {
      const publish = (result) => {
        onIndicator(result);
        return result;
      };
      try {
        const response = await fetch(
          `${BACKEND_URL}/FRED/series/${indicator.id}`
        );

        if (!response.ok) {
          return publish({
            ...indicator,
            value: null,
            change: null,
            date: null,
            error: true,
          });
        }

        const json = await response.json();

        /*
          Your existing graph code proves that your endpoint
          returns:

          {
            data: {
              "date": value,
              ...
            }
          }
        */
        const data = json?.data;

        if (!data || typeof data !== 'object') {
          return publish({
            ...indicator,
            value: null,
            change: null,
            date: null,
            error: true,
          });
        }

        const observations = Object.entries(data)
          .map(([date, value]) => ({
            date,
            value: Number(value),
          }))
          .filter(
            (item) =>
              item.date &&
              Number.isFinite(item.value)
          )
          .sort(
            (a, b) =>
              new Date(a.date) - new Date(b.date)
          );

        if (observations.length === 0) {
          return publish({
            ...indicator,
            value: null,
            change: null,
            date: null,
            error: true,
          });
        }

        const latest =
          observations[observations.length - 1];

        /*
          Find the most recent observation that is at least
          approximately 7 days older than the latest.

          This works for daily, weekly, monthly and quarterly
          series without inventing observations.
        */
        const targetTime =
          new Date(latest.date).getTime() -
          7 * 24 * 60 * 60 * 1000;

        let previous = null;

        for (
          let i = observations.length - 1;
          i >= 0;
          i--
        ) {
          const observationTime =
            new Date(
              observations[i].date
            ).getTime();

          if (observationTime <= targetTime) {
            previous = observations[i];
            break;
          }
        }

        /*
          For very short series where no 7-day-earlier
          observation exists, do not fabricate a variation.
        */
        let percentChange = null;

        if (
          previous &&
          previous.value !== 0
        ) {
          percentChange =
            ((latest.value - previous.value) /
              Math.abs(previous.value)) *
            100;
        }

        return publish({
          ...indicator,
          value: latest.value,
          change: percentChange,
          date: latest.date,
          previousDate: previous?.date || null,
          error: false,
        });
      } catch (error) {
        return publish({
          ...indicator,
          value: null,
          change: null,
          date: null,
          error: true,
        });
      }
    })
  );

  try {
    summaryCache = await summaryPromise;
  } catch (error) {
    summaryPromise = null;
    throw error;
  }

  return summaryCache;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function FredCategoryExplorer() {
  const categoryRequestRef = useRef(0);
  const [history, setHistory] = useState([
    { id: 0, name: 'Root Categories' }
  ]);

  const [subcategories, setSubcategories] = useState([]);
  const [seriesList, setSeriesList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSeries, setSelectedSeries] =
    useState(null);

  const [seriesData, setSeriesData] =
    useState(null);

  const [loadingData, setLoadingData] =
    useState(false);

  /* SUMMARY */
  const [summaryData, setSummaryData] =
    useState([]);

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const currentCategory =
    history[history.length - 1];

  /* =======================================================
     LOAD CATEGORY CONTENT
  ======================================================= */

  useEffect(() => {
    fetchCategoryContents(currentCategory.id);
  }, [currentCategory.id]);

  /* =======================================================
     LOAD COUNTRY SUMMARY ONCE
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryData([]);

        const data =
          await fetchSummaryIndicators((indicator) => {
            if (cancelled) return;
            setSummaryData((current) => {
              const next = current.filter((item) => item.id !== indicator.id);
              next.push(indicator);
              return next.sort(
                (a, b) =>
                  SUMMARY_INDICATORS.findIndex((item) => item.id === a.id)
                  - SUMMARY_INDICATORS.findIndex((item) => item.id === b.id)
              );
            });
          });

        if (!cancelled) {
          setSummaryData(data);
        }
      } catch (error) {
        if (!cancelled) {
          setSummaryData([]);
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     FETCH CATEGORY CONTENT
  ======================================================= */

  const fetchCategoryContents = async (
    categoryId
  ) => {
    const requestId = ++categoryRequestRef.current;
    setLoading(true);
    setError(null);

    setSubcategories([]);
    setSeriesList([]);
    setSelectedSeries(null);
    setSeriesData(null);

    const loadSubcategories = async () => {
      const response = await fetch(
        `${BACKEND_URL}/FRED/categories/children/${categoryId}`
      );
      if (!response.ok) {
        throw new Error(`Subcategories request failed (HTTP ${response.status}).`);
      }
      const result = await response.json();
      if (requestId === categoryRequestRef.current) {
        setSubcategories(result.categories || []);
      }
    };

    const loadSeries = async () => {
      const response = await fetch(
        `${BACKEND_URL}/FRED/categories/series/${categoryId}`
      );
      if (!response.ok) {
        throw new Error(`Indicators request failed (HTTP ${response.status}).`);
      }
      const result = await response.json();
      const filteredSeries = (result.seriess || []).filter((series) => {
        const title = (series.title || '').toLowerCase();
        const units = (series.units || '').toLowerCase();
        return !title.includes('discontinued')
          && !title.includes('book value')
          && !title.includes('on display')
          && !units.includes('u.s. dollars')
          && !units.includes('dollars');
      });
      if (requestId === categoryRequestRef.current) {
        setSeriesList(filteredSeries);
      }
    };

    const results = await Promise.allSettled([
      loadSubcategories(),
      loadSeries(),
    ]);
    if (requestId !== categoryRequestRef.current) return;

    const failures = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason.message);
    if (failures.length) {
      setError(`Failed to fetch FRED data: ${failures.join(' ')}`);
    }
    setLoading(false);
  };

  /* =======================================================
     SELECT SERIES
  ======================================================= */

  const handleSelectSeries = async (
    series
  ) => {
    setSelectedSeries(series);
    setSeriesData(null);
    setLoadingData(true);
    setError(null);

    try {
      const res =
        await fetch(
          `${BACKEND_URL}/FRED/series/${series.id}`
        );

      if (!res.ok) {
        throw new Error(
          `HTTP error! status: ${res.status}`
        );
      }

      const json =
        await res.json();

      setSeriesData(json.data);
    } catch (err) {
      setError(
        `Failed to fetch data for ${series.id}: ${err.message}`
      );
    } finally {
      setLoadingData(false);
    }
  };

  /* =======================================================
     PROCESS CHART DATA
  ======================================================= */

  const chartData = useMemo(() => {
    if (!seriesData) {
      return [];
    }

    const entries =
      Object.entries(seriesData);

    return entries.map(
      ([date, value], index) => {
        const numValue =
          parseFloat(value);

        let change = 0;
        let percentChange = 0;

        if (index > 0) {
          const prevValue =
            parseFloat(
              entries[index - 1][1]
            );

          change =
            numValue - prevValue;

          percentChange =
            prevValue !== 0
              ? (change / prevValue) *
                100
              : 0;
        }

        return {
          date,

          value: Number.isNaN(numValue)
            ? null
            : numValue,

          change: Number(
            change.toFixed(2)
          ),

          percentChange: Number(
            percentChange.toFixed(2)
          ),
        };
      }
    );
  }, [seriesData]);

  const chartDisplayData = useMemo(() => {
    const maxPoints = 500;
    if (chartData.length <= maxPoints) return chartData;
    const stride = Math.ceil((chartData.length - 1) / (maxPoints - 1));
    return chartData.filter(
      (_, index) => index % stride === 0 || index === chartData.length - 1
    );
  }, [chartData]);

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(value)
    ) {
      return '—';
    }

    return Number(value).toLocaleString(
      'en-US',
      {
        maximumFractionDigits: 4,
      }
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div style={styles.container}>

      {/* ===================================================
          COUNTRY HEADER
      =================================================== */}

      <h2 style={styles.heading}>
        United States Of America
      </h2>

      {/* ===================================================
          COUNTRY SUMMARY
      =================================================== */}

      <div
        className="countrySummary"
        style={styles.summarySection}
      >
        <div style={styles.summaryHeader}>

          <div>
            <h3
              style={styles.summaryTitle}
            >
              United States — Economic
              & Financial Dashboard
            </h3>

            <div
              style={styles.summarySubtitle}
            >
              Latest FRED observations
              & approximate 7-day variation
            </div>
          </div>

          <div
            style={styles.summaryCount}
          >
            {summaryLoading
              ? `${summaryData.length} / ${SUMMARY_INDICATORS.length} received`
              : `${summaryData.filter(
                  (x) => !x.error
                ).length} / ${
                  SUMMARY_INDICATORS.length
                } loaded`
            }
          </div>
        </div>

        {summaryLoading && (
          <div
            style={styles.summaryLoading}
          >
            Loading economic indicators...
          </div>
        )}

        {summaryData.length > 0 && (
            <div
              style={styles.summaryGrid}
            >
              {summaryData.map(
                (indicator) => {
                  const positive =
                    indicator.change >
                    0;

                  const negative =
                    indicator.change <
                    0;

                  return (
                    <div
                      key={indicator.id}
                      style={{
                        ...styles.summaryCard,

                        opacity:
                          indicator.error
                            ? 0.55
                            : 1,
                      }}
                    >

                      <div
                        style={
                          styles.summaryTop
                        }
                      >

                        <button
                          type="button"
                          onClick={() =>
                            handleSelectSeries(
                              {
                                id:
                                  indicator.id,

                                title:
                                  indicator.label,

                                units:
                                  indicator.units ||
                                  'N/A',
                              }
                            )
                          }
                          style={
                            styles.summaryLink
                          }
                          disabled={
                            indicator.error
                          }
                        >
                          {indicator.label}
                        </button>

                        <span
                          style={
                            styles.summaryGroup
                          }
                        >
                          {indicator.group}
                        </span>
                      </div>

                      <div
                        style={
                          styles.summaryBottom
                        }
                      >

                        <span
                          style={
                            styles.summaryValue
                          }
                        >
                          {indicator.error
                            ? '—'
                            : formatValue(
                                indicator.value
                              )}
                        </span>

                        <span
                          style={{
                            ...styles.summaryChange,

                            color:
                              positive
                                ? '#16803c'
                                : negative
                                ? '#c53030'
                                : '#64748b',
                          }}
                        >
                          {indicator.change !==
                            null &&
                          !indicator.error
                            ? `${
                                positive
                                  ? '+'
                                  : ''
                              }${indicator.change.toFixed(
                                2
                              )}%`
                            : '—'}
                        </span>

                      </div>

                      <div
                        style={
                          styles.summaryDate
                        }
                      >
                        {indicator.date
                          ? `Latest: ${indicator.date}`
                          : ''}
                      </div>

                    </div>
                  );
                }
              )}
            </div>
          )}

        {!summaryLoading && summaryData.length === 0 && (
            <div
              style={
                styles.summaryLoading
              }
            >
              No summary data available.
            </div>
          )}
      </div>

      {/* ===================================================
          BREADCRUMBS
      =================================================== */}

      <nav
        style={styles.breadcrumb}
      >
        {history.map(
          (step, idx) => (
            <span
              key={`${step.id}-${idx}`}
            >
              <button
                type="button"
                onClick={() =>
                  setHistory(
                    (prev) =>
                      prev.slice(
                        0,
                        idx + 1
                      )
                  )
                }
                style={{
                  ...styles.breadcrumbBtn,

                  fontWeight:
                    idx ===
                    history.length - 1
                      ? 'bold'
                      : 'normal',

                  color:
                    idx ===
                    history.length - 1
                      ? '#1a202c'
                      : '#2b6cb0',
                }}
              >
                {step.name}
              </button>

              {idx <
                history.length - 1 && (
                <span
                  style={
                    styles.separator
                  }
                >
                  /
                </span>
              )}
            </span>
          )
        )}
      </nav>

      {/* ===================================================
          GENERAL ERROR
      =================================================== */}

      {error && (
        <div
          style={styles.error}
        >
          {error}
        </div>
      )}

      {/* ===================================================
          CATEGORY CONTENT
      =================================================== */}

      {loading && (
        <div
          style={styles.loading}
        >
          Loading categories from FRED...
        </div>
      )}

      {(!error || subcategories.length > 0 || seriesList.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* =================================================
              SUBCATEGORIES
          ================================================= */}

          {subcategories.length >
            0 && (
            <div
              style={{ ...styles.section, order: 1 }}
            >
              <h3
                style={
                  styles.subHeading
                }
              >
                Subcategories (
                {
                  subcategories.length
                }
                )
              </h3>

              <div
                style={
                  styles.buttonGrid
                }
              >
                {subcategories.map(
                  (cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() =>
                        setHistory(
                          (
                            prev
                          ) => [
                            ...prev,
                            {
                              id: cat.id,
                              name:
                                cat.name,
                            },
                          ]
                        )
                      }
                      style={
                        styles.categoryBtn
                      }
                    >
                      📁 {cat.name}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* =================================================
              AVAILABLE INDICATORS
          ================================================= */}

          {seriesList.length >
            0 && (
            <div
              style={{ ...styles.section, order: 2 }}
            >
              <h3
                style={
                  styles.subHeading
                }
              >
                Available Indicators (
                {seriesList.length}
                )
              </h3>

              <div
                style={
                  styles.seriesGrid
                }
              >
                {seriesList.map(
                  (s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() =>
                        handleSelectSeries(
                          s
                        )
                      }
                      style={{
                        ...styles.seriesCard,

                        borderColor:
                          selectedSeries?.id ===
                          s.id
                            ? '#3182ce'
                            : '#cbd5e0',

                        backgroundColor:
                          selectedSeries?.id ===
                          s.id
                            ? '#ebf8ff'
                            : '#ffffff',
                      }}
                    >
                      <strong
                        style={{
                          color:
                            '#2d3748',
                        }}
                      >
                        {s.id}
                      </strong>{' '}
                      — {s.title}

                      <div
                        style={
                          styles.unitBadge
                        }
                      >
                        {s.units ||
                          'N/A'}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* =================================================
              SELECTED INDICATOR
          ================================================= */}

          {selectedSeries && (
            <div
              style={{ ...styles.detailCard, order: 0 }}
            >

              <h3
                style={
                  styles.detailTitle
                }
              >
                {selectedSeries.title}{' '}
                (
                {selectedSeries.id}
                )
              </h3>

              <p
                style={
                  styles.detailUnits
                }
              >
                <strong>
                  Units:
                </strong>{' '}
                {selectedSeries.units ||
                  'N/A'}
              </p>

              {loadingData && (
                <div
                  style={
                    styles.loading
                  }
                >
                  Fetching observation
                  points...
                </div>
              )}

              {chartData.length >
                0 && (
                <div
                  style={
                    styles.analyticsContainer
                  }
                >

                  {/* =========================================
                      GRAPH 1
                  ========================================= */}

                  <div
                    style={
                      styles.chartWrapper
                    }
                  >
                    <h4
                      style={
                        styles.chartTitle
                      }
                    >
                      Historical Trend
                      (Level Values)
                    </h4>

                    <div
                      style={
                        styles.chartContainer
                      }
                    >
                      <ResponsiveContainer width="100%" height={360}>
                      <LineChart
                        data={chartDisplayData}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 10,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                        />

                        <XAxis
                          dataKey="date"
                          interval="preserveStartEnd"
                          minTickGap={
                            60
                          }
                          tick={{
                            fill:
                              '#4a5568',
                            fontSize: 11,
                          }}
                        />

                        <YAxis
                          tick={{
                            fill:
                              '#4a5568',
                            fontSize: 12,
                          }}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor:
                              '#ffffff',
                            borderRadius:
                              '6px',
                            border:
                              '1px solid #cbd5e0',
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3182ce"
                          strokeWidth={
                            2
                          }
                          dot={false}
                          isAnimationActive={
                            false
                          }
                          name="Value"
                        />
                      </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* =========================================
                      GRAPH 2
                  ========================================= */}

                  <div
                    style={
                      styles.chartWrapper
                    }
                  >
                    <h4
                      style={
                        styles.chartTitle
                      }
                    >
                      Period-to-Period
                      Variation (%)
                    </h4>

                    <div
                      style={
                        styles.chartContainer
                      }
                    >
                      <ResponsiveContainer width="100%" height={360}>
                      <LineChart
                        data={chartDisplayData.slice(1)}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 10,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                        />

                        <XAxis
                          dataKey="date"
                          interval="preserveStartEnd"
                          minTickGap={
                            60
                          }
                          tick={{
                            fill:
                              '#4a5568',
                            fontSize: 11,
                          }}
                        />

                        <YAxis
                          tick={{
                            fill:
                              '#4a5568',
                            fontSize: 12,
                          }}
                          unit="%"
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor:
                              '#ffffff',
                            borderRadius:
                              '6px',
                            border:
                              '1px solid #cbd5e0',
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="percentChange"
                          stroke="#dd6b20"
                          strokeWidth={
                            2
                          }
                          dot={false}
                          isAnimationActive={
                            false
                          }
                          name="% Change"
                        />
                      </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* =========================================
                      TABLE
                  ========================================= */}

                  <div
                    style={
                      styles.tableWrapper
                    }
                  >
                    <h4
                      style={
                        styles.chartTitle
                      }
                    >
                      Recent Observations
                      & Changes
                    </h4>

                    <div
                      style={
                        styles.tableScroll
                      }
                    >
                      <table
                        style={
                          styles.table
                        }
                      >
                        <thead>
                          <tr
                            style={
                              styles.tableHeaderRow
                            }
                          >
                            <th
                              style={
                                styles.th
                              }
                            >
                              Date
                            </th>

                            <th
                              style={
                                styles.th
                              }
                            >
                              Value
                            </th>

                            <th
                              style={
                                styles.th
                              }
                            >
                              Abs. Change
                            </th>

                            <th
                              style={
                                styles.th
                              }
                            >
                              % Variation
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {chartData
                            .slice(-12)
                            .map(
                              (
                                row
                              ) => (
                                <tr
                                  key={
                                    row.date
                                  }
                                  style={
                                    styles.tableRow
                                  }
                                >
                                  <td
                                    style={
                                      styles.td
                                    }
                                  >
                                    {
                                      row.date
                                    }
                                  </td>

                                  <td
                                    style={
                                      styles.tdStrong
                                    }
                                  >
                                    {
                                      row.value
                                    }
                                  </td>

                                  <td
                                    style={{
                                      ...styles.td,

                                      color:
                                        row.change >
                                        0
                                          ? '#2f855a'
                                          : row.change <
                                            0
                                          ? '#c53030'
                                          : '#4a5568',
                                    }}
                                  >
                                    {row.change >
                                    0
                                      ? `+${row.change}`
                                      : row.change}
                                  </td>

                                  <td
                                    style={{
                                      ...styles.td,

                                      color:
                                        row.percentChange >
                                        0
                                          ? '#2f855a'
                                          : row.percentChange <
                                            0
                                          ? '#c53030'
                                          : '#4a5568',
                                    }}
                                  >
                                    {row.percentChange >
                                    0
                                      ? `+${row.percentChange}%`
                                      : `${row.percentChange}%`}
                                  </td>
                                </tr>
                              )
                            )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  container: {
    fontFamily:
      'system-ui, -apple-system, sans-serif',

    maxWidth: '1100px',
    width: '100%',

    boxSizing:
      'border-box',

    padding: '24px',

    margin: '0 auto',

    backgroundColor:
      '#f8fafc',
  },

  heading: {
    fontSize: '24px',
    marginBottom: '16px',
    color: '#0f172a',
  },

  /* =======================================================
     SUMMARY
  ======================================================= */

  summarySection: {
    marginBottom: '24px',
  },

  summaryHeader: {
    display: 'flex',

    justifyContent:
      'space-between',

    alignItems:
      'center',

    gap: '12px',

    marginBottom:
      '12px',

    flexWrap: 'wrap',
  },

  summaryTitle: {
    margin: 0,

    fontSize: '18px',

    color: '#0f172a',
  },

  summarySubtitle: {
    marginTop: '4px',

    fontSize: '12px',

    color: '#64748b',
  },

  summaryCount: {
    fontSize: '11px',

    color: '#64748b',

    whiteSpace:
      'nowrap',
  },

  summaryLoading: {
    padding: '16px',

    backgroundColor:
      '#ffffff',

    border:
      '1px solid #e2e8f0',

    borderRadius:
      '8px',

    color:
      '#475569',

    fontSize: '13px',
  },

  summaryGrid: {
    display: 'grid',

    gridTemplateColumns:
      'repeat(auto-fit, minmax(235px, 1fr))',

    gap: '10px',

    width: '100%',
  },

  summaryCard: {
    backgroundColor:
      '#ffffff',

    border:
      '1px solid #e2e8f0',

    borderRadius:
      '8px',

    padding:
      '12px 14px',

    boxSizing:
      'border-box',

    minWidth: 0,
  },

  summaryTop: {
    display: 'flex',

    justifyContent:
      'space-between',

    alignItems:
      'flex-start',

    gap: '8px',
  },

  summaryLink: {
    background:
      'none',

    border:
      'none',

    padding: 0,

    margin: 0,

    color:
      '#2563eb',

    fontSize:
      '13px',

    fontWeight:
      '700',

    cursor:
      'pointer',

    textAlign:
      'left',

    textDecoration:
      'underline',
  },

  summaryGroup: {
    fontSize: '10px',

    padding:
      '3px 6px',

    borderRadius:
      '4px',

    backgroundColor:
      '#f1f5f9',

    color:
      '#64748b',

    whiteSpace:
      'nowrap',
  },

  summaryBottom: {
    display: 'flex',

    justifyContent:
      'space-between',

    alignItems:
      'baseline',

    gap: '10px',

    marginTop:
      '10px',
  },

  summaryValue: {
    fontSize: '18px',

    fontWeight:
      '700',

    color:
      '#0f172a',

    overflow:
      'hidden',

    textOverflow:
      'ellipsis',

    whiteSpace:
      'nowrap',
  },

  summaryChange: {
    fontSize: '13px',

    fontWeight:
      '700',

    whiteSpace:
      'nowrap',
  },

  summaryDate: {
    marginTop:
      '5px',

    fontSize: '10px',

    color:
      '#94a3b8',
  },

  /* =======================================================
     CATEGORIES
  ======================================================= */

  subHeading: {
    fontSize: '18px',

    color:
      '#1e293b',

    borderBottom:
      '2px solid #e2e8f0',

    paddingBottom:
      '8px',
  },

  breadcrumb: {
    display: 'flex',

    flexWrap:
      'wrap',

    alignItems:
      'center',

    marginBottom:
      '20px',

    padding:
      '12px 18px',

    backgroundColor:
      '#e2e8f0',

    borderRadius:
      '8px',
  },

  breadcrumbBtn: {
    background:
      'none',

    border:
      'none',

    cursor:
      'pointer',

    fontSize:
      '14px',

    padding:
      '2px 4px',
  },

  separator: {
    margin:
      '0 6px',

    color:
      '#64748b',
  },

  section: {
    marginBottom:
      '28px',
  },

  buttonGrid: {
    display: 'grid',

    gridTemplateColumns:
      'repeat(auto-fill, minmax(240px, 1fr))',

    gap: '12px',

    marginTop:
      '12px',
  },

  categoryBtn: {
    padding:
      '12px 16px',

    backgroundColor:
      '#ffffff',

    border:
      '1px solid #cbd5e0',

    borderRadius:
      '8px',

    color:
      '#1e293b',

    cursor:
      'pointer',

    textAlign:
      'left',

    fontSize:
      '14px',

    fontWeight:
      '600',
  },

  seriesGrid: {
    display: 'grid',

    gridTemplateColumns:
      'repeat(auto-fill, minmax(300px, 1fr))',

    gap: '10px',

    marginTop:
      '12px',
  },

  seriesCard: {
    padding:
      '12px',

    border:
      '1px solid #cbd5e0',

    borderRadius:
      '8px',

    textAlign:
      'left',

    cursor:
      'pointer',

    fontSize:
      '13px',

    color:
      '#334155',
  },

  unitBadge: {
    fontSize:
      '11px',

    color:
      '#64748b',

    marginTop:
      '4px',
  },

  /* =======================================================
     DETAILS / CHARTS
  ======================================================= */

  detailCard: {
    marginTop:
      '20px',

    padding:
      '24px',

    border:
      '1px solid #cbd5e0',

    borderRadius:
      '12px',

    backgroundColor:
      '#ffffff',

    boxSizing:
      'border-box',

    width:
      '100%',
  },

  analyticsContainer: {
    display: 'flex',

    flexDirection:
      'column',

    gap:
      '28px',

    width:
      '100%',
  },

  chartWrapper: {
    width:
      '100%',

    boxSizing:
      'border-box',

    backgroundColor:
      '#ffffff',

    border:
      '1px solid #e2e8f0',

    padding:
      '16px',

    borderRadius:
      '8px',

    overflowX:
      'auto',
  },

  chartContainer: {
    width:
      '100%',

    display:
      'block',

    textAlign:
      'left',

    margin:
      '0',

    padding:
      '0',
  },

  detailTitle: {
    margin:
      '0 0 8px 0',

    fontSize:
      '20px',

    color:
      '#0f172a',
  },

  detailUnits: {
    margin:
      '0 0 20px 0',

    color:
      '#475569',

    fontSize:
      '14px',
  },

  chartTitle: {
    margin:
      '0 0 16px 0',

    fontSize:
      '16px',

    color:
      '#1e293b',
  },

  /* =======================================================
     TABLE
  ======================================================= */

  tableWrapper: {
    backgroundColor:
      '#ffffff',

    border:
      '1px solid #e2e8f0',

    padding:
      '16px',

    borderRadius:
      '8px',
  },

  tableScroll: {
    overflowX:
      'auto',
  },

  table: {
    width:
      '100%',

    borderCollapse:
      'collapse',

    textAlign:
      'left',

    fontSize:
      '14px',
  },

  tableHeaderRow: {
    backgroundColor:
      '#f1f5f9',

    borderBottom:
      '2px solid #cbd5e0',
  },

  th: {
    padding:
      '10px 14px',

    color:
      '#0f172a',

    fontWeight:
      '700',
  },

  tableRow: {
    borderBottom:
      '1px solid #e2e8f0',
  },

  td: {
    padding:
      '10px 14px',

    color:
      '#334155',
  },

  tdStrong: {
    padding:
      '10px 14px',

    color:
      '#0f172a',

    fontWeight:
      '700',
  },

  /* =======================================================
     STATUS
  ======================================================= */

  loading: {
    padding:
      '12px',

    color:
      '#475569',
  },

  error: {
    color:
      '#991b1b',

    padding:
      '12px',

    backgroundColor:
      '#fef2f2',

    border:
      '1px solid #fca5a5',

    borderRadius:
      '6px',

    marginBottom:
      '12px',
  },
};