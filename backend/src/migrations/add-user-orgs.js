const db = require('../database');

const migrations = [
  // Add user_submitted column to organizations table
  `ALTER TABLE organizations ADD COLUMN user_submitted BOOLEAN DEFAULT 0`,

  // Add submitted_by column to track which user submitted it
  `ALTER TABLE organizations ADD COLUMN submitted_by INTEGER REFERENCES users(id)`,

  // Update funder CHECK constraint to include Manifund and User
  // SQLite doesn't support ALTER for CHECK constraints, so we'll handle this in the application layer

  // Create index for user-submitted organizations
  `CREATE INDEX IF NOT EXISTS idx_organizations_user_submitted ON organizations(user_submitted)`,
  `CREATE INDEX IF NOT EXISTS idx_organizations_submitted_by ON organizations(submitted_by)`
];

async function runMigrations() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      migrations.forEach((migration, index) => {
        db.run(migration, (err) => {
          if (err) {
            // Ignore "duplicate column" errors for idempotency
            if (!err.message.includes('duplicate column')) {
              console.error(`Migration ${index} failed:`, err);
              reject(err);
            } else {
              console.log(`Migration ${index} already applied (skipped)`);
            }
          } else {
            console.log(`Migration ${index} completed`);
          }
        });
      });

      // Verify the migration worked
      db.get('SELECT COUNT(*) as count FROM organizations', (err, row) => {
        if (err) {
          reject(err);
        } else {
          console.log('User organizations migration completed successfully');
          resolve();
        }
      });
    });
  });
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runMigrations;
