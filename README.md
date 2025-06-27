# Flight Booking System

A modern, full-stack flight booking platform with real-time updates, admin management, and a polished user experience.

## Features
- User authentication (Supabase)
- Flight search with advanced filters
- Booking management (view, modify, cancel)
- E-Ticket with download/print
- Real-time flight status updates
- Admin panel (manage users, flights, bookings)
- Email notifications (Resend API)
- Responsive, modern UI
- Offline support (IndexedDB caching)

## Tech Stack
- **Frontend:** React.js, Tailwind CSS, Redux Toolkit, React Router, idb, Web Workers
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth

## Project Structure
```
flight-booking-system/
├── client/   # React frontend
├── server/   # Node.js backend
├── database/ # SQL schemas & migrations
```

---

## Frontend (client/)
### Main Dependencies
- React, Redux Toolkit, Tailwind CSS, React Router, Axios, idb

### Scripts
- `npm start` — Start dev server
- `npm run build` — Production build
- `npm test` — Run tests
- `npm run lint` — Lint code

### Env Vars (`client/.env`)
```
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_API_URL=http://localhost:5000
```

---

## Backend (server/)
### Main Dependencies
- Express, Supabase-js, Stripe, Resend, JWT, CORS, dotenv

### Scripts
- `npm run dev` — Start with nodemon
- `npm start` — Start server
- `npm test` — Run backend tests

### Env Vars (`server/.env`)
```
PORT=5000
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
```

---

## Setup
1. **Clone repo:**
   ```bash
   git clone <repo-url>
   cd flight-booking-system
   ```
2. **Install all dependencies:**
   ```bash
   npm run setup
   ```
3. **Configure env files:**
   - Copy `.env.example` to `.env` in both `client/` and `server/`
   - Fill in your credentials
4. **Database:**
   - Create a Supabase project
   - Run SQL scripts in `database/`
5. **Start dev servers:**
   ```bash
   npm run dev
   ```

---

## Author
Yash Choudhary 