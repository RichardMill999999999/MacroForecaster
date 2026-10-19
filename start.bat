# Setup (5 minutes)

1. **Copy everything in this folder into your project root**, the folder that already contains
   `serverFolder/` and `websocketFinnhub.py`. Rename your old `app.py` to `app_old.py` first, then let this one replace it.
   (`news_fetcher.py` is no longer used.)
2. **.env is a hidden file.** On Mac press Cmd+Shift+. in Finder to see it. If you already have a `.env`,
   copy your `OPENAI_API_KEY2=` (DeepSeek) line into the new one.
3. Fill in the blank keys in `.env`:
   - `OPENAI_API_KEY2`: your DeepSeek key
   - `NEWSDATA_API_KEY`: https://newsdata.io/search-dashboard
   - `INEGI_TOKEN`, `BANXICO_TOKEN`: optional, only for Mexico series
4. Run `start.bat` (Windows) or `./start.sh` (Mac/Linux). It creates a virtualenv, installs requirements and starts the server on http://127.0.0.1:5000

# Check it works

- http://127.0.0.1:5000/health          which integrations are configured
- http://127.0.0.1:5000/news/regions
- http://127.0.0.1:5000/news/china      SCMP etc.  (read the "errors" list for dead feeds)
- http://127.0.0.1:5000/news/all?regions=us,europe,india,russia&q=inflation
- http://127.0.0.1:5000/macro/USA/inflation
- http://127.0.0.1:5000/macro/compare/inflation?countries=USA,MEX,EA,CHN&prefer=imf
- http://127.0.0.1:5000/macro/changes
- http://127.0.0.1:5000/macro/outlook/IND/gdp_growth

# Layout
- `app.py`         all your original routes + the two new blueprints
- `newsfeeds/`     news: one fetch_<region>() per region, fetch_newsdata(), fetch_all_news()
- `macrodata/`     economic data per country: get_indicator(), compare(), detect_changes(), outlook()
