import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error,r2_score
import json
import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import skew, kurtosis
from statsmodels.tsa.seasonal import seasonal_decompose
from flask import jsonify

import statsmodels.api as sm

def simpleRegression (dataFrame, target_variable, independent_variable):
    # Assume 'EUA' is the target variable (dependent variable)
    

    # Extract features (X) and target variable (y)
    X = dataFrame[[independent_variable]]
    y = dataFrame[[target_variable]]

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Create a linear regression model
    model = LinearRegression()

    # Fit the model to the training data
    model.fit(X_train, y_train)
    # trend = model.predict(X)
    # print(trend)
    # # Make predictions on the test set
    y_pred = model.predict(X_test)
    # plt.scatter(X, y, label='Original data')
    # plt.plot(X, trend, color='red', label='Linear trend')
    # plt.xlabel('Time')
    # plt.ylabel('Values')
    # plt.legend()
    slope = model.coef_[0]
    skewness = skew(y)
    kurt = kurtosis(y)

  
    if skewness < 0:
        skew_comment = "La distribución está sesgada hacia la izquierda."
    elif skewness > 0:
        skew_comment = "La distribución está sesgada hacia la derecha."
    else:
        skew_comment = "La distribución es simétrica."

    if kurt < 0:
        kurt_comment = "La distribución es platicúrtica (menos puntiaguda que la distribución normal)."
    elif kurt > 0:
        kurt_comment = "La distribución es leptocúrtica (más puntiaguda que la distribución normal)."
    else:
        kurt_comment = "La distribución tiene una forma similar a la distribución normal."


    # Evaluate the model
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # Extract coefficients and intercept
    coefficients = model.coef_
    intercept = model.intercept_
    return coefficients, intercept, skewness, slope, kurt, r2
def seasonalDecompose(dataFrame):
    result = seasonal_decompose(dataFrame, model='additive')

    # Visualizar las componentes
    result.plot()

def regressionMultipleVariables(df):
    # Select relevant columns
    columns_to_keep = ['ICC', 'VR', 'TDESEM', 'CETES', 'CAF', 'TIV']
    df = df[columns_to_keep]
    
    # Extract features (X) and target variable (y)
    X = df.drop('TIV', axis=1)
    y = df['TIV']
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Create a linear regression model
    model = LinearRegression()
    
    # Fit the model to the training data
    model.fit(X_train, y_train)
    
    # Make predictions on the test set
    y_pred = model.predict(X_test)
    
    # Evaluate the model
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    skewness = skew(y)
    kurt = kurtosis(y)
    mvr_variance = model.score(X, y)
    
    # Extract coefficients and intercept
    coefficients = model.coef_
    intercept = model.intercept_
    
    # Calculate residuals
    residuals = y_test - y_pred
    
    # Plot each column against 'TIV'
    # for column in df.columns.tolist():
    #     plt.plot(df[column], label=column)
  
    print(y_pred)
    print(y_test)
    # Return results as a dictionary object
    return residuals
def find_best_arima_order(data, seasonal=False):

    model = auto_arima(data, seasonal=seasonal, trace=True)
    best_order = model.get_params()['order']

    return best_order

def filters(df):
    # Filtro de Hodrick-Prescott (HP)
    hp_cycle, hp_trend = sm.tsa.filters.hpfilter(df[tv])

    # Filtro Baxter-King
    bk_result = sm.tsa.filters.bkfilter(df[tv])
    bk_cycle, bk_trend = bk_result[:2]  # Tomar solo los dos primeros valores del resultado
    return bk_cycle, bk_trend, hp_cycle, hp_trend
def manualB1B2coefficients(x, y):
    n_obs = len(y)
    xm = x.mean()
    ym = y.mean()
    
    numArr = []
    denArr = []
    for i in range(1, len(y)):
        numerator = (x[i] * y[i] - (n_obs * xm * ym))
        numArr.append(numerator)
        denominator = (x[i]**2 - n_obs * (xm**2))
        denArr.append(denominator)
    
    numerator_sum = sum(numArr)
    denominator_sum = sum(denArr)
    b1 = numerator_sum / denominator_sum
    return b1
def calculate_b2(b1, x, y):
    xm = x.mean()
    ym = y.mean()
    b2 = ym - b1 * xm
    return b2

def tsGraphs (y,tv):

    dif = pd.DataFrame()
    dif['y'] = y
    df_log = np.log(dif)
    df_diff = df_log.diff()

    # Calcular la tasa de crecimiento
    df_growth_rate = df_log.pct_change()

    fig, axes = plt.subplots(nrows=3, ncols=1, figsize=(12, 10))

  
    # Logaritmo
    df_log.plot(ax=axes[0])
    axes[0].set_title('Logaritmo')

    # Diferencia
    df_diff.plot(ax=axes[1])
    axes[1].set_title('Diferencia')

    # Tasa de crecimiento
    df_growth_rate.plot(ax=axes[2])
    axes[2].set_title('Tasa de Crecimiento')

    plt.tight_layout()
    plt.savefig(f'../outputFiles/tsGraphs/{tv}')


    if tv != 'year':
        print(tv)
        b1 = manualB1B2coefficients(df['year'],df[tv])
        b2 = calculate_b2(b1,df['year'],df[tv])
        print(b1,b2)
        tendency = []
        tsGraphs(df[tv],tv)
        for x in df[tv]:
            y = b2+b1*x
            tendency.append(y)
        # plt.plot(tendency,label = 'column')
        # plt.savefig(f'../outputFiles/tsGraphs/{tv}')
        # mean, median, std_deviation, variance, = calculate_basic_statistics(df[tv])
        # # mvr_coefficients, mvr_intercept, mvr_skewness, mvr_slope, mvr_kurt, mvr_variance,mvr_r2 = regressionMultipleVariables(df,tv)
        # # hp_cycle, hp_trend, bk_cycle,bk_trend = filters(df)
        # # print(f"HP Cycle: {hp_cycle}")
        # # print(f"HP Trend: {hp_trend}")
        # # print(f"BK Cycle: {bk_cycle}")
        # # print(f"BK Trend: {bk_trend}")
        # print("Mean:", mean)

        # print("Median:", median)

        # print("Standard Deviation:", std_deviation)

        # # print("Variance Multiple Variable Regression:", mvr_variance)
        # # print(f"Coefficients Multiple Variable Regression: {mvr_coefficients}")
        # # print(f"Intercept Multiple Variable Regression: {mvr_intercept}")
        # # print(f"Skewness Multiple Variable Regression: {mvr_skewness}")
        # # print(f"Slope Multiple Variable Regression: {mvr_slope}")
        # # print(f"Kurtosis Multiple Variable Regression: {mvr_kurt}")
        # # print(f"r2 Multiple Variable Regression: {mvr_r2}")
        # print("Variance Simple Regression vs Time:", variance)
        # print(f"Coefficients Simple Regression vs Time: {coefficients}")
        # print(f"Intercept Simple Regression vs Time: {intercept}")
        # print(f"Skewness Simple Regression vs Time: {skewness}")
        # print(f"Slope Simple Regression vs Time: {slope}")
        # print(f"Kurtosis Simple Regression vs Time: {kurt}")
        # print(f"r2 Simple Regression vs Time: {r2}")

