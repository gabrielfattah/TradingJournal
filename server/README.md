# Trading Journal Backend

## What We Just Created

```
backend/
├── package.json          ← Lists all dependencies (like requirements.txt in Python)
├── tsconfig.json        ← TypeScript configuration (how TS compiles to JS)
├── .env                 ← Secret keys (JWT secret for authentication)
├── src/
│   ├── server.ts        ← Main entry point (Express server)
│   ├── types/
│   │   └── index.ts     ← TypeScript interfaces (User, Trade types)
│   └── data/
│       └── db.json      ← Our "database" (simple JSON file)
```

## Setup Instructions (Windows)

### 1. Install Dependencies
Open PowerShell/CMD in the backend folder and run:
```bash
npm install
```

This installs all packages listed in package.json:
- **express** - Web framework (makes creating APIs easy)
- **jsonwebtoken** - Creates JWT tokens for authentication
- **bcrypt** - Hashes passwords securely
- **cors** - Allows frontend to connect to backend
- **dotenv** - Loads environment variables from .env file

### 2. Start Development Server
```bash
npm run dev
```

You should see: `🚀 Server is running on http://localhost:5000`

### 3. Test It
Open browser and go to: http://localhost:5000
You should see: `{"message":"Trading Journal API is running!"}`

## What's Next?

Together we'll build:
1. ✅ Database helper functions (read/write to db.json)
2. ✅ Authentication routes (register, login)
3. ✅ JWT middleware (protect routes)
4. ✅ Trade CRUD routes (create, read, update, delete)

## Understanding the Stack

### Express.js
Think of it like a router for HTTP requests:
- Someone visits `/api/trades` → Express calls the trades handler
- Someone sends POST to `/api/auth/login` → Express calls login handler

### JWT (JSON Web Token)
When user logs in:
1. Server creates a token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
2. Frontend stores it
3. Frontend sends it with every request: `Authorization: Bearer <token>`
4. Server verifies token → knows which user is making the request

### TypeScript
Same JavaScript you know, but with types:
```typescript
// JavaScript (can be any type)
let user = { name: "Gab" };

// TypeScript (enforces structure)
interface User {
  name: string;
  age: number;
}
let user: User = { name: "Gab", age: 20 }; // Must match interface!
```
