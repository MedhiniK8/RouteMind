# RouteMind - AI-Powered Smart College Bus Tracking & Management System

RouteMind is a production-style hackathon project for real-time college bus tracking, driver coordination, student convenience, and management visibility. It uses React, Tailwind CSS, FastAPI, MongoDB Atlas, WebSockets, Leaflet, and OpenStreetMap.

## Full System Working

Drivers start a trip from the driver dashboard. Their device shares high-precision latitude and longitude through a WebSocket channel every few seconds. The FastAPI backend calculates live speed, updates MongoDB Atlas, runs ETA and delay logic, and broadcasts the latest bus state to students and management. Students see the assigned bus moving on a Leaflet map with ETA, speed, notifications, missed-bus suggestions, accessibility filtering, and SOS. Admins see all buses, SOS alerts, fleet status, analytics, route editing, and live driver instructions.

The frontend also includes demo fallbacks, so the app still feels alive if MongoDB Atlas or the backend is not running during judging.

## Student Flow

1. Student logs in with the student account.
2. Dashboard loads the assigned bus, route, stops, ETA, speed, and notifications.
3. Student checks time to reach pickup point and alternate bus suggestions.
4. "Are you inside the bus?" opens a rounded slider popup.
5. If the student slides yes, the browser requests location permission and collects GPS samples.
6. The backend compares student samples against the live bus location.
7. Distance within 100 meters for most samples confirms: "You are onboard."
8. Student can trigger SOS in an emergency.

## Driver Flow

1. Driver logs in with the driver account.
2. Driver starts or stops a trip.
3. GPS location is shared through WebSockets or REST fallback.
4. Driver can report delays, toggle disabled-accessible mode, and update route status.
5. Driver receives management instructions in the dashboard.
6. Driver can send SOS if required.

## Admin Flow

1. Admin logs in with the management account.
2. Admin tracks all buses live on one map.
3. Admin sees late buses, SOS alerts, route information, fleet metrics, and analytics.
4. Admin edits route stops and sends instructions to drivers.
5. SOS alerts are prioritized above routine notifications.

## Real-Time Tracking Working

- Driver app sends `{ bus_id, lat, lng, heading, timestamp }` to `/ws/{room}` or `/api/tracking/update`.
- Backend stores the bus location and location history in MongoDB.
- Backend broadcasts the update to `bus:{id}` and `admin` WebSocket rooms.
- Student dashboards subscribe to their assigned bus room.
- Admin dashboard subscribes to the global room.
- Leaflet renders bus markers, route polylines, and stop markers.

## ETA & Speed Calculation

- Speed uses haversine distance between the previous and current GPS points divided by elapsed time.
- ETA uses remaining haversine distance to the destination divided by the current or minimum realistic speed.
- Delay detection compares the bus position to scheduled route progress and flags buses more than 5 minutes behind.

## AI Logic Usage

RouteMind uses lightweight, explainable AI-style logic that works well in a hackathon demo:

- ETA prediction from distance, current speed, and route progress.
- Real-time speed calculation from GPS deltas.
- Delay detection against scheduled stop timing.
- Alternate bus suggestion by finding nearby routes that serve the student's stop area.
- Smart alert prioritization where SOS outranks delay, missed bus, presence, and info alerts.
- Smart presence validation with a 5 to 10 second consistency check to reduce GPS spoofing and one-off errors.

## MongoDB Atlas Setup

1. Create a free MongoDB Atlas M0 cluster.
2. Create a database user with read/write permission.
3. In Network Access, add your current IP address. For hackathon testing only, you can temporarily allow `0.0.0.0/0`.
4. Click Connect, choose Drivers, and copy the MongoDB URI.
5. Create `backend/.env`.
6. Paste this into `backend/.env` and replace the URI and secret:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/routemind?retryWrites=true&w=majority
DATABASE_NAME=routemind
JWT_SECRET=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=720
FRONTEND_ORIGIN=http://localhost:5173
SEED_DEMO_DATA=true
```

If your Atlas password contains special characters like `@`, `#`, `/`, or `:`, URL-encode the password in the URI.

## Folder Structure

```text
routemind/
  backend/
    app/
      main.py
      config.py
      database.py
      seed_data.py
      models/schemas.py
      routers/
        auth.py
        buses.py
        routes.py
        tracking.py
        notifications.py
        sos.py
        analytics.py
      services/
        geo.py
        ai_engine.py
        presence.py
      websocket/manager.py
    requirements.txt
    .env.example
  frontend/
    src/
      App.jsx
      main.jsx
      index.css
      components/
      context/
      hooks/
      services/
      utils/
    package.json
    tailwind.config.js
    vite.config.js
```

## MongoDB Collections

```js
users: {
  _id, name, email, password_hash, role, bus_id, route_id, stop_id, created_at
}

students: {
  _id, user_id, name, email, bus_id, route_id, stop_id, created_at
}

drivers: {
  _id, user_id, name, email, bus_id, route_id, status, created_at
}

admins: {
  _id, user_id, name, email, created_at
}

buses: {
  _id, bus_number, driver_id, route_id, status, is_accessible,
  current_location: { lat, lng }, speed, heading, trip_active, last_updated
}

routes: {
  _id, name, stops: [{ id, name, lat, lng, order, minutes_from_start }],
  polyline: [[lat, lng]], schedule_time, created_at
}

notifications: {
  _id, user_id, bus_id, type, message, priority, read, created_at
}

sos_alerts: {
  _id, user_id, bus_id, location: { lat, lng }, status, message,
  priority, score, created_at
}

location_history: {
  _id, bus_id, location: { lat, lng }, speed, timestamp
}

live_locations: {
  _id, bus_id, driver_id, trip_id, location: { lat, lng },
  speed, heading, status, updated_at
}

trip_sessions: {
  _id, driver_id, bus_id, route_id, status, started_at,
  ended_at, start_location
}
```

