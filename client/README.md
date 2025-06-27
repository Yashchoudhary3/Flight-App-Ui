# Flight Booking System — Frontend

This is the React.js frontend for the Flight Booking System.

## Features
- Modern UI with Tailwind CSS
- Flight search, booking, and management
- Real-time updates (SSE)
- Admin panel
- Offline support (IndexedDB)

## Tech Stack
- React.js, Redux Toolkit, Tailwind CSS, React Router, idb

## Setup
1. `cd client`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your Supabase/API keys
4. `npm start`

## Scripts
- `npm start` — Start dev server
- `npm run build` — Production build
- `npm test` — Run tests
- `npm run lint` — Lint code

## Env Vars (`.env`)
```
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_API_URL=http://localhost:5000
```

## Author
Yash Choudhary 