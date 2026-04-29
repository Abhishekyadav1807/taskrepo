# ConfigPilot - Config Driven App Generator

This project is a mini app generator inspired by products like Base44, built for Track A.

## Stack
- Frontend: React (Vite + JavaScript)
- Backend: Node.js + Express (JavaScript)
- DB: PostgreSQL

## Implemented capabilities
- Dynamic runtime from JSON config (UI + APIs + DB schema)
- Handles incomplete/inconsistent config with safe fallbacks
- Auth with user-scoped data access
- 3 integrated features: multilingual labels, multi-login methods, CSV import

## Run locally
1. Start PostgreSQL:
```bash
cd infra
docker compose up -d
```
2. Backend env:
```bash
cd backend
copy .env.example .env
```
3. Frontend env:
```bash
cd ../frontend
copy .env.local.example .env.local
```
4. Install and run:
```bash
cd ..
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Config file
Edit `shared/app-config.json`.

## APIs
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/magic-link` (mock)
- `GET /api/meta`
- `GET/POST /api/:entity`
- `PUT/DELETE /api/:entity/:id`
- `POST /api/:entity/import/csv`
