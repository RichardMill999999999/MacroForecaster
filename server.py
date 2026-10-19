from flask import Flask, jsonify,request
from flask_cors import CORS
import pandas as pd
from pmdarima import auto_arima
import numpy as np
from flask import jsonify
from pymongo import MongoClient
import os
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app, resources={r"/history/*": {"origins": "*"}}, methods=["POST"])

app = Flask(__name__)

# Replace with your MongoDB connection string
mongo_uri = "mongodb+srv://rickbmb9:Barcena10.@shakersmx.ytfcvgp.mongodb.net/?retryWrites=true&w=majority&appName=shakersmx"

# Connect to MongoDB Atlas
client = MongoClient(mongo_uri)
db = client.get_database('TimeSeriesHistory')  
collection = db['Historical Data']  


@app.route('/history/saveData')
def saveData():
    
    data = request.get_json()

    result = collection.insert_one(data)
    
if __name__ == '__main__':
    app.run(port=5000)
