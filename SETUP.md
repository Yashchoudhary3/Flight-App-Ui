# Flight Booking System - Setup Guide

This guide will help you set up and run the Flight Booking System with React.js, Node.js, Supabase, and PostgreSQL.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- A Supabase account

## Project Structure

```
flight-booking-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store and slices
│   │   ├── services/      # API services
│   │   ├── config/        # Configuration files
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── config/           # Configuration files
│   ├── package.json
│   └── index.js
├── database/              # Database schemas and migrations
│   └── schema.sql
├── docs/                  # Documentation
├── package.json
└── README.md
```

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd flight-booking-system

# Install all dependencies (frontend, backend, and root)
npm run setup
```

## Step 2: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Set Up Database**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Run the SQL script from `database/schema.sql`
   - This will create all necessary tables and relationships

3. **Configure Authentication**
   - In Supabase dashboard, go to Authentication > Settings
   - Configure your site URL (e.g., `http://localhost:3000`)
   - Set up email templates if needed

## Step 4: Environment Configuration

### Backend Environment (.env)

Copy `server/env.example` to `server/.env` and fill in your values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Database Configuration
DATABASE_URL=your_supabase_database_url

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment (.env)

Copy `client/env.example` to `client/.env` and fill in your values:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
REACT_APP_API_URL=http://localhost:5000

# App Configuration
REACT_APP_APP_NAME=Flight Booking System
REACT_APP_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_WEB_WORKERS=true
REACT_APP_ENABLE_INDEXEDDB=true
```

## Step 5: Start Development Servers

```bash
# Start both frontend and backend servers
npm run dev

# Or start them separately:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

## Step 6: Database Seeding (Optional)

To populate your database with sample data, you can run additional SQL scripts:

```sql
-- Insert sample flights
INSERT INTO flights (flight_number, airline, from_location, to_location, departure_time, arrival_time, duration, price, total_seats, available_seats, class) VALUES
('AA123', 'American Airlines', 'New York', 'Los Angeles', '2024-01-15 10:00:00', '2024-01-15 13:30:00', 210, 299.99, 180, 150, 'economy'),
('DL456', 'Delta Air Lines', 'Atlanta', 'Chicago', '2024-01-15 14:00:00', '2024-01-15 15:30:00', 90, 199.99, 160, 120, 'economy'),
('UA789', 'United Airlines', 'San Francisco', 'New York', '2024-01-15 08:00:00', '2024-01-15 16:30:00', 390, 399.99, 200, 180, 'economy');
```

## Step 7: Testing the Application

1. **Frontend**: Open `http://localhost:3000`
2. **Backend API**: Test `http://localhost:5000/health`
3. **Register a new user** and test the booking flow
4. **Create an admin user** by updating the role in the database

## Step 8: Admin User Setup

To create an admin user, update the user's role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Features Implemented

### ✅ Completed Features

- **User Authentication**
  - Registration and login with Supabase Auth
  - JWT token management
  - Protected routes

- **Flight Search**
  - Search by origin, destination, date
  - Filter by cabin class, passengers
  - Real-time flight availability

- **Booking System**
  - Create bookings with passenger details
  - Booking confirmation and management
  - Booking cancellation

- **Real-time Updates**
  - Server-Sent Events (SSE) for flight status
  - Supabase real-time subscriptions
  - Live booking updates

- **Admin Dashboard**
  - Flight management
  - Booking overview
  - User management
  - Analytics and statistics

- **Responsive Design**
  - Mobile-first approach
  - Tailwind CSS styling
  - Modern UI components

### 🔄 In Progress Features

- **Offline Support**
  - IndexedDB for flight data caching
  - Service worker implementation
  - Offline booking queue

- **Web Workers**
  - Flight search optimization
  - Data processing in background

- **Advanced Features**
  - Email notifications
  - Multi-language support
  - Advanced analytics

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Flight Endpoints

- `GET /api/flights` - Search flights
- `GET /api/flights/:id` - Get flight details
- `POST /api/flights` - Create flight (admin)
- `PUT /api/flights/:id` - Update flight (admin)
- `DELETE /api/flights/:id` - Delete flight (admin)

### Booking Endpoints

- `GET /api/bookings/my-bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/cancel` - Cancel booking

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Heroku)

1. Connect your repository to Railway/Heroku
2. Set environment variables
3. Deploy the server directory

### Database (Supabase)

- Supabase handles the database hosting
- Configure production environment variables
- Set up proper CORS origins

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS_ORIGIN is set correctly
   - Check that frontend and backend ports match

2. **Supabase Connection Issues**
   - Verify API keys are correct
   - Check RLS policies are properly configured

3. **Database Connection**
   - Verify DATABASE_URL is correct
   - Check if all tables are created

### Getting Help

- Check the console for error messages
- Verify all environment variables are set
- Ensure all dependencies are installed
- Check Supabase and Stripe dashboards for configuration issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 