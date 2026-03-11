# IDECO Backend - Production Level Structure

This project is a production-ready Node.js, TypeScript, and Express backend using PostgreSQL.

## Project Structure

```
src/
├── middleware/        # Global middlewares (Auth, Error, Upload)
│   ├── auth.ts
│   ├── error.ts
│   └── upload.ts
├── modules/           # Module-based structure
│   ├── users/         # User registration & login
│   │   ├── user.route.ts
│   │   ├── user.controller.ts
│   │   └── user.model.ts
│   ├── profiles/      # User profile management & Cloudinary
│   │   ├── profile.route.ts
│   │   ├── profile.controller.ts
│   │   └── profile.model.ts
│   └── errors/        # DB-based error logging
│       ├── error.route.ts
│       ├── error.controller.ts
│       └── error.model.ts
├── utils/            # Utility functions
│   ├── cloudinary.ts  # Cloudinary upload logic
│   ├── response.ts    # Standard API response structure
│   └── message.ts     # Global string constants
├── database.ts        # Sequelize connection & config
├── app.ts            # Express application setup
├── route.ts           # Root router
└── server.ts          # Server entry point & DB sync
.env                  # Environment variables
tsconfig.json         # TypeScript configuration
package.json          # Scripts and dependencies
```

## API Response Structure

### Success
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... } or [ ... ]
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "data": { ... }
}
```

## How to Run

1.  Configure `.env` with your PostgreSQL credentials.
2.  Install dependencies: `npm install`
3.  Run in development: `npm run dev`
4.  Build for production: `npm run build`
5.  Start production server: `npm start`
