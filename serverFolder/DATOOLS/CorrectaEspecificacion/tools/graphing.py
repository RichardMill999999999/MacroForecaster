import os

import matplotlib.pyplot as plt
import requests

def saveGraph(name,startDate,endDate):
    
    
    URL = f'https://api.polygon.io/v2/aggs/ticker/{name}/range/1/day/{startDate}/{endDate}?adjusted=true&sort=asc&apiKey={os.getenv("POLYGON_API_KEY", "")}'
    res = requests.get(URL)
    resObject = res.json()
    Values = resObject['results']
    closingValues = []
    for value in Values:
        closingValues.append(value['o'])
    plt.plot(closingValues)
    plt.xlabel('Tiempo')
    plt.ylabel(f'Value')
    plt.title(f'Closing Price of {name} from {startDate} to {endDate}')
    plt.savefig(f'../../../src_template/src/variable/assets/images/{name}')
def plotGraph(series,timeSeries,title, ylabel, xlabel,name):
     # Plotting the daily variance
    plt.plot(timeSeries,series)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.title(title)
    plt.plot()
