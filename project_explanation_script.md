# Agrolytics - Project Presentation Script

**Hello everyone,**

**Introduction:**
My project is named **"Agrolytics"**. It is a smart web application designed to help farmers predict their sugarcane yield using Artificial Intelligence (AI) and satellite data. Our main goal is to empower farmers with data-driven insights so they can make better farming decisions.

**The Problem:**
Currently, many sugarcane farmers rely on guesswork or past experience to estimate how much crop they will harvest. This can lead to poor planning and financial losses. Also, sugar factories struggle to estimate the total supply of sugarcane in their region.

**Our Solution (Agrolytics):**
Agrolytics solves this by using advanced Machine Learning. The platform is divided into two parts:
1. **The Farmer Portal:** Where farmers can log in, add their fields by drawing it on an interactive map, and enter details like soil type and planting season.
2. **The Factory Portal:** A dashboard for sugar factory owners to monitor all the registered farmers, total acreage, and estimated total yield in the region.

**How the AI works:**
Under the hood, Agrolytics uses a powerful Machine Learning algorithm called **XGBoost**. When a farmer requests a prediction, our system takes the field's size and location, combines it with weather data (like rainfall and temperature) and satellite data (like NDVI, which shows plant health). It feeds all this into the XGBoost model to instantly predict how many tonnes of sugarcane the farm will produce per hectare.

**Technology Stack:**
To build this, I used:
*   **React.js** for building a fast, smooth, and interactive user interface.
*   **Supabase** to securely store user data and handle login/authentication.
*   **Python (Flask)** to create an API that connects our website to the AI model.
*   **Hugging Face Spaces** to host the heavy Machine Learning model in the cloud. We had to split the frontend and the AI model to make sure the app runs quickly and smoothly.

**Conclusion:**
In summary, Agrolytics bridges the gap between traditional farming and modern AI technology. It provides highly accurate crop predictions in a very simple, user-friendly interface. 

Thank you!
