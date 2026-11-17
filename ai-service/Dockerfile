FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# models_data/*.joblib will be generated on first run and persisted via volume
RUN mkdir -p models_data

EXPOSE 8000
CMD ["python", "app.py"]
