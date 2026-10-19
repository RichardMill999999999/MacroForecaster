import React from "react";
import axios from "axios";
import astronaut from "../../../variable/assets/fotos/space-dance-nasa.gif";

const CUT_YEAR = 2026;

/* ------------------ HELPERS ------------------ */
const trimSeriesTo2023 = (dates, values) => {
  const trimmed = dates
    .map((d, i) => ({ d: Number(d), v: Number(values[i]) }))
    .filter(p => p.d <= CUT_YEAR);

  return {
    labels: trimmed.map(p => p.d),
    values: trimmed.map(p => p.v)
  };
};
const getGraphSearchContainer = () => {
  const el = document.getElementById("graphSearch");
  if (!el) return null;
  el.innerHTML = ""; // clear previous graph
  return el;
};
const showLoading = () => {
  if (document.getElementById("graph-loader")) return;
  const loader = document.createElement("div");
  loader.id = "graph-loader";
  loader.style.position = "fixed";
  loader.style.top = "50%";
  loader.style.left = "50%";
  loader.style.transform = "translate(-50%,-50%)";
  loader.style.zIndex = 10000;
  loader.style.textAlign = "center";
  loader.innerHTML = `
    <img src="${astronaut}" width="120"/>
    <div style="color:#cde6b3;margin-top:8px;font-family:monospace">
      Loading graph…
    </div>
  `;
  document.body.appendChild(loader);
};

const hideLoading = () => {
  const el = document.getElementById("graph-loader");
  if (el) el.remove();
};

/* ================= HOME GRAPHS ================= */
const HomeGraphs = {

  /* ---------- AUTOCORRELATION ---------- */
  autocorrelationGraph(ACV) {
    const data = ACV.map((v, i) => ({ x: i, y: v }));
    const container = document.getElementById("allGraphs");

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    new Chart(canvas, {
      type: "scatter",
      data: {
        datasets: [{
          data,
          borderColor: "#7CFF00",
          backgroundColor: "transparent"
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#9acd32" } },
          y: { ticks: { color: "#9acd32" } }
        }
      }
    });
  },

  /* ---------- PARTIAL AUTOCORRELATION ---------- */
  partialAutocorrelationGraph(pacv) {
    const data = pacv.map((v, i) => ({ x: i, y: v }));
    const container = document.getElementById("allGraphs");

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    new Chart(canvas, {
      type: "scatter",
      data: {
        datasets: [{
          data,
          borderColor: "#00E5FF",
          backgroundColor: "transparent"
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#9acd32" } },
          y: { ticks: { color: "#9acd32" } }
        }
      }
    });
  },

  /* ---------- SINGLE SERIES GRAPH (UNCHANGED LOGIC) ---------- */
graphScript(timeSeries, title) {
  const container = getGraphSearchContainer();
  if (!container) return;

  const data = timeSeries.dates.map((d, i) => ({
    x: d,
    y: timeSeries.datos[i]
  }));

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "380px";
  container.appendChild(canvas);

  new Chart(canvas, {
    type: "line",
    data: { datasets: [{ label: title, data }] },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#cde6b3" } }
      },
      scales: {
        x: { ticks: { color: "#9acd32" } },
        y: { ticks: { color: "#9acd32" } }
      }
    }
  });
}
,
  /* ---------- SINGLE COUNTRY MACRO ---------- */
graphMacronomicIndicators(timeSeries, title) {
  showLoading();

  const container = getGraphSearchContainer();
  if (!container) return;

  const ordered = timeSeries
    .map(d => ({ date: +d.date, value: +d.value }))
    .filter(d => d.date <= CUT_YEAR)
    .sort((a, b) => a.date - b.date);

  const labels = ordered.map(d => d.date);
  const values = ordered.map(d => d.value);

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "380px";
  container.appendChild(canvas);

  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: "#7CFF00",
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#9acd32" } },
        y: { ticks: { color: "#9acd32" } }
      }
    }
  });

  hideLoading();
}
,
  /* ---------- MULTI COUNTRY MACRO (ENHANCED) ---------- */
  graphMultipleMacronomicIndicators(timeSeriesArray, title) {
  showLoading();

  const container = getGraphSearchContainer();
  if (!container) return;

  const colors = [
    "#7CFF00", "#00E5FF", "#FFB300",
    "#FF5252", "#69F0AE", "#40C4FF"
  ];

  const sorted = timeSeriesArray.map(s => ({
    country: s.country,
    data: s.data
      .map(d => ({ date: +d.date, value: +d.value }))
      .filter(d => d.date <= CUT_YEAR)
      .sort((a, b) => a.date - b.date)
  }));

  const labels = sorted[0]?.data.map(d => d.date) || [];

  const datasets = sorted.map((s, i) => ({
    label: s.country,
    data: s.data.map(d => d.value),
    borderColor: colors[i % colors.length],
    borderWidth: 2,
    tension: 0.35,
    pointRadius: 0
  }));

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "380px";
  container.appendChild(canvas);

  new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#cde6b3" } }
      },
      scales: {
        x: { ticks: { color: "#9acd32" } },
        y: { ticks: { color: "#9acd32" } }
      }
    }
  });

  hideLoading();
}


};

export default HomeGraphs;