## API List

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Backend health check |
| POST | `/api/auth/register` | Register student, driver, or admin |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/buses` | List buses |
| GET | `/api/buses/{id}` | Get bus details |
| POST | `/api/buses` | Create bus |
| PUT | `/api/buses/{id}` | Update bus |
| GET | `/api/routes` | List routes |
| POST | `/api/routes` | Create route |
| PUT | `/api/routes/{id}` | Update route |
| POST | `/api/tracking/update` | REST location update |
| POST | `/api/tracking/start-trip` | Driver starts live trip |
| POST | `/api/tracking/stop-trip` | Driver stops live trip |
| GET | `/api/tracking/live-buses` | Active buses |
| GET | `/api/tracking/student-assignment` | Student assigned bus and route |
| POST | `/api/tracking/student-location` | Student Track My Bus GPS update |
| GET | `/api/tracking/bus/{id}` | Latest bus location |
| POST | `/api/tracking/presence-check` | Smart onboard validation |
| GET | `/api/notifications` | User notifications |
| POST | `/api/notifications` | Create alert |
| POST | `/api/notifications/admin-message` | Admin sends live message |
| POST | `/api/notifications/route-change` | Admin broadcasts route change |
| POST | `/api/sos` | Trigger SOS |
| GET | `/api/sos` | Admin SOS list |
| PUT | `/api/sos/{id}/resolve` | Resolve SOS |
| GET | `/api/analytics/overview` | Fleet overview |
| GET | `/api/analytics/punctuality` | Punctuality data |
| GET | `/api/analytics/delays` | Delay history |
| WS | `/ws/{room}` | Realtime bus/admin updates |

## Dummy Login Data

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@routemind.dev` | `student123` |
| Driver | `driver@routemind.dev` | `driver123` |
| Admin | `admin@routemind.dev` | `admin123` |

## Setup Steps

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Paste your MongoDB Atlas URI into backend/.env as MONGODB_URI.
python -m uvicorn app.main:app --reload --port 8000
```

No local MongoDB is required. The backend reads `MONGODB_URI` from `backend/.env` and connects to MongoDB Atlas.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Run Instructions

1. Add the Atlas URI to `backend/.env`.
2. Start FastAPI on port `8000`.
3. Start React/Vite on port `5173`.
4. Login as student, driver, and admin in separate browser tabs.
5. Use the driver dashboard to simulate trip status.
6. Watch live bus movement and alerts in student/admin dashboards.

## Deployment Guide

### Backend

- Deploy FastAPI to Render, Railway, Fly.io, or any Python host.
- Add environment variables:
  - `MONGODB_URI`
  - `DATABASE_NAME`
  - `JWT_SECRET`
  - `FRONTEND_ORIGIN`
- Run with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

- Deploy `frontend` to Vercel or Netlify.
- Set:
  - `VITE_API_URL=https://your-backend-url`
  - `VITE_WS_URL=wss://your-backend-url`
- Build with:

```bash
npm run build
```

## Hackathon Demo Script

1. Open landing page and show the animated light-theme UI.
2. Login as driver, choose `Dharwad Route` or `Hubli Route`, then press Start Trip.
3. Allow browser location permission. RouteMind uses high-accuracy `watchPosition`; it does not silently fall back to Bengaluru coordinates.
4. Login as student, choose the same route and one of its stops, then press Track My Bus.
5. Login as admin and click `Driver of Bus Route Dharwad` or `Driver of Bus Route Hubli` to highlight that bus marker and inspect details.
6. Send route chat messages between driver, student, and admin.
7. Trigger SOS or Breakdown from the driver portal.
8. Resolve the alert in admin. The active warning is removed from admin/student/driver UI state.

## SDM Route Demo Data

Dharwad Route stops:

- Court Circle
- NTTF
- Hosayellapura
- Toll Naka
- Vidyagiri
- Gadhinagar
- SDM Engineering Clg

Hubli Route stops:

- President Hotel
- Navanagar
- SDM Hospital
- YS Colony
- SDM College

Both routes end at SDM Engineering College, Dharwad, which is highlighted on the map.

## Real vs Demo Features

Real when FastAPI + Atlas are running:

- Signup/login stores users in MongoDB Atlas.
- Student, driver, and admin profile collections are created.
- Role-based JWT authentication protects APIs.
- Driver start/stop trip writes trip sessions.
- Driver live location updates are stored in `live_locations` and `location_history`.
- Multiple active drivers/buses can be tracked independently.
- Admin sees all active buses and SOS/breakdown events in real time.
- Students can track their own GPS location and assigned bus on one map.
- SOS, breakdown, route-change, and admin messages broadcast over WebSockets.
- Bus-near-stop notifications are generated when a bus is close to a stop.

Demo fallback when backend is offline:

- Login falls back to local demo accounts.
- Bus movement is simulated on predefined routes.
- Smart presence returns a simulated result if the backend is unavailable.
- Dashboard cards and maps remain usable for UI presentation.
