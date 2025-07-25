const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM customers';
  let countQuery = 'SELECT COUNT(*) as total FROM customers';
  const params = [];

  if (search) {
    const searchCondition = ' WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?';
    query += searchCondition;
    countQuery += searchCondition;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  // Get total count
  db.get(countQuery, search ? params.slice(0, 4) : [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get customers
    db.all(query, params, (err, customers) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        customers,
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    });
  });
});

// Get single customer
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get customer's booking history
    db.all(`
      SELECT b.*, r.room_number, rt.name as room_type_name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `, [id], (err, bookings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      customer.bookings = bookings;
      res.json(customer);
    });
  });
});

// Create new customer
router.post('/', authenticateToken, [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('date_of_birth').optional().isISO8601().withMessage('Valid date of birth is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    first_name, last_name, email, phone, address,
    id_number, id_type, date_of_birth, nationality
  } = req.body;

  // Check if email already exists (if provided)
  if (email) {
    db.get('SELECT id FROM customers WHERE email = ?', [email], (err, existingCustomer) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingCustomer) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      createCustomer();
    });
  } else {
    createCustomer();
  }

  function createCustomer() {
    db.run(`
      INSERT INTO customers (first_name, last_name, email, phone, address, 
                           id_number, id_type, date_of_birth, nationality)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [first_name, last_name, email, phone, address, id_number, id_type, date_of_birth, nationality],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create customer' });
      }

      res.status(201).json({
        message: 'Customer created successfully',
        customer_id: this.lastID
      });
    });
  }
});

// Update customer
router.put('/:id', authenticateToken, [
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('date_of_birth').optional().isISO8601().withMessage('Valid date of birth is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const {
    first_name, last_name, email, phone, address,
    id_number, id_type, date_of_birth, nationality
  } = req.body;

  const updates = [];
  const values = [];

  if (first_name) {
    updates.push('first_name = ?');
    values.push(first_name);
  }
  if (last_name) {
    updates.push('last_name = ?');
    values.push(last_name);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }
  if (id_number !== undefined) {
    updates.push('id_number = ?');
    values.push(id_number);
  }
  if (id_type !== undefined) {
    updates.push('id_type = ?');
    values.push(id_type);
  }
  if (date_of_birth !== undefined) {
    updates.push('date_of_birth = ?');
    values.push(date_of_birth);
  }
  if (nationality !== undefined) {
    updates.push('nationality = ?');
    values.push(nationality);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.run(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update customer' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({ message: 'Customer updated successfully' });
    }
  );
});

// Delete customer (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;

  // Check if customer has any bookings
  db.get('SELECT COUNT(*) as booking_count FROM bookings WHERE customer_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.booking_count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing bookings',
        booking_count: result.booking_count
      });
    }

    db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete customer' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({ message: 'Customer deleted successfully' });
    });
  });
});

// Search customers
router.get('/search/:term', authenticateToken, (req, res) => {
  const { term } = req.params;
  const searchTerm = `%${term}%`;

  db.all(`
    SELECT id, first_name, last_name, email, phone
    FROM customers 
    WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?
    ORDER BY first_name, last_name
    LIMIT 20
  `, [searchTerm, searchTerm, searchTerm, searchTerm], (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(customers);
  });
});

// Get customer statistics
router.get('/:id/stats', authenticateToken, (req, res) => {
  const { id } = req.params;

  const queries = [
    // Total bookings
    'SELECT COUNT(*) as total_bookings FROM bookings WHERE customer_id = ?',
    // Total spent
    'SELECT SUM(total_amount) as total_spent FROM bookings WHERE customer_id = ? AND status != "cancelled"',
    // Last booking
    'SELECT check_in_date, check_out_date, status FROM bookings WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1',
    // Favorite room type
    `SELECT rt.name, COUNT(*) as count 
     FROM bookings b 
     JOIN rooms r ON b.room_id = r.id 
     JOIN room_types rt ON r.room_type_id = rt.id 
     WHERE b.customer_id = ? AND b.status != "cancelled"
     GROUP BY rt.id 
     ORDER BY count DESC 
     LIMIT 1`
  ];

  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      db.get(query, [id], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }))
  .then(([bookings, spent, lastBooking, favoriteRoom]) => {
    res.json({
      total_bookings: bookings.total_bookings || 0,
      total_spent: spent.total_spent || 0,
      last_booking: lastBooking,
      favorite_room_type: favoriteRoom ? favoriteRoom.name : null
    });
  })
  .catch(() => {
    res.status(500).json({ error: 'Failed to get customer statistics' });
  });
});

module.exports = router;