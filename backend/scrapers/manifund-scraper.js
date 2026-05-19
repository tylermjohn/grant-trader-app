const axios = require('axios');
const db = require('../src/database');

const API_URL = 'https://manifund.org/api/v0/projects';

async function scrapeManifundGrants() {
  console.log('Starting Manifund scraper...');

  try {
    let allProjects = [];
    let before = null;
    let hasMore = true;

    // Fetch all projects with pagination
    while (hasMore) {
      const url = before ? `${API_URL}?before=${before}` : API_URL;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GrantTrader/1.0)',
        },
      });

      const projects = response.data;

      if (!projects || projects.length === 0) {
        hasMore = false;
        break;
      }

      allProjects = allProjects.concat(projects);

      // If we got less than 100, we've reached the end
      if (projects.length < 100) {
        hasMore = false;
      } else {
        // Get the oldest timestamp for next page
        const oldestProject = projects[projects.length - 1];
        before = oldestProject.created_at;
      }

      console.log(`Fetched ${allProjects.length} projects so far...`);
    }

    console.log(`Found ${allProjects.length} total projects from Manifund`);

    const grants = [];

    // Process projects and extract funding information
    for (const project of allProjects) {
      const orgName = project.title;
      const createdDate = new Date(project.created_at);

      // Extract actual funding from transactions
      let totalFunded = 0;
      if (project.txns && Array.isArray(project.txns)) {
        totalFunded = project.txns
          .reduce((sum, txn) => sum + (txn.amount || 0), 0);
      }

      // Also check bids
      if (project.bids && Array.isArray(project.bids)) {
        const bidTotal = project.bids
          .reduce((sum, bid) => sum + (bid.amount || 0), 0);
        totalFunded += bidTotal;
      }

      // Clean description - remove markdown/HTML formatting and truncate
      let description = project.blurb || project.description || '';
      // Remove markdown headers (###, ##, etc)
      description = description.replace(/^#+\s+/gm, '');
      // Remove bold/italic markers
      description = description.replace(/\*\*([^*]+)\*\*/g, '$1');
      description = description.replace(/\*([^*]+)\*/g, '$1');
      // Remove links but keep text
      description = description.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Collapse multiple newlines
      description = description.replace(/\n\n+/g, '\n');
      // Truncate to first paragraph or 300 characters
      const firstParagraph = description.split('\n')[0];
      description = firstParagraph.length > 300
        ? firstParagraph.substring(0, 300) + '...'
        : firstParagraph;

      // Only save if there's actual funding
      if (orgName && totalFunded > 0) {
        grants.push({
          name: orgName,
          amount: totalFunded,
          date: createdDate,
          year: createdDate.getFullYear(),
          description: description.trim(),
          url: project.slug ? `https://manifund.org/projects/${project.slug}` : null,
          funder: 'Manifund',
        });
      }
    }

    console.log(`Found ${grants.length} funded projects from Manifund`);

    for (const grant of grants) {
      await saveGrant(grant);
    }

    console.log('Manifund scraping completed');
  } catch (error) {
    console.error('Error scraping Manifund:', error.message);
  }
}

async function saveGrant(grant) {
  return new Promise((resolve, reject) => {
    // Check if organization exists
    db.get(
      'SELECT id FROM organizations WHERE name = ? AND funder = ?',
      [grant.name, grant.funder],
      (err, org) => {
        if (err) {
          return reject(err);
        }

        const saveGrantRecord = (orgId) => {
          // Check if grant already exists
          db.get(
            `SELECT id FROM grants
             WHERE organization_id = ? AND funder = ? AND grant_year = ? AND amount = ?`,
            [orgId, grant.funder, grant.year, grant.amount],
            (err, existingGrant) => {
              if (err) return reject(err);

              if (existingGrant) {
                return resolve(); // Grant already exists
              }

              // Insert grant
              db.run(
                `INSERT INTO grants (organization_id, funder, amount, grant_date, grant_year, description, source_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orgId, grant.funder, grant.amount, grant.date.toISOString().split('T')[0], grant.year, grant.description, grant.url],
                (err) => {
                  if (err) return reject(err);
                  resolve();
                }
              );
            }
          );
        };

        if (org) {
          saveGrantRecord(org.id);
        } else {
          // Create organization
          db.run(
            `INSERT INTO organizations (name, description, website, funder)
             VALUES (?, ?, ?, ?)`,
            [grant.name, grant.description, grant.url, grant.funder],
            function(err) {
              if (err) return reject(err);
              saveGrantRecord(this.lastID);
            }
          );
        }
      }
    );
  });
}

if (require.main === module) {
  scrapeManifundGrants()
    .then(() => {
      console.log('Manifund scraper completed successfully');
      db.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Manifund scraper failed:', err);
      db.close();
      process.exit(1);
    });
}

module.exports = scrapeManifundGrants;
