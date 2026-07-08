const db = require('../database');

// The predictions table was created before Manifund support was added, so its
// funder CHECK constraint rejects 'Manifund'. SQLite cannot alter a CHECK
// constraint in place, so rebuild the table with the expanded constraint.

async function runMigration() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const statements = [
        `CREATE TABLE predictions_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          organization_id INTEGER NOT NULL,
          funder TEXT NOT NULL CHECK(funder IN ('OP', 'CG', 'SFF', 'Manifund')),
          prediction_year INTEGER NOT NULL,
          predicted_amount REAL NOT NULL,
          actual_amount REAL,
          prediction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved BOOLEAN DEFAULT 0,
          resolution_date DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (organization_id) REFERENCES organizations(id),
          UNIQUE(user_id, organization_id, funder, prediction_year)
        )`,
        `INSERT INTO predictions_new SELECT * FROM predictions`,
        `DROP TABLE predictions`,
        `ALTER TABLE predictions_new RENAME TO predictions`,
        `CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_predictions_org ON predictions(organization_id)`,
        `CREATE INDEX IF NOT EXISTS idx_predictions_year ON predictions(prediction_year)`,
      ];

      statements.forEach((sql, index) => {
        db.run(sql, (err) => {
          if (err) {
            console.error(`Statement ${index} failed:`, err);
            db.run('ROLLBACK');
            reject(err);
          }
        });
      });

      db.run('COMMIT', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('predictions table rebuilt with Manifund support');
          resolve();
        }
      });
    });
  });
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runMigration;
