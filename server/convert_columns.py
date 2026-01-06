import joblib
import json
import os
import pandas as pd

try:
    path = 'models/model_columns.pkl'
    if os.path.exists(path):
        cols = joblib.load(path)
        # Handle both pandas Index and list
        if hasattr(cols, 'tolist'):
            cols_list = cols.tolist()
        else:
            cols_list = list(cols)
            
        with open('models/model_columns.json', 'w') as f:
            json.dump(cols_list, f)
        print("Successfully converted model_columns.pkl to model_columns.json")
    else:
        print("model_columns.pkl not found")
except Exception as e:
    print(f"Error: {e}")
