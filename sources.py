from flask import Blueprint, jsonify, request

from . import COUNTRIES, compare, detect_changes, get_indicator, outlook

macro_bp = Blueprint("macro", __name__, url_prefix="/macro")


def _csv(name, default):
    return [x.strip().upper() for x in request.args.get(name, default).split(",") if x.strip()]


@macro_bp.route("/countries")
def countries():
    return jsonify(COUNTRIES)


@macro_bp.route("/compare/<indicator>")
def compare_route(indicator):
    return jsonify(compare(indicator, _csv("countries", "USA,MEX,EA,CHN,IND,RUS,ZAF"),
                           request.args.get("prefer", "auto")))


@macro_bp.route("/changes")
def changes_route():
    inds = [i.lower() for i in request.args.get("indicators", "inflation,unemployment,gdp_growth,policy_rate").split(",")]
    return jsonify(detect_changes(_csv("countries", "USA,MEX,EA,CHN,IND,RUS,ZAF"), inds,
                                  request.args.get("z", 2.0, type=float)))


@macro_bp.route("/outlook/<country>/<indicator>")
def outlook_route(country, indicator):
    try:
        return jsonify(outlook(country, indicator, request.args.get("steps", 4, type=int)))
    except LookupError as e:
        return jsonify({"error": str(e)}), 404


@macro_bp.route("/<country>/<indicator>")
def indicator_route(country, indicator):
    try:
        return jsonify(get_indicator(country, indicator, request.args.get("prefer", "auto")))
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
