# Career Atlas 🧭

🌐 **Live Demo:** [https://career-atlas-nextstep.onrender.com/](https://career-atlas-nextstep.onrender.com/)

Career Atlas is an interactive, premium career path exploration and mapping platform designed to navigate educational milestones, degrees, entrance exams, and professional occupations. It guides students through the branching requirements of secondary, higher secondary, undergraduate, and postgraduate pathways, complete with real-time smart college recommendations and pathway validation rules.

---

## 🚀 Key Features

*   **Interactive Roadmap Explorer**: Visually trace educational paths using an interactive node canvas built with `@xyflow/react`. Nodes dynamically expand and collapse to show milestones, degrees, exams, and target occupations.
*   **Intelligent Pathfinding Engine**: Calculates optimal academic and professional roadmaps, validating prerequisite subjects and entrance exam gates.
*   **Smart College Recommender**: Recommends institutes and universities based on offered degrees, NIRF rankings, budget/fees, and location criteria.
*   **Crowdsourced Suggestions**: Allows visitors to submit suggestions for new careers, degrees, or requirements directly from the site.
*   **Admin Dashboard Logs**: Administrative console to review suggestions, dynamically edit nodes/requirements, audit graph health, and track system logs.
*   **Premium Aesthetic & Micro-animations**: Sleek glassmorphic card elements, custom animated dropdowns, dark/light theme options, and fluid UI interactions powered by `framer-motion` and `lucide-react`.

---

## 🛠 Tech Stack

*   **Frontend**: React (v19), TypeScript, Vite, Zustand (state management), Tailwind CSS (styling), Framer Motion (animations), React Flow (graph UI).
*   **Backend**: Node.js, Express, TypeScript, Mongoose/MongoDB (data storage), Helmet & CORS (security), Morgan (logging).
*   **Monorepo Workspace**: Powered by npm workspaces to manage both directories cleanly.

---

## 💻 Local Development Setup

### Prerequisite
Ensure you have **Node.js** (v18+) and **MongoDB** (local community server or Atlas cluster) installed.

### 1. Install Dependencies
In the root folder of the project, install all frontend and backend dependencies simultaneously:
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env` configuration files for both services:

*   **Backend** (`backend/.env`):
    ```env
    PORT=5000
    MONGODB_URI=your-mongodb-connection-string
    NODE_ENV=development
    ```
*   **Frontend** (`frontend/.env`):
    ```env
    VITE_API_BASE_URL=http://localhost:5000/api/v1
    VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
    ```

### 3. Seed the Database
Run the seeder scripts from the root directory to populate your database with nodes, rules, and college mapping metadata:
```bash
# Import the master graph nodes and connections
npm run seed

# Generate the dynamic pathfinding rules
npm run backend:dev -- ts-node src/seeds/seed-rules.ts

# Import the college program offerings
npm run backend:dev -- ts-node src/seeds/seed-institute-courses.ts
```

### 4. Launch Dev Servers
Start both the backend API and the Vite frontend dev server:
```bash
# Start backend (on port 5000)
npm run backend:dev

# Start frontend (on port 5173)
npm run frontend:dev
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Deployment on Render

The production website is live and hosted at: [https://career-atlas-nextstep.onrender.com/](https://career-atlas-nextstep.onrender.com/)

This project is structured as a monorepo, making it extremely easy to host:

1.  **Backend Web Service**:
    *   **Root Directory**: `backend`
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm run start`
    *   **Env Variables**: `MONGODB_URI` (pointing to your MongoDB Atlas cluster), `NODE_ENV=production`, `PORT=5000`.
2.  **Frontend Static Site**:
    *   **Root Directory**: `frontend`
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `dist`
    *   **Env Variables**: `VITE_API_BASE_URL` (your deployed backend API url + `/api/v1`), `VITE_GOOGLE_CLIENT_ID` (for Google authentication).
    *   **SPA Rewrite Rule (Critical)**: Add a rewrite rule under *Redirects/Rewrites* with Source `/*`, Destination `/index.html`, and Action `Rewrite` to prevent 404s.

---

## 📄 License
This project is private and proprietary. All rights reserved.
