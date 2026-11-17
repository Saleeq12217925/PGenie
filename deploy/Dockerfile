FROM node:22-bookworm-slim AS frontend
WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN VITE_API_URL="" npm run build

FROM node:22-bookworm-slim AS backend
WORKDIR /build/server
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM python:3.11-slim-bookworm
COPY --from=backend /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=128 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    OPENBLAS_NUM_THREADS=1 \
    OMP_NUM_THREADS=1 \
    MODEL_N_JOBS=1 \
    STATIC_DIR=/app/client/dist \
    AI_SERVICE_URL=http://127.0.0.1:8000 \
    CHECK_AI_HEALTH=true
WORKDIR /app
COPY ai-service/requirements.txt ai-service/requirements.txt
COPY deploy/requirements.txt deploy/requirements.txt
RUN pip install --no-cache-dir -r deploy/requirements.txt
COPY ai-service/ ai-service/
# Build the synthetic rent model once; retain it across cold starts in the image.
RUN cd ai-service && python -c "from model.rent_model import RentPredictor; RentPredictor().train_or_load()"
COPY server/ server/
COPY --from=backend /build/server/node_modules server/node_modules
COPY --from=frontend /build/client/dist client/dist
COPY deploy/start.py deploy/start.py
RUN mkdir -p server/uploads && chown 10001:10001 server/uploads
USER 10001:10001
EXPOSE 10000
CMD ["python", "/app/deploy/start.py"]
