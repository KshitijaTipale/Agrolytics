# How to Run Agrolytics Locally (Hybrid Mode)

Because we split the project into a **Frontend** (Vercel) and **Model Engine** (Hugging Face) to solve the size limit, running locally now involves starting **3 separate terminals**.

## Prerequisites
- **Node.js** (Installed)
- **Python 3.x** (Installed)

---

## Terminal 1: The Model Engine (Simulating Hugging Face)
This runs the heavy XGBoost model locally, just like Hugging Face will do in the cloud.

```powershell
# 1. Go to the Hugging Face space folder
cd hf_space

# 2. Install heavy dependencies (only needed once)
pip install -r requirements.txt

# 3. Run the Model Server (Runs on port 7860)
python app.py
```
> **Keep this running.** It listens on `http://localhost:7860`.

---

## Terminal 2: The API Proxy (Simulating Vercel Backend)
This runs the lightweight API that forwards requests from the frontend to the Model Engine.

```powershell
# 1. Open a NEW terminal and go to api folder
cd api

# 2. Install proxy dependencies
pip install -r requirements.txt

# 3. Set the Environment Variable to point to LOCAL Model Engine
$env:HF_API_URL = "http://localhost:7860"

# 4. Run the Proxy Server (Runs on port 5000)
python index.py
```
> **Keep this running.** It listens on `http://localhost:5000` and forwards traffic to port 7860.

---

## Terminal 3: The Frontend (React)
This runs the user interface.

```powershell
# 1. Open a NEW terminal at Project Root
# (If in api or hf_space, go back up)
cd ..

# 2. Start the Frontend
npm run dev
```
> **Success**: Open `http://localhost:5173`.
> When you click "Predict", the request flows:
> **React (5173)** -> **Proxy (5000)** -> **Model Engine (7860)**.