# Export Order Management System

## Tech Stack
- **Backend:** Node.js + Express
- **Frontend:** React + Material UI
- **Database:** MySQL

## Setup

### Prerequisites
- Node.js v18+
- MySQL 8.0+

### 1. Database Setup
```bash
cd server
# Edit .env with your MySQL credentials
npm run db:migrate
npm run db:seed
```

### 2. Start Backend
```bash
cd server
npm run dev
```

### 3. Start Frontend
```bash
cd client
npm start
```

### Default Login
- Username: `admin`
- Password: `admin123`

## Project Structure
```
export-app/
├── server/
│   ├── src/
│   │   ├── db/          # Database connection & migrations
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth middleware
│   │   ├── utils/       # Number-to-words, financial year
│   │   └── templates/   # PDF templates
│   └── .env
├── client/
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Page components
│       ├── services/    # API service layer
│       └── context/     # React context (auth state)
└── README.md
```
