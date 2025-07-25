const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all room types
router.get('/types', authenticateToken, (req, res) => {
  db.all('SELECT * FROM room_types ORDER BY name', (err, roomTypes) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(roomTypes);
  });
});

// Create room type (admin/manager only)
router.post('/types', authenticateToken, requireRole(['admin', 'manager']), [
  body('name').notEmpty().withMessage('Room type name is required'),
  body('base_price').isFloat({ min: 0 }).withMessage('Valid base price is required'),
  body('max_occupancy').isInt({ min: 1 }).withMessage('Valid max occupancy is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, base_price, max_occupancy, amenities } = req.body;

  db.run(
    'INSERT INTO room_types (name, description, base_price, max_occupancy, amenities) VALUES (?, ?, ?, ?, ?)',
    [name, description, base_price, max_occupancy, amenities],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create room type' });
      }

      res.status(201).json({
        message: 'Room type created successfully',
        id: this.lastID
      });
    }
  );
});

// Get all rooms with their types
router.get('/', authenticateToken, (req, res) => {
  const { status, floor, room_type_id } = req.query;
  
  let query = `
    SELECT r.*, rt.name as room_type_name, rt.description as room_type_description,
           rt.base_price, rt.max_occupancy, rt.amenities
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
  `;
  
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }
  if (floor) {
    conditions.push('r.floor = ?');
    params.push(floor);
  }
  if (room_type_id) {
    conditions.push('r.room_type_id = ?');
    params.push(room_type_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY r.room_number';

  db.all(query, params, (err, rooms) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rooms);
  });
});

// Create new room (admin/manager only)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), [
  body('room_number').notEmpty().withMessage('Room number is required'),
  body('room_type_id').isInt({ min: 1 }).withMessage('Valid room type is required'),
  body('floor').isInt({ min: 1 }).withMessage('Valid floor number is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { room_number, room_type_id, floor, status, notes } = req.body;

  // Check if room number already exists
  db.get('SELECT id FROM rooms WHERE room_number = ?', [room_number], (err, existingRoom) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingRoom) {
      return res.status(400).json({ error: 'Room number already exists' });
    }

    // Verify room type exists
    db.get('SELECT id FROM room_types WHERE id = ?', [room_type_id], (err, roomType) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!roomType) {
        return res.status(400).json({ error: 'Invalid room type' });
      }

      db.run(
        'INSERT INTO rooms (room_number, room_type_id, floor, status, notes) VALUES (?, ?, ?, ?, ?)',
        [room_number, room_type_id, floor, status || 'available', notes],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create room' });
          }

          res.status(201).json({
            message: 'Room created successfully',
            id: this.lastID
          });
        }
      );
    });
  });
});

// Update room
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), [
  body('room_number').optional().notEmpty().withMessage('Room number cannot be empty'),
  body('room_type_id').optional().isInt({ min: 1 }).withMessage('Valid room type is required'),
  body('floor').optional().isInt({ min: 1 }).withMessage('Valid floor number is required'),
  body('status').optional().isIn(['available', 'occupied', 'maintenance', 'cleaning']).withMessage('Invalid status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { room_number, room_type_id, floor, status, notes } = req.body;

  const updates = [];
  const values = [];

  if (room_number) {
    updates.push('room_number = ?');
    values.push(room_number);
  }
  if (room_type_id) {
    updates.push('room_type_id = ?');
    values.push(room_type_id);
  }
  if (floor) {
    updates.push('floor = ?');
    values.push(floor);
  }
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);

  db.run(
    `UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update room' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({ message: 'Room updated successfully' });
    }
  );
});

// Check room availability
router.get('/availability', authenticateToken, (req, res) => {
  const { check_in, check_out, room_type_id } = req.query;

  if (!check_in || !check_out) {
    return res.status(400).json({ error: 'Check-in and check-out dates are required' });
  }

  let query = `
    SELECT r.*, rt.name as room_type_name, rt.base_price, rt.max_occupancy
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    WHERE r.status = 'available'
    AND r.id NOT IN (
      SELECT room_id FROM bookings 
      WHERE status IN ('confirmed', 'checked_in')
      AND ((check_in_date <= ? AND check_out_date > ?) 
           OR (check_in_date < ? AND check_out_date >= ?))
    )
  `;

  const params = [check_in, check_in, check_out, check_out];

  if (room_type_id) {
    query += ' AND r.room_type_id = ?';
    params.push(room_type_id);
  }

  query += ' ORDER BY rt.base_price, r.room_number';

  db.all(query, params, (err, availableRooms) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(availableRooms);
  });
});

// Update room status
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['available', 'occupied', 'maintenance', 'cleaning']).withMessage('Invalid status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE rooms SET status = ?, last_cleaned = CASE WHEN ? = "available" THEN CURRENT_TIMESTAMP ELSE last_cleaned END WHERE id = ?',
    [status, status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update room status' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({ message: 'Room status updated successfully' });
    }
  );
});

module.exports = router;