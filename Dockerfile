FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production
RUN npm install -g pm2

COPY --from=builder /app/dist ./dist
COPY .env .env

COPY pm2.config.js .

CMD ["pm2-runtime", "pm2.config.js"]
