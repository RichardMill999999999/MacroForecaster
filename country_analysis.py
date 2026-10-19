"""Country-level economic context and news sources for macro analysis."""
from __future__ import annotations

import csv
import io
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import timezone
from email.utils import parsedate_to_datetime
from io import BytesIO, TextIOWrapper
from urllib.parse import urlencode

import requests

from macrodata.sources import IMF, imf
from newsfeeds import fetch_newsdata
from newsfeeds.core import HEADERS, ttl_cache
from newsfeeds.regions import (
    fetch_africa,
    fetch_asia_pacific,
    fetch_china,
    fetch_europe,
    fetch_india,
    fetch_latam,
    fetch_middle_east,
    fetch_russia,
    fetch_us,
)

WORLD_BANK = "https://api.worldbank.org/v2"
INDICATORS = {
    "gdp": ("NY.GDP.MKTP.CD", "GDP, current US dollars"),
    "gdp_ppp": ("NY.GDP.MKTP.PP.CD", "GDP, PPP current international dollars"),
    "gdp_per_capita": ("NY.GDP.PCAP.CD", "GDP per capita, current US dollars"),
    "gdp_per_capita_ppp": ("NY.GDP.PCAP.PP.CD", "GDP per capita, PPP current international dollars"),
    "gdp_growth": ("NY.GDP.MKTP.KD.ZG", "GDP growth, annual percent"),
    "inflation": ("FP.CPI.TOTL.ZG", "Consumer price inflation, annual percent"),
    "cpi_index": ("FP.CPI.TOTL", "Consumer price index, 2010 = 100"),
    "exchange_rate": ("PA.NUS.FCRF", "Official exchange rate, local currency per US dollar"),
    "ppp_conversion": ("PA.NUS.PPP", "PPP conversion factor, local currency per international dollar"),
    "unemployment": ("SL.UEM.TOTL.ZS", "Unemployment, percent of labor force"),
    "population": ("SP.POP.TOTL", "Population"),
    "trade": ("NE.TRD.GNFS.ZS", "Trade, percent of GDP"),
    "fdi": ("BX.KLT.DINV.WD.GD.ZS", "FDI net inflows, percent of GDP"),
    "government_debt": ("GC.DOD.TOTL.GD.ZS", "Central government debt, percent of GDP"),
    "life_expectancy": ("SP.DYN.LE00.IN", "Life expectancy at birth, years"),
    "current_account": ("BN.CAB.XOKA.GD.ZS", "Current account, percent of GDP"),
    "gold_reserves": (None, "Gold reserves, current US dollars (derived)"),
    "total_reserves": ("FI.RES.TOTL.CD", "Total reserves including gold, current US dollars"),
    "gini": ("SI.POV.GINI", "Gini index (0 = equality, 100 = inequality)"),
    "poverty_national": ("SI.POV.NAHC", "Poverty headcount at national poverty lines, percent"),
    "poverty_300": ("SI.POV.DDAY", "Poverty headcount at $3.00 per day, 2021 PPP percent"),
    "poverty_830": ("SI.POV.UMIC", "Poverty headcount at $8.30 per day, 2021 PPP percent"),
    "income_share_bottom_20": ("SI.DST.FRST.20", "Income share held by lowest 20 percent"),
    "income_share_top_10": ("SI.DST.10TH.10", "Income share held by highest 10 percent"),
    "reserves_months_imports": ("FI.RES.TOTL.MO", "Total reserves in months of imports"),
}
COUNTRY_ALIASES = {
    "United States": ["United States of America", "USA", "US"],
    "Russian Federation": ["Russia"],
    "Korea, Rep.": ["South Korea", "Republic of Korea"],
    "Korea, Dem. People's Rep.": ["North Korea"],
    "Iran, Islamic Rep.": ["Iran"],
    "Egypt, Arab Rep.": ["Egypt"],
    "Venezuela, RB": ["Venezuela"],
    "Viet Nam": ["Vietnam"],
    "Türkiye": ["Turkey", "Turkiye"],
    "Czechia": ["Czech Republic"],
    "Congo, Dem. Rep.": ["Democratic Republic of the Congo", "DR Congo"],
    "Congo, Rep.": ["Republic of the Congo"],
    "Cote d'Ivoire": ["Ivory Coast"],
    "Gambia, The": ["The Gambia"],
    "Bahamas, The": ["The Bahamas"],
    "Kyrgyz Republic": ["Kyrgyzstan"],
    "Brunei Darussalam": ["Brunei"],
    "Cabo Verde": ["Cape Verde"],
    "Micronesia, Fed. Sts.": ["Micronesia"],
    "Timor-Leste": ["East Timor"],
    "Slovak Republic": ["Slovakia"],
}
REGIONAL_FEEDS = {
    "NAC": fetch_us,
    "EAS": fetch_asia_pacific,
    "SAS": fetch_india,
    "ECS": fetch_europe,
    "LCN": fetch_latam,
    "MEA": fetch_middle_east,
    "SSF": fetch_africa,
}
COUNTRY_FEEDS = {
    "US": fetch_us,
    "CN": fetch_china,
    "IN": fetch_india,
    "RU": fetch_russia,
}


