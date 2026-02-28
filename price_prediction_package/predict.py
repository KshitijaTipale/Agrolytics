import os
import argparse
import pandas as pd
import joblib
import sys

def load_model(model_path='best_price_model.pkl'):
    """Loads the trained machine learning pipeline."""
    if not os.path.isabs(model_path):
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), model_path)
    try:
        model = joblib.load(model_path)
        print(f"Successfully loaded model from {model_path}")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)

def predict_prices(model, input_csv, output_csv=None):
    """Reads input data, predicts prices, and optionally saves the results."""
    try:
        df = pd.read_csv(input_csv)
    except Exception as e:
        print(f"Error reading input CSV file: {e}")
        sys.exit(1)
        
    print(f"Generating price predictions for {len(df)} records...")
    
    # Check if unnecessary columns exist and drop them to match training
    # The pipeline will automatically handle standard columns mapped during training
    drop_cols = ['Target', 'Price_Per_Ton', 'Total_Revenue_INR', 'Yield_Tonnes_Ha', 
                 'District', 'Village_Cluster', 'Latitude', 'Longitude', 
                 'Planting_Date', 'Harvest_Date', 'Area_Harvested_Ha']
    for col in drop_cols:
        if col in df.columns:
            df = df.drop(columns=[col])
            
    # The model was saved as a Pipeline combining StandardScalar + OneHotEncoder + XGBoost
    try:
        predictions = model.predict(df)
        df['Predicted_Price_Per_Ton'] = predictions.round(2)
        print("\nPredictions generated successfully!\n")
        
        # Display first few predictions to the console
        columns_to_show = ['Taluka', 'Season', 'Cane_Variety', 'Harvest_Year', 'Predicted_Price_Per_Ton']
        print(df[[c for c in columns_to_show if c in df.columns]].head(10))
        
        if output_csv:
            df.to_csv(output_csv, index=False)
            print(f"\nSaved final results to: {output_csv}")
            
    except Exception as e:
        print(f"Error making predictions: {e}")
        print("Please verify the input CSV columns match the necessary features.")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sugarcane Price Predictor Inference Script")
    parser.add_argument('--input', type=str, required=True, help="Path to input CSV file containing farm properties.")
    parser.add_argument('--output', type=str, default="predicted_prices.csv", help="Desired output CSV filename.")
    parser.add_argument('--model', type=str, default="best_price_model.pkl", help="Path to the model .pkl file.")
    
    args = parser.parse_args()
    
    pipeline = load_model(args.model)
    predict_prices(pipeline, input_csv=args.input, output_csv=args.output)
