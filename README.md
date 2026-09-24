# 🔎 FindBack — AI-Powered Lost & Found Platform

> **Find What Was Lost. Return What Was Found.**  
> A complete, production-ready MERN Stack (MongoDB, Express, React, Node.js) platform powered by Google Gemini AI, Cloudinary, and Socket.IO for real-time peer coordination and safe item returns.

---

## 🌟 Key Features

1. **SmartMatch AI Engine**: Automatically compares newly reported lost & found items using Google Gemini AI, calculating similarity scores across category, brand, model, color, description, and proximity.
2. **Explainable AI**: Plain-language explanations of why two reports may correspond to the same item, highlighting that final ownership is established through human verification.
3. **Confidential Ownership Proof**: Claimants must provide hidden identifying details (e.g. phone wallpaper, keychain charms, scratches) before items are returned.
4. **Real-time Peer Messaging**: Peer-to-peer chat powered by Socket.IO with typing indicators, online status, and instant delivery.
5. **Geospatial Proximity Radar**: MongoDB 2dsphere queries supporting distance-based item searches (1km, 5km, 10km, 25km radius).
6. **Campus & Enterprise Hubs**: Organization mode for colleges, universities, hostels, and workplaces to manage community lost & found desks.
7. **Comprehensive Admin Dashboard**: Interactive Recharts analytics for category distribution, lost vs. found trends, user management, and abuse reports.
8. **Dark / Light / System Mode**: Full Tailwind theme support persisted in localStorage.

---

## 🏗️ Architecture & Technology Stack

```text
       React.js (Vite) + Tailwind CSS + Lucide + Recharts
                             │
                      REST API / Axios
                             │
                             ▼
              Node.js + Express.js Backend
         (JWT Auth, Rate Limiting, Helmet, Multer)
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  MongoDB + Mongoose     Gemini AI          Socket.IO
(2dsphere + Text Index) (SmartMatch Engine) (Live Chat & Alerts)
```

---

## 📂 Project Structure

```text
LostAndFound/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI, Layout, Item Cards
│   │   ├── context/            # Auth, Theme, Socket, Notifications
│   │   ├── layouts/            # RootLayout, DashboardLayout, AdminLayout
│   │   ├── pages/              # Home, Explore, ItemDetails, Matches, Claims, Chat
│   │   ├── services/           # Axios API instance
│   │   ├── App.jsx             # Main router
│   │   ├── main.jsx            # Context tree & Toaster
│   │   └── index.css           # Tailwind base & glassmorphism
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── ai/                 # Gemini SmartMatch AI Engine & Fallbacks
│   │   ├── config/             # MongoDB, Cloudinary, Gemini AI setup
│   │   ├── controllers/        # Auth, Items, Claims, Matches, Admin, Sockets
│   │   ├── middleware/         # JWT Auth, Role RBAC, Uploads, Rate Limiter
│   │   ├── models/             # 12 Mongoose Models
│   │   ├── routes/             # REST API Endpoints
│   │   ├── seed/               # Database Seeding Script
│   │   ├── sockets/            # Socket.IO Chat & Notifications
│   │   └── index.js            # Express server entry point
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start & Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance (MongoDB Atlas connection string or local MongoDB on `mongodb://127.0.0.1:27017/findback`)

### 1. Backend Setup

```powershell
cd server
npm install
```

Configure your environment variables in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/findback?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key_optional
CLOUDINARY_CLOUD_NAME=your_cloudinary_name_optional
CLOUDINARY_API_KEY=your_cloudinary_key_optional
CLOUDINARY_API_SECRET=your_cloudinary_secret_optional
CLIENT_URL=http://localhost:5173
```

### 2. Seed Demo Data

Populate the database with sample categories, demo users, lost/found items, and an AI match:

```powershell
npm run seed
```

### 3. Start Backend Server

```powershell
npm run dev
# Server runs on http://localhost:5000
```

### 4. Frontend Setup

Open a new terminal window:

```powershell
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔑 Demo Accounts

Use these pre-seeded accounts to test all platform roles:

```
| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Admin** | `admin@findback.com` | `password123` | Full access: Analytics, User role management, Abuse reports |
| **Moderator** | `moderator@findback.com` | `password123` | Content review, claim resolution, abuse logs |
| **Regular User** | `user@findback.com` | `password123` | Report items, AI matches, submit claims, chat |
```

---

## 🛡️ Privacy & AI Safety Principles

1. **Non-Authoritative AI**: The SmartMatch engine provides similarity scores and match rationales, but **never** makes unilateral decisions regarding ownership.
2. **Private Identifying Details**: Serial numbers, private identifying marks, and claimant verification answers are never exposed in public listing payloads.
3. **Two-Way Confirmation**: An item is only flagged as `returned` once both the finder and claimant have registered handover completion.

---

### 📄 License

This project is licensed under the **MIT License**.

---

### 👨‍💻 Author

**Karan Maurya**

- GitHub: [@karanaurya-git](https://github.com/karanaurya-git)
- LinkedIn: [karan-maurya-4260b6293/](https://linkedin.com/in/karan-maurya-4260b6293/)

If you found this project helpful, don't forget to ⭐ the repository.
