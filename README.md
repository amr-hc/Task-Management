# 🗂️ Task Management API

A task management backend built with **Node.js**, **TypeScript**, **MongoDB**, **Redis**, and **BullMQ**.  
Includes authentication, role-based access, task tracking, comments, notifications, and background jobs.

---

## 🚀 Features

- ✅ JWT Authentication + Refresh Tokens
- ✅ Role-based access: `admin`, `manager`, `user`
- ✅ Task CRUD + assignment to users
- ✅ Task History (Audit log)
- ✅ Comments on tasks
- ✅ Notifications via BullMQ + Redis
- ✅ Redis Caching for GET requests
- ✅ Dockerized setup with MongoDB + Redis
- ✅ MongoDB Aggregations (history, interaction)

---

## 🧠 Tech Stack

- Node.js + Express
- TypeScript + Zod
- MongoDB + Mongoose
- Redis + BullMQ
- Docker + Docker Compose

---

# ☁️ Cloud Deployment Guide

This document explains how to deploy the Task Management System to the cloud.

---

## 🌐 Live Link

- **API Health Check**: [http://16.171.16.24:5000/health](http://16.171.16.24:5000/health)

---

## 📦 Repository

- GitHub: [https://github.com/amr-hc/Task-Management](https://github.com/amr-hc/Task-Management)

---

## 🐳 Docker Setup

### Dockerfile Highlights

- **Multi-stage build**
- Uses `node:20-alpine` for lightweight image
- Only production dependencies are included in the final image

### `docker-compose.yml`

```yaml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env
    depends_on:
      - redis

  redis:
    image: redis:6
    ports:
      - "6379:6379"
```

> 🧠 **Note**: MongoDB is hosted externally via Atlas, so it's not included in the Docker services.

---

## 🌍 Environment Variables

`.env` Example:

```
PORT=5000
MONGO_URI=
JWT_SECRET=secret-key
JWT_REFRESH_SECRET=refresh-secret
REDIS_URL=redis://redis:6379
```

---

## 🚀 Deployment Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/amr-hc/Task-Management.git
   cd Task-Management
   ```
2. Create `.env` file with production secrets.
3. Build & run the containers:
   ```bash
   docker-compose up -d --build
   ```
4. Confirm it's running:
   ```bash
   curl http://16.171.16.24:5000/health
   ```

---

## 🔐 Security

- Rate limiting via `express-rate-limit`
- HTTP headers via `helmet`
- CORS enabled

---

## 🧪 Testing

- Use Postman or curl to test endpoints.

---

