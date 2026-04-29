FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# uploads/ is a Docker volume — this just ensures the dir exists in the image
RUN mkdir -p uploads

EXPOSE 5000
CMD ["node", "server.js"]
