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

## 🛠️ Setup

### 1. Clone and install

```bash
git clone https://github.com/amr-hc/Task-Management.git
cd task-management
npm install
