# How to Run Agrolytics Locally

Since the project structure has changed (Frontend at Root, Backend in `api/`), here is how to run the application manually on your machine.

## Prerequisites
- **Node.js** (Installed)
- **Python 3.x** (Installed)

## Step 1: Start the Backend (API)
Open a terminal and run the Python Flask server:

```powershell
# 1. Navigate to the api directory
cd api

# 2. Install dependencies (if not already installed)
pip install -r requirements.txt

# 3. Run the server
python index.py
```
> **Success**: You should see `Running on http://127.0.0.1:5000`

## Step 2: Start the Frontend (Client)
Open a **new terminal window** (keep the backend running) and start the React app from the project root:

```powershell
# 1. Navigate to project root (if not already there)
# (If you are in api folder, go back up)
cd ..

# 2. Install dependencies (since we moved files, it's good to ensure everything is linked)
npm install

# 3. Start the dev server
npm run dev
```
> **Success**: You should see `Local: http://localhost:5173/`

## Step 3: Open in Browser
- Go to [http://localhost:5173](http://localhost:5173).
- The app should load, and API requests (like Login or Prediction) will automatically be proxied to your Python server running on port 5000.
