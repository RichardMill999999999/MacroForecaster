"""Multi-source news. Public API:

    fetch_all_news(regions=None, query=None, translate=True, ...)   # everything, merged + deduped
    fetch_us / fetch_china / fetch_europe / fetch_africa / fetch_india / fetch_russia /
    fetch_latam / fetch_middle_east / fetch_asia_pacific            # each usable on its own
    fetch_newsdata(...)                                             # newsdata.io
    search_related_news(title, limit)  and  fetch_article_text(url) # drop-ins for the old news_fetcher
"""
from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor

import requests

from .core import HEADERS, ttl_cache
from .newsdata import fetch_newsdata
from .regions import (fetch_africa, fetch_asia_pacific, fetch_china, fetch_europe, fetch_india,
                      fetch_latam, fetch_middle_east, fetch_russia, fetch_us)

REGIONS = {
    "us": fetch_us, "china": fetch_china, "europe": fetch_europe, "africa": fetch_africa,
    "india": fetch_india, "russia": fetch_russia, "latam": fetch_latam,
    "middle_east": fetch_middle_east, "asia_pacific": fetch_asia_pacific,
}


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def fetch_all_news(regions=None, query=None, translate=True, limit_per_feed=8,
                   per_region=40, total=200, include_newsdata=True, newsdata_countries=None) -> dict:
    """Runs every region fetcher in parallel, merges, de-duplicates (by URL and title), newest first."""
    names = [r for r in (regions or REGIONS) if r in REGIONS]
    jobs = {n: (lambda n=n: REGIONS[n](limit_per_feed, translate, query)) for n in names}
    if include_newsdata and (regions is None or "newsdata" in regions):
        jobs["newsdata"] = lambda: fetch_newsdata(query=query, countries=newsdata_countries, translate=translate)

    with ThreadPoolExecutor(max_workers=len(jobs) or 1) as ex:
        futures = {n: ex.submit(fn) for n, fn in jobs.items()}

    merged, errors, per = [], [], {}
    seen_links, seen_titles = set(), set()
    for name, fut in futures.items():
        try:
            res = fut.result()
        except Exception as e:
            errors.append({"source": name, "error": str(e)})
            continue
        errors.extend(res["errors"])
        kept = 0
        for a in res["articles"][:per_region]:
            lk, tt = a["link"].split("?")[0], _norm(a["title"])
            if lk in seen_links or tt in seen_titles:
                continue
            seen_links.add(lk); seen_titles.add(tt)
            merged.append(a); kept += 1
        per[name] = kept

    merged.sort(key=lambda a: a["published"] or "", reverse=True)
    merged = merged[:total]
    return {"count": len(merged), "per_region": per, "articles": merged, "errors": errors}


# ---------------------------------------------------------------- drop-ins for the old module
def search_related_news(title: str, limit: int = 6) -> list[dict]:
    """Ranks cached feed articles by keyword overlap with `title`. Returns the same shape the
    old function did: [{source, title, published, link}]."""
    words = {w for w in _norm(title).split() if len(w) > 3}
    if not words:
        return []
    pool = fetch_all_news(translate=False, include_newsdata=False, total=1000)["articles"]
    scored = []
    for a in pool:
        if a["language"].lower() not in ("en", "english"):
            continue
        overlap = len(words & set(_norm(a["title"] + " " + a["summary"]).split()))
        if overlap >= 2:
            scored.append((overlap, a))
    scored.sort(key=lambda x: (-x[0], x[1]["published"] or ""))
    return [{"source": a["source"], "title": a["title"], "published": a["published"], "link": a["link"]}
            for _, a in scored[:limit]]


@ttl_cache(1800)
def fetch_article_text(url: str, max_chars: int = 12000) -> str:
    """Best-effort full-text. Uses trafilatura if installed, else strips <p> tags. Paywalls return ''."""
    try:
        html_text = requests.get(url, headers=HEADERS, timeout=15).text
    except requests.RequestException:
        return ""
    try:
        import trafilatura
        return (trafilatura.extract(html_text) or "")[:max_chars]
    except ImportError:
        paras = re.findall(r"<p[^>]*>(.*?)</p>", html_text, flags=re.S | re.I)
        text = " ".join(re.sub(r"<[^>]+>", "", p) for p in paras)
        return re.sub(r"\s+", " ", text).strip()[:max_chars]


__all__ = ["REGIONS", "fetch_all_news", "fetch_newsdata", "search_related_news", "fetch_article_text",
           "fetch_us", "fetch_china", "fetch_europe", "fetch_africa", "fetch_india", "fetch_russia",
           "fetch_latam", "fetch_middle_east", "fetch_asia_pacific"]
