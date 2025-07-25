const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview statistics
router.get('/overview', authenticateToken, (req, res) => {
  const queries = [
    // Total rooms
    'SELECT COUNT(*) as total_rooms FROM rooms',
    // Available rooms
    'SELECT COUNT(*) as available_rooms FROM rooms WHERE status = "available"',
    // Occupied rooms
    'SELECT COUNT(*) as occupied_rooms FROM rooms WHERE status = "occupied"',
    // Total customers
    'SELECT COUNT(*) as total_customers FROM customers',
    // Active bookings (confirmed + checked_in)
    'SELECT COUNT(*) as active_bookings FROM bookings WHERE status IN ("confirmed", "checked_in")',
    // Today's check-ins
    'SELECT COUNT(*) as todays_checkins FROM bookings WHERE status = "confirmed" AND check_in_date = date("now")',
    // Today's check-outs
    'SELECT COUNT(*) as todays_checkouts FROM bookings WHERE status = "checked_in" AND check_out_date = date("now")',
    // This month's revenue
    'SELECT COALESCE(SUM(total_amount), 0) as monthly_revenue FROM bookings WHERE status != "cancelled" AND strftime("%Y-%m", created_at) = strftime("%Y-%m", "now")',
    // Total revenue
    'SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM bookings WHERE status != "cancelled"'
  ];

  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      db.get(query, [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }))
  .then(([
    totalRooms, availableRooms, occupiedRooms, totalCustomers,
    activeBookings, todaysCheckins, todaysCheckouts, monthlyRevenue, totalRevenue
  ]) => {
    res.json({
      rooms: {
        total: totalRooms.total_rooms,
        available: availableRooms.available_rooms,
        occupied: occupiedRooms.occupied_rooms,
        occupancy_rate: totalRooms.total_rooms > 0 ? 
          ((occupiedRooms.occupied_rooms / totalRooms.total_rooms) * 100).toFixed(1) : 0
      },
      customers: {
        total: totalCustomers.total_customers
      },
      bookings: {
        active: activeBookings.active_bookings,
        todays_checkins: todaysCheckins.todays_checkins,
        todays_checkouts: todaysCheckouts.todays_checkouts
      },
      revenue: {
        monthly: monthlyRevenue.monthly_revenue,
        total: totalRevenue.total_revenue
      }
    });
  })
  .catch(() => {
    res.status(500).json({ error: 'Failed to get dashboard overview' });
  });
});

// Get recent bookings
router.get('/recent-bookings', authenticateToken, (req, res) => {
  const { limit = 10 } = req.query;

  db.all(`
    SELECT b.id, b.check_in_date, b.check_out_date, b.status, b.total_amount,
           c.first_name, c.last_name, r.room_number, rt.name as room_type_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN rooms r ON b.room_id = r.id
    JOIN room_types rt ON r.room_type_id = rt.id
    ORDER BY b.created_at DESC
    LIMIT ?
  `, [parseInt(limit)], (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(bookings);
  });
});

// Get revenue analytics
router.get('/revenue-analytics', authenticateToken, (req, res) => {
  const { period = '30' } = req.query; // days

  const queries = [
    // Daily revenue for the period
    `SELECT DATE(created_at) as date, SUM(total_amount) as revenue
     FROM bookings 
     WHERE status != 'cancelled' AND created_at >= date('now', '-${period} days')
     GROUP BY DATE(created_at)
     ORDER BY date`,
    
    // Revenue by room type
    `SELECT rt.name, SUM(b.total_amount) as revenue, COUNT(*) as bookings
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     JOIN room_types rt ON r.room_type_id = rt.id
     WHERE b.status != 'cancelled' AND b.created_at >= date('now', '-${period} days')
     GROUP BY rt.id
     ORDER BY revenue DESC`,
    
    // Monthly comparison (current vs previous month)
    `SELECT 
       SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN total_amount ELSE 0 END) as current_month,
       SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month') THEN total_amount ELSE 0 END) as previous_month
     FROM bookings 
     WHERE status != 'cancelled'`
  ];

  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      db.all(query, [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }))
  .then(([dailyRevenue, revenueByRoomType, monthlyComparison]) => {
    const currentMonth = monthlyComparison[0]?.current_month || 0;
    const previousMonth = monthlyComparison[0]?.previous_month || 0;
    const monthlyGrowth = previousMonth > 0 ? 
      (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1) : 0;

    res.json({
      daily_revenue: dailyRevenue,
      revenue_by_room_type: revenueByRoomType,
      monthly_comparison: {
        current_month: currentMonth,
        previous_month: previousMonth,
        growth_percentage: monthlyGrowth
      }
    });
  })
  .catch(() => {
    res.status(500).json({ error: 'Failed to get revenue analytics' });
  });
});

