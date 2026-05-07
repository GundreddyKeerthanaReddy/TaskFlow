# TaskFlow — Project & Task Management Platform

A production-ready, full-stack SaaS-style project management application built with React, Node.js, Express, and MongoDB. TaskFlow enables teams to plan, track, and collaborate on projects with a modern Kanban board, analytics dashboard, and real-time activity feeds.

---





## Features

- **Authentication** — JWT-based login/register with role-based access (Admin / Member)
- **Dashboard** — Real-time stats, activity feed, productivity charts
- **Project Management** — Create, edit, delete projects with progress tracking and team assignment
- **Task Management** — Full CRUD with priority levels, due dates, assignees, checklists, and comments
- **Kanban Board** — Drag-and-drop board with 4 columns (To Do / In Progress / In Review / Completed)
- **Team Collaboration** — Team creation, member management, role assignment
- **Analytics** — Productivity charts, completion rates, team performance metrics
- **Notifications** — In-app notification center with read/unread state
- **Activity Log** — Full audit trail of all project and task actions
- **Dark / Light Mode** — System-aware theme with manual toggle
- **Responsive Design** — Mobile-first layout with collapsible sidebar
- **Search & Filtering** — Global search, status/priority/project filters

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| State Management | Zustand |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Icons | Lucide React |
| Toasts | react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| File Upload | Multer |
| Security | Helmet, CORS, express-rate-limit |
| Validation | express-validator |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers (auth, users, projects, tasks, teams, analytics, notifications, activities)
│   │   ├── middleware/      # auth, error handling, validation
│   │   ├── models/          # Mongoose schemas (User, Project, Task, Team, ActivityLog, Notification)
│   │   ├── routes/          # Express routers
│   │   ├── utils/           # seed.js for demo data
│   │   └── server.js        # App entry point
│   ├── .env.example
│   ├── package.json
│   └── railway.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/      # AppLayout, AuthLayout, Sidebar, Topbar
    │   │   ├── notifications/
    │   │   ├── projects/
    │   │   ├── tasks/
    │   │   └── ui/          # Avatar, Badge, Modal, ProgressBar, Skeleton, etc.
    │   ├── lib/             # Axios API client
    │   ├── pages/           # All page components
    │   ├── store/           # Zustand stores (auth, theme)
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

### 4. Seed demo data (optional)

```bash
cd backend
npm run seed
```

This creates 5 demo users, 5 projects, 12 tasks, and sample activity/notification data.

**Demo credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskflow.com | password123 |
| Member | sarah@taskflow.com | password123 |
| Member | marcus@taskflow.com | password123 |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET` | Secret key for JWT signing | _(required)_ |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `NODE_ENV` | Environment (`development`/`production`) | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `/api` |

---

## API Endpoints Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| PUT | `/api/auth/change-password` | Change password |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/stats` | Get project statistics |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (with filters) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/move` | Move task (Kanban) |
| POST | `/api/tasks/:id/comments` | Add comment |
| DELETE | `/api/tasks/:id/comments/:commentId` | Delete comment |
| PATCH | `/api/tasks/:id/checklist/:itemId` | Update checklist item |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List user's teams |
| POST | `/api/teams` | Create team |
| GET | `/api/teams/:id` | Get team details |
| PUT | `/api/teams/:id` | Update team |
| DELETE | `/api/teams/:id` | Delete team |
| POST | `/api/teams/:id/members` | Add member |
| DELETE | `/api/teams/:id/members/:userId` | Remove member |
| PATCH | `/api/teams/:id/members/:userId/role` | Update member role |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard overview stats |
| GET | `/api/analytics/productivity` | Productivity chart data |
| GET | `/api/analytics/team` | Team performance data |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/settings` | Update settings |
| POST | `/api/users/avatar` | Upload avatar |
| GET | `/api/users/:id/stats` | Get user stats |

---

## Deployment

### Railway (Recommended)

#### Backend

1. Create a new Railway project
2. Add a MongoDB service (or use MongoDB Atlas)
3. Deploy the `backend/` directory
4. Set environment variables in Railway dashboard:
   - `MONGODB_URI` — your MongoDB connection string
   - `JWT_SECRET` — a strong random secret
   - `NODE_ENV=production`
   - `CLIENT_URL` — your frontend URL

#### Frontend

1. Create another Railway service for the frontend
2. Deploy the `frontend/` directory
3. Set `VITE_API_URL` to your backend Railway URL (e.g., `https://taskflow-api.railway.app/api`)
4. Build command: `npm run build`
5. Start command: `npx serve dist`

### Manual Production Build

```bash
# Backend
cd backend
NODE_ENV=production npm start

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with any static file server
```

---

## Database Models

| Model | Key Fields |
|-------|-----------|
| **User** | name, email, password (hashed), role, avatar, jobTitle, notifications |
| **Project** | name, description, status, priority, owner, members, taskCount, dueDate |
| **Task** | title, status, priority, project, assignees, checklist, comments, dueDate |
| **Team** | name, owner, members (with roles), color |
| **ActivityLog** | actor, action, entityType, entityId, project, description |
| **Notification** | recipient, sender, type, title, message, isRead |

---

## License

MIT — free to use and modify.
