const db = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = () => {
  console.log('🚀 Initializing Davis Hotel Database...');

  // Users table (for staff authentication)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'staff',
      full_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Room types table
  db.run(`
    CREATE TABLE IF NOT EXISTS room_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      description TEXT,
      base_price DECIMAL(10,2) NOT NULL,
      max_occupancy INTEGER NOT NULL,
      amenities TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rooms table
  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number VARCHAR(10) UNIQUE NOT NULL,
      room_type_id INTEGER NOT NULL,
      floor INTEGER,
      status VARCHAR(20) DEFAULT 'available',
      last_cleaned DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_type_id) REFERENCES room_types (id)
    )
  `);

  // Customers table
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      address TEXT,
      id_number VARCHAR(50),
      id_type VARCHAR(20),
      date_of_birth DATE,
      nationality VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bookings table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      check_in_date DATE NOT NULL,
      check_out_date DATE NOT NULL,
      adults INTEGER DEFAULT 1,
      children INTEGER DEFAULT 0,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'confirmed',
      special_requests TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (room_id) REFERENCES rooms (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Payments table
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(20) NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending',
      transaction_id VARCHAR(100),
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings (id)
    )
  `);

  // Services table
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(50),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Booking services table (many-to-many)
  db.run(`
    CREATE TABLE IF NOT EXISTS booking_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      total_price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings (id),
      FOREIGN KEY (service_id) REFERENCES services (id)
    )
  `);

  console.log('✅ Database tables created successfully');

  // Insert default data
  insertDefaultData();
};

const insertDefaultData = () => {
  console.log('📝 Inserting default data...');

  // Create default admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (username, email, password, role, full_name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['admin', 'admin@davishotel.com', adminPassword, 'admin', 'System Administrator', '+1234567890']);

  // Insert room types
  const roomTypes = [
    ['Standard Single', 'Comfortable single room with basic amenities', 99.99, 1, 'WiFi, TV, AC, Private Bathroom'],
    ['Standard Double', 'Spacious double room perfect for couples', 149.99, 2, 'WiFi, TV, AC, Private Bathroom, Mini Fridge'],
    ['Deluxe Suite', 'Luxurious suite with separate living area', 299.99, 4, 'WiFi, TV, AC, Private Bathroom, Mini Fridge, Balcony, Room Service'],
    ['Presidential Suite', 'Ultimate luxury with premium amenities', 599.99, 6, 'WiFi, TV, AC, Private Bathroom, Mini Fridge, Balcony, Room Service, Jacuzzi, Butler Service']
  ];

  roomTypes.forEach(roomType => {
    db.run(`
      INSERT OR IGNORE INTO room_types (name, description, base_price, max_occupancy, amenities)
      VALUES (?, ?, ?, ?, ?)
    `, roomType);
  });

  // Insert sample rooms
  const rooms = [
    ['101', 1, 1, 'available'],
    ['102', 1, 1, 'available'],
    ['103', 2, 1, 'available'],
    ['104', 2, 1, 'available'],
    ['201', 2, 2, 'available'],
    ['202', 3, 2, 'available'],
    ['301', 4, 3, 'available']
  ];

  rooms.forEach(room => {
    db.run(`
      INSERT OR IGNORE INTO rooms (room_number, room_type_id, floor, status)
      VALUES (?, ?, ?, ?)
    `, room);
  });

  // Insert sample services
  const services = [
    ['Room Service', 'Food delivery to your room', 15.00, 'Food & Beverage'],
    ['Laundry Service', 'Professional laundry and dry cleaning', 25.00, 'Housekeeping'],
    ['Spa Treatment', 'Relaxing spa and massage services', 80.00, 'Wellness'],
    ['Airport Transfer', 'Convenient airport pickup and drop-off', 45.00, 'Transportation'],
    ['Late Checkout', 'Extend your stay until 6 PM', 50.00, 'Accommodation']
  ];

  services.forEach(service => {
    db.run(`
      INSERT OR IGNORE INTO services (name, description, price, category)
      VALUES (?, ?, ?, ?)
    `, service);
  });

  console.log('✅ Default data inserted successfully');
  console.log('🔑 Default admin credentials: admin / admin123');
};

// Run initialization
initDatabase();

// Close database connection after initialization
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('📁 Database connection closed');
    }
    process.exit(0);
  });
}, 1000);