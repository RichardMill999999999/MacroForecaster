import pandas as pd
import statsmodels.api as sm
import numpy as np
from scipy.stats import skew, kurtosis, jarque_bera
import matplotlib.pyplot as plt
import tools
from pmdarima import auto_arima
from scipy.stats import shapiro


def linearRegressionSummary(timeSeries,Y,x):

    y = timeSeries[Y]
    X = sm.add_constant(timeSeries[x])
    data = pd.concat([X, y], axis=1)

    # Fit the OLS model
    model = sm.OLS(data[Y], data[['const', x] + Y])
    result = model.fit()

    # Print the summary
    print('resid: ')
    print(result.resid)
    print(result.summary())
def calculate_statistics(data):
    mean = np.mean(data) 
    data = np.where(np.isnan(data), mean, data)
    median = np.median(data)
    maximum = np.max(data)
    minimum = np.min(data)
    std_deviation = np.std(data)
    skewness = skew(data)
    kurt = kurtosis(data)
    jarque_bera_stat, jarque_bera_prob = jarque_bera(data)
    total_sum = np.sum(data)
    sqrts = []
    for num in data:
        sqrtnum = num**2
        sqrts.append(sqrtnum)
    sum_sqrt = np.sum(sqrts)
    
    return [mean, median, maximum, minimum, std_deviation, skewness, kurt, jarque_bera_stat, jarque_bera_prob, total_sum, sum_sqrt ]
def graph(data, title):
    plt.xlabel('Tiempo')
    plt.ylabel('valor')
    plt.title(title)
    plt.plot(data,label = title)
    plt.savefig(f'../outputFiles/{title}')
class Result:
    def __init__(self, value=None, stationarity="",heterocedasticidad = '',order ='',stability = ''):
        self.value = value
        self.stationarity = stationarity
        self.heterocedasticidad = heterocedasticidad
        self.order = order
        self.stability = stability
    def __str__(self):
        return f"Result(value={self.value}, description='{self.description}')"
    

def CorrectaEspecificacionVAR(timeSeries,variables):
    nlags = 10
    #we start by testing stationarity
    x=0
    for variable in variables:

        ADFResult = False
        while ADFResult == False:
         ADFResult = tools.stationalityTests.apply_augmented_dickey_fuller_test(timeSeries[variable])
    # DFResult = tools.stationalityTests.apply_dickey_fuller_test(timeSeries)
    # PPResult = tools.stationalityTests.apply_phillips_perron_test(timeSeries)
         if ADFResult == False:
            timeSeries[variable] = timeSeries[variable].diff()

            x += 1
    depVar = variables[0]
    indVars= variables[1:]
    # y = timeSeries[variables[0]]
    # X = timeSeries[indVars]
    # model = sm.OLS(y, X).fit()
    model = auto_arima(timeSeries, seasonal=False, trace=True)

    best_order = model.get_params()['order']
    try:
        # Aquí  el código para la prueba de heterocedasticidad
        breusch_pagan_result = tools.heterocedasticityTests.test_breusch_pagan(model.resid,model.model.exog)
        white_result = tools.heterocedasticityTests.test_white()
        white_pvalue = white_result[1]
        breusch_pagan_pvalue = breusch_pagan_result[1]
    except TypeError as e:
           white_pvalue = 'error'
           breusch_pagan_pvalue = 'error'
    except Exception as e:
           white_pvalue = 'error'
           breusch_pagan_pvalue = 'error'




    
    print('Testing for autocorrelation')
        # Compute autocorrelation matrix
    try:
        autocorr_matrix = np.array([timeSeries[depVar].autocorr(lag) for lag in range(len(timeSeries[depVar]))])
        autocorr_matrix = np.correlate(timeSeries[depVar], timeSeries[depVar], mode='full')[len(timeSeries[depVar])-1:]
        autocorr_matrix /= autocorr_matrix[0]

    except:
        autocorr_matrix = None  # or any other action you want to take in case of an error
        
    #CORRELATION MATRIX
    try:
        corrMatix = timeSeries.corr()
    except:
        corrMatix = None

    # Suponiendo que residuals son los residuos de tu modelo
    stat, p = shapiro(model.resid)
    print('Statistics=%.3f, p=%.3f' % (stat, p))
    alpha = 0.05
    if p > alpha:
        normalityInResid = True
    else : 
        normalityInResid = False


   

    print('Checking for cointegration')
    # Código para verificar la cointegración de las series de tiempo

    print('Checking for model stability')
    # Código para verificar la estabilidad del modelo VAR

    print('Analyzing impulse-response function')
    # Código para analizar la función de impulso-respuesta del modelo VAR

    print('Evaluating model prediction and validation')
    # Código para evaluar la capacidad predictiva y validar el modelo VAR

    print('Selecting optimal lag length')
    # Código para determinar el número óptimo de rezagos en el modelo VAR

    print('Considering exogenous variables specification')
    # Código para considerar la especificación de variables exógenas en el modelo VAR
def ModelAndPrediction(modelCorrectSpecifications):
    #we start by checking on stationality in all our time series

    print('') 