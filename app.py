# ============================================================
#  Secrets. NEVER commit this file or share it (see .gitignore)
# ============================================================

# --- MongoDB Atlas -------------------------------------------
MONGO_URI=mongodb+srv://rickbmb9:Barcena10@economicstudies.39nbren.mongodb.net/

# --- FRED (US macro data) ------------------------------------
FRED_API_KEY=e5c45f7970a9918ee75db382c485a519

# --- Alpaca market data (PK... keys are paper-trading keys) --
ALPACA_API_KEY=PKKNW5C2VDEH2QQKKD422IDNEY
ALPACA_SECRET_KEY=4bjRRFRcCUG74CzySmtzF92XTxJigD9qgKX7XsEuA3Ki

# --- New York Times -------------------------------------------
NYTKEY=2MIexNmiT62CJNu1me6tW6hyGWmAeAUglkTQMQZJpG6IhvAw
NYT_SECRET=drICvYHTzMorgUdXQETMUexYQ8ZaYFVGON4ikyOUg8Z9ngEugdG3a2n7hYaIcJdO
NYT_APP_ID=47c3a712-7922-41c9-bd5a-536b5b4c4ac7

# --- FILL THESE IN (not in the code you sent me) --------------
# DeepSeek key used by /ai-analyze-article and /ai-forecast-commentary
# (if you already have this line in your old .env, paste it here)
OPENAI_API_KEY2=
# https://newsdata.io/search-dashboard  -> your API key
NEWSDATA_API_KEY=
# Optional, only needed for Mexico series:
#   INEGI token: https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/
#   Banxico token: https://www.banxico.org.mx/SieAPIRest/service/v1/token
INEGI_TOKEN=
BANXICO_TOKEN=

# --- App settings ---------------------------------------------
# Comma-separated list of frontend origins allowed by CORS
CORS_ORIGIN=http://localhost:8000
# Alpaca trading API (only used by /alpaca/assets). Paper keys -> paper URL
ALPACA_TRADING_URL=https://paper-api.alpaca.markets
