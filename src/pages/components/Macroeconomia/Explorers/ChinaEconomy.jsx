import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const API_URL = 'https://chinadata.live/api/v2';

/* =========================================================
   IMPORTANT CHINA INDICATORS
========================================================= */

const SUMMARY_DATASETS = [
  {
    id: 'china-gdp',
    label: 'GDP',
    group: 'Growth',
  },
  {
    id: 'china-population',
    label: 'Population',
    group: 'Demographics',
  },
  {
    id: 'china-cpi',
    label: 'CPI',
    group: 'Inflation',
  },
  {
    id: 'china-trade',
    label: 'Trade',
    group: 'Trade',
  },
];

/* =========================================================
   CACHE
========================================================= */

let datasetsCache = null;
let datasetsPromise = null;

let summaryCache = null;
let summaryPromise = null;

/* =========================================================
   API FETCH
========================================================= */

const apiFetch = async (url) => {
  let response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (error) {
    throw new Error(
      `Network error connecting to ChinaData API: ${error.message}`
    );
  }

  const text = await response.text();

  let json;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      `ChinaData returned invalid JSON. HTTP ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      json?.message ||
        json?.error ||
        json?.detail ||
        `HTTP ${response.status}`
    );
  }

  if (json?.success === false) {
    throw new Error(
      json?.message ||
        json?.error ||
        'ChinaData API returned an unsuccessful response.'
    );
  }

  return json;
};

/* =========================================================
   FETCH DATASET CATALOG
========================================================= */

const fetchDatasets = async () => {
  if (datasetsCache) {
    return datasetsCache;
  }

  if (datasetsPromise) {    
    return datasetsPromise;
  }

  datasetsPromise = apiFetch(`${API_URL}/datasets`)
    .then((json) => {
      const data = Array.isArray(json?.data)
        ? json.data
        : [];

      if (!data.length) {
        throw new Error(
          'ChinaData returned zero datasets.'
        );
      }

      datasetsCache = data;

      return data;
    })
    .catch((error) => {
      datasetsPromise = null;
      throw error;
    });

  return datasetsPromise;
};

/* =========================================================
   FETCH SINGLE DATASET
========================================================= */

const fetchDataset = async (datasetId) => {
  if (!datasetId) {
    throw new Error('Missing dataset ID.');
  }

  const json = await apiFetch(
    `${API_URL}/data/${encodeURIComponent(datasetId)}`
  );

  if (!json?.data) {
    throw new Error(
      `No data returned for dataset "${datasetId}".`
    );
  }

  return json.data;
};

/* =========================================================
   NORMALIZE DATA
========================================================= */

function normalizeData(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((point) => {
      const rawDate =
        point?.date ??
        point?.period ??
        point?.year ??
        point?.time ??
        '';

      const rawValue =
        point?.value ??
        point?.val ??
        point?.observation ??
        null;

      return {
        date: String(rawDate),
        value: Number(rawValue),
      };
    })
    .filter(
      (point) =>
        point.date &&
        point.date !== 'undefined' &&
        point.date !== 'null' &&
        Number.isFinite(point.value)
    )
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (
        Number.isFinite(dateA) &&
        Number.isFinite(dateB)
      ) {
        return dateA - dateB;
      }

      return String(a.date).localeCompare(
        String(b.date)
      );
    });
}

/* =========================================================
   FETCH SUMMARY
========================================================= */

const fetchSummary = async () => {
  if (summaryCache) {
    return summaryCache;
  }

  if (summaryPromise) {
    return summaryPromise;
  }

  summaryPromise = Promise.all(
    SUMMARY_DATASETS.map(async (indicator) => {
      try {
        const dataset = await fetchDataset(
          indicator.id
        );

        const observations = normalizeData(
          dataset?.data
        );

        if (!observations.length) {
          return {
            ...indicator,
            title:
              dataset?.title || indicator.label,
            unit: dataset?.unit || '',
            frequency:
              dataset?.frequency || '',
            value: null,
            change: null,
            date: null,
            error: true,
            errorMessage:
              'No observations returned.',
          };
        }

        const latest =
          observations[observations.length - 1];

        const previous =
          observations.length >= 2
            ? observations[
                observations.length - 2
              ]
            : null;

        let percentChange = null;

        if (
          previous &&
          Number.isFinite(previous.value) &&
          previous.value !== 0
        ) {
          percentChange =
            ((latest.value -
              previous.value) /
              Math.abs(previous.value)) *
            100;
        }

        return {
          ...indicator,
          title:
            dataset?.title || indicator.label,
          unit: dataset?.unit || '',
          frequency:
            dataset?.frequency || '',
          value: latest.value,
          change: percentChange,
          date: latest.date,
          error: false,
          errorMessage: null,
        };
      } catch (error) {
        return {
          ...indicator,
          value: null,
          change: null,
          date: null,
          error: true,
          errorMessage: error.message,
        };
      }
    })
  ).then((results) => {
    summaryCache = results;
    return results;
  });

  try {
    return await summaryPromise;
  } catch (error) {
    summaryPromise = null;
    throw error;
  }
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ChinaDataExplorer() {
  const [datasets, setDatasets] = useState([]);

  const [selectedDataset, setSelectedDataset] =
    useState(null);

  const [datasetData, setDatasetData] =
    useState(null);

  const [summaryData, setSummaryData] =
    useState([]);

  const [search, setSearch] = useState('');

  const [selectedCategory, setSelectedCategory] =
    useState('All');

  const [loading, setLoading] =
    useState(true);

  const [loadingData, setLoadingData] =
    useState(false);

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /* =======================================================
     LOAD DATASETS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadDatasets = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchDatasets();

        if (!cancelled) {
          setDatasets(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            `Failed to fetch ChinaData datasets: ${err.message}`
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDatasets();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     LOAD SUMMARY
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        setSummaryLoading(true);

        const data = await fetchSummary();

        if (!cancelled) {
          setSummaryData(data);
        }
      } catch {
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
     CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    const unique = [
      ...new Set(
        datasets
          .map((dataset) => dataset.category)
          .filter(Boolean)
      ),
    ];

    return ['All', ...unique.sort()];
  }, [datasets]);

  /* =======================================================
     FILTER DATASETS
  ======================================================= */

  const filteredDatasets = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return datasets.filter((dataset) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        dataset.category ===
          selectedCategory;

      const searchableText = [
        dataset.id,
        dataset.slug,
        dataset.title,
        dataset.description,
        dataset.category,
        ...(Array.isArray(dataset.tags)
          ? dataset.tags
          : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    datasets,
    search,
    selectedCategory,
  ]);

  /* =======================================================
     GROUP DATASETS
  ======================================================= */

  const groupedDatasets = useMemo(() => {
    const groups = {};

    filteredDatasets.forEach(
      (dataset) => {
        const category =
          dataset.category || 'Other';

        if (!groups[category]) {
          groups[category] = [];
        }

        groups[category].push(dataset);
      }
    );

    return groups;
  }, [filteredDatasets]);

  /* =======================================================
     SELECT DATASET
  ======================================================= */

  const handleSelectDataset = async (
    dataset
  ) => {
    if (!dataset?.id) {
      return;
    }

    setSelectedDataset(dataset);
    setDatasetData(null);
    setLoadingData(true);
    setError(null);

    try {
      const data =
        await fetchDataset(dataset.id);

      setDatasetData(data);
    } catch (err) {
      setError(
        `Failed to fetch ${dataset.id}: ${err.message}`
      );
    } finally {
      setLoadingData(false);
    }
  };

  /* =======================================================
     CHART DATA
  ======================================================= */

  const chartData = useMemo(() => {
    if (!datasetData?.data) {
      return [];
    }

    const observations =
      normalizeData(datasetData.data);

    return observations.map(
      (observation, index) => {
        const previous =
          observations[index - 1];

        let change = null;
        let percentChange = null;

        if (previous) {
          change =
            observation.value -
            previous.value;

          if (previous.value !== 0) {
            percentChange =
              (change /
                Math.abs(
                  previous.value
                )) *
              100;
          }
        }

        return {
          date: observation.date,

          value: Number(
            observation.value.toFixed(
              6
            )
          ),

          change:
            change === null
              ? null
              : Number(
                  change.toFixed(6)
                ),

          percentChange:
            percentChange === null
              ? null
              : Number(
                  percentChange.toFixed(
                    4
                  )
                ),
        };
      }
    );
  }, [datasetData]);

  const chartDisplayData = useMemo(() => {
    const maxPoints = 500;
    if (chartData.length <= maxPoints) return chartData;
    const stride = Math.ceil((chartData.length - 1) / (maxPoints - 1));
    return chartData.filter(
      (_, index) => index % stride === 0 || index === chartData.length - 1
    );
  }, [chartData]);

  /* =======================================================
     FORMAT VALUE
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

      {/* =================================================
          HEADER
      ================================================= */}

      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>
            China Economic Data
          </h2>

          <div style={styles.subtitle}>
            China Data Portal — Economic,
            demographic, trade and financial
            indicators
          </div>
        </div>

        <div style={styles.apiBadge}>
          ChinaData API
        </div>
      </div>

      {/* =================================================
          API
      ================================================= */}

      <div style={styles.apiInfo}>
        <strong>API:</strong>{' '}
        {API_URL}
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div style={styles.error}>
          <strong>API Error</strong>

          <div style={styles.errorMessage}>
            {error}
          </div>

          <div style={styles.errorHint}>
            Test this endpoint directly in your
            browser:
          </div>

          <code>
            https://chinadata.live/api/v2/datasets
          </code>
        </div>
      )}

      {/* =================================================
          SUMMARY DASHBOARD
      ================================================= */}

      <section
        style={styles.summarySection}
      >
        <div style={styles.summaryHeader}>
          <div>
            <h3
              style={styles.summaryTitle}
            >
              China Economic Dashboard
            </h3>

            <div
              style={styles.summarySubtitle}
            >
              Latest available observations
            </div>
          </div>

          <div
            style={styles.summaryCount}
          >
            {summaryData.length > 0
              ? `${
                  summaryData.filter(
                    (x) => !x.error
                  ).length
                } / ${
                  summaryData.length
                } loaded`
              : ''}
          </div>
        </div>

        {summaryLoading && (
          <div
            style={styles.loadingCard}
          >
            Loading China indicators...
          </div>
        )}

        {!summaryLoading &&
          summaryData.length > 0 && (
            <div
              style={styles.summaryGrid}
            >
              {summaryData.map(
                (indicator) => {
                  const positive =
                    indicator.change > 0;

                  const negative =
                    indicator.change < 0;

                  return (
                    <div
                      key={indicator.id}
                      style={{
                        ...styles.summaryCard,
                        opacity:
                          indicator.error
                            ? 0.6
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
                          disabled={
                            indicator.error
                          }
                          onClick={() =>
                            handleSelectDataset(
                              {
                                id:
                                  indicator.id,
                                title:
                                  indicator.title ||
                                  indicator.label,
                                category:
                                  indicator.group,
                                unit:
                                  indicator.unit,
                              }
                            )
                          }
                          style={
                            styles.summaryLink
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
                            color: positive
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
                          : indicator.errorMessage ||
                            ''}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
      </section>

      {/* =================================================
          DATASET EXPLORER
      ================================================= */}

      <section style={styles.explorer}>
        <div
          style={styles.explorerHeader}
        >
          <div>
            <h3
              style={styles.sectionTitle}
            >
              China Data Explorer
            </h3>

            <div
              style={styles.datasetCount}
            >
              {filteredDatasets.length}{' '}
              datasets
            </div>
          </div>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search GDP, trade, energy..."
            style={styles.searchInput}
          />
        </div>

        {/* CATEGORY FILTER */}

        <div style={styles.categoryBar}>
          {categories.map(
            (category) => (
              <button
                type="button"
                key={category}
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
                style={{
                  ...styles.categoryFilter,

                  backgroundColor:
                    selectedCategory ===
                    category
                      ? '#2563eb'
                      : '#ffffff',

                  color:
                    selectedCategory ===
                    category
                      ? '#ffffff'
                      : '#334155',

                  borderColor:
                    selectedCategory ===
                    category
                      ? '#2563eb'
                      : '#cbd5e0',
                }}
              >
                {category}
              </button>
            )
          )}
        </div>

        {/* LOADING */}

        {loading && (
          <div
            style={styles.loadingCard}
          >
            Loading ChinaData datasets...
          </div>
        )}

        {/* DATASETS */}

        {!loading &&
          Object.keys(
            groupedDatasets
          ).map((category) => (
            <div
              key={category}
              style={styles.section}
            >
              <h4
                style={
                  styles.categoryTitle
                }
              >
                {category}

                <span
                  style={
                    styles.categoryCount
                  }
                >
                  {
                    groupedDatasets[
                      category
                    ].length
                  }
                </span>
              </h4>

              <div
                style={
                  styles.datasetGrid
                }
              >
                {groupedDatasets[
                  category
                ].map((dataset) => (
                  <button
                    type="button"
                    key={dataset.id}
                    onClick={() =>
                      handleSelectDataset(
                        dataset
                      )
                    }
                    style={{
                      ...styles.datasetCard,

                      borderColor:
                        selectedDataset?.id ===
                        dataset.id
                          ? '#2563eb'
                          : '#cbd5e0',

                      backgroundColor:
                        selectedDataset?.id ===
                        dataset.id
                          ? '#eff6ff'
                          : '#ffffff',
                    }}
                  >
                    <div
                      style={
                        styles.datasetId
                      }
                    >
                      {dataset.id}
                    </div>

                    <div
                      style={
                        styles.datasetTitle
                      }
                    >
                      {dataset.title}
                    </div>

                    <div
                      style={
                        styles.datasetDescription
                      }
                    >
                      {dataset.description ||
                        'No description available.'}
                    </div>

                    <div
                      style={
                        styles.datasetMeta
                      }
                    >
                      <span>
                        {dataset.unit ||
                          'N/A'}
                      </span>

                      <span>
                        {dataset.frequency ||
                          'N/A'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

        {!loading &&
          filteredDatasets.length ===
            0 && (
            <div
              style={
                styles.emptyState
              }
            >
              No datasets match your
              search.
            </div>
          )}
      </section>

      {/* =================================================
          SELECTED DATASET
      ================================================= */}

      {selectedDataset && (
        <section
          style={styles.detailCard}
        >
          <div
            style={styles.detailHeader}
          >
            <div>
              <h3
                style={
                  styles.detailTitle
                }
              >
                {datasetData?.title ||
                  selectedDataset.title ||
                  selectedDataset.id}
              </h3>

              <div
                style={styles.detailId}
              >
                {selectedDataset.id}
              </div>
            </div>

            {datasetData && (
              <div
                style={styles.sourceBox}
              >
                <strong>
                  Source
                </strong>

                <div>
                  {datasetData.source ||
                    'China Data Portal'}
                </div>
              </div>
            )}
          </div>

          {/* METADATA */}

          {datasetData && (
            <div
              style={styles.metadataGrid}
            >
              <div
                style={
                  styles.metadataItem
                }
              >
                <span>Unit</span>

                <strong>
                  {datasetData.unit ||
                    'N/A'}
                </strong>
              </div>

              <div
                style={
                  styles.metadataItem
                }
              >
                <span>Frequency</span>

                <strong>
                  {datasetData.frequency ||
                    'N/A'}
                </strong>
              </div>

              <div
                style={
                  styles.metadataItem
                }
              >
                <span>Category</span>

                <strong>
                  {datasetData.category ||
                    'N/A'}
                </strong>
              </div>

              <div
                style={
                  styles.metadataItem
                }
              >
                <span>Observations</span>

                <strong>
                  {chartData.length}
                </strong>
              </div>
            </div>
          )}

          {loadingData && (
            <div
              style={styles.loadingCard}
            >
              Fetching observations...
            </div>
          )}

          {/* DESCRIPTION */}

          {datasetData && (
            <div
              style={
                styles.datasetDescriptionLarge
              }
            >
              <strong>
                {datasetData.title}
              </strong>

              {datasetData.description && (
                <div
                  style={{
                    marginTop: '5px',
                  }}
                >
                  {datasetData.description}
                </div>
              )}
            </div>
          )}

          {/* =================================================
              CHARTS
          ================================================= */}

          {chartData.length > 0 && (
            <div
              style={
                styles.analyticsContainer
              }
            >
              {/* HISTORICAL TREND */}

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
                </h4>

                <div
                  style={
                    styles.chartContainer
                  }
                >
                  <ResponsiveContainer
                    width="100%"
                    height={360}
                  >
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
                        minTickGap={60}
                        tick={{
                          fill: '#4a5568',
                          fontSize: 11,
                        }}
                      />

                      <YAxis
                        tick={{
                          fill: '#4a5568',
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
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        name="Value"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PERCENT CHANGE */}

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
                  Period-to-Period Variation
                  (%)
                </h4>

                <div
                  style={
                    styles.chartContainer
                  }
                >
                  <ResponsiveContainer
                    width="100%"
                    height={360}
                  >
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
                        minTickGap={60}
                        tick={{
                          fill: '#4a5568',
                          fontSize: 11,
                        }}
                      />

                      <YAxis
                        unit="%"
                        tick={{
                          fill: '#4a5568',
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
                        formatter={(
                          value
                        ) => [
                          `${Number(
                            value
                          ).toFixed(
                            2
                          )}%`,
                          '% Change',
                        ]}
                      />

                      <Line
                        type="monotone"
                        dataKey="percentChange"
                        stroke="#dd6b20"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        name="% Change"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* TABLE */}

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
                </h4>

                <div
                  style={
                    styles.tableScroll
                  }
                >
                  <table
                    style={styles.table}
                  >
                    <thead>
                      <tr
                        style={
                          styles.tableHeaderRow
                        }
                      >
                        <th
                          style={styles.th}
                        >
                          Date
                        </th>

                        <th
                          style={styles.th}
                        >
                          Value
                        </th>

                        <th
                          style={styles.th}
                        >
                          Abs. Change
                        </th>

                        <th
                          style={styles.th}
                        >
                          % Variation
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {chartData
                        .slice(-15)
                        .reverse()
                        .map((row) => (
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
                              {row.date}
                            </td>

                            <td
                              style={
                                styles.tdStrong
                              }
                            >
                              {formatValue(
                                row.value
                              )}
                            </td>

                            <td
                              style={{
                                ...styles.td,
                                color:
                                  row.change >
                                  0
                                    ? '#16803c'
                                    : row.change <
                                      0
                                    ? '#c53030'
                                    : '#475569',
                              }}
                            >
                              {row.change ===
                              null
                                ? '—'
                                : row.change >
                                  0
                                ? `+${formatValue(
                                    row.change
                                  )}`
                                : formatValue(
                                    row.change
                                  )}
                            </td>

                            <td
                              style={{
                                ...styles.td,
                                color:
                                  row.percentChange >
                                  0
                                    ? '#16803c'
                                    : row.percentChange <
                                      0
                                    ? '#c53030'
                                    : '#475569',
                              }}
                            >
                              {row.percentChange ===
                              null
                                ? '—'
                                : `${
                                    row.percentChange >
                                    0
                                      ? '+'
                                      : ''
                                  }${row.percentChange.toFixed(
                                    2
                                  )}%`}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* NO OBSERVATIONS */}

          {!loadingData &&
            datasetData &&
            chartData.length === 0 && (
              <div
                style={
                  styles.emptyState
                }
              >
                The API returned the dataset
                metadata but no usable
                numeric observations.
              </div>
            )}
        </section>
      )}
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    width: '100%',
    maxWidth: '1100px',
    boxSizing: 'border-box',
    padding: '24px',
    margin: '0 auto',
    backgroundColor: '#f8fafc',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },

  heading: {
    margin: 0,
    fontSize: '26px',
    color: '#0f172a',
  },

  subtitle: {
    marginTop: '5px',
    color: '#64748b',
    fontSize: '13px',
  },

  apiBadge: {
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: '11px',
    fontWeight: '700',
  },

  apiInfo: {
    marginBottom: '20px',
    padding: '8px 10px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#64748b',
    fontSize: '11px',
    overflowX: 'auto',
  },

  error: {
    color: '#991b1b',
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '12px',
  },

  errorMessage: {
    marginTop: '5px',
  },

  errorHint: {
    marginTop: '10px',
    marginBottom: '5px',
    color: '#7f1d1d',
  },

  summarySection: {
    order: 2,
    marginBottom: '28px',
  },

  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },

  summaryTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#0f172a',
  },

  summarySubtitle: {
    marginTop: '4px',
    color: '#64748b',
    fontSize: '12px',
  },

  summaryCount: {
    fontSize: '11px',
    color: '#64748b',
  },

  summaryGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(235px, 1fr))',
    gap: '10px',
  },

  summaryCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px 14px',
  },

  summaryTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  },

  summaryLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'left',
    textDecoration: 'underline',
  },

  summaryGroup: {
    fontSize: '10px',
    padding: '3px 6px',
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },

  summaryBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '10px',
    marginTop: '10px',
  },

  summaryValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },

  summaryChange: {
    fontSize: '13px',
    fontWeight: '700',
  },

  summaryDate: {
    marginTop: '5px',
    fontSize: '10px',
    color: '#94a3b8',
  },

  explorer: {
    order: 1,
    marginBottom: '24px',
  },

  explorerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#0f172a',
  },

  datasetCount: {
    marginTop: '3px',
    color: '#64748b',
    fontSize: '12px',
  },

  searchInput: {
    width: '300px',
    maxWidth: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e0',
    borderRadius: '7px',
    outline: 'none',
    fontSize: '13px',
    boxSizing: 'border-box',
  },

  categoryBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '7px',
    marginBottom: '20px',
  },

  categoryFilter: {
    padding: '7px 11px',
    border: '1px solid',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },

  categoryTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '17px',
    color: '#1e293b',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '8px',
    marginBottom: '10px',
  },

  categoryCount: {
    fontSize: '11px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '3px 7px',
    borderRadius: '5px',
  },

  section: {
    marginBottom: '25px',
  },

  datasetGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '10px',
  },

  datasetCard: {
    padding: '14px',
    border: '1px solid #cbd5e0',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    minWidth: 0,
  },

  datasetId: {
    fontSize: '11px',
    color: '#2563eb',
    fontWeight: '700',
    marginBottom: '5px',
  },

  datasetTitle: {
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: '6px',
  },

  datasetDescription: {
    fontSize: '12px',
    lineHeight: '1.45',
    color: '#64748b',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  datasetDescriptionLarge: {
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '7px',
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#475569',
  },

  datasetMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #f1f5f9',
    color: '#64748b',
    fontSize: '10px',
  },

  detailCard: {
    marginTop: '20px',
    padding: '24px',
    border: '1px solid #cbd5e0',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    width: '100%',
  },

  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '18px',
    flexWrap: 'wrap',
  },

  detailTitle: {
    margin: 0,
    fontSize: '21px',
    color: '#0f172a',
  },

  detailId: {
    marginTop: '4px',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: '700',
  },

  sourceBox: {
    fontSize: '11px',
    color: '#64748b',
    padding: '9px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },

  metadataGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '20px',
  },

  metadataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#64748b',
  },

  analyticsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    width: '100%',
  },

  chartWrapper: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '16px',
    borderRadius: '8px',
    overflow: 'hidden',
  },

  chartTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#1e293b',
  },

  chartContainer: {
    width: '100%',
    height: '360px',
    display: 'block',
    margin: 0,
    padding: 0,
  },

  tableWrapper: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '16px',
    borderRadius: '8px',
  },

  tableScroll: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },

  tableHeaderRow: {
    backgroundColor: '#f1f5f9',
    borderBottom: '2px solid #cbd5e0',
  },

  th: {
    padding: '10px 14px',
    color: '#0f172a',
    fontWeight: '700',
  },

  tableRow: {
    borderBottom: '1px solid #e2e8f0',
  },

  td: {
    padding: '10px 14px',
    color: '#334155',
  },

  tdStrong: {
    padding: '10px 14px',
    color: '#0f172a',
    fontWeight: '700',
  },

  loadingCard: {
    padding: '14px',
    color: '#475569',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
  },

  emptyState: {
    padding: '30px',
    textAlign: 'center',
    color: '#64748b',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
  },
};