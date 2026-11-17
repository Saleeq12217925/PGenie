import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models_data', 'rent_model.joblib')

FEATURES = ['location_score', 'amenities_count', 'room_type_encoded', 'occupancy_rate', 'market_trend_index']


class RentPredictor:
    def __init__(self):
        self.pipeline = None

    def train_or_load(self):
        if os.path.exists(MODEL_PATH):
            self.pipeline = joblib.load(MODEL_PATH)
            print('[RentModel] Loaded from cache.')
            return

        print('[RentModel] Training...')
        # Import here to avoid circular dependency issues at startup
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
        from data.train_data import generate_rent_data

        df = generate_rent_data(n=2000)
        X = df[FEATURES].values
        y = df['rent'].values

        self.pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('rf', RandomForestRegressor(n_estimators=100, random_state=42,
                                         n_jobs=int(os.getenv('MODEL_N_JOBS', '-1')))),
        ])
        self.pipeline.fit(X, y)
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.pipeline, MODEL_PATH)
        print('[RentModel] Trained and saved.')

    def predict(self, features: dict) -> int:
        X = np.array([[features.get(f, 0) for f in FEATURES]])
        pred = self.pipeline.predict(X)[0]
        return int(round(pred / 100) * 100)  # round to nearest ₹100
