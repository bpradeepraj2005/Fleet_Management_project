import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'unified_ev_fleet_dataset_final.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'backend', 'range_model.pkl')
ENCODERS_PATH = os.path.join(BASE_DIR, 'backend', 'encoders.pkl')

def train_model():
    if not os.path.exists(DATA_PATH):
        print(f"Data file not found at {DATA_PATH}")
        return

    # Load data
    df = pd.read_csv(DATA_PATH)

    # Select features and target
    features = ['current_battery_percent', 'current_speed_kmph', 'air_conditioning_usage', 
                'outside_temperature_c', 'avg_gradient_percent', 'road_type', 
                'driver_behavior_score']
    target = 'estimated_remaining_range_km'

    # Filter out rows with missing target or features
    df = df.dropna(subset=features + [target])

    X = df[features].copy()
    y = df[target]

    # Encode categorical variables
    encoders = {}
    for col in ['road_type']:
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
    for col in ['road_type']:
        if col in df.columns:
            # Handle unseen labels gracefully if needed, here we assume valid inputs
            try:
                df[col] = encoders[col].transform(df[col])
            except ValueError:
                # Default to a generic value if unknown
                df[col] = encoders[col].transform([encoders[col].classes_[0]])

    prediction = model.predict(df)
    return prediction[0]

if __name__ == "__main__":
    train_model()
