from flask import Blueprint, jsonify, request

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


@news_bp.route("/<region>")
def one_region(region):
    if region not in REGIONS:
        return jsonify({"error": f"unknown region '{region}'", "available": list(REGIONS)}), 404
    return jsonify(REGIONS[region](
        request.args.get("per_feed", 10, type=int), _bool("translate"), request.args.get("q")))
