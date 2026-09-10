# Mutual — Accountability Partner Platform

A full-stack web application that helps people follow through on goals by pairing them with an accountability partner. Users can create goals, submit check-ins, form partnerships, and track streaks from a responsive dashboard.

## Why I built it

Most goal-tracking apps are single-player: a user sets a goal and relies only on self-discipline to keep going. Mutual adds a social layer by making progress visible to an accountability partner.

## What it does

- Register and sign in with cookie-based JWT authentication
- Create and manage goals with deadlines and check-in schedules
- Submit text or photo-based check-ins against a goal
- Create and manage accountability partnerships
- Track goal progress and consistency streaks
- Run scheduled background logic for streak-related processing
- Expose a health-check endpoint for deployment monitoring

## Engineering highlights

- Structured the app as a client/server monorepo with separate React and Express applications.
- Built REST APIs for authentication, goals, check-ins, and partnerships.
- Used MongoDB/Mongoose to model users, goals, check-ins, and relationships.
- Protected browser sessions with HTTP-only cookies and configured CORS to allow credentialed requests from the client.
- Added Zod validation at API boundaries and centralized server concerns into routes, controllers, models, middleware, and utilities.
- Designed the client around React Router, Zustand state management, and reusable UI components.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Zustand, Axios, Tailwind CSS |
| Backend | Node.js, Express, JWT, bcryptjs, Zod, node-cron |
| Database | MongoDB, Mongoose |
| Tooling | ESLint, Nodemon |

## Architecture

```text
React client
    ↓ HTTP requests (credentials enabled)
Express API
    ├── auth, goals, check-ins, partnerships routes
    ├── validation and authentication middleware
    └── Mongoose models
            ↓
         MongoDB
```

## Run locally

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)

### 1. Clone and install dependencies

```bash
git clone https://github.com/tonysoftwarengineer/Mutual-Accountability-Web-platform.git
cd Mutual-Accountability-Web-platform

cd server && npm install
cd ../client && npm install
```

### 2. Configure the server

Copy the included template and set your values:

```bash
cd server
cp .env.example .env
```

Required variables:

```env
PORT=5001
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=use_a_long_random_value
JWT_EXPIRES_IN=7d
```

### 3. Start the application

In two terminals:

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

The client runs on Vite's local URL (normally `http://localhost:5173`).

## Repository structure

```text
├── client/              # React application
│   └── src/             # Routes, components, store, and API utilities
├── server/              # Express application
│   ├── controllers/     # Request-handling logic
│   ├── middleware/      # Authentication and validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # REST endpoints
│   └── utils/           # Shared server utilities
└── server/.env.example  # Environment-variable template
```

## Future improvements

- Add automated tests to the npm test workflow.
- Add a deployment configuration and CI checks.
- Introduce real-time partner notifications where the product needs them.
