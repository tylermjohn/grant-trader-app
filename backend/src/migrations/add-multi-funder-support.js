const db = require('../database');

// This migration adds support for organizations to have multiple funders
// Instead of org being tied to ONE funder, we'll have a many-to-many relationship

const migrations = [
  // Create organization_funders junction table
  `CREATE TABLE IF NOT EXISTS organization_funders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    funder TEXT NOT NULL CHECK(funder IN ('OP', 'CG', 'SFF', 'Manifund', 'User')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    UNIQUE(organization_id, funder)
  )`,

  // Create index for faster lookups
  `CREATE INDEX IF NOT EXISTS idx_org_funders_org ON organization_funders(organization_id)`,
  `CREATE INDEX IF NOT EXISTS idx_org_funders_funder ON organization_funders(funder)`,

  // Migrate existing data from organizations.funder to organization_funders table
  // This will be done in the migrate function below
];

async function runMigrations() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Run table creation migrations
      migrations.forEach((migration, index) => {
        db.run(migration, (err) => {
          if (err) {
            if (!err.message.includes('already exists')) {
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

      // Migrate existing organization funders
      db.all('SELECT id, funder FROM organizations WHERE funder IS NOT NULL', [], (err, orgs) => {
        if (err) {
          console.error('Error fetching organizations:', err);
          return reject(err);
        }

        console.log(`Migrating ${orgs.length} organization funder associations...`);

        let processed = 0;
        if (orgs.length === 0) {
          console.log('No organizations to migrate');
          return resolve();
        }

        orgs.forEach((org) => {
          db.run(
            'INSERT OR IGNORE INTO organization_funders (organization_id, funder) VALUES (?, ?)',
            [org.id, org.funder],
            (err) => {
              if (err) {
                console.error(`Error migrating org ${org.id}:`, err);
              }
              processed++;
              if (processed === orgs.length) {
                console.log('Multi-funder support migration completed successfully');
                resolve();
              }
            }
          );
        });
      });
    });
  });
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration complete');
      db.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      db.close();
      process.exit(1);
    });
}

module.exports = runMigrations;
