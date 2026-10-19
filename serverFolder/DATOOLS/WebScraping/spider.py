import requests
from bs4 import BeautifulSoup
import pandas as pd
import openmeteo_requests
import requests_cache
from retry_requests import retry

# def scrape_weather_data(base_url):
#     months = ["2020-" + str(month) for month in range(1, 13)] + [str(year) + "-" + str(month).zfill(2) for year in range(2021, 2024) for month in range(1, 7)]
#     daily_temperatures_veracruz = []
#     # for month in months:
#     url = base_url + '2020-4'
#     print(url)
#     response = requests.get(url)
#     soup = BeautifulSoup(response.content, "html.parser")
#     tables = soup.find_all("", class_='observation-title')
#     print(soup.attrs) 
#     print(soup)
#     #     for table in tables:
#     #         trs = table.find_all("tr")
#     #         for tr in trs[1:]:
#     #             tds = tr.find_all("td")
#     #             date = month + "-" + tds[0].get_text()
#     #             temperature = tds[1].get_text()
#     #             daily_temperatures_veracruz.append({"date": date, "temperature": temperature})
#     # data = pd.DataFrame({'temperaturas': daily_temperatures_veracruz})

#     # return data
# response = scrape_weather_data("https://www.wunderground.com/history/monthly/mx/veracruz/MMVR/date/")
# # response.to_excel('../outputFiles/temps.xlsx')
# print(response)

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": 19.1809,
	"longitude": -96.1429,
	"daily": "temperature_2m_min",
	"start_date": "2020-02-26",
	"end_date": "2023-06-31"
}
responses = openmeteo.weather_api(url, params=params)
print(responses[0])
# Process first location. Add a for-loop for multiple locations or weather models
# response = responses[0]


# # Process daily data. The order of variables needs to be the same as requested.
# daily = response.Daily()
# daily_temperature_2m_min = daily.Variables(0)
# print(daily_temperature_2m_min)
# daily_data = {"date": pd.date_range(
# 	start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
# 	end = pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
# 	freq = pd.Timedelta(seconds = daily.Interval()),
# 	inclusive = "left"
# )}
# daily_data["temperature_2m_min"] = daily_temperature_2m_min

# daily_dataframe = pd.DataFrame(data = daily_data)
