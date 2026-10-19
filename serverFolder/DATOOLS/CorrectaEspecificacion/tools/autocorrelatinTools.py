import os
import numpy as np
from statsmodels.tsa.stattools import acf, pacf
import pandas as pd
from pmdarima import auto_arima
import matplotlib.pyplot as plt
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

import requests
#Autocorrelation Tests

def aucorrMatrix(timeSeries, nlags):
    correlation_matrix = np.corrcoef(timeSeries, rowvar=False)
    columns = timeSeries.columns
    df = pd.DataFrame(correlation_matrix, columns=columns, index=columns)
    return df

def aucorrParcial(timeSeries, nlags):
    pacf_vals = pacf(timeSeries, nlags=nlags)
    pacf_vals= pacf_vals.tolist()

    response = {
       'aucorrParcial':pacf_vals
    }
    return response
def aucorr(timeSeries, nlags):
    acf_vals = acf(timeSeries, nlags=nlags)
    acf_vals= acf_vals.tolist()

    response = {
       'aucorr': acf_vals
    }
    return response
def find_best_arima_order(data, seasonal=False):

    model = auto_arima(data, seasonal=seasonal, trace=True)
    best_order = model.get_params()['order']
    
    return best_order

def findStockByName(name):
    URL = f'https://api.polygon.io/v3/reference/tickers?search={name}&limit=10&apiKey={os.getenv("POLYGON_API_KEY", "")}'
    res = requests.get(URL)
    responseN1 = res.json()
    if responseN1['results'][0]['ticker']:
     return responseN1['results'][0]['ticker']

def stockGeneralInfo(name):
    URL = f'https://api.polygon.io/v3/reference/tickers?search={name}&limit=10&apiKey={os.getenv("POLYGON_API_KEY", "")}'
    res = requests.get(URL)
    responseN1 = res.json()
    if responseN1['results'][0]:
     return responseN1['results'][0]
def DailyClosingValuesByName(name,startDate,endDate):
    actualStock = findStockByName(name)

    URL = f'https://api.polygon.io/v2/aggs/ticker/{actualStock}/range/1/day/{startDate}/{endDate}?adjusted=true&sort=asc&apiKey={os.getenv("POLYGON_API_KEY", "")}'
    res = requests.get(URL)
    return  res.json() 
