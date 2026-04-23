# 🧠 AirQ Machine Learning Guide

Welcome to the AirQ Machine Learning setup! Don't worry if you've never used AI before. This guide will explain how your system learns and predicts air quality in simple terms.

## 1. How Does the "Brain" Work?
Your ML (Machine Learning) model acts as the brain of your dashboard's forecast system. 
- It looks at the **last hour of sensor data** (Temperature, Humidity, CO2, Gas, and Dust).
- It uses a neural network called an **LSTM** (Long Short-Term Memory), which is specifically designed to understand patterns over time.
- Based on the patterns it learned during "training", it predicts what the PM2.5 dust levels will be in **30 minutes** and **60 minutes**.

## 2. Training vs. Running

### **Running (Inference)**
- **What it is:** The `app.py` service running in the background.
- **What it does:** It receives real-time data from your dashboard, asks the brain (`model.h5`) for a prediction, and sends the forecast back to the dashboard.
- **When to do it:** This runs automatically all the time while your backend and frontend are running.

### **Training**
- **What it is:** Running the `train_model.py` script.
- **What it does:** It pulls thousands of historical sensor readings from your MongoDB database, studies the data for several minutes, and builds a brand new brain file (`model.h5`). 
- **When to do it:** You do **NOT** need to train the model every day. You only need to train it when:
  1. **First Setup:** When you first deploy the system.
  2. **Environment Changes:** If you move your sensors to a completely new room or factory floor with different air patterns.
  3. **Monthly Maintenance:** Once a month, to let the model learn from the most recent data and improve its accuracy.

---

## 3. Step-by-Step Setup Guide (First Time)

*Note: The ML model requires Python 3.11 or 3.12 (TensorFlow does not support Python 3.14 yet).*

### Step A: Install the Correct Python Version
1. Open a terminal and run: `winget install Python.Python.3.11`
2. Close your terminal and reopen it so it recognizes the new Python.

### Step B: Setup the ML Environment
Open a terminal inside your `ml_service` folder and run:
```powershell
# 1. Create a virtual environment using Python 3.11
py -3.11 -m venv venv

# 2. Activate it
.\venv\Scripts\activate

# 3. Install the required AI libraries
pip install fastapi uvicorn pydantic numpy pandas scikit-learn tensorflow pymongo joblib
```

### Step C: Train the Brain!
While still in your `ml_service` terminal (with the `(venv)` active), run:
```powershell
python train_model.py
```
*What happens:*
- It will pull data from your database (or generate synthetic data if you don't have enough real data yet).
- It will train for 5 "epochs" (rounds of studying).
- You will see two new files appear: `model.h5` (the brain) and `scaler.gz` (a tool it uses to understand the scale of the numbers).

### Step D: Start the Prediction Service
Now that the brain is trained, start the service so your dashboard can talk to it:
```powershell
uvicorn app:app --host 0.0.0.0 --port 8000
```
Your dashboard will now show real AI forecasts!

---

## 4. How to Retrain in the Future (Monthly)

When you decide it's time to make the model smarter (e.g., after running the sensors in a factory for a month):

1. Stop the running ML service (`Ctrl+C` in its terminal).
2. Ensure your virtual environment is active (`.\venv\Scripts\activate`).
3. Run `python train_model.py`.
4. Once it finishes and says "Saved model to model.h5", start the service again: `uvicorn app:app --host 0.0.0.0 --port 8000`.
