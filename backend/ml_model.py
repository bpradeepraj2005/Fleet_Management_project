import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
import os
import data_service

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'Final_dataset_fleet.xlsx')
MODEL_PATH = os.path.join(BASE_DIR, 'backend', 'range_model.pkl')
ENCODERS_PATH = os.path.join(BASE_DIR, 'backend', 'encoders.pkl')

def train_model():
    if not os.path.exists(DATA_PATH):
        print(f"Data file not found at {DATA_PATH}")
        return

    # Load data
    df = pd.read_excel(DATA_PATH)

    # Select features and target
    features = ['current_battery_pct', 'current_speed_kmh', 'ac_status', 
                'outside_temperature_c', 'vehicle_weight_kg', 'road_type', 
                'weather_condition', 'driving_mode']
    target = 'actual_remaining_range_km'

    # Filter out rows with missing target or features
    df = df.dropna(subset=features + [target])

    X = df[features].copy()
    y = df[target]

    # Encode categorical variables
    encoders = {}
    for col in ['road_type', 'weather_condition', 'driving_mode']:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        encoders[col] = le

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    score = model.score(X_test, y_test)
    print(f"Model trained with R^2 score: {score:.4f}")

    # Save model and encoders
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    with open(ENCODERS_PATH, 'wb') as f:
        pickle.dump(encoders, f)
    
    print(f"Model saved to {MODEL_PATH}")

def predict_range(data_dict):
    """
    Predict remaining range given a dictionary of features.
    """
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODERS_PATH):
        print("Model or encoders not found. Please train the model first.")
        return None

    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(ENCODERS_PATH, 'rb') as f:
        encoders = pickle.load(f)

    df = pd.DataFrame([data_dict])

    # Encode categorical
    cat_cols = ['driving_mode', 'weather_condition', 'road_type']
    for col in cat_cols:
        if col in df.columns:
            try:
                df[col] = encoders[col].transform(df[col].astype(str))
            except ValueError:
                # Default to a generic value if unknown
                df[col] = encoders[col].transform([encoders[col].classes_[0]])

    # Reorder columns to match training features
    features = ['current_battery_pct', 'current_speed_kmh', 'ac_status', 
                'outside_temperature_c', 'vehicle_weight_kg', 'road_type', 
                'weather_condition', 'driving_mode']
    df = df[features]

    prediction = model.predict(df)
    return prediction[0]

if __name__ == "__main__":
    train_model()
