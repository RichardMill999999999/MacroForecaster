from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
import json
import InvestmentFinanceAPI from serverFolder
app = Flask(__name__)

# Mocked or imported API wrapper based on your snippet
# from your_module import InvestmentFinanceAPI

@app.route('/getData/<searchValue>/<startDate>/<endDate>', methods=['GET'])
def getData(searchValue, startDate, endDate):
    try:
        # Fetch data from your existing API wrapper
        closingValues = InvestmentFinanceAPI.DailyClosingValuesByName(searchValue, startDate, endDate)
        
        datos = []
        dates = []
        
        for res in closingValues.get('results', []):
            datos.append(res['c'])
            # Fixed the double append from your snippet: Convert to clean string date
            formatted_date = pd.Timestamp(res["t"], unit='ms').strftime('%Y/%m/%d')
            dates.append(formatted_date)
        
        # --- Volatility Clustering & Short-Term Variance Calculus ---
        df = pd.DataFrame({'close': datos})
        
        # Calculate log returns to accurately isolate clustering shocks
        df['returns'] = np.log(df['close'] / df['close'].shift(1))
        
        # Calculate a short-term 5-period rolling standard deviation
        df['rolling_vol'] = df['returns'].rolling(window=5).std()
        
        # Extract latest values for our starting point matrix calculations
        latest_price = datos[-1] if datos else 0
        
        # Handle cases where there isn't enough data for rolling metrics
        latest_vol = df['rolling_vol'].iloc[-1] if len(df) >= 5 else 0.01 
        if np.isnan(latest_vol): 
            latest_vol = 0.01
            
        # Standard deviation in nominal currency units for the grid steps
        variance_step = latest_price * latest_vol

        return jsonify({
            "ticker": searchValue,
            "latestPrice": latest_price,
            "calculatedVarianceStep": variance_step,
            "historicalPrices": datos,
            "historicalDates": dates,
            "rawAPIResult": closingValues
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/getOptions/<searchValue>', methods=['GET'])
def getOptions(searchValue):
    try:
        # Check if option chains exist for this ticker in your database/wrapper
        # options_data = InvestmentFinanceAPI.GetOptionsChain(searchValue)
        
        # Mocking logic structure to verify availability
        has_options = True if searchValue.upper() in ["GLD", "GOLD", "SPY", "AAPL"] else False
        
        if not has_options:
            return jsonify({"available": False, "options": []})
            
        # Example schema match for your 4310 and 4420 nodes
        mock_options = [
            {"strike": 4310, "type": "Call", "premium": 145.20},
            {"strike": 4310, "type": "Put", "premium": 12.50},
            {"strike": 4420, "type": "Call", "premium": 42.10},
            {"strike": 4420, "type": "Put", "premium": 88.40}
        ]
        
        return jsonify({"available": True, "options": mock_options})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)