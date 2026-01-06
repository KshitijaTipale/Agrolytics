from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import os
import pandas as pd
import xgboost
from sklearn.preprocessing import OneHotEncoder

app = Flask(__name__)
CORS(app)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'sugarcane_yield_model.pkl')
COLUMNS_JSON_PATH = os.path.join(MODEL_DIR, 'model_columns.json')

# Load Model
model = None
model_columns = None

try:
    if os.path.exists(MODEL_PATH) and os.path.exists(COLUMNS_JSON_PATH):
        print(f"Loading model from {MODEL_PATH}")
        model = joblib.load(MODEL_PATH)
        
        with open(COLUMNS_JSON_PATH, 'r') as f:
            model_columns = json.load(f)
            
        print("Model and columns loaded successfully.")
    else:
        print(f"Error: Files not found at {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "model_loaded": model is not None,
        "xgboost_version": xgboost.__version__
    })

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.json
        
        # 1. Create DataFrame from input
        input_df = pd.DataFrame([data])
        
        # 2. Add missing columns with default 0
        # (This mimics pd.get_dummies alignment with training columns)
        # We need to manually construct the one-hot encoded dataframe if we want to be safe,
        # OR better: use the exact logic your model expects.
        # Assuming model requires specific columns:
        
        # Let's try to reconstruct the dataframe structure the model Expects
        # If the model was trained on a specific set of One-Hot columns, 
        # we need to provide a DataFrame with exactly those columns.
        
        # Create an empty DF with all model columns
        df_encoded = pd.DataFrame(columns=model_columns)
        
        # Fill in the data provided
        # For numerical cols, just copy
        # For categorical, set the specific one-hot column to 1
        
        # Initialize with 0s
        df_encoded.loc[0] = 0
        
        # Map simple fields
        numerical_map = [
            'Latitude', 'Longitude', 'Area_Harvested_Ha', 'Avg_NDVI', 'Avg_EVI',
            'Avg_LST_Celsius', 'Avg_Max_Temp_Celsius', 'Avg_Min_Temp_Celsius',
            'Avg_Humidity_Percent', 'Solar_Radiation_kWh', 'Accumulated_Rainfall_mm'
        ]
        
        for col in numerical_map:
            if col in data:
                df_encoded.at[0, col] = data[col]

        # Map Categorical fields
        categorical_cols = ['Taluka', 'Season', 'Cane_Variety', 'Soil_Type', 'Irrigation_Method']
        for col in categorical_cols:
            val = data.get(col)
            if val:
                dummy_col = f"{col}_{val}"
                if dummy_col in df_encoded.columns:
                    df_encoded.at[0, dummy_col] = 1
        
        # Predict
        prediction = float(model.predict(df_encoded)[0])
        
        return jsonify({
            "predicted_yield": prediction,
            "units": "Tonnes/Ha"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)
