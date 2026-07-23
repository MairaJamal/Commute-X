# 🚗 Commute‑X — Smart Carpooling Platform

A smart carpool matching platform that connects commuters with similar routes and lets them share rides using their preferred ride‑hailing service (Uber, Careem, InDrive, Yango, etc.).
Our mission: make commuting cheaper, smarter, and more sustainable.

---

## ⚙️ Getting Started

First, run the development server:

```bash
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

---

## 💡 Problem
Daily commuters often travel to the same destinations separately, leading to:
- Higher travel costs
- More traffic congestion
- Increased carbon emissions

---

## 🧠 Solution
Commute‑X is **not** a ride‑hailing service.
It matches users with similar routes and schedules, helping them coordinate and share rides through existing apps.

---

## 🧭 How It Works
1. Users create an account.
2. Enter pickup, destination, and preferred departure time.
3. System finds matching routes.
4. Both users get notified and can accept/decline.
5. If matched, they choose a ride‑hailing app.
6. One user books the ride.
7. Fare split is calculated automatically.
8. After the ride, users can rate each other.

---

## 🔑 Features

Good catch — based on what we've actually seen in the codebase, here's an updated split. I moved the ones I can confirm are implemented (AI matching, women-only matching, recurring commute frequency, SOS) into Features, and kept the ones I haven't seen evidence of in Future Enhancements:

markdown
## 🔑 Features

### 👥 User Features
- Registration & login
- AI‑based smart ride matching
- Women‑only ride matching
- Daily recurring commute groups (departure time, days of week, frequency)
- Interactive map
- Fare split calculator
- In‑app chat
- Ride history
- Ratings & reviews
- Notifications
- Emergency SOS feature
- 
---

## 📚 Learn More
To learn more about Next.js:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)

---


## 🛠 Tech Stack
- **Next.js**
- **TypeScript**
- **Node.js / Express** (optional backend)
- **MongoDB / Firebase** (database)
- **Vercel** (deployment)

---

## 📄 License
This project is licensed under the **MIT License**.

---

## ✨ Value Proposition
Commute‑X complements existing ride‑hailing services by helping passengers share rides they already intend to book.
This saves money, reduces congestion, and contributes to a greener environment.