// Get occupancy analytics
router.get('/occupancy-analytics', authenticateToken, (req, res) => {
  const { period = '30' } = req.query; // days

  db.all(`
    SELECT 
      DATE(check_in_date) as date,
      COUNT(*) as bookings,
      SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as occupied
    FROM bookings 
    WHERE check_in_date >= date('now', '-${period} days')
    GROUP BY DATE(check_in_date)
    ORDER BY date
  `, [], (err, occupancyData) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get room type occupancy
    db.all(`
      SELECT 
        rt.name,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN b.status IN ('confirmed', 'checked_in') THEN 1 ELSE 0 END) as active_bookings
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE b.created_at >= date('now', '-${period} days')
      GROUP BY rt.id
      ORDER BY active_bookings DESC
    `, [], (err, roomTypeOccupancy) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        daily_occupancy: occupancyData,
        room_type_occupancy: roomTypeOccupancy
      });
    });
  });
});

// Get top customers
router.get('/top-customers', authenticateToken, (req, res) => {
  const { limit = 10 } = req.query;

  db.all(`
    SELECT 
      c.id, c.first_name, c.last_name, c.email,
      COUNT(b.id) as total_bookings,
      SUM(CASE WHEN b.status != 'cancelled' THEN b.total_amount ELSE 0 END) as total_spent,
      MAX(b.created_at) as last_booking_date
    FROM customers c
    JOIN bookings b ON c.id = b.customer_id
    GROUP BY c.id
    ORDER BY total_spent DESC
    LIMIT ?
  `, [parseInt(limit)], (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(customers);
  });
});

// Get upcoming check-ins and check-outs
router.get('/upcoming-activities', authenticateToken, (req, res) => {
  const { days = 7 } = req.query;

  const queries = [
    // Upcoming check-ins
    `SELECT b.id, b.check_in_date, b.adults, b.children,
            c.first_name, c.last_name, c.phone,
            r.room_number, rt.name as room_type_name
     FROM bookings b
     JOIN customers c ON b.customer_id = c.id
     JOIN rooms r ON b.room_id = r.id
     JOIN room_types rt ON r.room_type_id = rt.id
     WHERE b.status = 'confirmed' 
     AND b.check_in_date BETWEEN date('now') AND date('now', '+${days} days')
     ORDER BY b.check_in_date, r.room_number`,
    
    // Upcoming check-outs
    `SELECT b.id, b.check_out_date, b.adults, b.children,
            c.first_name, c.last_name, c.phone,
            r.room_number, rt.name as room_type_name
     FROM bookings b
     JOIN customers c ON b.customer_id = c.id
     JOIN rooms r ON b.room_id = r.id
     JOIN room_types rt ON r.room_type_id = rt.id
     WHERE b.status = 'checked_in' 
     AND b.check_out_date BETWEEN date('now') AND date('now', '+${days} days')
     ORDER BY b.check_out_date, r.room_number`
  ];

  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      db.all(query, [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }))
  .then(([checkins, checkouts]) => {
    res.json({
      upcoming_checkins: checkins,
      upcoming_checkouts: checkouts
    });
  })
  .catch(() => {
    res.status(500).json({ error: 'Failed to get upcoming activities' });
  });
});

// Get room status summary
router.get('/room-status', authenticateToken, (req, res) => {
  db.all(`
    SELECT 
      r.id, r.room_number, r.floor, r.status, r.last_cleaned,
      rt.name as room_type_name, rt.base_price,
      CASE 
        WHEN b.id IS NOT NULL THEN json_object(
          'booking_id', b.id,
          'customer_name', c.first_name || ' ' || c.last_name,
          'check_in_date', b.check_in_date,
          'check_out_date', b.check_out_date,
          'adults', b.adults,
          'children', b.children
        )
        ELSE NULL
      END as current_booking
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.id
    LEFT JOIN bookings b ON r.id = b.room_id 
      AND b.status IN ('confirmed', 'checked_in')
      AND date('now') BETWEEN b.check_in_date AND b.check_out_date
    LEFT JOIN customers c ON b.customer_id = c.id
    ORDER BY r.floor, r.room_number
  `, [], (err, rooms) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse JSON strings for current_booking
    const processedRooms = rooms.map(room => ({
      ...room,
      current_booking: room.current_booking ? JSON.parse(room.current_booking) : null
    }));

    res.json(processedRooms);
  });
});

module.exports = router;