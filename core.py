"""Economic data across countries.

    get_indicator("MEX", "inflation")            best available series (national source first)
    compare("inflation", ["USA","MEX","CHN"])    side-by-side latest values, ranking, change flags
    detect_changes(["USA","MEX","EA"])           only the series with unusual recent moves
    outlook("IND", "gdp_growth")                 history + IMF projections + model forecast

Canonical indicators: gdp_growth, inflation, unemployment, current_account, gov_debt,
policy_rate, fx_usd (the last two only where a national source is registered).
"""
from __future__ import annotations

import datetime as dt
from concurrent.futures import ThreadPoolExecutor

from . import sources as src
from .core import forecast, package, summarize, yoy

COUNTRIES = {
    "USA": "United States", "MEX": "Mexico", "EA": "Euro area", "DEU": "Germany", "FRA": "France",
    "GBR": "United Kingdom", "ESP": "Spain", "ITA": "Italy", "CHN": "China", "IND": "India",
    "RUS": "Russia", "JPN": "Japan", "BRA": "Brazil", "ZAF": "South Africa", "NGA": "Nigeria",
    "EGY": "Egypt", "KEN": "Kenya", "ETH": "Ethiopia", "GHA": "Ghana", "MAR": "Morocco",
}
WB_ALIAS = {"EA": "EMU"}      # World Bank code for the euro area


# ------------------------------------------------ national high-frequency sources (verify ids once)
def _usa_inflation():
    return package("USA", "inflation", "FRED", yoy(src.fred("CPIAUCSL"), 12), "monthly", "% y/y", "CPI-U, all items", "CPIAUCSL")

def _usa_unemployment():
    return package("USA", "unemployment", "FRED", src.fred("UNRATE"), "monthly", "%", "Unemployment rate", "UNRATE")

def _usa_policy():
    return package("USA", "policy_rate", "FRED", src.fred("FEDFUNDS"), "monthly", "%", "Effective fed funds rate", "FEDFUNDS")

def _usa_gdp():
    return package("USA", "gdp_growth", "FRED", src.fred("A191RL1Q225SBEA"), "quarterly", "% q/q annualised", "Real GDP growth", "A191RL1Q225SBEA")

def _mex_inflation():   # INEGI INPC general index. CONFIRM the id in the INEGI indicator catalog
    return package("MEX", "inflation", "INEGI", yoy(src.inegi("628194"), 12), "monthly", "% y/y", "INPC", "628194")

def _mex_policy():      # Banxico target rate. CONFIRM the id in the SIE catalog
    return package("MEX", "policy_rate", "Banxico", src.banxico("SF61745"), "daily", "%", "Target rate", "SF61745")

def _mex_fx():
    return package("MEX", "fx_usd", "Banxico", src.banxico("SF43718"), "daily", "MXN per USD", "FIX exchange rate", "SF43718")

def _ea_inflation():
    return package("EA", "inflation", "ECB", src.ecb("ICP", "M.U2.N.000000.4.ANR"), "monthly", "% y/y", "HICP headline", "ICP")

def _ea_policy():
    return package("EA", "policy_rate", "ECB", src.ecb("FM", "B.U2.EUR.4F.KR.MRR_FR.LEV", 400), "daily", "%", "Main refinancing rate", "FM")

def _ea_unemployment():
    return package("EA", "unemployment", "ECB", src.ecb("LFSI", "M.I9.S.UNEHRT.TOTAL0.15_74.T"), "monthly", "%", "Unemployment rate", "LFSI")

def _rus_fx():
    return package("RUS", "fx_usd", "CBR", src.cbr_fx("R01235"), "daily", "RUB per USD", "Official USD rate", "R01235")

NATIONAL = {
    ("USA", "inflation"): _usa_inflation, ("USA", "unemployment"): _usa_unemployment,
    ("USA", "policy_rate"): _usa_policy, ("USA", "gdp_growth"): _usa_gdp,
    ("MEX", "inflation"): _mex_inflation, ("MEX", "policy_rate"): _mex_policy, ("MEX", "fx_usd"): _mex_fx,
    ("EA", "inflation"): _ea_inflation, ("EA", "policy_rate"): _ea_policy, ("EA", "unemployment"): _ea_unemployment,
    ("RUS", "fx_usd"): _rus_fx,
}
# Add more by writing a function like the ones above, e.g. ("CHN","inflation"): lambda: package(..., src.dbnomics(...)).


