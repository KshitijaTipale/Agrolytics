from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
import sys

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Pointing to the models directory inside the server folder for Vercel deployment
MODEL_DIR = os.path.join(BASE_DIR, 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'sugarcane_yield_model.pkl')
COLUMNS_PATH = os.path.join(MODEL_DIR, 'model_columns.pkl')

# Load Model
model = None
model_columns = None

try:
    if os.path.exists(MODEL_PATH) and os.path.exists(COLUMNS_PATH):
        print(f"Loading model from {MODEL_PATH}")
        model = joblib.load(MODEL_PATH)
        model_columns = joblib.load(COLUMNS_PATH)
        print("Model loaded successfully.")
    else:
        print(f"Error: Model files not found at {MODEL_PATH} or {COLUMNS_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.json
        # Expected input keys should match what the model expects.
        # Based on previous app.py, the model expects a DataFrame with specific columns.
        
        # Construct DataFrame from input
        input_data = {
            'Taluka': data.get('Taluka'),
            'Season': data.get('Season'),
            'Cane_Variety': data.get('Cane_Variety'),
            'Soil_Type': data.get('Soil_Type'),
            'Irrigation_Method': data.get('Irrigation_Method'),
            'Latitude': data.get('Latitude'),
            'Longitude': data.get('Longitude'),
            'Area_Harvested_Ha': data.get('Area_Harvested_Ha', 1.0),
            'Avg_NDVI': data.get('Avg_NDVI'),
            'Avg_EVI': data.get('Avg_EVI'),
            'Avg_LST_Celsius': data.get('Avg_LST_Celsius'),
            'Avg_Max_Temp_Celsius': data.get('Avg_Max_Temp_Celsius'),
            'Avg_Min_Temp_Celsius': data.get('Avg_Min_Temp_Celsius'),
            'Avg_Humidity_Percent': data.get('Avg_Humidity_Percent'),
            'Solar_Radiation_kWh': data.get('Solar_Radiation_kWh'),
            'Accumulated_Rainfall_mm': data.get('Accumulated_Rainfall_mm')
        }

        # Validate required fields (basic check)
        if None in input_data.values():
             return jsonify({"error": "Missing input fields", "received": input_data}), 400

        input_df = pd.DataFrame([input_data])
        
        # Preprocessing (One-Hot Encoding)
        # We need to reproduce the exact dummy columns as training.
        # This is done by get_dummies and then reindexing with model_columns.
        categorical_cols = ['Taluka', 'Season', 'Cane_Variety', 'Soil_Type', 'Irrigation_Method']
        input_df_encoded = pd.get_dummies(input_df, columns=categorical_cols)
        
        # Reindex to match model columns, filling missing with 0
        input_df_final = input_df_encoded.reindex(columns=model_columns, fill_value=0)
        
        prediction = float(model.predict(input_df_final)[0])
        
        return jsonify({
            "predicted_yield": prediction,
            "units": "Tonnes/Ha"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
