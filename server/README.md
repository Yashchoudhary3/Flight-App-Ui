# Flight Booking System — Backend

This is the Node.js/Express backend for the Flight Booking System.

## Features
- REST API for flights, bookings, users
- Supabase Auth integration
- Stripe payments
- Email notifications (Resend API)
- Real-time updates (SSE)

## Tech Stack
- Node.js, Express.js, Supabase-js, Stripe, Resend, JWT

## Setup
1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials
4. `npm run dev`

## Scripts
- `npm run dev` — Start with nodemon
- `npm start` — Start server
- `npm test` — Run backend tests

## Env Vars (`.env`)
```
PORT=5000
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
```

## Author
Yash Choudhary 