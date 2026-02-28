# Sugarcane Price Predictor

This directory contains everything needed to run inferences predicting the expected price per ton of sugarcane based on several agronomic, climatic, and spatial variables. The model was built using an XGBoost regressor packaged within a full Scikit-Learn pipeline (handling standard scaling and one-hot encoding).

## Contents

- `best_price_model.pkl`: The compiled machine learning pipeline.
- `predict.py`: An easy-to-use Python script to run inferences on CSV files.
- `requirements.txt`: Python package dependency list.
- `sample_input.csv`: A sample 10-row dataset showing the exact feature schema required by the model.

## Installation

1. Make sure Python 3.9+ is installed.
2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

To generate price predictions for your dataset, run the `predict.py` script from the command line, pointing to your CSV file:

```bash
python predict.py --input sample_input.csv --output predicted_prices.csv
```

### Script Arguments

- `--input`: (Required) Path to the CSV file containing the features for inference.
- `--output`: (Optional) The desired location to save the output file. Defaults to `predicted_prices.csv`.
- `--model`: (Optional) The path to the model pickle file. Defaults to `best_price_model.pkl`.

## Input Features

The inference script automatically drops upstream targets (like `Yield_Tonnes_Ha` or `Total_Revenue_INR`) if they are accidentally included in your dataset. The remaining columns in `sample_input.csv` show the raw values required (e.g. `Taluka`, `Season`, `Cane_Variety`, `Harvest_Year`, `Soil_Type`, `Irrigation_Method`, along with various climatic integers like `Avg_EVI` and `Avg_Humidity_Percent`).
