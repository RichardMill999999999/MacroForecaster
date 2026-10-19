import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
import matplotlib.pyplot as plt
import statsmodels.api as sm
import statsmodels.tsa as tsa
from statsmodels.stats.diagnostic import acorr_ljungbox, het_arch, het_white, het_breuschpagan
from pmdarima import auto_arima
from statsmodels.stats.outliers_influence import reset_ramsey
from statsmodels.tsa.stattools import pacf, adfuller
from arch.unitroot import PhillipsPerron

from arch.unitroot import ADF
from arch import arch_model
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
import numpy as np


def movingAvrgGraph(df,y,x):
    window_size = 3
    df['y'] = df[y].apply(lambda x: np.log(x))
    df['moving_avg'] = df['y'].rolling(window=window_size).mean()
    # Plotting
    df['residuals'] = df['y']-df['moving_avg']
    df['volatility'] = df['residuals'] * df['residuals']

    plt.figure(figsize=(10, 6))
    plt.plot(df[x], df['moving_avg'], label=f'Residuals')
    plt.legend()

    plt.xlabel('Date')
    plt.ylabel('Value')
    plt.title('Moving Average')
    plt.show()
    return  df['moving_avg']

def ARMAp(series,order =0):
    if (order == 0):
        model_arma = sm.tsa.ARIMA(series, order=(1, 0, 1))
        results_arma = model_arma.fit()

        # Print summary of the ARIMA model
        return results_arma
    else:
        model_arma = sm.tsa.ARIMA(series, order=order)
        results_arma = model_arma.fit()

        # Print summary of the ARIMA model
        
        return results_arma

    # # Calculate additional statistics
    # stats = calculate_model_statistics(results_arma, series['Fecha'], series['Cantidad'])
    # print(stats)
def find_best_arima_order(data, seasonal=False):

    model = auto_arima(data, seasonal=seasonal)
    best_order = model.get_params()['order']

    return best_order
def calculate_ljung_box(residuals, lags):
    result = acorr_ljungbox(residuals, lags=lags)
    return result
def parcentualVariation(series):
    variaciones = ((series - series.shift(1)) / series.shift(1)) * 100
    variaciones = variaciones.dropna()
    return variaciones.to_numpy()
def ARIMAX(y, exog, p, d, q):
        # Example data
    # y: Time series data
    # exog: Exogenous variables

    # Fit ARIMAX model
    model_arimax = sm.tsa.ARIMA(y, exog=exog, order=(p, d, q))  # p, d, q are the orders of AR, differencing, and MA terms
    results_arimax = model_arimax.fit()
    forecast_exog = exog[-10:]  
    forecast = results_arimax.get_forecast(steps=10,exog=forecast_exog)  # Adjust the number of steps as needed
    # Extract the forecasted value

    pacf_values = pacf(y, nlags=1)
    lb_test_stat, lb_p_value = acorr_ljungbox(results_arimax.resid, lags=1)
    print('ADFULLER TEST')
    result = adfuller(y)

    print(result)
    print('ultimos 5 datos')
    print('Prediccion del Modelo')
    print(forecast.predicted_mean.head())
    print('Autocorrelacion Parcial')
    print(pacf_values)
    print('Correcta Especificacion')
    print(lb_p_value, lb_test_stat)
    print(results_arimax.summary())

def ARIMAp(series,order=0):
    if(order == 0):
        best_order = find_best_arima_order(series, seasonal=False)

        # Summary of the model
        model = sm.tsa.ARIMA(series,trend='t', order=best_order)  # Specify your desired order (p, d, q)
        res = model.fit()
        correctSpecification(series,res,best_order)

        forecast = res.get_forecast(steps=3)  # Adjust the number of steps as needed
        print(series.tail())
        print(forecast.predicted_mean.head())
        print(res.summary())

        return res
    else:

        # Summary of the model
        model = sm.tsa.ARIMA(series,trend='t', order=order)  # Specify your desired order (p, d, q)
        res = model.fit()
        correctSpecification(series,res,order)

        forecast = res.get_forecast(steps=3)  # Adjust the number of steps as needed
        print(series.tail())
        print(forecast.predicted_mean.head())
        print(res.summary())
        return res
    # Append forecasted values to original data
  # Plot the original series

    # Print the forecasted value

