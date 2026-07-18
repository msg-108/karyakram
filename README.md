# Karyakram

Event management and ticket booking platform for Nepal.

## Stack

- **Backend**: Django 6 + DRF + SimpleJWT + PostgreSQL
- **Frontend**: React 19 + TypeScript + Vite + Zustand + Axios + TailwindCSS

## Running locally

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements/base.txt
python manage.py migrate
python manage.py runserver
# API at http://localhost:8000/api/
# Swagger docs at http://localhost:8000/api/docs/
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL if needed
npm run dev
# Dev server at http://localhost:5173/
```

## API prefix

All endpoints are under `/api/`. The frontend reads `VITE_API_BASE_URL` from `.env` — default is `http://localhost:8000/api`.

## Roles

| Role | JWT claim | Dashboard |
|------|-----------|-----------|
| `USER` | `role: "USER"` | User dashboard |
| `ORGANIZER` | `role: "ORGANIZER"` | Organizer dashboard |
| Staff/admin | `is_staff: true` | Admin panel |