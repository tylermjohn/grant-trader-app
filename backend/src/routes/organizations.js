const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Simple fuzzy matching using Levenshtein distance
function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

function similarityScore(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

router.get('/', (req, res) => {
  const { funder, search } = req.query;

  let query = `
    SELECT
      o.*,
      o.funder as primary_funder,
      GROUP_CONCAT(DISTINCT of.funder) as funders,
      COUNT(DISTINCT g.id) as grant_count,
      SUM(g.amount) as total_funding,
      MAX(g.grant_date) as last_grant_date
    FROM organizations o
    LEFT JOIN organization_funders of ON o.id = of.organization_id
    LEFT JOIN grants g ON o.id = g.organization_id
  `;

  const params = [];
  const conditions = [];

  if (funder) {
    // Support filtering by any funder in the many-to-many relationship
    query += `
      WHERE o.id IN (
        SELECT organization_id FROM organization_funders WHERE funder = ?
      )
    `;
    params.push(funder);

    if (search) {
      conditions.push('o.name LIKE ?');
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
  } else if (search) {
    conditions.push('o.name LIKE ?');
    params.push(`%${search}%`);
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY o.id ORDER BY total_funding DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch organizations' });
    }
    // Convert comma-separated funders to array for each row
    rows.forEach(row => {
      row.funders_list = row.funders ? row.funders.split(',') : [];
    });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  const query = `
    SELECT
      o.*,
      COUNT(DISTINCT g.id) as grant_count,
      SUM(g.amount) as total_funding,
      MAX(g.grant_date) as last_grant_date
    FROM organizations o
    LEFT JOIN grants g ON o.id = g.organization_id
    WHERE o.id = ?
    GROUP BY o.id
  `;

  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch organization' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(row);
  });
});

router.get('/:id/grants', (req, res) => {
  const query = `
    SELECT * FROM grants
    WHERE organization_id = ?
    ORDER BY grant_date DESC
  `;

  db.all(query, [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch grants' });
    }
    res.json(rows);
  });
});

router.get('/:id/predictions', authMiddleware, (req, res) => {
  const query = `
    SELECT
      p.*,
      u.username
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    WHERE p.organization_id = ?
    ORDER BY p.prediction_year DESC, p.prediction_date DESC
  `;

  db.all(query, [req.params.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch predictions' });
    }
    res.json(rows);
  });
});

// Create user-submitted organization
router.post('/', authMiddleware, (req, res) => {
  const { name, description, website, funder } = req.body;

  if (!name || !funder) {
    return res.status(400).json({ error: 'Name and funder are required' });
  }

  // Check if organization already exists
  db.get(
    'SELECT id FROM organizations WHERE name = ? AND funder = ?',
    [name, funder],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check organization' });
      }

      if (existing) {
        return res.status(400).json({ error: 'Organization already exists' });
      }

      // Insert new user-submitted organization
      db.run(
        `INSERT INTO organizations (name, description, website, funder, user_submitted, submitted_by)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [name, description, website, funder, req.userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create organization' });
          }

          // Return the newly created organization
          db.get(
            'SELECT * FROM organizations WHERE id = ?',
            [this.lastID],
            (err, org) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to fetch created organization' });
              }
              res.status(201).json(org);
            }
          );
        }
      );
    }
  );
});

// Get user-submitted organizations
router.get('/user-submitted/all', authMiddleware, (req, res) => {
  const query = `
    SELECT
      o.*,
      u.username as submitted_by_username,
      COUNT(DISTINCT g.id) as grant_count,
      SUM(g.amount) as total_funding,
      MAX(g.grant_date) as last_grant_date
    FROM organizations o
    LEFT JOIN users u ON o.submitted_by = u.id
    LEFT JOIN grants g ON o.id = g.organization_id
    WHERE o.user_submitted = 1
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user-submitted organizations' });
    }
    res.json(rows);
  });
});

// Check for potential duplicates
router.get('/check-duplicates/:name', (req, res) => {
  const searchName = decodeURIComponent(req.params.name);

  db.all('SELECT id, name, funder, description FROM organizations', [], (err, orgs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to check duplicates' });
    }

    const potentialDuplicates = orgs
      .map(org => ({
        ...org,
        similarity: similarityScore(searchName, org.name)
      }))
      .filter(org => org.similarity > 0.7) // 70% similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // Top 5 matches

    res.json(potentialDuplicates);
  });
});

// Add funder to organization
router.post('/:id/funders', authMiddleware, (req, res) => {
  const { funder } = req.body;
  const orgId = req.params.id;

  if (!funder) {
    return res.status(400).json({ error: 'Funder is required' });
  }

  // Check if funder already exists for this org
  db.get(
    'SELECT id FROM organization_funders WHERE organization_id = ? AND funder = ?',
    [orgId, funder],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        return res.status(400).json({ error: 'Funder already associated with this organization' });
      }

      db.run(
        'INSERT INTO organization_funders (organization_id, funder) VALUES (?, ?)',
        [orgId, funder],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to add funder' });
          }
          res.json({ message: 'Funder added successfully' });
        }
      );
    }
  );
});

// Remove funder from organization
router.delete('/:id/funders/:funder', authMiddleware, (req, res) => {
  const orgId = req.params.id;
  const funder = req.params.funder;

  db.run(
    'DELETE FROM organization_funders WHERE organization_id = ? AND funder = ?',
    [orgId, funder],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to remove funder' });
      }
      res.json({ message: 'Funder removed successfully' });
    }
  );
});