def correctSpecification(series,res,order):
    scaledTS = series * 0.1
    am = arch_model(scaledTS)
    res = am.fit(disp='off')
    arch = [res.arch_lm_test(lags=i + 1) for i in range(4)]

    # Get the residuals
    residuals = res.resid
    r_squared = res.rsquared
    n = len(ts)
    k = len(order) + 1  # Assuming p, d, q parameters in order
    r_squared_adj = 1 - (1 - r_squared) * (n - 1) / (n - k - 1)

    # Perform the Breusch-Pagan test for heteroskedasticity
    # Fit a GARCH(1, 1) model
    returns = series.pct_change()
    returns.replace([float('-inf'), float('inf')], float('nan'), inplace=True)  # Replace infinite values with NaN
    returns.dropna(inplace=True)  # Drop NaN values
    returns.to_excel('output.xlsx',index=False)
    garch_model = arch_model(returns, vol='GARCH', p=1, q=1)
    garch_res = garch_model.fit(disp='off')

    # Perform the Ljung-Box test on the standardized residuals
    garch_test_stat = garch_res.arch_lm_test()

    # Print the test statistic
    # Prob(F-Statistic)
    p_value_f_stat = res.pvalues
    lm_statistics = calculate_ljung_box(residuals, lags=4)
    # Durbin-Watson
    dw_stat = sm.stats.stattools.durbin_watson(residuals)
    # Jarque-Bera
    jb_stat, jb_p_value, _, _ = sm.stats.stattools.jarque_bera(residuals)
    squared_resid = residuals**2
    cubed_resid = residuals**3

  
    white_nc = sm.stats.diagnostic.het_white(residuals, exog=sm.add_constant(series))[1]
    white_c = sm.stats.diagnostic.het_white(residuals,exog=sm.add_constant(series))[1]
    
    return {
        "R2": r_squared,
        "R2-A": r_squared_adj,
        "Prob(F-Statistic)": p_value_f_stat,
        "DW": dw_stat,
        "J-B": jb_stat,
        "LM": lm_statistics,
        "ARCH": arch,
        "WHITE(N.C.)": white_nc,
        "WHITE(C.)": white_c,
        "GARCH Test Statistic:": garch_test_stat   
         }

def BoxJenkins(series):
    # Check for stationarity and apply differencing if necessary
    adf_result = adfuller(series)
    print(adf_result)
    pp_result = PhillipsPerron(series)
    print("Estadístico de prueba:", pp_result)
    if adf_result[1] > 0.05:
        data_diff = series.diff().dropna()
    else:
        data_diff = series
    # Plot ACF and PACF to identify AR and MA terms
    # plot_acf(data_diff, lags=50)
    # plot_pacf(data_diff,lags=50)

    strings = [
    "rm(5,0,2)",  "irm(5,1,4)", "irm(5,1,40)"
    ]

# Create tuples with an empty string
    tuples = [(s, '') for s in strings]

#     # Fit the models and generate forecasts
    result0 = ARIMAp(series,(5,1,4))
   
#     # result5 = ARIMAX(series, order=(8, 0, 20))
#     # result6 = ARIMAX(series, order=(1,1,1))
    allResults = [result0]
    for index, res in enumerate(allResults):
        forecast = res.get_forecast(steps=30).predicted_mean
        print(f'done {tuples[index][0]}')
        tuples[index] = (tuples[index][0], forecast)
        forecasts[tuples[index][0]] = forecast
      
    # Store the forecasts in variables


    # forecast_df = pd.DataFrame(tuples, columns=["Model", "Forecast"])

    # forecast_df.to_excel('../outputFiles/forecastCovidVeracruz.xlsx')
    # print('done')

def ResidsMovingAvrg(df,y,x):
        
        window_size = 3
      
     
        return   df[y].rolling(window=window_size).mean()

