# 🏦 FinEdge — Personal Finance & Expense Tracker API

A comprehensive RESTful API for personal finance management built with **Node.js**, **Express**, and **MVC architecture**. Features include transaction tracking, budget management, analytics, AI-powered saving tips, JWT authentication, and an in-memory cache.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Testing](#testing)

---

## ✨ Features

### Core Features
- ✅ **User Management** — Register, login, profile management with JWT authentication
- ✅ **Transaction Tracking** — Full CRUD for income/expense transactions
- ✅ **Budget Management** — Set monthly goals and savings targets
- ✅ **Income-Expense Summary** — Aggregated financial overview

### Analytics & Reporting (Bonus A)
- 📊 Total income, expenses, and balance calculation
- 🔍 Filter transactions by category, type, and date range
- 📈 Monthly trend analysis

### AI / Automation (Bonus B)
- 💡 AI-powered saving tips based on spending patterns
- 🏷️ Auto-categorize expenses using keyword matching
- ⚡ Real-time updates on new transactions (cache invalidation)

### Data Persistence (Bonus C)
- 💾 JSON file-based persistence using `fs/promises`

### Advanced Middleware (Bonus D)
- 🚦 Rate limiter for API protection
- 🌐 CORS support
- 📝 Request logging middleware
- ⚡ In-memory cache service with TTL expiry for `/summary`

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | Web framework |
| JWT | Authentication |
| fs/promises | File-based data persistence |
| uuid | Unique ID generation |
| cors | Cross-origin resource sharing |
| express-rate-limit | Rate limiting |
| tap + supertest | Testing |
| dotenv | Environment variable management |

---

## 📁 Project Structure (MVC Architecture)

```
FinEdge-Personal-Finance-Expense-Tracker-API/
├── app.js                          # Application entry point
├── package.json
├── .env                            # Environment variables
├── .env.example                    # Environment template
├── data/                           # JSON data files (auto-created)
│   ├── users.json
│   ├── transactions.json
│   └── budgets.json
├── src/
│   ├── config/
│   │   └── index.js                # Centralized configuration
│   ├── models/                     # Data layer (Model)
│   │   ├── FileStore.js            # Generic JSON file persistence
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Budget.js
│   ├── controllers/                # Request handlers (Controller)
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   ├── budgetController.js
│   │   └── summaryController.js
│   ├── services/                   # Business logic layer
│   │   ├── userService.js
│   │   ├── transactionService.js
│   │   ├── budgetService.js
│   │   └── summaryService.js
│   ├── routes/                     # Route definitions (View routing)
│   │   ├── index.js
│   │   ├── userRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── budgetRoutes.js
│   │   └── summaryRoutes.js
│   ├── middleware/                  # Custom middleware
│   │   ├── auth.js                 # JWT authentication
│   │   ├── errorHandler.js         # Global error handler
│   │   ├── logger.js               # Request logging
│   │   └── validators.js           # Input validation
│   └── utils/                      # Utilities
│       ├── cache.js                # In-memory cache with TTL
│       ├── errors.js               # Custom error classes
│       └── helpers.js              # Helper functions & AI logic
└── test/
    └── api.test.js                 # Comprehensive test suite
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js >= 18.0.0
- npm

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd FinEdge-Personal-Finance-Expense-Tracker-API

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Start development server
npm run dev

# 5. Verify server is running
curl http://localhost:3000/health
```

---

## 📖 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
All endpoints except `/health`, `POST /users`, and `POST /users/login` require a JWT token:
```
Authorization: Bearer <your-jwt-token>
```

---

### 🏥 Health Check

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Verify server is running |

---

### 👤 User Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/users` | ❌ | Register new user |
| POST | `/users/login` | ❌ | Login and get JWT token |
| GET | `/users/profile` | ✅ | Get user profile |
| PATCH | `/users/preferences` | ✅ | Update user preferences |

#### Register User
```json
POST /users
{
  "name": "Sagar",
  "email": "sagar@finedge.com",
  "password": "password123"
}
```

#### Login
```json
POST /users/login
{
  "email": "sagar@finedge.com",
  "password": "password123"
}
// Response includes { user, token }
```

---

### 💳 Transaction Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/transactions` | ✅ | Add income/expense |
| GET | `/transactions` | ✅ | Fetch all transactions |
| GET | `/transactions/:id` | ✅ | View single transaction |
| PATCH | `/transactions/:id` | ✅ | Update transaction |
| DELETE | `/transactions/:id` | ✅ | Delete transaction |

#### Query Parameters for GET /transactions
- `type` — Filter by `income` or `expense`
- `category` — Filter by category (food, transport, etc.)
- `startDate` — Filter from date (YYYY-MM-DD)
- `endDate` — Filter to date (YYYY-MM-DD)

#### Create Transaction
```json
POST /transactions
{
  "type": "expense",
  "amount": 500,
  "description": "Lunch at restaurant",
  "date": "2026-02-10",
  "category": "food"     // optional, auto-detected from description
}
```

---

### 💰 Budget Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/budgets` | ✅ | Create/update budget |
| GET | `/budgets` | ✅ | Fetch all budgets |
| GET | `/budgets/:month` | ✅ | Get budget by month |
| DELETE | `/budgets/:id` | ✅ | Delete budget |

#### Create Budget
```json
POST /budgets
{
  "month": "2026-02",
  "monthlyGoal": 30000,
  "savingsTarget": 20000,
  "categoryBudgets": { "food": 5000, "transport": 3000 }
}
```

---

### 📊 Summary & Analytics Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/summary` | ✅ | Income-expense summary |
| GET | `/summary/trends` | ✅ | Monthly trends |
| GET | `/summary/tips` | ✅ | AI-powered saving tips |
| GET | `/summary/budget/:month` | ✅ | Budget vs actual comparison |

#### Query Parameters for GET /summary
- `month` — Filter by month (YYYY-MM format)

---

## 🧪 Testing

```bash
# Run all tests
npm test
```

The test suite covers:
- ✅ Health check endpoint
- ✅ User registration, login, and profile
- ✅ Transaction CRUD with filtering
- ✅ Budget CRUD
- ✅ Summary and analytics
- ✅ Cache verification
- ✅ Auto-categorization
- ✅ Error handling and edge cases
- ✅ Authentication middleware

---

## 🔧 Configuration

Environment variables (`.env`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | 24h | Token expiry duration |
| `DATA_DIR` | ./data | JSON data storage path |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |
| `CACHE_TTL_SECONDS` | 300 | Cache TTL (5 min) |

---

## 📝 License

ISC
