# Quick Start Guide

## Prerequisites

Before you begin, make sure you have:
- Node.js (v14 or higher) installed
- npm (comes with Node.js)

Check if you have these installed:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

## Installation

### Option 1: Automated Setup (Recommended)

Run the setup script:
```bash
cd grant-trader
./setup.sh
```

This will:
- Install all dependencies
- Set up the database
- Prepare both backend and frontend

### Option 2: Manual Setup

1. **Backend Setup**
```bash
cd grant-trader/backend
npm install
npm run migrate
```

2. **Frontend Setup**
```bash
cd grant-trader/frontend
npm install
```

## Running the Application

You need two terminal windows:

### Terminal 1: Backend Server
```bash
cd grant-trader/backend
npm run dev
```

The backend will start on http://localhost:3001

### Terminal 2: Frontend Server
```bash
cd grant-trader/frontend
npm start
```

The frontend will start on http://localhost:3000 and should open in your browser automatically.

## Initial Data Setup

The application will work without any data, but to get started with real grant data:

```bash
cd grant-trader/backend
npm run scrape
```

This will fetch grant data from Open Philanthropy and SFF websites.

**Note**: The scrapers may need adjustments depending on the current structure of the OP and SFF websites.

## First Steps

1. **Register an Account**: Go to http://localhost:3000 and click "Register"
2. **Browse Organizations**: Explore the market to see available organizations
3. **Make a Prediction**: Click on an organization and submit a prediction
4. **View Your Profile**: Check your prediction accuracy and statistics

## Common Issues

### Port Already in Use

If port 3000 or 3001 is already in use:

**Backend**: Edit `backend/.env` and change `PORT=3001` to another port

**Frontend**: The app will prompt you to use a different port automatically

### Database Errors

If you see database errors, try resetting:
```bash
cd grant-trader/backend
rm database.sqlite
npm run migrate
```

### Missing Dependencies

If you get module not found errors:
```bash
cd grant-trader/backend
npm install

cd grant-trader/frontend
npm install
```

## Development Mode

The app is configured for development by default:
- Backend auto-restarts on file changes (using nodemon)
- Frontend hot-reloads on file changes
- Database is SQLite (stored in `backend/database.sqlite`)

## Next Steps

- Read the full README.md for detailed documentation
- Explore the API endpoints
- Customize the scrapers for your needs
- Add more organizations manually if needed

## Manual Data Entry

If scrapers don't work, you can add data manually through the SQLite database:

```bash
cd grant-trader/backend
sqlite3 database.sqlite

# Example: Add an organization
INSERT INTO organizations (name, funder, description) VALUES ('Example Org', 'OP', 'Test organization');

# Example: Add a grant
INSERT INTO grants (organization_id, funder, amount, grant_date, grant_year) VALUES (1, 'OP', 100000, '2024-01-01', 2024);
```

## Support

If you encounter issues:
1. Check the console logs in both terminals
2. Verify all dependencies are installed
3. Ensure ports 3000 and 3001 are available
4. Try the manual setup steps

Happy predicting!
