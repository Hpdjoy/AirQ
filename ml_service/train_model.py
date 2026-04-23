import os
import pandas as pd
import numpy as np
from pymongo import MongoClient
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

# Phase 1: Data Preparation
def extract_data_from_mongodb():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["airq_monitor"]
    collection = db["sensorreadings"]
    
    # Extract
    data = list(collection.find({}, {
        "timestamp": 1,
        "dht11.temperature": 1,
        "dht11.humidity": 1,
        "dust.density": 1,
        "mq135.co2_ppm": 1,
        "mq2.ppm": 1,
        "_id": 0
    }).sort("timestamp", 1))
    
    if not data or len(data) < 100:
        print("Not enough real data found in MongoDB. Generating synthetic data for training.")
        return generate_synthetic_data()

    # Flatten the JSON
    flattened_data = []
    for d in data:
        flattened_data.append({
            "timestamp": d.get("timestamp"),
            "temperature": d.get("dht11", {}).get("temperature", 25),
            "humidity": d.get("dht11", {}).get("humidity", 50),
            "pm25": d.get("dust", {}).get("density", 15),
            "co2": d.get("mq135", {}).get("co2_ppm", 400),
            "gas": d.get("mq2", {}).get("ppm", 100)
        })
        
    df = pd.DataFrame(flattened_data)
    df.set_index('timestamp', inplace=True)
    return df

def generate_synthetic_data():
    dates = pd.date_range(start='2026-04-01', end='2026-04-23', freq='5min') # using '5min' as deprecated '5T' is old, warning in pandas 2+ but ok
    np.random.seed(42)
    df = pd.DataFrame({
        'temperature': np.random.normal(25, 2, len(dates)),
        'humidity': np.random.normal(50, 5, len(dates)),
        'pm25': np.random.normal(20, 10, len(dates)) + np.sin(np.linspace(0, 50, len(dates))) * 10,
        'co2': np.random.normal(400, 50, len(dates)),
        'gas': np.random.normal(100, 20, len(dates))
    }, index=dates)
    df['pm25'] = df['pm25'].clip(lower=0)
    return df

def clean_and_normalize(df):
    # Handle missing
    df = df.ffill().bfill()
    
    # Remove extreme outliers 
    for col in df.columns:
        upper = df[col].quantile(0.99)
        lower = df[col].quantile(0.01)
        df[col] = df[col].clip(lower=lower, upper=upper)
        
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(df)
    
    return scaled_data, scaler

def create_sequences(data, seq_length, lookahead=6):
    X, y = [], []
    for i in range(len(data) - seq_length - lookahead):
        X.append(data[i:(i + seq_length)])
        y.append(data[i + seq_length + lookahead, 2]) # 2 is index of pm25
    return np.array(X), np.array(y)

# Phase 2: Model Training
def build_and_train_model():
    df = extract_data_from_mongodb()
    
    # Save CSV
    df.to_csv("historical_data.csv")
    print("Exported data to historical_data.csv")
    
    scaled_data, scaler = clean_and_normalize(df)
    
    # Save scaler for future inference
    joblib.dump(scaler, 'scaler.gz')
    print("Saved scaler to scaler.gz")
    
    seq_length = 12 # 1 hour of 5-min intervals
    X, y = create_sequences(scaled_data, seq_length, lookahead=6) # 30 mins ahead
    
    if len(X) == 0:
        print("Not enough data to train. Exiting.")
        return
        
    # Split
    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    
    # Build LSTM
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
        Dropout(0.2),
        LSTM(50, return_sequences=False),
        Dropout(0.2),
        Dense(25),
        Dense(1)
    ])
    
    model.compile(optimizer='adam', loss='mean_squared_error')
    
    print("Training model...")
    model.fit(X_train, y_train, batch_size=32, epochs=5, validation_data=(X_test, y_test), verbose=1)
    
    # Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"Evaluation -> MAE: {mae:.4f}, MSE: {mse:.4f}, R2: {r2:.4f}")
    
    model.save("model.h5")
    print("Saved model to model.h5")

if __name__ == "__main__":
    build_and_train_model()
