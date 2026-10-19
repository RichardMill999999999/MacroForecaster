"""One small fetcher per data provider. All return ascending [{"date","value"}] lists."""
from __future__ import annotations

import datetime as dt
import csv
import io
import math
import os
import xml.etree.ElementTree as ET

import requests

from .core import obs_list

H = {"User-Agent": "Mozilla/5.0 (compatible; EconDashboard/1.0)", "Accept": "application/json"}


# ------------------------------------------------------------- FRED (United States)  key: FRED_API_KEY
def fred(series_id: str, start: str = "2005-01-01") -> list[dict]:
    from fredapi import Fred
    s = Fred(api_key=os.getenv("FRED_API_KEY")).get_series(series_id, observation_start=start).dropna()
    return obs_list((d.strftime("%Y-%m-%d"), v) for d, v in s.items())


# ------------------------------------------------------------- INEGI (Mexico)       key: INEGI_TOKEN
def inegi(indicator_id: str, area: str = "0700", source: str = "BIE") -> list[dict]:
    """area 0700 = national. Find indicator ids in the INEGI indicator catalog."""
    url = (f"https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/INDICATOR/"
           f"{indicator_id}/es/{area}/false/{source}/2.0/{os.getenv('INEGI_TOKEN')}")
    r = requests.get(url, params={"type": "json"}, headers=H, timeout=25)
    r.raise_for_status()
    rows = r.json()["Series"][0]["OBSERVATIONS"]
    pairs = []
    for o in rows:
        p = o["TIME_PERIOD"].split("/")                  # "2025/09" or "2025"
        pairs.append((f"{p[0]}-{p[1]}-01" if len(p) > 1 else f"{p[0]}-01-01", o["OBS_VALUE"]))
    return obs_list(pairs)


# ------------------------------------------------------------- Banxico SIE (Mexico) key: BANXICO_TOKEN
def banxico(series_id: str, start: str = "2010-01-01") -> list[dict]:
    end = dt.date.today().isoformat()
    url = f"https://www.banxico.org.mx/SieAPIRest/service/v1/series/{series_id}/datos/{start}/{end}"
    r = requests.get(url, headers={**H, "Bmx-Token": os.getenv("BANXICO_TOKEN", "")}, timeout=25)
    r.raise_for_status()
    rows = r.json()["bmx"]["series"][0].get("datos", [])
    return obs_list((dt.datetime.strptime(x["fecha"], "%d/%m/%Y").strftime("%Y-%m-%d"),
                     x["dato"].replace(",", "")) for x in rows)


# ------------------------------------------------------------- ECB Data Portal (euro area), no key
def ecb(flow: str, key: str, last_n: int = 120) -> list[dict]:
    r = requests.get(f"https://data-api.ecb.europa.eu/service/data/{flow}/{key}",
                     params={"format": "jsondata", "lastNObservations": last_n}, headers=H, timeout=25)
    r.raise_for_status()
    d = r.json()
    d = d.get("data", d)
    series = next(iter(d["dataSets"][0]["series"].values()))
    times = d["structure"]["dimensions"]["observation"][0]["values"]
    pairs = []
    for i, v in series["observations"].items():
        t = times[int(i)]["id"]
        pairs.append((t + "-01" if len(t) == 7 else t, v[0]))
    return obs_list(pairs)


# ------------------------------------------------------------- Central Bank of Russia, no key
def cbr_fx(val_code: str = "R01235", days: int = 1500) -> list[dict]:
    """Daily official RUB rate. R01235 = USD, R01239 = EUR, R01375 = CNY."""
    end = dt.date.today()
    start = end - dt.timedelta(days=days)
    r = requests.get("https://www.cbr.ru/scripts/XML_dynamic.asp",
                     params={"date_req1": start.strftime("%d/%m/%Y"), "date_req2": end.strftime("%d/%m/%Y"),
                             "VAL_NM_RQ": val_code}, headers=H, timeout=25)
    r.raise_for_status()
    root = ET.fromstring(r.content)
    pairs = []
    for rec in root.findall("Record"):
        nominal = float(rec.findtext("Nominal", "1").replace(",", "."))
        val = float(rec.findtext("Value").replace(",", ".")) / nominal
        pairs.append((dt.datetime.strptime(rec.attrib["Date"], "%d.%m.%Y").strftime("%Y-%m-%d"), val))
    return obs_list(pairs)


