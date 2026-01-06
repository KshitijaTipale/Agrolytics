from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import os

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
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
        print(f"Error: Model files not found at {MODEL_PATH} or {COLUMNS_JSON_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")

def prepare_input_vector(input_data, columns):
    """
    Manually construct the feature vector (One-Hot Encoding) to avoid needing pandas.
    """
    vector = [0] * len(columns)
    col_dict = {col: i for i, col in enumerate(columns)}
    
    # Numerical Fields
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
                vector[col_dict[col]] = 0.0

    # Categorical Fields (One-Hot)
    # These must match exactly how get_dummies names columns: "Column_Value"
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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": model is not None})

@app.route('/api/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data = request.json
        
        # Prepare Input
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

        # Vectorize
        input_vector = prepare_input_vector(input_data, model_columns)
        
        # Predict
        prediction = float(model.predict(input_vector)[0])
        
        return jsonify({
            "predicted_yield": prediction,
            "units": "Tonnes/Ha"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
