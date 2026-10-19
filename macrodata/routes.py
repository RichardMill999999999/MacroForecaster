from flask import Blueprint, jsonify, request
import requests

from . import COUNTRIES, compare, detect_changes, get_indicator, national_snapshot, outlook
from country_analysis import get_country_context, global_commodity_distribution, resolve_country

macro_bp = Blueprint("macro", __name__, url_prefix="/macro")


def _csv(name, default):
    return [x.strip().upper() for x in request.args.get(name, default).split(",") if x.strip()]


@macro_bp.route("/countries")
def countries():
    return jsonify(COUNTRIES)


@macro_bp.route("/country-profile/<country_name>")
def country_profile(country_name):
    try:
        country = resolve_country(country_name)
        if not country:
            return jsonify({"error": f"No World Bank country matched '{country_name}'."}), 404
        profile = get_country_context(country)
        alpha2_to_alpha3 = {"US": "USA", "CN": "CHN", "GB": "GBR", "DE": "DEU"}
        national_code = alpha2_to_alpha3.get(country.get("iso2Code", "").upper())
        profile["nationalData"] = national_snapshot(national_code) if national_code else {
            "country": country.get("id"), "provider": None, "indicators": [], "errors": [],
        }
        return jsonify(profile)
    except (requests.RequestException, ValueError) as error:
        return jsonify({"error": f"Unable to load country profile: {error}"}), 502


@macro_bp.route("/commodity-distribution/<commodity>")
def commodity_distribution_route(commodity):
    try:
        return jsonify(global_commodity_distribution(commodity))
    except ValueError as error:
        return jsonify({"error": str(error)}), 404
    except requests.RequestException as error:
        return jsonify({"error": f"Unable to load country distribution data: {error}"}), 502


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