def _normalize(value):
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", " ", ascii_text).strip()


@ttl_cache(86400)
def _country_catalog():
    response = requests.get(
        f"{WORLD_BANK}/country",
        params={"format": "json", "per_page": 400},
        headers=HEADERS,
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        raise ValueError("Unexpected World Bank country catalog response")
    return [
        country for country in payload[1]
        if country.get("id") and country.get("name") and country.get("region", {}).get("value") != "Aggregates"
    ]


def resolve_country(name, preferred_id=None):
    catalog = _country_catalog()
    if preferred_id:
        resolved = next((c for c in catalog if c["id"].upper() == str(preferred_id).upper()), None)
        if resolved and any(
            _normalize(candidate) == _normalize(name)
            for candidate in [resolved["name"], *COUNTRY_ALIASES.get(resolved["name"], [])]
        ):
            return resolved

    target = _normalize(name)
    for country in catalog:
        names = [country["name"], *COUNTRY_ALIASES.get(country["name"], [])]
        if any(_normalize(candidate) == target for candidate in names):
            return country
    return None


@ttl_cache(900)
def _world_bank_series(country_id, indicator_code):
    response = requests.get(
        f"{WORLD_BANK}/country/{country_id}/indicator/{indicator_code}",
        params={"format": "json", "per_page": 100},
        headers=HEADERS,
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        raise ValueError("Unexpected World Bank indicator response")
    rows = [
        {"year": str(row["date"]), "value": float(row["value"])}
        for row in payload[1]
        if row.get("date") and row.get("value") is not None
    ]
    rows.sort(key=lambda row: row["year"])
    alpha3 = next((row.get("countryiso3code") for row in payload[1] if row.get("countryiso3code")), None)
    return rows, alpha3


@ttl_cache(900)
def _gold_reserves(country_id):
    total, alpha3 = _world_bank_series(country_id, "FI.RES.TOTL.CD")
    excluding_gold, _ = _world_bank_series(country_id, "FI.RES.XGLD.CD")
    non_gold_by_year = {row["year"]: row["value"] for row in excluding_gold}
    return [
        {"year": row["year"], "value": row["value"] - non_gold_by_year[row["year"]]}
        for row in total
        if row["year"] in non_gold_by_year
    ], alpha3


def _indicator_result(label, rows, source="World Bank"):
    latest = rows[-1] if rows else None
    previous = rows[-2] if len(rows) > 1 else None
    result = {
        "label": label,
        "source": source,
        "observations": rows[-20:],
        "latest": latest,
        "previous": previous,
        "change": latest["value"] - previous["value"] if latest and previous else None,
    }
    if source == "IMF DataMapper":
        result["note"] = "May include estimates and projections; current and future years are not necessarily finalized actuals."
    if source == "World Bank (derived)":
        result["note"] = "Calculated as total reserves including gold minus total reserves excluding gold, using same-year World Bank values."
    return result


def _imf_series(country_iso3, indicator):
    rows = imf(country_iso3, indicator)
    return [{"year": str(row["date"]), "value": float(row["value"])} for row in rows][-20:]


def get_country_context(country):
    return _cached_country_context(country["id"])


@ttl_cache(86400)
def global_gold_reserves():
    """Fetch quarterly holdings and reserve shares from the World Gold Council dashboard."""
    response = requests.get(
        "https://fsapi.gold.org/api/cbd/v11/charts/getPage",
        params={"page": "snapshot", "periodicity": "QTD_FULL"},
        headers=HEADERS,
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json().get("chartData", {})
    date = payload.get("options", {}).get("maxDateAvailable")
    snapshot = payload.get("table", {}).get("QTD_FULL", {}).get(date, {})
    header_groups = snapshot.get("headers", [])
    rows = snapshot.get("rows", [])
    if not date or not header_groups or not rows:
        raise ValueError("World Gold Council returned no quarterly country holdings.")

    columns = {
        column.get("filterId"): index
        for index, column in enumerate(header_groups[0])
        if column.get("filterId")
    }

    def value(row, key):
        try:
            number = float(row[columns[key]]["val"])
        except (KeyError, IndexError, TypeError, ValueError):
            return None
        return number

    items = []
    for row in rows:
        country_cell = row[columns["countryNameDefault"]]
        country = country_cell.get("val") if isinstance(country_cell, dict) else None
        tonnes = value(row, "gold_reserves_tns")
        total_reserves = value(row, "total_reserves")
        gold_value = value(row, "gold_reserves")
        reserve_share = value(row, "holdings_pct")
        if not country or tonnes is None or tonnes <= 0:
            continue
        items.append({
            "country": country,
            "year": date,
            "value": tonnes,
            "reserve_share": reserve_share,
            "total_reserves_usd_millions": total_reserves,
            "gold_value_usd_millions": gold_value,
        })
    global_total = sum(item["value"] for item in items)
    for item in items:
        item["share_of_total"] = item["value"] / global_total * 100 if global_total else None
    items.sort(key=lambda item: item["value"], reverse=True)
    return {
        "title": "Gold reserves by country",
        "measure": "Official gold holdings and gold's share of each country's total reserves",
        "unit": "tonnes",
        "year": date,
        "source": "World Gold Council; IMF IFS and other reported sources",
        "url": "https://www.gold.org/goldhub/data/gold-reserves-by-country",
        "note": "Quarterly holdings are reported with a publication lag; listed shares are calculated against all country holdings in this dataset. Gold value and total reserves are also included in the API response.",
        "items": items,
    }


OWID_COMMODITY_PRODUCTION = {
    "oil": ("oil-production-by-country", "Oil production", "TWh"),
    "natural_gas": ("gas-production-by-country", "Natural gas production", "TWh"),
    "wheat": ("wheat-production", "Wheat production", "tonnes"),
    "maize": ("maize-production", "Maize production", "tonnes"),
    "soybeans": ("soybean-production", "Soybean production", "tonnes"),
    "coffee": ("coffee-bean-production", "Coffee production", "tonnes"),
    "cocoa": ("cocoa-bean-production", "Cocoa production", "tonnes"),
    "rice": ("rice-production", "Rice production", "tonnes"),
    "sugar": ("sugar-beet-production", "Sugar-beet production (partial sugar feedstock)", "tonnes"),
}

FAOSTAT_CROP_PRODUCTION = {
    "oats": ("Oats", "Oat production"),
    "cotton": ("Cotton lint, ginned", "Ginned cotton lint production"),
}
FAOSTAT_CROP_ITEMS = {
    item_name: commodity
    for commodity, (item_name, _) in FAOSTAT_CROP_PRODUCTION.items()
}
FAOSTAT_CROP_URL = (
    "https://bulks-faostat.fao.org/production/"
    "Production_Crops_Livestock_E_All_Data_%28Normalized%29.zip"
)


@ttl_cache(86400)
def _owid_commodity_production(commodity):
    chart, title, unit = OWID_COMMODITY_PRODUCTION[commodity]
    url = f"https://ourworldindata.org/grapher/{chart}.csv"
    response = requests.get(url, headers=HEADERS, timeout=40)
    response.raise_for_status()
    rows_by_country = {}
    for row in csv.DictReader(io.StringIO(response.text)):
        code = (row.get("Code") or "").strip()
        entity = (row.get("Entity") or "").strip()
        value_column = next((column for column in row if column not in {"Entity", "Code", "Year"}), None)
        try:
            value = float(row[value_column])
            year = str(row["Year"])
        except (TypeError, ValueError, KeyError):
            continue
        if not re.fullmatch(r"[A-Z]{3}", code) or not entity:
            continue
        current = rows_by_country.get(code)
        if current is None or year > current["year"]:
            rows_by_country[code] = {"country": entity, "year": year, "value": value}
    items = list(rows_by_country.values())
    items.sort(key=lambda row: row["value"], reverse=True)
    total = sum(row["value"] for row in items if row["value"] > 0)
    for row in items:
        row["global_share"] = row["value"] / total * 100 if total and row["value"] > 0 else 0
    return {
        "title": title + " by country",
        "measure": title,
        "unit": unit,
        "year": "latest available per country",
        "source": "Our World in Data",
        "url": url,
        "note": "Country reporting years can differ. The underlying series and its cited source are available at the linked chart.",
        "items": items,
    }


@ttl_cache(86400)
def _faostat_crop_production():
    response = requests.get(FAOSTAT_CROP_URL, headers=HEADERS, timeout=120)
    response.raise_for_status()
    country_names = set()
    for country in _country_catalog():
        names = [country["name"], *COUNTRY_ALIASES.get(country["name"], [])]
        country_names.update(_normalize(name) for name in names)

    with zipfile.ZipFile(BytesIO(response.content)) as archive:
        csv_name = next(
            (name for name in archive.namelist() if name.endswith("_All_Data_(Normalized).csv")),
            None,
        )
        if csv_name is None:
            raise ValueError("FAOSTAT production archive does not contain its normalized data CSV.")
        with archive.open(csv_name) as source:
            rows = csv.DictReader(TextIOWrapper(source, encoding="utf-8-sig"))
            yearly = {commodity: {} for commodity in FAOSTAT_CROP_PRODUCTION}
            for row in rows:
                if row.get("Element") != "Production":
                    continue
                area = row.get("Area", "")
                if _normalize(area) not in country_names:
                    continue
                commodity = FAOSTAT_CROP_ITEMS.get(row.get("Item"))
                if commodity is None:
                    continue
                try:
                    value = float(row["Value"])
                    year = int(row["Year"])
                except (KeyError, TypeError, ValueError):
                    continue
                if value <= 0:
                    continue
                yearly[commodity].setdefault(year, {})[area] = value

    result = {}
    for commodity, by_year in yearly.items():
        if not by_year:
            result[commodity] = []
            continue
        coverage_by_year = {year: len(values) for year, values in by_year.items()}
        max_coverage = max(coverage_by_year.values())
        common_years = [
            year for year, coverage in coverage_by_year.items()
            if coverage >= max_coverage * 0.95
        ]
        reference_year = max(common_years)
        result[commodity] = [
            {"country": country, "year": str(reference_year), "value": value}
            for country, value in by_year[reference_year].items()
        ]
        result[commodity].sort(key=lambda item: item["value"], reverse=True)
        total = sum(item["value"] for item in result[commodity])
        for item in result[commodity]:
            item["global_share"] = item["value"] / total * 100 if total else 0
    return result


def _faostat_crop_distribution(commodity):
    item_name, title = FAOSTAT_CROP_PRODUCTION[commodity]
    items = _faostat_crop_production()[commodity]
    if not items:
        raise ValueError(f"FAOSTAT has no country production observations for {item_name}.")
    return {
        "title": title + " by country",
        "measure": title,
        "unit": "tonnes",
        "year": items[0]["year"],
        "source": "FAOSTAT, Crops and livestock products",
        "url": "https://www.fao.org/faostat/en/#data/QCL",
        "note": "Shows the latest year with at least 95% of the maximum country coverage in this series; country production is limited to World Bank country entries.",
        "items": items,
    }


def global_commodity_distribution(commodity):
    commodity = (commodity or "").strip().lower()
    if commodity == "gold":
        return global_gold_reserves()
    if commodity in FAOSTAT_CROP_PRODUCTION:
        return _faostat_crop_distribution(commodity)
    if commodity in OWID_COMMODITY_PRODUCTION:
        return _owid_commodity_production(commodity)
    raise ValueError(
        f"No compatible public country reserve/production series is configured for '{commodity}'."
    )


@ttl_cache(900)
def _cached_country_context(country_id):
    """Collect historical World Bank and IMF indicators plus regional/global scale ratios."""
    country = next((item for item in _country_catalog() if item["id"] == country_id), None)
    if not country:
        raise ValueError(f"Unknown World Bank country code: {country_id}")
    indicator_jobs = {
        key: (lambda code=code: _gold_reserves(country["id"]) if code is None else _world_bank_series(country["id"], code))
        for key, (code, _) in INDICATORS.items()
    }
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {key: executor.submit(job) for key, job in indicator_jobs.items()}

    results, errors, alpha3 = {}, [], None
    for key, future in futures.items():
        label = INDICATORS[key][1]
        try:
            rows, series_alpha3 = future.result()
            alpha3 = alpha3 or series_alpha3
            results[key] = _indicator_result(
                label, rows, "World Bank (derived)" if key == "gold_reserves" else "World Bank"
            )
        except (requests.RequestException, ValueError, KeyError, TypeError) as error:
            results[key] = _indicator_result(label, [])
            errors.append({"source": "World Bank", "indicator": key, "error": str(error)})

    imf_jobs = {}
    if alpha3:
        imf_jobs = {
            key: (lambda indicator=key: _imf_series(alpha3, indicator))
            for key in ("gdp_growth", "inflation", "unemployment", "current_account", "gov_debt")
            if key in IMF
        }
    with ThreadPoolExecutor(max_workers=max(1, len(imf_jobs))) as executor:
        imf_futures = {key: executor.submit(job) for key, job in imf_jobs.items()}
    for key, future in imf_futures.items():
        try:
            rows = future.result()
            results[f"imf_{key}"] = _indicator_result(IMF[key][0], rows, "IMF DataMapper")
        except (requests.RequestException, ValueError, KeyError, TypeError) as error:
            results[f"imf_{key}"] = _indicator_result(IMF[key][0], [], "IMF DataMapper")
            errors.append({"source": "IMF DataMapper", "indicator": key, "error": str(error)})

    region_code = country.get("region", {}).get("id")
    scale = _relative_scale(region_code, results.get("gdp", {}), errors)
    return {
        "country": {
            "name": country["name"],
            "worldBankId": country["id"],
            "iso2": country.get("iso2Code") or country["id"],
            "region": country.get("region", {}).get("value"),
            "regionId": country.get("region", {}).get("id"),
            "incomeLevel": country.get("incomeLevel", {}).get("value"),
            "capital": country.get("capitalCity"),
            "currencyUnit": country.get("currencyUnit"),
        },
        "indicators": results,
        "relativeEconomicScale": scale,
        "errors": errors,
    }


def _relative_scale(region_code, gdp_result, errors):
    gdp_latest = gdp_result.get("latest") or {}
    year = gdp_latest.get("year")
    if not year:
        return {"status": "unavailable", "definition": "GDP shares measure economic scale, not military or overall geopolitical power."}

    def aggregate(code):
        rows, _ = _world_bank_series(code, INDICATORS["gdp"][0])
        return next((row["value"] for row in reversed(rows) if row["year"] == year), None)

    jobs = {"world": lambda: aggregate("WLD")}
    if region_code:
        jobs["region"] = lambda: aggregate(region_code)
    with ThreadPoolExecutor(max_workers=len(jobs)) as executor:
        futures = {key: executor.submit(job) for key, job in jobs.items()}
    denominators = {}
    for key, future in futures.items():
        try:
            denominators[key] = future.result()
        except (requests.RequestException, ValueError, KeyError, TypeError) as error:
            errors.append({"source": "World Bank", "indicator": f"{key}_gdp_total", "error": str(error)})
            denominators[key] = None

    value = gdp_latest["value"]
    return {
        "year": year,
        "gdpCurrentUsd": value,
        "worldGdpCurrentUsd": denominators.get("world"),
        "regionalGdpCurrentUsd": denominators.get("region"),
        "worldGdpSharePct": value / denominators["world"] * 100 if denominators.get("world") else None,
        "regionalGdpSharePct": value / denominators["region"] * 100 if denominators.get("region") else None,
        "definition": "GDP shares measure economic scale, not military or overall geopolitical power.",
    }


def _google_news(country):
    query = f'"{country["name"]}" (politics OR economy OR government)'
    url = f"https://news.google.com/rss/search?{urlencode({'q': query, 'hl': 'en-US', 'gl': 'US', 'ceid': 'US:en'})}"
    response = requests.get(url, headers=HEADERS, timeout=18)
    response.raise_for_status()
    root = ET.fromstring(response.content)
    articles = []
    for item in root.findall(".//item")[:12]:
        source = item.findtext("source") or "Google News publisher"
        published = item.findtext("pubDate") or ""
        try:
            published = parsedate_to_datetime(published).astimezone(timezone.utc).isoformat()
        except (TypeError, ValueError):
            published = ""
        articles.append({
            "title": item.findtext("title") or "Untitled",
            "abstract": item.findtext("description") or "",
            "url": item.findtext("link") or "",
            "published": published,
            "source": source,
            "provider": "Google News",
        })
    return articles


def _local_articles(country):
    iso2 = (country.get("iso2Code") or country["id"]).upper()
    fetcher = COUNTRY_FEEDS.get(iso2) or REGIONAL_FEEDS.get(country.get("region", {}).get("id"))
    if not fetcher:
        return []
    response = fetcher(limit_per_feed=4, translate=False)
    aliases = [country["name"], country.get("capitalCity", ""), *COUNTRY_ALIASES.get(country["name"], [])]
    terms = [_normalize(alias) for alias in aliases if alias and len(_normalize(alias)) > 2]
    articles = []
    for item in response.get("articles", []):
        searchable = _normalize(f'{item.get("title", "")} {item.get("summary", "")}')
        if not any(f" {term} " in f" {searchable} " for term in terms):
            continue
        articles.append({
            "title": item.get("title", ""),
            "abstract": item.get("summary", ""),
            "url": item.get("link", ""),
            "published": item.get("published", ""),
            "source": item.get("source", "Regional RSS"),
            "provider": "Regional RSS",
            "note": item.get("note", ""),
        })
    return articles


def get_country_news(country):
    iso2 = (country.get("iso2Code") or country["id"]).lower()
    return _fetch_country_news(
        country["name"],
        iso2,
        country.get("region", {}).get("id", ""),
        country.get("capitalCity", ""),
    )


@ttl_cache(300)
def _fetch_country_news(country_name, iso2, region_id, capital):
    country = {
        "name": country_name,
        "iso2Code": iso2.upper(),
        "id": iso2.upper(),
        "region": {"id": region_id},
        "capitalCity": capital,
    }
    jobs = {
        "newsdata.io": lambda: fetch_newsdata(
            countries=iso2, categories="politics,business,world,top", translate=False
        ),
        "Google News": lambda: _google_news(country),
        "Regional RSS": lambda: _local_articles(country),
    }
    articles, errors = [], []
    with ThreadPoolExecutor(max_workers=len(jobs)) as executor:
        futures = {name: executor.submit(job) for name, job in jobs.items()}
    for source, future in futures.items():
        try:
            result = future.result()
            if source == "newsdata.io":
                for item in result.get("articles", []):
                    articles.append({
                        "title": item.get("title", ""),
                        "abstract": item.get("summary", ""),
                        "url": item.get("link", ""),
                        "published": item.get("published", ""),
                        "source": item.get("source", source),
                        "provider": source,
                    })
                errors.extend(result.get("errors", []))
            else:
                articles.extend(result)
        except (requests.RequestException, ET.ParseError, ValueError, KeyError) as error:
            errors.append({"source": source, "error": str(error)})

    merged, seen = [], set()
    for item in sorted(articles, key=lambda article: article.get("published") or "", reverse=True):
        key = (item.get("url") or item.get("title") or "").split("?")[0].lower()
        if not key or key in seen:
            continue
        seen.add(key)
        merged.append(item)
    return {"articles": merged[:30], "errors": errors}