# ------------------------------------------------------------- World Bank (everyone, annual), no key
WB = {"gdp_growth": ("NY.GDP.MKTP.KD.ZG", "% y/y"), "inflation": ("FP.CPI.TOTL.ZG", "% y/y"),
      "unemployment": ("SL.UEM.TOTL.ZS", "% labour force"), "current_account": ("BN.CAB.XOKA.GD.ZS", "% GDP"),
      "gdp_per_capita": ("NY.GDP.PCAP.CD", "USD"), "gov_debt": ("GC.DOD.TOTL.GD.ZS", "% GDP")}


def worldbank(country_iso3: str, indicator: str, years: int = 30) -> list[dict]:
    code = WB[indicator][0]
    r = requests.get(f"https://api.worldbank.org/v2/country/{country_iso3}/indicator/{code}",
                     params={"format": "json", "per_page": 200, "mrv": years}, headers=H, timeout=25)
    r.raise_for_status()
    rows = r.json()[1] or []
    return obs_list((x["date"], x["value"]) for x in rows if x["value"] is not None)


# ------------------------------------------------------------- IMF DataMapper (WEO, incl. forecasts), no key
IMF = {"gdp_growth": ("NGDP_RPCH", "% y/y"), "inflation": ("PCPIPCH", "% y/y"),
       "unemployment": ("LUR", "% labour force"), "current_account": ("BCA_NGDPD", "% GDP"),
       "gov_debt": ("GGXWDG_NGDP", "% GDP")}


def imf(country_iso3: str, indicator: str) -> list[dict]:
    code = IMF[indicator][0]
    r = requests.get(f"https://www.imf.org/external/datamapper/api/v1/{code}/{country_iso3}",
                     headers=H, timeout=25)
    r.raise_for_status()
    vals = r.json().get("values", {}).get(code, {}).get(country_iso3, {})
    return obs_list(vals.items())


# ------------------------------------------------------------- DBnomics (aggregates NBS China, RBI, OECD, ...)
def dbnomics(provider: str, dataset: str, code: str) -> list[dict]:
    """Generic bridge. Browse https://db.nomics.world to find the provider/dataset/code you want."""
    r = requests.get(f"https://api.db.nomics.world/v22/series/{provider}/{dataset}/{code}",
                     params={"observations": 1}, headers=H, timeout=30)
    r.raise_for_status()
    doc = r.json()["series"]["docs"][0]
    return obs_list(zip(doc["period_start_day"] if "period_start_day" in doc else doc["period"], doc["value"]))


# ------------------------------------------------------------- ChinaData (China), NBS datasets already used by the UI
def china_data(dataset_id: str) -> tuple[list[dict], dict]:
    r = requests.get(f"https://chinadata.live/api/v2/data/{dataset_id}", headers=H, timeout=25)
    r.raise_for_status()
    payload = r.json()
    if payload.get("success") is False or not isinstance(payload.get("data"), dict):
        raise ValueError(f"ChinaData returned no dataset for '{dataset_id}'.")
    dataset = payload["data"]
    rows = dataset.get("data")
    if not isinstance(rows, list):
        raise ValueError(f"ChinaData dataset '{dataset_id}' has no observations.")
    return obs_list((item.get("date"), item.get("value")) for item in rows), dataset


# ------------------------------------------------------------- Eurostat (UK and Germany), public JSON-stat API
EUROSTAT_BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
EUROSTAT_SERIES = {
    "gdp_growth": {
        "dataset": "namq_10_gdp",
        "params": {"na_item": "B1GQ", "unit": "CLV_PCH_PRE", "s_adj": "SCA"},
        "frequency": "quarterly",
        "units": "% q/q",
        "label": "GDP growth, seasonally adjusted",
    },
    "inflation": {
        "dataset": "prc_hicp_manr",
        "params": {"coicop": "CP00", "unit": "RCH_A"},
        "frequency": "monthly",
        "units": "% y/y",
        "label": "HICP inflation, all items",
    },
    "unemployment": {
        "dataset": "une_rt_m",
        "params": {"age": "TOTAL", "sex": "T", "unit": "PC_ACT", "s_adj": "SA"},
        "frequency": "monthly",
        "units": "%",
        "label": "Unemployment rate, seasonally adjusted",
    },
}


