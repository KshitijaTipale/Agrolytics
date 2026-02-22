import pandas as pd
import numpy as np
import xgboost as xgb
import os
import json
import joblib

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CSV_PATH = os.path.join(PROJECT_ROOT, 'dataset', 'ahmednagar_sugarcane_enriched.csv')
MODEL_DIR = os.path.join(PROJECT_ROOT, 'api', 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'harvest_duration_model.pkl')
COLUMNS_PATH = os.path.join(MODEL_DIR, 'harvest_model_columns.json')

def train_model():
    print(f"Loading data from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    print("Preprocessing dates to extract Target Variable (Days_To_Harvest)...")
    # Convert dates to datetime objects
    df['Planting_Date'] = pd.to_datetime(df['Planting_Date'], format='%d-%m-%Y', errors='coerce')
    df['Harvest_Date'] = pd.to_datetime(df['Harvest_Date'], format='%d-%m-%Y', errors='coerce')
    
    # Calculate target (in days)
    df['Days_To_Harvest'] = (df['Harvest_Date'] - df['Planting_Date']).dt.days
    
    # Drop rows with invalid or negative durations
    df = df.dropna(subset=['Days_To_Harvest'])
    df = df[df['Days_To_Harvest'] > 0]
    
    print(f"{len(df)} valid records found for training.")

    # Select Features (Same as Yield Model)
    categorical_features = ['Taluka', 'Season', 'Cane_Variety', 'Soil_Type', 'Irrigation_Method']
    numerical_features = [
        'Area_Harvested_Ha',
        'Avg_NDVI',
        'Avg_EVI',
        'Avg_LST_Celsius',
        'Avg_Max_Temp_Celsius',
        'Avg_Min_Temp_Celsius',
        'Solar_Radiation_kWh',
        'Avg_Humidity_Percent',
        'Accumulated_Rainfall_mm'
    ]

    # Handle Missing Values in features
    for col in numerical_features:
        df[col] = df[col].fillna(df[col].median())
    for col in categorical_features:
        df[col] = df[col].fillna(df[col].mode()[0])

    features_df = df[categorical_features + numerical_features]
    target = df['Days_To_Harvest']

    print("One-hot encoding categorical features...")
    features_encoded = pd.get_dummies(features_df, columns=categorical_features, drop_first=True)
    
    # Ensure all columns are float
    for col in features_encoded.columns:
        features_encoded[col] = features_encoded[col].astype(float)
        
    model_columns = list(features_encoded.columns)

    print("Training XGBoost Regressor for Harvest Duration...")
    # Parameters tuned for ~300-500 day duration
    model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        random_state=42,
        objective='reg:squarederror'
    )
    
    model.fit(features_encoded, target)
    
    # Evaluate
    predictions = model.predict(features_encoded)
    mae = np.mean(np.abs(predictions - target))
    print(f"Training Mean Absolute Error: {mae:.2f} days")
    print(f"Avg Actual Duration: {target.mean():.1f} days")
    print(f"Avg Predicted Duration: {predictions.mean():.1f} days")

    print(f"Saving model and columns to {MODEL_DIR}...")
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    joblib.dump(model, MODEL_PATH)
    
    with open(COLUMNS_PATH, 'w') as f:
        json.dump(model_columns, f)
        
    print("✅ Model trained and saved successfully.")

if __name__ == '__main__':
    train_model()
