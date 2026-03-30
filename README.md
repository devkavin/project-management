# Project management platform

This repository contains two services:
- `backend`: Laravel 12 REST API
- `frontend`: Next.js UI

## Stack

- Backend: Laravel 12, Sanctum, MySQL 8.4
- Frontend: Next.js 16 (App Router), TypeScript, Tailwind, React Query, Zustand
- Runtime: Docker Compose

## Features implemented

- User authentication: register, login, logout, profile
- Workspaces CRUD
- Spaces CRUD
- Tasks CRUD
- Subtasks via parent task relationship
- Views in UI:
  - List
  - Board (status columns)
  - Calendar
  - Gantt timeline

## Architecture

- Frontend calls backend through REST endpoints under `/api`.
- Backend uses token auth (`Bearer` token via Sanctum).
- MySQL is the persistent database for all entities.

## Run with Docker

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- MySQL: localhost:3307 (`project` / `project`)

## Important API routes

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Work management:
- `GET/POST /api/workspaces`
- `GET/PATCH/DELETE /api/workspaces/{workspace}`
- `POST /api/workspaces/{workspace}/spaces`
- `GET/PATCH/DELETE /api/spaces/{space}`
- `POST /api/spaces/{space}/tasks`
- `PATCH/DELETE /api/tasks/{task}`
- `GET /api/workspaces/{workspace}/views`

## Local run without Docker

Backend:
```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

Frontend:
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
