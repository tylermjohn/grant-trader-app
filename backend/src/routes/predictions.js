const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
  const { organizationId, funder, predictionYear, predictedAmount } = req.body;
  const userId = req.userId;

  if (!organizationId || !funder || !predictionYear || predictedAmount === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
    INSERT INTO predictions (user_id, organization_id, funder, prediction_year, predicted_amount)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [userId, organizationId, funder, predictionYear, predictedAmount],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({
            error: 'You already have a prediction for this organization and year'
          });
        }
        return res.status(500).json({ error: 'Failed to create prediction' });
      }

      res.status(201).json({
        id: this.lastID,
        userId,
        organizationId,
        funder,
        predictionYear,
        predictedAmount,
      });
    }
  );
});

router.get('/user/:userId', (req, res) => {
  const query = `
    SELECT
      p.*,
      o.name as organization_name
    FROM predictions p
    JOIN organizations o ON p.organization_id = o.id
    WHERE p.user_id = ?
    ORDER BY p.prediction_year DESC, p.prediction_date DESC
  `;

  db.all(query, [req.params.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch predictions' });
    }
    res.json(rows);
  });
});

router.get('/my-predictions', authMiddleware, (req, res) => {
  const query = `
    SELECT
      p.*,
      o.name as organization_name,
      o.funder
    FROM predictions p
    JOIN organizations o ON p.organization_id = o.id
    WHERE p.user_id = ?
    ORDER BY p.prediction_year DESC, p.prediction_date DESC
  `;

  db.all(query, [req.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch predictions' });
    }
    res.json(rows);
  });
});

router.put('/:id', authMiddleware, (req, res) => {
  const { predictedAmount } = req.body;
  const userId = req.userId;

  if (predictedAmount === undefined) {
    return res.status(400).json({ error: 'Predicted amount is required' });
  }

  db.get('SELECT * FROM predictions WHERE id = ?', [req.params.id], (err, prediction) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch prediction' });
    }

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (prediction.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (prediction.resolved) {
      return res.status(400).json({ error: 'Cannot update resolved prediction' });
    }

    db.run(
      'UPDATE predictions SET predicted_amount = ? WHERE id = ?',
      [predictedAmount, req.params.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update prediction' });
        }
        res.json({ id: req.params.id, predictedAmount });
      }
    );
  });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const userId = req.userId;

  db.get('SELECT * FROM predictions WHERE id = ?', [req.params.id], (err, prediction) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch prediction' });
    }

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (prediction.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (prediction.resolved) {
      return res.status(400).json({ error: 'Cannot delete resolved prediction' });
    }

    db.run('DELETE FROM predictions WHERE id = ?', [req.params.id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete prediction' });
      }
      res.json({ message: 'Prediction deleted' });
    });
  });
});

module.exports = router;
