# Agrolytics - Interview Questions & Answers

**Q1: What is the main objective of the your project "Agrolytics"?**
**Answer:** The main goal of Agrolytics is to help farmers predict their sugarcane yield accurately using Machine Learning. It also provides a dashboard for sugar factories to monitor total regional supply from registered farmers.

**Q2: What technologies did you use for the frontend?**
**Answer:** I used React.js because it makes building fast and dynamic user interfaces very easy. For styling, I used standard CSS. I also used Vite as the build tool to make the development process much faster than traditional tools like Create-React-App.

**Q3: How does the farmer draw their field on the map?**
**Answer:** I integrated a library called Leaflet (react-leaflet). It provides an interactive map where farmers can drop points (pins) to outline the boundaries of their farm. The app then automatically calculates the total acreage (area) based on the shape drawn.

**Q4: Can you explain your backend architecture?**
**Answer:** The backend is split into two parts:
1. **Database & Authentication:** I used Supabase. It securely stores user data, like farmer profiles and field details. It also handles User Login and Registration safely.
2. **Machine Learning API:** Since ML models are heavy, I hosted a Python Flask API on Hugging Face Spaces. The React frontend sends the field details to a middleman proxy (another Flask app), which then forwards it to the Hugging Face model for prediction. 

**Q5: Which Machine Learning algorithm did you use and why?**
**Answer:** I used the XGBoost algorithm (Extreme Gradient Boosting), specifically the XGBoost Regressor. I chose it because it is very powerful and highly accurate when predicting numbers (like tonnes of yield) from tabular data (like temperature, rainfall, and field size).

**Q6: Why did you separate the Machine Learning model from the main website?**
**Answer:** Machine Learning models (like XGBoost) and their libraries (like Pandas and Scikit-Learn) are very large in file size. Free hosting platforms like Vercel have size limits. So, to keep the React website fast and deployment successful, I deployed the lightweight React app on Vercel and the heavy ML model separately on Hugging Face Spaces.

**Q7: How did you handle user login and security?**
**Answer:** I used Supabase Authentication. It provides secure, ready-to-use login systems. It ensures that a farmer can only view and edit their own fields, keeping everyone's data private and safe.

**Q8: What was the most challenging part of this project?**
**Answer:** The biggest challenge was connecting the React frontend with the Python Machine Learning model, especially dealing with different environments and CORS (Cross-Origin Resource Sharing) errors. I solved this by building a Flask proxy API to perfectly bridge the communication between them. Another challenge was calculating farm size from map coordinates, which I handled using turf.js mathematically.

**Q9: If you had more time, how would you improve this project?**
**Answer:** I would add a feature to automatically suggest the best fertilizer amounts based on the predicted yield and soil type. I would also add native mobile app support using React Native so farmers can use it easily on their smartphones in the field.
