"""newsdata.io connector. Needs NEWSDATA_API_KEY. Check your plan's daily credit / per-request limits."""
from __future__ import annotations

import os

import requests

from .core import HEADERS, Article, parse_date, clean, result, translate_articles, matches

BASE = "https://newsdata.io/api/1/latest"


def fetch_newsdata(query=None, countries=None, languages=None, categories="business,top",
                   pages=1, translate=True) -> dict:
    """countries: 'us,mx,cn' (ISO-2, comma list) | languages: 'en,es' | categories: business,top,world,..."""
    key = os.getenv("NEWSDATA_API_KEY")
    if not key:
        return result("newsdata", [], [{"source": "newsdata.io", "error": "NEWSDATA_API_KEY not set"}])

    params = {"apikey": key}
    if query:
        params["q"] = query
    if countries:
        params["country"] = countries
    if languages:
        params["language"] = languages
    if categories:
        params["category"] = categories

    articles, errors = [], []
    for _ in range(max(1, pages)):
        try:
            r = requests.get(BASE, params=params, headers=HEADERS, timeout=20)
            data = r.json()
        except Exception as e:
            errors.append({"source": "newsdata.io", "error": str(e)})
            break
        if data.get("status") != "success":
            errors.append({"source": "newsdata.io", "error": str(data.get("results", data))})
            break
        for it in data.get("results", []):
            desc = clean(it.get("description") or "")
            if "ONLY AVAILABLE IN" in desc.upper():     # paid-plan placeholder text
                desc = ""
            country = it.get("country") or [""]
            cats = it.get("category") or [""]
            articles.append(Article(
                title=clean(it.get("title") or ""), link=it.get("link") or "", summary=desc[:600],
                published=parse_date(it.get("pubDate") or ""),
                source=it.get("source_name") or it.get("source_id") or "newsdata.io",
                region="newsdata", country=country[0] if isinstance(country, list) else country,
                language=(it.get("language") or "en").lower(),
                category=cats[0] if isinstance(cats, list) else cats,
                image=it.get("image_url") or "", origin="newsdata"))
        if not data.get("nextPage"):
            break
        params["page"] = data["nextPage"]

    if translate:
        translate_articles(articles)
    if query:
        articles = [a for a in articles if matches(a, query)] or articles
    return result("newsdata", articles, errors)
