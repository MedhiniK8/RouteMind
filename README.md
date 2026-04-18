Team Name: FusionOps
College Name: KLE Technological University(BVB Campus)

📘 RouteMind – Smart Campus Bus Tracking System

📌 Project Overview

RouteMind is an AI-powered smart transportation system designed to improve campus bus management. It enables real-time tracking, accurate ETA prediction, emergency handling, and seamless communication between students, drivers, and administrators.

---

🚀 How to Run the Project

1. Open the folder
2. Double-click **index.html**
3. Use demo login:

   * Student / Driver / Admin
4. Explore features through dashboard

(No installation required – runs directly in browser)

---

🎯 Core Features

* 📍 Real-time bus tracking (simulated GPS updates)
* 🧠 AI-based ETA prediction
* 🚨 SOS emergency alert system
* 📊 Admin analytics dashboard
* 🛡️ Smart presence detection (verify student is inside bus)
* ♿ Accessibility filter for buses

---

👥 User Roles & Flow

🎓 Student

* Select boarding stop
* Track live bus location
* View ETA
* Confirm presence in bus
* Trigger SOS if needed

🧑‍✈️ Driver

* Start trip
* Share live location
* Update status
* Receive admin messages

🧑‍💼 Admin

* Monitor all buses
* Detect delays
* Respond to SOS alerts
* Communicate with drivers
* View analytics

---

🔄 System Flowchart

```
            +-------------------+
            |   Start System    |
            +-------------------+
                     |
                     v
        +---------------------------+
        | User Login (Role Select)  |
        | Student / Driver / Admin  |
        +---------------------------+
                     |
        -------------------------------
        |             |              |
        v             v              v

   +-----------+  +-----------+  +-------------+
   |  Student  |  |  Driver   |  |    Admin    |
   +-----------+  +-----------+  +-------------+
        |             |              |
        v             v              v

  Select Stop     Start Trip     Monitor Buses
        |             |              |
        v             v              v

  View Live Map   Send GPS Data   Track All Routes
        |             |              |
        v             v              v

  Check ETA       Update Status   Detect Delays
        |             |              |
        v             v              v

 Confirm Presence  Receive Msg    Handle Alerts
        |             |              |
        v             v              v

   Trigger SOS  <----Communication----> Respond to SOS
        |                                   |
        v                                   v

  Alert Admin -----------------------> Take Action
                     |
                     v
            +-------------------+
            |   End / Continue  |
            +-------------------+
```

---

🧠 Technology Stack

* Frontend: HTML, CSS, JavaScript
* Maps: Leaflet + OpenStreetMap
* Real-time simulation using JavaScript
* Role-based dynamic UI

---

🔮 Future Enhancements

* Real GPS integration via mobile devices
* Backend integration (Node.js / Firebase)
* Machine learning for traffic prediction
* Attendance integration with student ID

---

📎 Notes

* This project uses simulated real-time data for demonstration
* Designed for scalability into a full production system

---

🏁 Conclusion

RouteMind transforms traditional campus transportation into a **smart, safe, and efficient system**, improving user experience and operational control.

---
