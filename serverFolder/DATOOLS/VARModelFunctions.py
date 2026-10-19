
# from DATOOLS.CorrectaEspecificacion.tools.ARIMA import movingAvrgGraph
# import numpy as np
# from InvestmentFinanceAPI import closingValuesArray
# from arch import arch_model

# def ARCHTest(name, startDate,endDate):
#         fetchResults = closingValuesArray(name,startDate,endDate)
#         iV = fetchResults['datos']
#         timeSeries[exog_vars] = fetchResults.drop('datos',axis=1)
#         resid = movingAvrgGraph(fetchResults,'datos','dates')
#         resid2 = resid**2
#         resid2 = resid2.dropna()
#         model = arch_model(resid2,timeSeries[exog_vars],'Constant',2,'ARCH')
#         model_fit = model.fit()
#         print(model_fit.summary())
        
# ARCHTest('X:BTCUSD','2022-05-02','2024-05-02')
import pandas as pd
from pmdarima import auto_arima
import matplotlib.pyplot as plt
from scipy.stats import shapiro,kurtosis
import statsmodels.api as sm
from sklearn.metrics import mean_squared_error
import numpy as np
from statsmodels.tsa.stattools import adfuller
from statsmodels.stats.diagnostic import het_breuschpagan, het_white
import seaborn as sns
from statsmodels.tsa.api import VAR
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.stats.stattools import durbin_watson, jarque_bera
from scipy.stats import skew

# Load the data


"""" FUCNTIONS"""

def calculate_basic_statistics(data):
    mean = np.mean(data)
    median = np.median(data)
    std_deviation = np.std(data)
    variance = np.var(data)
    skewness = skew(data)
    kurt = kurtosis(data)
    jarque = jarque_bera(data)
    sum_data = np.sum(data)
    sum_sq_deviation = np.sum((data - mean)**2)
    observations = len(data)
    
    # Create a dictionary containing the calculated statistics
    statistics = {
        "mean": mean,
        "median": median,
        "std_deviation": std_deviation,
        "variance": variance,
        "skewness": skewness,
        "kurtosis": kurt,
        "jarque_bera": jarque_bera,
        # "probability": p_value,
        "sum": sum_data,
        "sum_sq_deviation": sum_sq_deviation,
        "observations": observations
    }
    print(statistics)
    
    # Return the dictionary as JSON
   

# Function to perform ADF test
def adf_test(series, name, signif=0.05):
    dftest = adfuller(series.dropna(), autolag='AIC')
    adf = pd.Series(dftest[0:4], index=['Test Statistic', 'p-value', '#Lags Used', 'Number of Observations Used'])
    for key, value in dftest[4].items():
        adf['Critical Value (%s)' % key] = value
    # print(f'Augmented Dickey-Fuller Test on "{name}"')
    # print(adf)
    p = adf['p-value']
    # if p <= signif:
    #     print(f" => {name} is stationary")
    # else:
    #     print(f" => {name} is non-stationary")
    return p
"""# Split data into endogenous and exogenous variables"""
# exog_vars = ['igs', 'gnipc']


# timeSeries[exog_vars] = timeSeries[exog_vars]

"""# Check for stationarity and difference if needed"""
def stationarityCheck(timeSeries,columns):
    
    diffed_data = {}
    print(columns)
    for var in columns:
        p_value = adf_test(timeSeries[var], var)
        d = 0
        while p_value > 0.05:
            d += 1
            timeSeries[var] = timeSeries[var].diff().dropna()
            p_value = adf_test(timeSeries[var], var + f' diff({d})')
        diffed_data[var] = d
    maxDiffLevel = 0
    for element in diffed_data:
        if diffed_data[element] > maxDiffLevel:
            maxDiffLevel = diffed_data[element]

# timeSeries = timeSeries.diff(maxDiffLevel)
def ObtainingBasicStatistics(columns,timeSeries):
    for c in columns:
        basicStatis = calculate_basic_statistics(timeSeries[c])
        print(basicStatis)
def PlotACFandPACF(diffed_data):
        for var in diffed_data.keys():
            series, d = diffed_data[var]
            fig, axes = plt.subplots(1, 2, figsize=(16, 4))
            fig.suptitle(f'ACF and PACF for {var} (d={d})')
            plot_acf(series.dropna(), ax=axes[0])
            plot_pacf(series.dropna(), ax=axes[1])
            plt.show()
def PrintDiffedData(diffed_data):
    for var in diffed_data.keys():
        series, d = diffed_data[var]
        fig, axes = plt.subplots(1, 2, figsize=(16, 4))
        fig.suptitle(f'ACF and PACF for {var} (d={d})')
        plot_acf(series.dropna(), ax=axes[0])
        plot_pacf(series.dropna(), ax=axes[1])
        plt.show()
               
def Handlemissingvaluesinexogenousvariables(timeSeries,y,exog_vars):
    exog = timeSeries[exog_vars].dropna()
    endog = timeSeries[y].dropna()
    print(endog,exog)
    return endog,exog
def FittheVARmodel(exog, endog):
    model = VAR(endog,exog)
    results = model.fit(maxlags=2, ic='aic')
    return results

# # Display the results summary

def Forecastfuturevalues(results,exog_vars,timeSeries,y):
    lag_order = results.k_ar
    forecast_input = timeSeries[y][-lag_order:]
    exog_forecast = timeSeries[exog_vars][-lag_order:]
    forecast = results.forecast(y=forecast_input, steps=10, exog_future=exog_forecast)

def ConvertforecasttoaDataFrame(forecast,timeSeries,y):
    forecast_df = pd.DataFrame(forecast, index=pd.date_range(start=timeSeries[y].index[-1], periods=10, freq='Q'), columns=timeSeries[y].columns)
    forecast_df = pd.DataFrame(forecast, index=pd.date_range(start=timeSeries[y].index[-1], periods=10, freq='Q'), columns=timeSeries[y].columns)

def PlotTheForecast(forecast_df,timeSeries,y):
    plt.figure(figsize=(10, 5))
    for var in timeSeries[y].columns:
        plt.plot(forecast_df.index, forecast_df[var], label=f'Forecast {var}')
        plt.plot(timeSeries[y].index, timeSeries[y][var], label=f'Actual {var}')
    plt.legend()
    plt.show()

def CalculateRMSE(forecast_df,timeSeries,y):
    for var in timeSeries[y].columns:
        mse = mean_squared_error(timeSeries[y][var][-10:], forecast_df[var][:10])
        rmse = np.sqrt(mse)
        print(f'RMSE for {var}: {rmse}')

## Perform  diagnostic  checks
def DurbinWatsonStatistic(results):
    dw = durbin_watson(results.resid)
    print(f'Durbin-Watson statistic: {dw}')

def BreuschPaganTestForHeteroscedasticity(results,exog_vars,timeSeries,y):
    bp_test = het_breuschpagan(results.resid, timeSeries[exog_vars])
    print(f'Breusch-Pagan test: {bp_test}')

def JarqueBeraTestForNormality(results):
    jb_test = jarque_bera(results.resid)
    print(f'Jarque-Bera test: {jb_test}')

def PlotHistogramAndQ_QPlotOfResiduals(results,timeSeries,y):
    for var in timeSeries[y].columns:
        sns.histplot(results.resid[var], kde=True)
        plt.title(f'Histogram of Residuals for {var}')
        plt.show()

        sm.qqplot(results.resid[var], line='s')
        plt.title(f'Q-Q Plot of Residuals for {var}')
        plt.show()

