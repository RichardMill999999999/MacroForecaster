from statsmodels.tsa.stattools import adfuller
from arch.unitroot import PhillipsPerron
import pandas as pd
import matplotlib.pyplot as plt
import io
import numpy as np

def apply_dickey_fuller_test(series):
    result = adfuller(series, autolag='AIC')

    return result
def apply_augmented_dickey_fuller_test(series):
    result = adfuller(series, autolag='AIC')
    
    return result[0] < result[4]['5%']
def apply_phillips_perron_test(series):

    pp = PhillipsPerron(series)
    return {
        'test': 'Phillips-Perron Test',
        'test_statistic': pp.stat,
        'p_value': pp.pvalue,
        'critical_values': pp.critical_values
    }

def generateGraphs(columnsAre,dataOriginal, DataSet):
    graphs = {}
    for eachColumn in columnsAre:
        variable = DataSet[eachColumn].diff()[1:]

        plt.plot(dataOriginal['MES'][2:],variable)
        plt.xlabel('Tiempo')
        plt.ylabel('Espectro de covarianza')
        # Save the plot to a file-like object
        
        plt.title(f'Segundas diferencias{eachColumn}')
        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format='png')
        img_bytes.seek(0)
        graphs[eachColumn] = img_bytes
        plt.close()

    return graphs

# Assuming dataOriginal is your DataFrame

