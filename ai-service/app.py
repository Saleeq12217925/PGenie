from flask import Flask, request, jsonify
from flask_cors import CORS
from model.rent_model import RentPredictor
from model.recommender import HybridRecommender

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000', 'http://localhost:5173'])

rent_model = RentPredictor()
rent_model.train_or_load()

recommender = HybridRecommender()

@app.post('/predict-rent')
def predict_rent():
    body = request.get_json(force=True, silent=True) or {}
    required = ['location_score', 'amenities_count', 'room_type_encoded', 'occupancy_rate', 'market_trend_index']
    missing = [f for f in required if f not in body]
    if missing:
        return jsonify({'error': f'Missing fields: {missing}'}), 400

    predicted = rent_model.predict(body)
    return jsonify({'predicted_rent': predicted})


@app.post('/recommend')
def recommend():
    body = request.get_json(force=True, silent=True) or {}
    recommendations = recommender.recommend(body)
    return jsonify({'recommendations': recommendations})


@app.get('/health')
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
