# API Documentation

## Auth Endpoints
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Get current user info

## Flight Endpoints
- `GET /api/flights` — List/search flights
- `GET /api/flights/:id` — Get flight details
- `POST /api/flights` — Create flight (admin)
- `PUT /api/flights/:id` — Update flight (admin)
- `DELETE /api/flights/:id` — Delete flight (admin)

## Booking Endpoints
- `GET /api/bookings/my-bookings` — Get user's bookings
- `POST /api/bookings` — Create booking
- `GET /api/bookings/:id` — Get booking details
- `POST /api/bookings/:id/cancel` — Cancel booking
- `PATCH /api/bookings/:id` — Edit booking/passenger details

## User/Admin Endpoints
- `GET /api/users` — List all users (admin)
- `PATCH /api/users/:id/role` — Change user role (admin) 