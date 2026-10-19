import pandas as pd
from flask import jsonify
import numpy as np
from scipy.stats import skew, kurtosis, jarque_bera

def calculate_basic_statistics(data):
    if len(data) == 0:
        return jsonify({"error": "Input data is empty"})

    mean = np.mean(data)
    median = np.median(data)
    std_deviation = np.std(data)
    variance = np.var(data)
    skewness = skew(data)
    kurtosis_value = kurtosis(data)
    jb_stat, p_value = jarque_bera(data)
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
        "kurtosis": kurtosis_value,
        "jarque_bera": jb_stat,
        "probability": p_value,
        "sum": sum_data,
        "sum_sq_deviation": sum_sq_deviation,
        "observations": observations
    }

    return jsonify(statistics)

    
    # Return the dictionary as JSON
    return jsonify(statistics)
