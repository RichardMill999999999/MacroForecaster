"""Common schema, change detection and forecasting for every economic source.

Every source returns observations as [{"date": "YYYY-MM-DD" | "YYYY", "value": float}, ...] (ascending),
and package() wraps them in one schema so countries can be compared directly.
"""
from __future__ import annotations

import math
import statistics

import pandas as pd

PERIOD = {"annual": "Y", "quarterly": "Q", "monthly": "M", "daily": "D"}


def obs_list(pairs) -> list[dict]:
    out = []
    for d, v in pairs:
        try:
            v = float(v)
        except (TypeError, ValueError):
            continue
        if math.isfinite(v):
            out.append({"date": str(d), "value": v})
    return sorted(out, key=lambda o: o["date"])


def yoy(obs: list[dict], lag: int = 12) -> list[dict]:
    """Index level -> year-over-year % change (lag=12 monthly, 4 quarterly)."""
    return [{"date": o["date"], "value": (o["value"] / obs[i - lag]["value"] - 1) * 100}
            for i, o in enumerate(obs) if i >= lag and obs[i - lag]["value"]]


def summarize(obs: list[dict], z_threshold: float = 2.0) -> dict:
    if not obs:
        return {}
    vals = [o["value"] for o in obs]
    latest = vals[-1]
    prev = vals[-2] if len(vals) > 1 else None
    change = latest - prev if prev is not None else None
    s = {"latest_date": obs[-1]["date"], "latest": latest, "previous": prev, "change": change,
         "pct_change": (change / abs(prev) * 100) if prev else None,
         "z_score": None, "flag": "normal"}
    diffs = [b - a for a, b in zip(vals, vals[1:])]
    if len(diffs) >= 8:
        hist = diffs[:-1]
        sd = statistics.pstdev(hist)
        if sd > 0:
            s["z_score"] = (diffs[-1] - statistics.mean(hist)) / sd
            if abs(s["z_score"]) >= z_threshold:
                s["flag"] = "unusual_jump" if s["z_score"] > 0 else "unusual_drop"
    return s


def package(country, indicator, source, obs, frequency, units="", label="", series_id="") -> dict:
    return {"country": country, "indicator": indicator, "label": label or indicator,
            "source": source, "series_id": series_id, "frequency": frequency, "units": units,
            "observations": obs, "summary": summarize(obs)}


def _future_labels(last_date: str, steps: int, frequency: str) -> list[str]:
    try:
        p = pd.Period(last_date if frequency != "annual" else last_date[:4], PERIOD[frequency])
        return [str(p + i) for i in range(1, steps + 1)]
    except Exception:
        return [f"t+{i}" for i in range(1, steps + 1)]


def forecast(obs: list[dict], steps: int = 4, frequency: str = "monthly") -> dict:
    """auto_arima when there is enough history (pmdarima is already in your project), else linear drift."""
    vals = [o["value"] for o in obs]
    if len(vals) < 3:
        return {"method": "none", "points": []}
    labels = _future_labels(obs[-1]["date"], steps, frequency)
    if len(vals) >= 12:
        try:
            from pmdarima import auto_arima
            m = auto_arima(vals, seasonal=False, suppress_warnings=True, error_action="ignore")
            pred, ci = m.predict(n_periods=steps, return_conf_int=True)
            return {"method": "auto_arima", "order": list(m.order),
                    "points": [{"date": labels[i], "value": float(pred[i]),
                                "low": float(ci[i][0]), "high": float(ci[i][1])} for i in range(steps)]}
        except Exception:
            pass
    n = min(len(vals), 8)
    slope = (vals[-1] - vals[-n]) / (n - 1)
    return {"method": "linear_drift", "points": [{"date": labels[i], "value": vals[-1] + slope * (i + 1)}
                                                  for i in range(steps)]}
