const cron = require('node-cron');
const runAllScrapers = require('../scrapers/run-scrapers');

function startScheduler() {
  cron.schedule('0 2 * * *', () => {
    console.log('Running scheduled scraping task...');
    runAllScrapers().catch((error) => {
      console.error('Scheduled scraping failed:', error);
    });
  });

  console.log('Scheduler started - will run daily at 2:00 AM');
}

module.exports = startScheduler;
