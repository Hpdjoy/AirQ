import os
import random
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import joblib

# Optional imports — TensorFlow doesn't support Python 3.14 yet
try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("[WARN] TensorFlow not available (Python 3.14 not yet supported).")
    print("       Running in SIMULATION mode. Predictions will be approximated.")

app = FastAPI(title="AirQ ML Prediction Service")

# Load model and scaler globally
MODEL_PATH = "model.h5"
SCALER_PATH = "scaler.gz"

model = None
scaler = None

if HAS_TF:
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
            print("[OK] Model and scaler loaded successfully.")
        else:
            print("[INFO] Model or scaler not found. Running in simulation mode.")
    except Exception as e:
        print(f"[ERROR] Error loading model: {e}")
else:
    print("[INFO] ML Service started in simulation mode (no TensorFlow).")

class SensorReading(BaseModel):
    temperature: float
    humidity: float
    pm25: float
    co2: float
    gas: float

class SensorData(BaseModel):
    # Expect a sequence of 12 readings (1 hour of 5-min intervals)
    readings: List[SensorReading]

class PredictionResponse(BaseModel):
    predicted_pm25_30m: float
    predicted_pm25_60m: float
    confidence: float
    status: str

@app.post("/predict", response_model=PredictionResponse)
async def get_prediction(data: SensorData):
    if not data.readings:
        raise HTTPException(status_code=400, detail="No readings provided")

    current_pm25 = data.readings[-1].pm25

    if model is not None and scaler is not None and len(data.readings) >= 12:
        try:
            # Prepare data: shape should be (1, 12, 5)
            # Use the last 12 readings
            input_data = []
            for r in data.readings[-12:]:
                input_data.append([r.temperature, r.humidity, r.pm25, r.co2, r.gas])
            
            input_df = np.array(input_data)
            # Scale
            scaled_input = scaler.transform(input_df)
            # Reshape for LSTM
            X = np.array([scaled_input])
            
            # Predict
            pred_scaled = model.predict(X)[0][0]
            
            # Inverse scale: we need to reconstruct a dummy row to inverse transform the PM25 column
            dummy = np.zeros((1, 5))
            dummy[0, 2] = pred_scaled # pm25 is at index 2
            inv_scaled = scaler.inverse_transform(dummy)
            predicted_pm25_30m = inv_scaled[0, 2]
            
            # Simulate 60m since our model currently only predicts 30m
            predicted_pm25_60m = predicted_pm25_30m * 1.1

            return PredictionResponse(
                predicted_pm25_30m=round(max(0, predicted_pm25_30m), 2),
                predicted_pm25_60m=round(max(0, predicted_pm25_60m), 2),
                confidence=0.85,
                status="success"
            )
        except Exception as e:
            print(f"Prediction error: {e}")
            # Fall back to simulation on error

    # Fallback / Simulation
    simulated_future_pm25_30m = max(0, current_pm25 + random.uniform(-5.0, 15.0))
    simulated_future_pm25_60m = max(0, current_pm25 + random.uniform(-10.0, 25.0))

    return PredictionResponse(
        predicted_pm25_30m=round(simulated_future_pm25_30m, 2),
        predicted_pm25_60m=round(simulated_future_pm25_60m, 2),
        confidence=0.70,
        status="simulation"
    )

@app.get("/health")
async def health_check():
    status = "healthy" if model else "simulated"
    return {"status": status, "model": "LSTM" if model else "placeholder"}
