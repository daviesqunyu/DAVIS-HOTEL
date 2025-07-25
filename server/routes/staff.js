const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all staff members (admin/manager only)
router.get('/', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  const { role, search } = req.query;
  
  let query = 'SELECT id, username, email, role, full_name, phone, created_at FROM users';
  const params = [];
  const conditions = [];

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (search) {
    conditions.push('(full_name LIKE ? OR username LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, staff) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(staff);
  });
});

// Get single staff member
router.get('/:id', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  const { id } = req.params;

  db.get('SELECT id, username, email, role, full_name, phone, created_at FROM users WHERE id = ?', 
    [id], (err, staff) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Get staff activity stats
    db.all(`
      SELECT 
        COUNT(*) as total_bookings_created,
        DATE(created_at) as date
      FROM bookings 
      WHERE created_by = ? 
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [id], (err, activity) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      staff.activity = activity;
      res.json(staff);
    });
  });
});

// Update staff member (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('role').optional().isIn(['admin', 'manager', 'staff']).withMessage('Invalid role'),
  body('phone').optional()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { email, full_name, role, phone } = req.body;

  // Don't allow updating own role
  if (req.user.id == id && role && role !== req.user.role) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  const updates = [];
  const values = [];

  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  if (full_name) {
    updates.push('full_name = ?');
    values.push(full_name);
  }
  if (role) {
    updates.push('role = ?');
    values.push(role);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update staff member' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      res.json({ message: 'Staff member updated successfully' });
    }
  );
});

// Delete staff member (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;

  // Don't allow deleting own account
  if (req.user.id == id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Check if staff member has created any bookings
  db.get('SELECT COUNT(*) as booking_count FROM bookings WHERE created_by = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.booking_count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete staff member who has created bookings',
        booking_count: result.booking_count
      });
    }

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete staff member' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      res.json({ message: 'Staff member deleted successfully' });
    });
  });
});

// Get staff performance stats (admin/manager only)
router.get('/:id/performance', authenticateToken, requireRole(['admin', 'manager']), (req, res) => {
  const { id } = req.params;
  const { period = '30' } = req.query; // days

  const queries = [
    // Total bookings created
    `SELECT COUNT(*) as total_bookings 
     FROM bookings 
     WHERE created_by = ? AND created_at >= date('now', '-${period} days')`,
    
    // Total revenue generated
    `SELECT SUM(total_amount) as total_revenue 
     FROM bookings 
     WHERE created_by = ? AND status != 'cancelled' AND created_at >= date('now', '-${period} days')`,
    
    // Average booking value
    `SELECT AVG(total_amount) as avg_booking_value 
     FROM bookings 
     WHERE created_by = ? AND status != 'cancelled' AND created_at >= date('now', '-${period} days')`,
    
    // Bookings by status
    `SELECT status, COUNT(*) as count 
     FROM bookings 
     WHERE created_by = ? AND created_at >= date('now', '-${period} days')
     GROUP BY status`,
    
    // Daily booking counts
    `SELECT DATE(created_at) as date, COUNT(*) as bookings 
     FROM bookings 
     WHERE created_by = ? AND created_at >= date('now', '-${period} days')
     GROUP BY DATE(created_at)
     ORDER BY date`
  ];

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries[0], [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries[1], [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries[2], [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      db.all(queries[3], [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      db.all(queries[4], [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  ])
  .then(([totals, revenue, avgValue, byStatus, daily]) => {
    res.json({
      period_days: parseInt(period),
      total_bookings: totals.total_bookings || 0,
      total_revenue: revenue.total_revenue || 0,
      avg_booking_value: avgValue.avg_booking_value || 0,
      bookings_by_status: byStatus,
      daily_bookings: daily
    });
  })
  .catch(() => {
    res.status(500).json({ error: 'Failed to get performance statistics' });
  });
});

// Get all services
router.get('/services/all', authenticateToken, (req, res) => {
  db.all('SELECT * FROM services WHERE is_active = 1 ORDER BY category, name', (err, services) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(services);
  });
});

// Create service (admin/manager only)
router.post('/services', authenticateToken, requireRole(['admin', 'manager']), [
  body('name').notEmpty().withMessage('Service name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category').notEmpty().withMessage('Category is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, category } = req.body;

  db.run(
    'INSERT INTO services (name, description, price, category) VALUES (?, ?, ?, ?)',
    [name, description, price, category],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create service' });
      }

      res.status(201).json({
        message: 'Service created successfully',
        service_id: this.lastID
      });
    }
  );
});

// Update service (admin/manager only)
router.put('/services/:id', authenticateToken, requireRole(['admin', 'manager']), [
  body('name').optional().notEmpty().withMessage('Service name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, price, category, is_active } = req.body;

  const updates = [];
  const values = [];

  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (price) {
    updates.push('price = ?');
    values.push(price);
  }
  if (category) {
    updates.push('category = ?');
    values.push(category);
  }
  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);

  db.run(
    `UPDATE services SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update service' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({ message: 'Service updated successfully' });
    }
  );
});

module.exports = router;