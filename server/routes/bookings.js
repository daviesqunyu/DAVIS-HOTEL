const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all bookings with customer and room details
router.get('/', authenticateToken, (req, res) => {
  const { status, date_from, date_to, customer_id, room_id } = req.query;
  
  let query = `
    SELECT b.*, 
           c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone,
           r.room_number, rt.name as room_type_name, rt.base_price,
           u.full_name as created_by_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN rooms r ON b.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN users u ON b.created_by = u.id
  `;
  
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }
  if (date_from) {
    conditions.push('b.check_in_date >= ?');
    params.push(date_from);
  }
  if (date_to) {
    conditions.push('b.check_out_date <= ?');
    params.push(date_to);
  }
  if (customer_id) {
    conditions.push('b.customer_id = ?');
    params.push(customer_id);
  }
  if (room_id) {
    conditions.push('b.room_id = ?');
    params.push(room_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY b.created_at DESC';

  db.all(query, params, (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(bookings);
  });
});

// Get single booking
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT b.*, 
           c.first_name, c.last_name, c.email as customer_email, c.phone as customer_phone,
           c.address, c.id_number, c.id_type, c.nationality,
           r.room_number, r.floor, rt.name as room_type_name, rt.base_price, rt.amenities,
           u.full_name as created_by_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN rooms r ON b.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN users u ON b.created_by = u.id
    WHERE b.id = ?
  `;

  db.get(query, [id], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get booking services
    db.all(`
      SELECT bs.*, s.name, s.description, s.category
      FROM booking_services bs
      JOIN services s ON bs.service_id = s.id
      WHERE bs.booking_id = ?
    `, [id], (err, services) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      booking.services = services;
      res.json(booking);
    });
  });
});

// Create new booking
router.post('/', authenticateToken, [
  body('customer_id').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
  body('room_id').isInt({ min: 1 }).withMessage('Valid room ID is required'),
  body('check_in_date').isISO8601().withMessage('Valid check-in date is required'),
  body('check_out_date').isISO8601().withMessage('Valid check-out date is required'),
  body('adults').isInt({ min: 1 }).withMessage('At least 1 adult is required'),
  body('children').optional().isInt({ min: 0 }).withMessage('Children must be 0 or more'),
  body('total_amount').isFloat({ min: 0 }).withMessage('Valid total amount is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    customer_id, room_id, check_in_date, check_out_date,
    adults, children, total_amount, special_requests, services
  } = req.body;

  // Validate dates
  if (new Date(check_in_date) >= new Date(check_out_date)) {
    return res.status(400).json({ error: 'Check-out date must be after check-in date' });
  }

  // Check room availability
  db.get(`
    SELECT COUNT(*) as conflicts FROM bookings 
    WHERE room_id = ? AND status IN ('confirmed', 'checked_in')
    AND ((check_in_date <= ? AND check_out_date > ?) 
         OR (check_in_date < ? AND check_out_date >= ?))
  `, [room_id, check_in_date, check_in_date, check_out_date, check_out_date], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.conflicts > 0) {
      return res.status(400).json({ error: 'Room is not available for the selected dates' });
    }

    // Create booking
    db.run(`
      INSERT INTO bookings (customer_id, room_id, check_in_date, check_out_date, 
                           adults, children, total_amount, special_requests, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [customer_id, room_id, check_in_date, check_out_date, adults, children || 0, 
        total_amount, special_requests, req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create booking' });
      }

      const bookingId = this.lastID;

      // Add services if provided
      if (services && services.length > 0) {
        const servicePromises = services.map(service => {
          return new Promise((resolve, reject) => {
            db.run(`
              INSERT INTO booking_services (booking_id, service_id, quantity, total_price)
              VALUES (?, ?, ?, ?)
            `, [bookingId, service.service_id, service.quantity, service.total_price], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all(servicePromises)
          .then(() => {
            res.status(201).json({
              message: 'Booking created successfully',
              booking_id: bookingId
            });
          })
          .catch(() => {
            res.status(500).json({ error: 'Booking created but failed to add services' });
          });
      } else {
        res.status(201).json({
          message: 'Booking created successfully',
          booking_id: bookingId
        });
      }
    });
  });
});

// Update booking
router.put('/:id', authenticateToken, [
  body('check_in_date').optional().isISO8601().withMessage('Valid check-in date is required'),
  body('check_out_date').optional().isISO8601().withMessage('Valid check-out date is required'),
  body('adults').optional().isInt({ min: 1 }).withMessage('At least 1 adult is required'),
  body('children').optional().isInt({ min: 0 }).withMessage('Children must be 0 or more'),
  body('total_amount').optional().isFloat({ min: 0 }).withMessage('Valid total amount is required'),
  body('status').optional().isIn(['confirmed', 'checked_in', 'checked_out', 'cancelled']).withMessage('Invalid status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { check_in_date, check_out_date, adults, children, total_amount, special_requests, status } = req.body;

  const updates = [];
  const values = [];

  if (check_in_date) {
    updates.push('check_in_date = ?');
    values.push(check_in_date);
  }
  if (check_out_date) {
    updates.push('check_out_date = ?');
    values.push(check_out_date);
  }
  if (adults) {
    updates.push('adults = ?');
    values.push(adults);
  }
  if (children !== undefined) {
    updates.push('children = ?');
    values.push(children);
  }
  if (total_amount) {
    updates.push('total_amount = ?');
    values.push(total_amount);
  }
  if (special_requests !== undefined) {
    updates.push('special_requests = ?');
    values.push(special_requests);
  }
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.run(
    `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update booking' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json({ message: 'Booking updated successfully' });
    }
  );
});

// Check-in
router.patch('/:id/checkin', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed bookings can be checked in' });
    }

    // Update booking status and room status
    db.run('UPDATE bookings SET status = "checked_in", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check in' });
      }

      db.run('UPDATE rooms SET status = "occupied" WHERE id = ?', [booking.room_id], (err) => {
        if (err) {
          console.error('Failed to update room status:', err);
        }
        
        res.json({ message: 'Check-in successful' });
      });
    });
  });
});

// Check-out
router.patch('/:id/checkout', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'checked_in') {
      return res.status(400).json({ error: 'Only checked-in bookings can be checked out' });
    }

    // Update booking status and room status
    db.run('UPDATE bookings SET status = "checked_out", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check out' });
      }

      db.run('UPDATE rooms SET status = "cleaning" WHERE id = ?', [booking.room_id], (err) => {
        if (err) {
          console.error('Failed to update room status:', err);
        }
        
        res.json({ message: 'Check-out successful' });
      });
    });
  });
});

// Cancel booking
router.patch('/:id/cancel', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM bookings WHERE id = ?', [id], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (booking.status === 'checked_out') {
      return res.status(400).json({ error: 'Cannot cancel completed booking' });
    }

    db.run('UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to cancel booking' });
      }

      // If room was occupied, set it to cleaning
      if (booking.status === 'checked_in') {
        db.run('UPDATE rooms SET status = "cleaning" WHERE id = ?', [booking.room_id], (err) => {
          if (err) {
            console.error('Failed to update room status:', err);
          }
        });
      }

      res.json({ message: 'Booking cancelled successfully' });
    });
  });
});

// Add service to booking
router.post('/:id/services', authenticateToken, [
  body('service_id').isInt({ min: 1 }).withMessage('Valid service ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  body('total_price').isFloat({ min: 0 }).withMessage('Valid total price is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { service_id, quantity, total_price } = req.body;

  db.run(`
    INSERT INTO booking_services (booking_id, service_id, quantity, total_price)
    VALUES (?, ?, ?, ?)
  `, [id, service_id, quantity, total_price], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to add service to booking' });
    }

    res.status(201).json({
      message: 'Service added to booking successfully',
      id: this.lastID
    });
  });
});

module.exports = router;