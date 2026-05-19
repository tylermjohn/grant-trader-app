const express = require('express');
const db = require('../database');

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

// Check for potential duplicates
router.get('/api/organizations/check-duplicates/:name', (req, res) => {
  const searchName = req.params.name;

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

module.exports = router;
