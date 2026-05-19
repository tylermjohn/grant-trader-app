const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
  db.get(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [req.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch user' });
      }
      res.json(user);
    }
  );
});

router.get('/:id', (req, res) => {
  db.get(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [req.params.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch user' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    }
  );
});

router.get('/:id/stats', (req, res) => {
  const statsQuery = `
    SELECT
      COUNT(*) as total_predictions,
      SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) as resolved_predictions,
      AVG(CASE WHEN resolved = 1 THEN ABS(predicted_amount - actual_amount) ELSE NULL END) as avg_error,
      AVG(CASE WHEN resolved = 1 AND actual_amount > 0
        THEN ABS(predicted_amount - actual_amount) / actual_amount * 100
        ELSE NULL END) as avg_percent_error
    FROM predictions
    WHERE user_id = ?
  `;

  db.get(statsQuery, [req.params.id], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
    res.json(stats);
  });
});

module.exports = router;
