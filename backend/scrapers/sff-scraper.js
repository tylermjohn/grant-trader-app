const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../src/database');

const BASE_URL = 'https://survivalandflourishing.fund';

// All SFF recommendation pages with their dates
const SFF_ROUNDS = [
  { url: '/sff-2023-h2-recommendations', date: '2023-12-01' },
  { url: '/sff-2023-h1-recommendations', date: '2023-06-01' },
  { url: '/sff-2022-h2-recommendations', date: '2022-12-01' },
  { url: '/sff-2022-h1-recommendations', date: '2022-06-01' },
  { url: '/sff-2021-h2-recommendations', date: '2021-12-01' },
  { url: '/sff-2021-h1-recommendations', date: '2021-06-01' },
  { url: '/sff-2020-h2-recommendations', date: '2020-12-01' },
  { url: '/sff-2020-h1-recommendations', date: '2020-06-01' },
];

async function scrapeSFFGrants() {
  console.log('Starting SFF scraper...');

  let totalGrants = 0;

  for (const round of SFF_ROUNDS) {
    try {
      console.log(`Scraping ${round.url}...`);
      const response = await axios.get(`${BASE_URL}${round.url}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GrantTrader/1.0)',
        },
      });

      const $ = cheerio.load(response.data);
      const grants = [];
      const grantDate = new Date(round.date);
      const year = grantDate.getFullYear();

      $('table tr, .grant-list li').each((i, element) => {
        const $el = $(element);

        let name, amountText, description;

        if ($el.is('tr')) {
          const cells = $el.find('td');
          if (cells.length >= 2) {
            name = cells.eq(0).text().trim();
            amountText = cells.eq(1).text().trim();
            description = cells.eq(2) ? cells.eq(2).text().trim() : '';
          }
        } else {
          name = $el.find('.grant-name, strong').first().text().trim();
          amountText = $el.text().match(/\$[\d,]+/)?.[0] || '';
          description = $el.find('p, .description').first().text().trim();
        }

        let amount = 0;
        if (amountText) {
          const matches = amountText.match(/\$?([\d,]+(?:\.\d+)?)\s*(k|K|thousand|million|M)?/i);
          if (matches) {
            amount = parseFloat(matches[1].replace(/,/g, ''));
            if (matches[2]) {
              const unit = matches[2].toLowerCase();
              if (unit === 'k' || unit === 'thousand') {
                amount *= 1000;
              } else if (unit === 'million' || unit === 'm') {
                amount *= 1000000;
              }
            }
          }
        }

        if (name && amount > 0) {
          grants.push({
            name,
            amount,
            date: grantDate,
            year,
            description,
            url: `${BASE_URL}${round.url}`,
            funder: 'SFF',
          });
        }
      });

      console.log(`Found ${grants.length} grants from ${round.url}`);
      totalGrants += grants.length;

      for (const grant of grants) {
        await saveGrant(grant);
      }
    } catch (error) {
      console.error(`Error scraping ${round.url}:`, error.message);
    }
  }

  console.log(`SFF scraping completed - total ${totalGrants} grants`);
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

module.exports = scrapeSFFGrants;