def _worldbank(country, indicator):
    if indicator not in src.WB:
        raise KeyError(indicator)
    return package(country, indicator, "World Bank", src.worldbank(WB_ALIAS.get(country, country), indicator),
                   "annual", src.WB[indicator][1], indicator)


def _imf(country, indicator):
    if indicator not in src.IMF:
        raise KeyError(indicator)
    return package(country, indicator, "IMF WEO", src.imf(country, indicator), "annual", src.IMF[indicator][1], indicator)


def get_indicator(country: str, indicator: str, prefer: str = "auto") -> dict:
    """prefer: auto (national -> World Bank -> IMF) | national | worldbank | imf.
    Use 'imf' or 'worldbank' when you need a like-for-like annual comparison across countries."""
    country = country.upper()
    order = {"auto": ["national", "worldbank", "imf"], "national": ["national"],
             "worldbank": ["worldbank"], "imf": ["imf"]}[prefer]
    last_err = None
    for kind in order:
        try:
            if kind == "national":
                fn = NATIONAL.get((country, indicator))
                if not fn:
                    continue
                pkg = fn()
            elif kind == "worldbank":
                pkg = _worldbank(country, indicator)
            else:
                pkg = _imf(country, indicator)
            if pkg["observations"]:
                pkg["country_name"] = COUNTRIES.get(country, country)
                return pkg
        except Exception as e:
            last_err = e
    raise LookupError(f"No data for {country}/{indicator} (prefer={prefer}): {last_err or 'no source registered'}")


def _many(countries, fn):
    ok, errors = {}, []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {c: ex.submit(fn, c) for c in countries}
    for c, f in futs.items():
        try:
            ok[c] = f.result()
        except Exception as e:
            errors.append({"country": c, "error": str(e)})
    return ok, errors


def compare(indicator: str, countries: list[str], prefer: str = "auto") -> dict:
    ok, errors = _many([c.upper() for c in countries], lambda c: get_indicator(c, indicator, prefer))
    rows = []
    for c, p in ok.items():
        s = p["summary"]
        rows.append({"country": c, "name": p["country_name"], "source": p["source"], "frequency": p["frequency"],
                     "units": p["units"], **s})
    ranking = [r["country"] for r in sorted(rows, key=lambda r: r["latest"], reverse=True)]
    return {"indicator": indicator, "prefer": prefer, "rows": rows, "ranking_high_to_low": ranking,
            "note": "Mixed sources/frequencies unless prefer='imf' or 'worldbank'; dates are in latest_date.",
            "errors": errors}


def detect_changes(countries: list[str], indicators=("inflation", "unemployment", "gdp_growth", "policy_rate"),
                   z_threshold: float = 2.0) -> dict:
    jobs = [(c.upper(), i) for c in countries for i in indicators]
    flagged, errors = [], []
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {j: ex.submit(get_indicator, *j) for j in jobs}
    for (c, i), f in futs.items():
        try:
            p = f.result()
            s = summarize(p["observations"], z_threshold)
            if s.get("flag") != "normal":
                flagged.append({"country": c, "indicator": i, "source": p["source"], **s})
        except Exception as e:
            errors.append({"country": c, "indicator": i, "error": str(e)})
    flagged.sort(key=lambda r: abs(r.get("z_score") or 0), reverse=True)
    return {"z_threshold": z_threshold, "flagged": flagged, "errors": errors}


def outlook(country: str, indicator: str, steps: int = 4) -> dict:
    """History tail + official IMF projections (annual) + a statistical forecast on the best series."""
    country = country.upper()
    hist = get_indicator(country, indicator)
    out = {"country": country, "indicator": indicator, "source": hist["source"], "frequency": hist["frequency"],
           "history_tail": hist["observations"][-24:],
           "model_forecast": forecast(hist["observations"], steps, hist["frequency"]),
           "imf_projections": None}
    try:
        imf_obs = _imf(country, indicator)["observations"]
        year = dt.date.today().year
        out["imf_projections"] = [o for o in imf_obs if int(o["date"][:4]) >= year]
    except Exception as e:
        out["imf_projections_error"] = str(e)
    return out
