# Grant Trader

A stock market-style trading game for predicting grantmaking decisions by Open Philanthropy, Coefficient Giving, and the Survival and Flourishing Fund.

## Overview

Grant Trader allows users to test their grantmaking judgment by making predictions about future grants. The platform:

- Lists organizations that have received grants from OP, CG, and SFF
- Displays historical grant data including amounts and dates
- Allows users to predict how much funding organizations will receive in future years
- Tracks prediction accuracy with detailed metrics and visualizations
- Automatically scrapes grant data to keep information current

## Features

- **Stock Market-Style Interface**: Browse organizations like stocks, with funding data replacing market metrics
- **Historical Grant Data**: View complete grant history for each organization
- **Prediction System**: Make predictions about future grant amounts by organization and year
- **User Profiles**: Track your prediction accuracy with charts and statistics
- **Leaderboards**: See how your predictions compare to other users
- **Automated Data Updates**: Regular scraping of OP/CG and SFF websites for new grants
- **Prediction Resolution**: Automatic resolution of predictions when new grant data becomes available

## Technology Stack

### Backend
- Node.js with Express
- SQLite database
- JWT authentication
- Web scraping with Axios and Cheerio
- Scheduled tasks with node-cron

### Frontend
- React with React Router
- Recharts for data visualization
- Responsive design with custom CSS

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository and navigate to the project:
```bash
cd grant-trader
```

2. Set up the backend:
```bash
cd backend
npm install
cp .env.example .env
```

3. Edit `.env` and set your JWT secret:
```
JWT_SECRET=your-secure-secret-key-here
```

4. Run database migrations:
```bash
npm run migrate
```

5. (Optional) Run initial data scraping:
```bash
npm run scrape
```

6. Start the backend server:
```bash
npm run dev
```

7. In a new terminal, set up the frontend:
```bash
cd ../frontend
npm install
```

8. Start the frontend development server:
```bash
npm start
```

9. Open your browser to http://localhost:3000

## Usage

### For Users

1. **Register/Login**: Create an account or log in
2. **Browse Organizations**: Explore the market to see organizations and their grant history
3. **Make Predictions**: Click on an organization to view details and submit predictions
4. **Track Progress**: Visit "My Predictions" to see your active predictions
5. **View Profile**: Check your accuracy metrics and prediction history with charts

### For Administrators

#### Running Scrapers Manually

To update grant data:
```bash
cd backend
npm run scrape
```

This will:
- Scrape Open Philanthropy and SFF websites for grant data
- Add new organizations and grants to the database
- Resolve any pending predictions for past years

#### Automated Scraping

The backend includes a scheduler that runs scrapers daily at 2:00 AM. This is automatically started when you run the server.

To disable automatic scraping, remove or comment out the scheduler in `backend/src/server.js`.

## Database Schema

### Tables

- **users**: User accounts with authentication
- **organizations**: Grant recipients (one per funder)
- **grants**: Individual grants with amounts and dates
- **predictions**: User predictions with resolution status

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login

### Organizations
- `GET /api/organizations` - List all organizations (with filters)
- `GET /api/organizations/:id` - Get organization details
- `GET /api/organizations/:id/grants` - Get organization grant history
- `GET /api/organizations/:id/predictions` - Get predictions for organization

### Predictions
- `POST /api/predictions` - Create new prediction (requires auth)
- `GET /api/predictions/my-predictions` - Get current user's predictions (requires auth)
- `GET /api/predictions/user/:userId` - Get user's predictions
- `PUT /api/predictions/:id` - Update prediction (requires auth)
- `DELETE /api/predictions/:id` - Delete prediction (requires auth)

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/stats` - Get user prediction statistics

## How Predictions Work

1. **Making Predictions**: Users predict the total amount an organization will receive from a specific funder in a given year
2. **Prediction Period**: Can predict for current year + 1 through current year + 5
3. **Resolution**: When the predicted year passes and new grant data is available, predictions are automatically resolved
4. **Scoring**: Error is calculated as the absolute difference between predicted and actual amounts
5. **Metrics**: User profiles show average error, percentage error, and accuracy trends over time

## Web Scraping

The application includes scrapers for:

- **Open Philanthropy**: Scrapes grant pages for organization names, amounts, and dates
- **SFF**: Scrapes recommendation pages for grant information

### Important Notes

- Scrapers use CSS selectors that may need updating if source websites change
- Rate limiting and respectful scraping practices are built in
- Manual verification of scraped data is recommended

### Customizing Scrapers

Scrapers are located in `backend/scrapers/`:
- `openphil-scraper.js` - Open Philanthropy scraper
- `sff-scraper.js` - SFF scraper
- `run-scrapers.js` - Orchestrates all scrapers

Update CSS selectors and parsing logic as needed when source sites change.

## Development

### Project Structure

```
grant-trader/
├── backend/
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── migrations/    # Database setup
│   │   ├── database.js    # Database connection
│   │   ├── scheduler.js   # Scheduled tasks
│   │   └── server.js      # Express app
│   ├── scrapers/          # Web scrapers
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── public/
│   └── package.json
└── README.md
```

### Adding New Features

To add support for additional funders:

1. Update database CHECK constraints in `migrations/run.js`
2. Create a new scraper in `backend/scrapers/`
3. Add the scraper to `run-scrapers.js`
4. Update frontend filters and badges

## Production Deployment

### Backend

1. Set `NODE_ENV=production` in `.env`
2. Use a production-grade database (PostgreSQL recommended)
3. Set up proper HTTPS and CORS settings
4. Use PM2 or similar for process management
5. Set up proper logging and monitoring

### Frontend

1. Build the production bundle:
```bash
cd frontend
npm run build
```

2. Serve the build folder with a web server (nginx, Apache, etc.)
3. Configure API proxy or update API URLs

### Database

For production, consider migrating from SQLite to PostgreSQL:
- Update database.js to use pg module
- Adjust SQL syntax as needed
- Set up database backups

## Security Considerations

- Change JWT_SECRET to a strong random value
- Use HTTPS in production
- Implement rate limiting on API endpoints
- Validate and sanitize all user inputs
- Regular security updates for dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Acknowledgments

- Open Philanthropy for their transparent grant data
- Survival and Flourishing Fund for their public recommendations
- The effective altruism community for inspiration

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Future Enhancements

Potential features to add:
- Leaderboard page with top predictors
- Prediction markets with virtual currency
- More granular predictions (e.g., specific grant amounts)
- Email notifications for resolved predictions
- Export prediction data to CSV
- API for third-party integrations
- Mobile app version
- More sophisticated accuracy metrics (Brier scores, calibration)