def ons_cpih() -> list[dict]:
    return ons_dataset_series(
        "cpih01",
        {"Geography": "United Kingdom", "Aggregate": "Overall Index"},
    )


def ons_dataset_series(dataset_id: str, filters: dict[str, str]) -> list[dict]:
    dataset_response = requests.get(
        f"https://api.beta.ons.gov.uk/v1/datasets/{dataset_id}",
        headers=H,
        timeout=20,
    )
    dataset_response.raise_for_status()
    latest_version_url = dataset_response.json().get("links", {}).get("latest_version", {}).get("href")
    if not latest_version_url:
        raise ValueError("ONS did not provide a latest CPIH dataset version.")
    version_response = requests.get(latest_version_url, headers=H, timeout=20)
    version_response.raise_for_status()
    csv_url = version_response.json().get("downloads", {}).get("csv", {}).get("href")
    if not csv_url:
        raise ValueError("ONS did not provide a CPIH CSV download.")

    data_response = requests.get(csv_url, headers={**H, "Accept": "text/csv"}, timeout=40)
    data_response.raise_for_status()
    pairs = []
    for row in csv.DictReader(io.StringIO(data_response.text)):
        if any(row.get(key) != value for key, value in filters.items()):
            continue
        try:
            label = row["Time"]
            date_label = label.rsplit("-", 1)[-1] if " " in label else label
            date_format = "%b %Y" if " " in date_label else "%b-%y"
            date = dt.datetime.strptime(date_label, date_format).strftime("%Y-%m-%d")
            pairs.append((date, row["v4_0"]))
        except (KeyError, TypeError, ValueError):
            continue
    observations = obs_list(pairs)
    if not observations:
        raise ValueError(f"ONS dataset '{dataset_id}' contained no observations for the requested series.")
    return observations


def bank_of_england(series_id: str = "IUDBEDR") -> list[dict]:
    r = requests.get(
        "https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp",
        params={
            "csv.x": "1",
            "Datefrom": "01/Jan/2000",
            "Dateto": "now",
            "SeriesCodes": series_id,
            "CSVF": "TN",
            "UsingCodes": "Y",
            "VPD": "Y",
            "VFD": "N",
        },
        headers={**H, "Accept": "text/csv"},
        timeout=30,
    )
    r.raise_for_status()
    pairs = []
    for row in csv.DictReader(io.StringIO(r.content.decode("utf-8-sig"))):
        try:
            date = dt.datetime.strptime(row["DATE"], "%d %b %Y").strftime("%Y-%m-%d")
            pairs.append((date, row[series_id]))
        except (KeyError, TypeError, ValueError):
            continue
    observations = obs_list(pairs)
    if not observations:
        raise ValueError(f"Bank of England returned no observations for {series_id}.")
    return observations


def eurostat(country_iso2: str, indicator: str) -> tuple[list[dict], dict]:
    spec = EUROSTAT_SERIES[indicator]
    params = {**spec["params"], "geo": country_iso2, "lang": "en", "lastTimePeriod": 120}
    r = requests.get(f"{EUROSTAT_BASE}/{spec['dataset']}", params=params, headers=H, timeout=30)
    r.raise_for_status()
    payload = r.json()
    ids = payload.get("id", [])
    sizes = payload.get("size", [])
    dimensions = payload.get("dimension", {})
    time_position = ids.index("time") if "time" in ids else -1
    if time_position < 0 or time_position >= len(sizes):
        raise ValueError(f"Eurostat did not return a time dimension for {indicator}.")

    time_index = dimensions.get("time", {}).get("category", {}).get("index", {})
    times = {position: date for date, position in time_index.items()}
    if not times and isinstance(time_index, list):
        times = dict(enumerate(time_index))

    values = payload.get("value", {})
    if isinstance(values, list):
        values = {str(i): value for i, value in enumerate(values)}
    pairs = []
    for raw_index, value in values.items():
        try:
            flat_index = int(raw_index)
            coordinate = (flat_index // math.prod(sizes[time_position + 1:])) % sizes[time_position]
            date = times.get(coordinate)
            number = float(value)
        except (TypeError, ValueError, IndexError, ZeroDivisionError):
            continue
        if date is not None:
            pairs.append((date, number))
    observations = obs_list(pairs)
    if not observations:
        raise ValueError(f"Eurostat returned no observations for {country_iso2}/{indicator}.")
    return observations, payload
