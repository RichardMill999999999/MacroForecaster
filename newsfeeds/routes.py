from flask import Blueprint, jsonify, request
import requests
from urllib.parse import urlencode
import xml.etree.ElementTree as ET

from country_analysis import get_country_news, resolve_country
from .core import download, parse_feed
from . import REGIONS, fetch_all_news, fetch_newsdata

news_bp = Blueprint("news", __name__, url_prefix="/news")


def _bool(name, default=True):
    return request.args.get(name, str(int(default))).lower() in ("1", "true", "yes")


@news_bp.route("/regions")
def regions():
    return jsonify(sorted(list(REGIONS) + ["newsdata"]))


@news_bp.route("/all")
def all_news():
    regs = [r for r in request.args.get("regions", "").split(",") if r] or None
    return jsonify(fetch_all_news(
        regions=regs, query=request.args.get("q"), translate=_bool("translate"),
        limit_per_feed=request.args.get("per_feed", 8, type=int),
        total=request.args.get("limit", 200, type=int),
        include_newsdata=_bool("newsdata"),
        newsdata_countries=request.args.get("countries")))


@news_bp.route("/newsdata")
def newsdata():
    return jsonify(fetch_newsdata(
        query=request.args.get("q"), countries=request.args.get("countries"),
        languages=request.args.get("languages"),
        categories=request.args.get("categories", "business,top"),
        translate=_bool("translate")))


@news_bp.route("/commodity")
def commodity_news():
    query = (request.args.get("q") or "").strip()[:100]
    if not query:
        return jsonify({"error": "The commodity query parameter is required."}), 400

    url = "https://news.google.com/rss/search?" + urlencode({
        "q": f'"{query}" commodity price OR supply OR market',
        "hl": "en-US",
        "gl": "US",
        "ceid": "US:en",
    })
    try:
        items = parse_feed(download(url))[:10]
    except (requests.RequestException, ET.ParseError, ValueError) as error:
        return jsonify({"error": f"Unable to load commodity news: {error}"}), 502

    articles = []
    for item in items:
        title = item["title"]
        articles.append({
            "title": title,
            "summary": item["summary"],
            "url": item["link"],
            "published": item["published"],
            "source": title.rsplit(" - ", 1)[-1] if " - " in title else "Google News",
            "provider": "Google News",
        })
    return jsonify({"query": query, "count": len(articles), "articles": articles})


@news_bp.route("/country")
def country_news():
    name = (request.args.get("country") or "").strip()
    if not name:
        return jsonify({"error": "The country query parameter is required."}), 400
    try:
        country = resolve_country(name)
        if not country:
            return jsonify({"error": f"No World Bank country matched '{name}'."}), 404
        return jsonify({
            "country": country["name"],
            **get_country_news(country),
        })
    except (requests.RequestException, ValueError) as error:
        return jsonify({"error": f"Unable to load country news: {error}"}), 502


@news_bp.route("/<region>")
def one_region(region):
    if region not in REGIONS:
        return jsonify({"error": f"unknown region '{region}'", "available": list(REGIONS)}), 404
    return jsonify(REGIONS[region](
        request.args.get("per_feed", 10, type=int), _bool("translate"), request.args.get("q")))
