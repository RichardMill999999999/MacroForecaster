"""One small fetcher per data provider. All return ascending [{"date","value"}] lists."""
from __future__ import annotations

import datetime as dt
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
