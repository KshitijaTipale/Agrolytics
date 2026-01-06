import requests
import json

url = 'http://127.0.0.1:5000/predict'

# Sample data mimicking app.py default values
payload = {
    'Taluka': 'Rahuri', # Example Taluka
    'Season': 'Suru',
    'Cane_Variety': 'Co 86032',
    'Soil_Type': 'Black Cotton',
    'Irrigation_Method': 'Drip',
    'Latitude': 19.39, # Approx for Rahuri
    'Longitude': 74.65,
    'Area_Harvested_Ha': 1.0,
    'Avg_NDVI': 0.6,
    'Avg_EVI': 0.48,
    'Avg_LST_Celsius': 30.0,
    'Avg_Max_Temp_Celsius': 35.0,
    'Avg_Min_Temp_Celsius': 20.0,
    'Avg_Humidity_Percent': 60.0,
    'Solar_Radiation_kWh': 5.5,
    'Accumulated_Rainfall_mm': 500.0
}

try:
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        print("Success!")
        print(response.json())
    else:
        print(f"Failed with status {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
