from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import os
import xgboost
import pandas as pd

app = Flask(__name__)
CORS(app)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
YIELD_MODEL_PATH = os.path.join(MODEL_DIR, 'sugarcane_yield_model.pkl')
YIELD_COLUMNS_PATH = os.path.join(MODEL_DIR, 'model_columns.json')
HARVEST_MODEL_PATH = os.path.join(MODEL_DIR, 'harvest_duration_model.pkl')
HARVEST_COLUMNS_PATH = os.path.join(MODEL_DIR, 'harvest_model_columns.json')
PRICE_MODEL_PATH = os.path.join(MODEL_DIR, 'best_price_model.pkl')

# Load Yield Model
yield_model = None
yield_model_columns = None
try:
    if os.path.exists(YIELD_MODEL_PATH) and os.path.exists(YIELD_COLUMNS_PATH):
        print(f"Loading yield model from {YIELD_MODEL_PATH}")
        yield_model = joblib.load(YIELD_MODEL_PATH)
        with open(YIELD_COLUMNS_PATH, 'r') as f:
            yield_model_columns = json.load(f)
        print("Yield Model loaded successfully.")
except Exception as e:
    print(f"Error loading yield model: {e}")

# Load Harvest Model
harvest_model = None
harvest_model_columns = None
try:
    if os.path.exists(HARVEST_MODEL_PATH) and os.path.exists(HARVEST_COLUMNS_PATH):
        print(f"Loading harvest model from {HARVEST_MODEL_PATH}")
        harvest_model = joblib.load(HARVEST_MODEL_PATH)
        with open(HARVEST_COLUMNS_PATH, 'r') as f:
            harvest_model_columns = json.load(f)
        print("Harvest Model loaded successfully.")
except Exception as e:
    print(f"Error loading harvest model: {e}")

# Load Price Model
price_model = None
try:
    if os.path.exists(PRICE_MODEL_PATH):
        print(f"Loading price model from {PRICE_MODEL_PATH}")
        price_model = joblib.load(PRICE_MODEL_PATH)
        print("Price Model loaded successfully.")
except Exception as e:
    print(f"Error loading price model: {e}")

def prepare_input_vector(input_data, columns):
    vector = [0] * len(columns)
    col_dict = {col: i for i, col in enumerate(columns)}
    
    numerical_cols = [
        'Latitude', 'Longitude', 'Area_Harvested_Ha', 'Avg_NDVI', 'Avg_EVI',
        'Avg_LST_Celsius', 'Avg_Max_Temp_Celsius', 'Avg_Min_Temp_Celsius',
        'Avg_Humidity_Percent', 'Solar_Radiation_kWh', 'Accumulated_Rainfall_mm'
    ]
    
    for col in numerical_cols:
        if col in col_dict and col in input_data:
            try:
                vector[col_dict[col]] = float(input_data.get(col, 0))
            except:
                pass

    categorical_map = {
        'Taluka': 'Taluka',
        'Season': 'Season',
        'Cane_Variety': 'Cane_Variety',
        'Soil_Type': 'Soil_Type',
        'Irrigation_Method': 'Irrigation_Method'
    }
    
    for field, prefix in categorical_map.items():
        val = input_data.get(field)
        if val:
            dummy_col = f"{prefix}_{val}"
            if dummy_col in col_dict:
                vector[col_dict[dummy_col]] = 1
                
    return [vector]

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "yield_model_loaded": yield_model is not None,
        "harvest_model_loaded": harvest_model is not None,
        "price_model_loaded": price_model is not None,
        "xgboost_version": xgboost.__version__
    })

@app.route('/predict', methods=['POST'])
def predict_yield():
    if not yield_model:
        return jsonify({"error": "Yield Model not loaded"}), 500
    try:
        data = request.json
        input_vector = prepare_input_vector(data, yield_model_columns)
        prediction = float(yield_model.predict(input_vector)[0])
        return jsonify({"predicted_yield": prediction, "units": "Tonnes/Ha"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict-harvest', methods=['POST'])
def predict_harvest():
    if not harvest_model:
        return jsonify({"error": "Harvest Model not loaded"}), 500
    try:
        data = request.json
        input_vector = prepare_input_vector(data, harvest_model_columns)
        prediction = float(harvest_model.predict(input_vector)[0])
        return jsonify({"predicted_harvest_days": round(prediction)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict-price', methods=['POST'])
def predict_price():
    if not price_model:
        return jsonify({"error": "Price Model not loaded"}), 500
    try:
        data = request.json
        df = pd.DataFrame([data])
        
        drop_cols = ['Target', 'Price_Per_Ton', 'Total_Revenue_INR', 'Yield_Tonnes_Ha', 
                     'District', 'Village_Cluster', 'Latitude', 'Longitude', 
                     'Planting_Date', 'Harvest_Date', 'Area_Harvested_Ha']
        for col in drop_cols:
            if col in df.columns:
                df = df.drop(columns=[col])
                
        prediction = float(price_model.predict(df)[0])
        return jsonify({"predicted_price_per_ton": round(prediction, 2)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
