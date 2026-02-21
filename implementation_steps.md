# Agrolytics - Step-by-Step Implementation Guide

Here is how the Agrolytics project was built from scratch, explained in simple English.

## Step 1: Planning and Setup
1. **Idea:** Decided to build a sugarcane yield prediction app with a Farmer portal and a Factory portal.
2. **Tool Selection:** Chose React.js for the interface, Supabase for the database, and Python (Flask & XGBoost) for the Machine Learning.
3. **Project Creation:** Used `npm create vite@latest` to generate a fresh, fast React project.

## Step 2: Designing the Database (Supabase)
1. Created an account on Supabase.
2. Set up a SQL Database with two main tables:
   * **`fields` table:** To store the basic farm name, owner ID, size, and map coordinates.
   * **`field_details` table:** To store specific crop details like planting season, soil type, and cane variety.
3. Enabled Supabase Authentication so farmers can securely sign up and log in.

## Step 3: Building the Frontend User Interface (React)
1. **Routing:** Installed `react-router-dom` to create different pages: Landing Page, Farmer Login, Farmer Dashboard, Field Details, and Factory Dashboard.
2. **Components:** Built reusable pieces of code like `StatsCard` for the dashboard and `FieldMap` for the interactive map.
3. **Map Integration:** Installed `leaflet` and `react-leaflet` to display an interactive map. Added `turf.js` to mathematically calculate the acreage (area) when a farmer draws a shape on the map.
4. **Styling:** Wrote custom CSS in `index.css` to make the app look modern, using "glassmorphism" (frosted glass) effects and smooth animations.

## Step 4: Machine Learning Model (Python)
1. **Data:** Used a dataset containing past records of sugarcane yield, weather (temperature, rainfall), and satellite data (NDVI vegetation health).
2. **Training:** Wrote a Python script using pandas and the XGBoost library to train a model (`sugarcane_yield_model.pkl`) that can learn the patterns between the weather/soil and the final harvest amount.
3. **Saving:** Exported the trained model and the list of its required columns into files so they can be loaded later without retraining.

## Step 5: Building the API to connect AI and React
1. **The Model Server (Hugging Face):** Wrote a Python Flask app (`hf_space/app.py`) that loads the saved XGBoost model. It creates a `/predict` URL. When it receives farm details, it calculates the yield and sends the number back.
2. **The Proxy Server (API):** Wrote a small, lightweight Flask app (`api/index.py`) to act as a bridge. It takes the request from the React frontend and safely forwards it to the Hugging Face Model Server.

## Step 6: Integrating Everything
1. Updated the React frontend to make an HTTP request (`fetch`) to the Proxy Server whenever the farmer clicks the "Predict Yield" button.
2. Displayed the returned prediction on the "Field Details" page in the React app.

## Step 7: Testing and Deployment
1. Tested the entire flow locally: Logging in -> Adding a farm -> Drawing it on the map -> Getting a prediction.
2. Setup the "hybrid" local running system where three terminals are used: one for React, one for the Proxy, and one for the Model server.
3. Deployed the React frontend and lightweight proxy on Vercel, and pushed the heavy Machine Learning code to Hugging Face Spaces for permanent cloud hosting.
