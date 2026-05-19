const axios = require('axios');
const db = require('../src/database');

const CSV_URL = 'https://www.openphilanthropy.org/wp-admin/admin-ajax.php?action=generate_grants&nonce=fad5e78bf3';

async function scrapeOpenPhilGrants() {
  console.log('Starting Open Philanthropy/Coefficient Giving scraper...');

  try {
    const response = await axios.get(CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GrantTrader/1.0)',
      },
    });

    const csvData = response.data;
    const lines = csvData.split('\n');
    const grants = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = parseCSVLine(line);
      if (parts.length < 5) continue;

      const grantTitle = parts[0];
      const orgName = parts[1] || grantTitle;
      const focusArea = parts[2];
      const amountText = parts[3];
      const dateText = parts[4];

      let amount = 0;
      if (amountText) {
        const cleanAmount = amountText.replace(/[$,]/g, '');
        amount = parseFloat(cleanAmount);
      }

      let grantDate = new Date();
      if (dateText) {
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
          grantDate = parsedDate;
        }
      }

      if (orgName && amount > 0) {
        grants.push({
          name: orgName,
          amount,
          date: grantDate,
          year: grantDate.getFullYear(),
          description: focusArea,
          url: 'https://www.openphilanthropy.org/grants/',
          funder: 'CG',
        });
      }
    }

    console.log(`Found ${grants.length} grants from Open Philanthropy/Coefficient Giving`);

    for (const grant of grants) {
      await saveGrant(grant);
    }

    console.log('Open Philanthropy/Coefficient Giving scraping completed');
  } catch (error) {
    console.error('Error scraping Open Philanthropy:', error.message);
  }
}

function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  parts.push(current.trim());
  return parts;
}

async function saveGrant(grant) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM organizations WHERE name = ? AND funder = ?',
      [grant.name, grant.funder],
      (err, org) => {
        if (err) {
          return reject(err);
        }

        if (org) {
          saveGrantRecord(org.id, grant, resolve, reject);
        } else {
          db.run(
            'INSERT INTO organizations (name, description, funder) VALUES (?, ?, ?)',
            [grant.name, grant.description, grant.funder],
            function (err) {
              if (err) {
                return reject(err);
              }
              saveGrantRecord(this.lastID, grant, resolve, reject);
            }
          );
        }
      }
    );
  });
}

function saveGrantRecord(orgId, grant, resolve, reject) {
  db.get(
    'SELECT id FROM grants WHERE organization_id = ? AND grant_year = ? AND amount = ?',
    [orgId, grant.year, grant.amount],
    (err, existingGrant) => {
      if (err) {
        return reject(err);
      }

      if (existingGrant) {
        return resolve();
      }

      db.run(
        `INSERT INTO grants (organization_id, funder, amount, grant_date, grant_year, description, source_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orgId,
          grant.funder,
          grant.amount,
          grant.date.toISOString().split('T')[0],
          grant.year,
          grant.description,
          grant.url,
        ],
        (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    }
  );
}

module.exports = scrapeOpenPhilGrants;
