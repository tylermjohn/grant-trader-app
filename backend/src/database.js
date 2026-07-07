const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite');

// Seed a fresh deployment with bundled grant data (hosts with ephemeral
// disks start with no database file)
const seedPath = path.join(__dirname, '..', 'seed.sqlite');
if (!fs.existsSync(dbPath) && fs.existsSync(seedPath)) {
  fs.copyFileSync(seedPath, dbPath);
  console.log('Seeded database from seed.sqlite');
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

db.run('PRAGMA foreign_keys = ON');

module.exports = db;
