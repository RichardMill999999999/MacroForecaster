import os
from statsmodels.stats.diagnostic import het_white,het_goldfeldquandt,het_breuschpagan
import pandas as pd
import statsmodels.api as sm
import numpy as np
import requests
from pmdarima import auto_arima

import matplotlib.pyplot as plt
def closingValuesArray(name,startDate,endDate):

        URL = f'https://api.polygon.io/v2/aggs/ticker/{name}/range/1/day/{startDate}/{endDate}?adjusted=true&sort=asc&apiKey={os.getenv("POLYGON_API_KEY", "")}'
        resp = requests.get(URL)
        resp = resp.json()   
        datos = []
        dates = []
        for res in resp['results']:
            datos.append(res['c'])
            dates.append(res['t'])
            
        response = {'dates': dates, 'datos': datos}
        df = pd.DataFrame(response)
        return df
def test_white(residuals,X):
  
        return het_white(residuals, X)
 
def test_breusch_pagan(residuals,X):
    _, p_value, _, _ = het_breuschpagan(residuals, X)
    return p_value
def test_goldfeld_quandt(residuals,X):
    _, p_value, _ = het_goldfeldquandt(residuals, X)
    return p_value


