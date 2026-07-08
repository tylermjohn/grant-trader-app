const db = require('../database');

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    funder TEXT NOT NULL CHECK(funder IN ('OP', 'CG', 'SFF', 'Manifund')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS grants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    funder TEXT NOT NULL CHECK(funder IN ('OP', 'CG', 'SFF', 'Manifund')),
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    grant_date DATE NOT NULL,
    grant_year INTEGER NOT NULL,
    description TEXT,
    source_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  )`,

  `CREATE TABLE IF NOT EXISTS predictions (
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

  `CREATE INDEX IF NOT EXISTS idx_grants_org ON grants(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_grants_year ON grants(grant_year)`,
  `CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_predictions_org ON predictions(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_predictions_year ON predictions(prediction_year)`
];

async function runMigrations() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      migrations.forEach((migration, index) => {
        db.run(migration, (err) => {
          if (err) {
            console.error(`Migration ${index} failed:`, err);
            reject(err);
          } else {
            console.log(`Migration ${index} completed`);
          }
        });
      });

      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          reject(err);
        } else {
          console.log('Migrations completed successfully');
          resolve();
        }
      });
    });
  });
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runMigrations;