// Merge organizations
router.post('/merge', authMiddleware, (req, res) => {
  const { sourceIds, targetId } = req.body;

  if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0 || !targetId) {
    return res.status(400).json({ error: 'sourceIds (array) and targetId are required' });
  }

  // Prevent merging an org into itself
  if (sourceIds.includes(targetId)) {
    return res.status(400).json({ error: 'Cannot merge an organization into itself' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Update grants to point to target org
    const placeholders = sourceIds.map(() => '?').join(',');
    db.run(
      `UPDATE grants SET organization_id = ? WHERE organization_id IN (${placeholders})`,
      [targetId, ...sourceIds],
      (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to merge grants' });
        }

        // Update predictions to point to target org
        db.run(
          `UPDATE predictions SET organization_id = ? WHERE organization_id IN (${placeholders})`,
          [targetId, ...sourceIds],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to merge predictions' });
            }

            // Copy funders from source orgs to target (avoiding duplicates)
            db.all(
              `SELECT DISTINCT funder FROM organization_funders WHERE organization_id IN (${placeholders})`,
              sourceIds,
              (err, funders) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to get source funders' });
                }

                // Insert each funder for target org if not already exists
                let completed = 0;
                const totalFunders = funders.length;

                if (totalFunders === 0) {
                  // No funders to copy, proceed to delete source orgs
                  deleteSourceOrgs();
                  return;
                }

                funders.forEach(({ funder }) => {
                  db.run(
                    'INSERT OR IGNORE INTO organization_funders (organization_id, funder) VALUES (?, ?)',
                    [targetId, funder],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Failed to copy funders' });
                      }

                      completed++;
                      if (completed === totalFunders) {
                        deleteSourceOrgs();
                      }
                    }
                  );
                });

                function deleteSourceOrgs() {
                  // Delete source org funders
                  db.run(
                    `DELETE FROM organization_funders WHERE organization_id IN (${placeholders})`,
                    sourceIds,
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Failed to delete source org funders' });
                      }

                      // Delete source organizations
                      db.run(
                        `DELETE FROM organizations WHERE id IN (${placeholders})`,
                        sourceIds,
                        (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to delete source organizations' });
                          }

                          db.run('COMMIT', (err) => {
                            if (err) {
                              db.run('ROLLBACK');
                              return res.status(500).json({ error: 'Failed to commit transaction' });
                            }
                            res.json({ message: 'Organizations merged successfully', targetId });
                          });
                        }
                      );
                    }
                  );
                }
              }
            );
          }
        );
      }
    );
  });
});

// Split organization by funder
router.post('/:id/split', authMiddleware, (req, res) => {
  const orgId = req.params.id;
  const { splitBy } = req.body; // 'funder' - split into separate orgs per funder

  if (splitBy !== 'funder') {
    return res.status(400).json({ error: 'Only splitBy: "funder" is currently supported' });
  }

  // Get organization details
  db.get('SELECT * FROM organizations WHERE id = ?', [orgId], (err, org) => {
    if (err || !org) {
      return res.status(500).json({ error: 'Organization not found' });
    }

    // Get all funders for this org
    db.all(
      'SELECT DISTINCT funder FROM grants WHERE organization_id = ?',
      [orgId],
      (err, funders) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to get funders' });
        }

        if (funders.length <= 1) {
          return res.status(400).json({ error: 'Organization only has one funder, cannot split' });
        }

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          const newOrgIds = {};
          let completed = 0;
          const totalFunders = funders.length;

          funders.forEach(({ funder }, index) => {
            if (index === 0) {
              // Keep first funder in original org
              newOrgIds[funder] = orgId;
              completed++;

              // Update organization_funders to only have this funder
              db.run(
                'DELETE FROM organization_funders WHERE organization_id = ? AND funder != ?',
                [orgId, funder],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to update organization funders' });
                  }

                  // Update grants to remain with original org
                  db.run(
                    'UPDATE grants SET organization_id = ? WHERE organization_id = ? AND funder = ?',
                    [orgId, orgId, funder],
                    checkComplete
                  );
                }
              );
            } else {
              // Create new org for this funder
              db.run(
                'INSERT INTO organizations (name, description, website, funder, created_at) VALUES (?, ?, ?, ?, ?)',
                [org.name, org.description, org.website, funder, org.created_at],
                function(err) {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to create new organization' });
                  }

                  const newOrgId = this.lastID;
                  newOrgIds[funder] = newOrgId;

                  // Add funder to organization_funders
                  db.run(
                    'INSERT INTO organization_funders (organization_id, funder) VALUES (?, ?)',
                    [newOrgId, funder],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Failed to add funder to new org' });
                      }

                      // Move grants to new org
                      db.run(
                        'UPDATE grants SET organization_id = ? WHERE organization_id = ? AND funder = ?',
                        [newOrgId, orgId, funder],
                        (err) => {
                          if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to move grants' });
                          }

                          // Move predictions to new org
                          db.run(
                            'UPDATE predictions SET organization_id = ? WHERE organization_id = ? AND funder = ?',
                            [newOrgId, orgId, funder],
                            (err) => {
                              if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Failed to move predictions' });
                              }

                              completed++;
                              checkComplete();
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          });

          function checkComplete() {
            if (completed === totalFunders) {
              db.run('COMMIT', (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: 'Failed to commit transaction' });
                }
                res.json({
                  message: 'Organization split successfully',
                  newOrganizations: newOrgIds
                });
              });
            }
          }
        });
      }
    );
  });
});

module.exports = router;
