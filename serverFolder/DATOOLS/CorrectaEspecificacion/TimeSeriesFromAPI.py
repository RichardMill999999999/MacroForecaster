import os
from DATOOLS.CorrectaEspecificacion.tools.stationalityTests import apply_augmented_dickey_fuller_test,apply_dickey_fuller_test,generateGraphs
from DATOOLS.CorrectaEspecificacion.tools.autocorrelatinTools import aucorrParcial,aucorr,acf,find_best_arima_order
from DATOOLS.CorrectaEspecificacion.tools.graphing import saveGraph,plotGraph
import matplotlib.pyplot as plt
import json
import pandas as pd
from statsmodels.tsa.api import VAR
import statsmodels.api as sm
from statsmodels.tsa.stattools import grangercausalitytests
from statsmodels.tsa.vector_ar.vecm import coint_johansen
from pmdarima import auto_arima
import pandas as pd
import requests
from datetime import datetime
import serverFolder.DATOOLS.VARModelFunctions as VARModelFunctions
class FinalResults:
    def __init__(self):
        self.autocorrelationResults = []
        self.stationarityResults = []
        self.cointegrationResults = []   
    def add_autocorrelation_result(self, column_name, result):
        self.autocorrelationResults.append((column_name, result))
    def add_stationarity_result(self,result):
        self.stationarityResults = result
    def add_cointegration_result(self, column_name, result):
        self.cointegrationResults.append((column_name, result))
        # Add more methods to add results for other categories
    def to_json(self):
        return {
            "autocorrelationResults": self.autocorrelationResults,
            "stationarityResults": self.stationarityResults,
            "cointegrationResults": self.cointegrationResults,
            # Add more result categories as needed
        }
FinalResult = FinalResults()
records = []
def findStockByName(name):
    URL = f'https://api.polygon.io/v3/reference/tickers?search={name}&limit=10&apiKey={os.getenv("POLYGON_API_KEY", "")}'
    res = requests.get(URL)
    responseN1 = res.json()
    return responseN1['results'][0]['ticker']

def stockGeneralInfo(name):
    URL = f'https://api.polygon.io/v3/reference/tickers?search={name}&limit=10&apiKey={os.getenv("POLYGON_API_KEY", "")}'
    res = requests.get(URL)
    responseN1 = res.json()
    if responseN1['results'][0]:
     return responseN1['results'][0]

def DailyClosingValuesByName(name,startDate,endDate):
   

    URL = f'https://api.polygon.io/v2/aggs/ticker/{name}/range/1/day/{startDate}/{endDate}?adjusted=true&sort=asc&apiKey={os.getenv("POLYGON_API_KEY", "")}'
    res = requests.get(URL)
    # results = res.json()
    # actualRes = []
    # for result in results['results']:
    #     actualRes.append(result['c'])
    return  res.json()   
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
def testAutoCorrelation(serie):
    bestOrder = find_best_arima_order(serie, seasonal=False)
    
    acp = aucorrParcial(serie, bestOrder[2])
    auc = aucorr(serie, bestOrder[2])
    acft = acf(serie, False, bestOrder[2])

    conditions = [acp[-1] < 1, auc[-1] < 1, acft[-1] < 1]
    true_count = sum(conditions)

    return true_count >= 2,bestOrder[2]
def recursiveDifferentiationTest(dataFrame):
    diffLevel = 0
    columnList = dataFrame.columns.to_list()
   
    print('times', diffLevel)  # Assume no further differencing needed until proven otherwise
    for columnName in columnList:
        stationarityResult = apply_augmented_dickey_fuller_test(dataFrame[columnName])
        
        if stationarityResult:
            print(stationarityResult)
            diffLevel =+ 1
            FDNeeded = True  # Set to True to indicate further differencing is needed
            print('breaking')
            break
    while FDNeeded == True:
         for columnName in columnList:
            print(columnName)
            dataFrame[columnName] = dataFrame[columnName].diff()
            dataFrame[columnName] = dataFrame[columnName].dropna()

            print(dataFrame[columnName])
            tempVar = dataFrame[columnName]
            tempVar = tempVar.dropna()
            stationarityResult = apply_augmented_dickey_fuller_test(tempVar)
            print(stationarityResult)
            if stationarityResult:
                diffLevel =+ 1
                FDNeeded = True 
                break
            else:
                FDNeeded == False
                return diffLevel  
def TSACompleteAnalysis(dataFrame):
    diffLevel = recursiveDifferentiationTest(dataFrame)
    boolACF,lagsNumber = testAutoCorrelation(dataFrame)
    print('diffLevel', diffLevel)
    print('bool', boolACF)
    print('lagsNumber',lagsNumber)
def findTickers(searchValue):
        
        URL = f'https://api.polygon.io/v3/reference/tickers?search={searchValue}&active=true&limit=100&apiKey={os.getenv("POLYGON_API_KEY", "")}'
 
        res = requests.get(URL)
        return res.json()
def getTickersByTypes(searchValue,marketType):
    URL = f'https://api.polygon.io/v3/reference/tickers?market={marketType}&search={searchValue}&active=true&limit=100&apiKey={os.getenv("POLYGON_API_KEY", "")}'

    res = requests.get(URL)
    return res.json()
# NVIDIA = DailyClosingValuesByName('NVDA','2023-05-30','2024-05-27')
# forecastVariable = 'NVDA'
# forecastVariables = ['','']
# explanatoryVariables = ['','']
# sdate = ''
# edate = ''

# # df.to_excel('output.xlsx', index=False)

# for each in forecastVariables:
#     if(each != ''):
#         tempVarHold = DailyClosingValuesByName(each,sdate,edate)
#         variableValues = pd.json_normalize(tempVarHold['results'])
#     else:
#         tempVarHold = DailyClosingValuesByName(forecastVariable,sdate,edate)
#         variableValues = pd.json_normalize(tempVarHold['results'])
