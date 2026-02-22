import joblib
import json
import os
from flask import request, jsonify

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'server', 'models')
YIELD_MODEL_PATH = os.path.join(MODEL_DIR, 'sugarcane_yield_model.pkl')
YIELD_COLUMNS_PATH = os.path.join(MODEL_DIR, 'model_columns.json')
HARVEST_MODEL_PATH = os.path.join(MODEL_DIR, 'harvest_duration_model.pkl')
HARVEST_COLUMNS_PATH = os.path.join(MODEL_DIR, 'harvest_model_columns.json')

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

def prepare_input_vector(input_data, columns):
    """
    Manually construct the feature vector (One-Hot Encoding).
    """
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

def handler(request):
    """Routing handler for multiple predict endpoints"""
    
    if request.method == 'OPTIONS':
        return '', 204
    
    path = request.path if hasattr(request, 'path') else request.environ.get('PATH_INFO', '')
    
    # 1. Yield Prediction
    if 'predict-harvest' not in path:
        if not yield_model or not yield_model_columns:
            return jsonify({"error": "Yield Model not loaded"}), 500
        try:
            data = request.json
            input_vector = prepare_input_vector(data, yield_model_columns)
            prediction = float(yield_model.predict(input_vector)[0])
            return jsonify({"predicted_yield": prediction, "units": "Tonnes/Ha"})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    # 2. Harvest Duration Prediction
    else:
        if not harvest_model or not harvest_model_columns:
            return jsonify({"error": "Harvest Model not loaded"}), 500
        try:
            data = request.json
            input_vector = prepare_input_vector(data, harvest_model_columns)
            prediction = float(harvest_model.predict(input_vector)[0])
            return jsonify({"predicted_harvest_days": round(prediction)})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

