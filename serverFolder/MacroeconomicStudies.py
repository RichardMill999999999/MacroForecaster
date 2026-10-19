import matplotlib.pyplot as plt
import json
import pandas as pd
import statsmodels.api as sm
import requests
from datetime import datetime



def listMacroeconomicIndicator():
    try:
        URL = f'https://api.worldbank.org/v2/es/indicator/?format=json'
 
        res = requests.get(URL)
        return res.json()
    except Exception as e:
        return str(e)
def listCategories():
    try:
        URL = f'https://api.worldbank.org/v2/es/topic/?format=json'
        res = requests.get(URL)
        return res.json()
    except Exception as e:
        return str(e)
def obtainCategoryListing(id):
    try:
        URL = f'https://api.worldbank.org/v2/es/topic/{id}/indicator?format=json&per_page=2000'
        res = requests.get(URL)
        return res.json()
    except Exception as e:
        return str(e)
def IndicatorData(indicator_id,CountryName):
    try:
        URL = f'https://api.worldbank.org/v2/country/{CountryName}/indicator/{indicator_id}?format=json&date=2011:2026'
        res = requests.get(URL)
        return res.json()
    except Exception as e:
        return str(e)
# # Run the async function in the event loop
# obtainCategoryListing(1)
