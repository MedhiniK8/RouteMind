# RouteMind - AI-Powered Smart College Bus Tracking & Management System

RouteMind is a production-style hackathon project for real-time college bus tracking, driver coordination, student convenience, and management visibility. It uses React, Tailwind CSS, FastAPI, MongoDB Atlas, WebSockets, Leaflet, and OpenStreetMap.

---

## 🚀 Full System Working

Drivers start a trip from the driver dashboard. Their device shares high-precision GPS (latitude & longitude) through WebSockets every few seconds. The FastAPI backend calculates live speed, updates MongoDB Atlas, runs ETA and delay logic, and broadcasts the latest bus state to students and admins.

Students see the assigned bus moving live on a map with ETA, speed, notifications, and SOS. Admins monitor all buses, alerts, and analytics in real time.

---

## 👨‍🎓 Student Flow

1. Login as student  
2. Click **Track My Bus**  
3. Allow GPS permission  
4. Choose:
   - Route (Dharwad / Hubli)
   - Stop  
5. View:
   - Live bus movement  
   - ETA  
   - Notifications  
6. Chat with assigned driver  
7. Trigger SOS if needed  

---

## 🧑‍✈️ Driver Flow

1. Login as driver  
2. Initially status = **Inactive**  
3. Click **Start Trip**  
4. Choose bus route:
   - Dharwad Route  
   - Hubli Route  
5. GPS tracking starts using **real device location (watchPosition)**  
6. Driver appears as a moving **bus icon on map**  
7. Can:
   - Chat with admin  
   - Chat with route-based students  
   - Send SOS / Breakdown alerts  

---

## 🧑‍💼 Admin Flow

1. Login as admin  
2. View all buses live  
3. Select:
   - Dharwad driver  
   - Hubli driver  
4. See:
   - Live location  
   - Speed  
   - Route  
5. Manage:
   - Alerts (SOS / Breakdown)  
   - Chat with drivers  

---

## 📍 Routes

### Dharwad Route
- Court Circle  
- NTTF  
- Hosayellapura  
- Toll Naka  
- Vidyagiri  
- Gadhinagar  
- SDM Engineering Clg  

### Hubli Route
- President Hotel  
- Navanagar  
- SDM Hospital  
- YS Colony  
- SDM College  

👉 Both routes end at **SDM Engineering College, Dharwad** (highlighted on map)

---

## ⚡ Real-Time Tracking

- Uses **browser GPS (watchPosition)**  
- No fallback to incorrect Bengaluru location  
- Bus icon moves live on map  
- Student & admin see updates instantly  

---

## 🔔 Notifications

- Appear at **top-right (professional UI)**  
- Auto-dismiss after **3 seconds**  
- Includes:
  - Bus started  
  - Bus on the way  
  - SOS / Breakdown  
  - Alerts resolved (auto removed)  

---

## 💬 Chat System

- Driver ↔ Admin chat  
- Driver ↔ Students (route-based)  
- Students only see messages for their selected route  

---

## 🧠 Smart Features

- ETA calculation  
- Speed detection  
- Delay detection  
- Route-based filtering  
- SOS priority alerts  

---

## 🗄️ Tech Stack

- Frontend: React + Tailwind CSS  
- Backend: FastAPI  
- Database: MongoDB Atlas  
- Realtime: WebSockets  
- Maps: Leaflet + OpenStreetMap  

---

## ⚙️ Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000