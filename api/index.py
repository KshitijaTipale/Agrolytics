from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# Environment Variable for HF Space URL
# Example: https://huggingface.co/spaces/username/space-name
# The actual API endpoint will be: {HF_API_URL}/predict
HF_API_URL = os.environ.get('HF_API_URL')

@app.route('/api/health', methods=['GET'])
def health_check():
    if not HF_API_URL:
        return jsonify({"status": "error", "message": "HF_API_URL not configured"}), 500
    
    try:
        # Forward health check to HF
        resp = requests.get(HF_API_URL)
        return jsonify({"status": "proxy_healthy", "hf_status": resp.status_code, "hf_response": resp.json()})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 502

@app.route('/api/predict', methods=['POST'])
def predict():
    if not HF_API_URL:
        return jsonify({"error": "HF_API_URL environment variable not set"}), 500

    try:
        # Forward the JSON body to Hugging Face
        payload = request.json
        hf_endpoint = f"{HF_API_URL}/predict"
        
        response = requests.post(hf_endpoint, json=payload)
        
        # Return whatever HF returns
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": "Proxy Error", "details": str(e)}), 502

@app.route('/api/predict-harvest', methods=['POST'])
def predict_harvest():
    if not HF_API_URL:
        return jsonify({"error": "HF_API_URL environment variable not set"}), 500

    try:
        # Forward the JSON body to Hugging Face
        payload = request.json
        hf_endpoint = f"{HF_API_URL}/predict-harvest"
        
        response = requests.post(hf_endpoint, json=payload)
        
        # Return whatever HF returns
        return jsonify(response.json()), response.status_code

    except Exception as e:
        return jsonify({"error": "Proxy Error", "details": str(e)}), 502

if __name__ == '__main__':
    app.run(debug=True, port=5000)
