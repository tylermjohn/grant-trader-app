const scrapeOpenPhilGrants = require('./openphil-scraper');
const scrapeSFFGrants = require('./sff-scraper');
const scrapeManifundGrants = require('./manifund-scraper');
const db = require('../src/database');

async function runAllScrapers() {
  console.log('Starting all scrapers...');

  try {
    await scrapeOpenPhilGrants();
    await scrapeSFFGrants();
    await scrapeManifundGrants();

    console.log('All scrapers completed successfully');

    await resolvePredictions();
  } catch (error) {
    console.error('Error running scrapers:', error);
  } finally {
    db.close();
  }
}

async function resolvePredictions() {
  console.log('Resolving predictions...');

  return new Promise((resolve, reject) => {
    const query = `
      SELECT p.id, p.organization_id, p.funder, p.prediction_year
      FROM predictions p
      WHERE p.resolved = 0
        AND p.prediction_year <= ?
    `;

    const currentYear = new Date().getFullYear();

    db.all(query, [currentYear], (err, predictions) => {
      if (err) {
        return reject(err);
      }

      let processed = 0;
      const total = predictions.length;

      if (total === 0) {
        console.log('No predictions to resolve');
        return resolve();
      }

      predictions.forEach((prediction) => {
        const sumQuery = `
          SELECT COALESCE(SUM(amount), 0) as total
          FROM grants
          WHERE organization_id = ?
            AND funder = ?
            AND grant_year = ?
        `;

        db.get(
          sumQuery,
          [prediction.organization_id, prediction.funder, prediction.prediction_year],
          (err, result) => {
            if (err) {
              console.error('Error calculating actual amount:', err);
            } else {
              db.run(
                `UPDATE predictions
                 SET actual_amount = ?, resolved = 1, resolution_date = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [result.total, prediction.id],
                (err) => {
                  if (err) {
                    console.error('Error updating prediction:', err);
                  }
                }
              );
            }

            processed++;
            if (processed === total) {
              console.log(`Resolved ${total} predictions`);
              resolve();
            }
          }
        );
      });
    });
  });
}

if (require.main === module) {
  runAllScrapers();
}

module.exports = runAllScrapers;
