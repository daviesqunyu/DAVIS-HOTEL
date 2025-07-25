# DAVIS HOTEL MANAGEMENT SYSTEM

A comprehensive, full-stack hotel management system built with modern technologies. This system provides complete functionality for managing hotel operations including room bookings, customer management, staff administration, and detailed analytics.

## 🏨 Features

### Core Functionality
- **Dashboard Analytics** - Real-time overview of hotel operations with charts and statistics
- **Room Management** - Manage room types, availability, and status tracking
- **Booking System** - Complete reservation management with check-in/check-out functionality
- **Customer Management** - Customer profiles, booking history, and statistics
- **Staff Administration** - User management with role-based access control
- **Revenue Analytics** - Detailed financial reporting and trend analysis

### Key Features
- 🔐 **Secure Authentication** - JWT-based authentication with role management
- 📊 **Real-time Dashboard** - Live statistics and interactive charts
- 📱 **Responsive Design** - Mobile-friendly interface using Material-UI
- 🔍 **Advanced Search** - Quick search across customers, bookings, and rooms
- 📈 **Analytics & Reporting** - Revenue trends, occupancy rates, and performance metrics
- 🎨 **Modern UI/UX** - Beautiful, intuitive interface with dark/light theme support
- ⚡ **Real-time Updates** - Live data updates using React Query
- 🔄 **Status Management** - Room status tracking (available, occupied, maintenance, cleaning)

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **SQLite** - Database (easily upgradeable to PostgreSQL)
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **Multer** - File upload handling

### Frontend
- **React 18** - User interface library
- **Material-UI (MUI)** - React component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **date-fns** - Date manipulation

### Development Tools
- **Concurrently** - Run multiple commands
- **Nodemon** - Development server auto-restart

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/daviesqunyu/DAVIS-HOTEL.git
cd DAVIS-HOTEL
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Initialize Database
```bash
# Initialize the SQLite database with sample data
cd server
npm run init-db
cd ..
```

### 4. Environment Configuration
Create a `.env` file in the `server` directory:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=./database/hotel.db
UPLOAD_PATH=./uploads
```

### 5. Start the Application
```bash
# Start both backend and frontend in development mode
npm run dev

# Or start them separately:
# Backend only
npm run server

# Frontend only
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔑 Default Login Credentials

**Administrator Account:**
- Username: `admin`
- Password: `admin123`

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new staff (admin only)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Room Management
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `GET /api/rooms/types` - Get room types
- `POST /api/rooms/types` - Create room type
- `GET /api/rooms/availability` - Check availability
- `PATCH /api/rooms/:id/status` - Update room status

### Booking Management
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `PATCH /api/bookings/:id/checkin` - Check-in guest
- `PATCH /api/bookings/:id/checkout` - Check-out guest
- `PATCH /api/bookings/:id/cancel` - Cancel booking

### Customer Management
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/stats` - Get customer statistics

### Dashboard & Analytics
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/revenue-analytics` - Revenue analytics
- `GET /api/dashboard/occupancy-analytics` - Occupancy analytics
- `GET /api/dashboard/recent-bookings` - Recent bookings
- `GET /api/dashboard/upcoming-activities` - Upcoming check-ins/outs
- `GET /api/dashboard/room-status` - Room status overview

## 🗄 Database Schema

### Core Tables
- **users** - Staff accounts and authentication
- **customers** - Customer information and profiles
- **room_types** - Room categories and pricing
- **rooms** - Individual room inventory
- **bookings** - Reservation records
- **payments** - Payment transactions
- **services** - Additional hotel services
- **booking_services** - Services linked to bookings

## 👥 User Roles & Permissions

### Administrator
- Full system access
- User management
- System configuration
- All booking and customer operations

### Manager
- Booking management
- Customer management
- Room management
- Staff performance viewing
- Revenue reports

### Staff
- Booking operations
- Customer service
- Room status updates
- Basic reporting

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Dark/Light Theme** - Automatic theme switching
- **Interactive Charts** - Real-time data visualization
- **Quick Actions** - Streamlined workflows
- **Search & Filters** - Advanced data filtering
- **Real-time Updates** - Live data synchronization

## 📊 Analytics & Reporting

- **Occupancy Rates** - Real-time room occupancy tracking
- **Revenue Trends** - Daily, weekly, monthly revenue analysis
- **Customer Analytics** - Customer behavior and preferences
- **Staff Performance** - Booking metrics per staff member
- **Room Performance** - Revenue per room type
- **Seasonal Trends** - Historical booking patterns

## 🔧 Development

### Project Structure
```
DAVIS-HOTEL/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── scripts/          # Database scripts
│   ├── index.js          # Server entry point
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

### Available Scripts
```bash
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run client       # Start frontend only
npm run build        # Build for production
npm run install-all  # Install all dependencies
```

## 🚀 Deployment

### Quick Deployment
Use the automated deployment script:
```bash
./deploy.sh
```

This interactive script provides multiple hosting options:
- **Netlify** (Frontend) - Free tier, great for React apps
- **Vercel** (Full-stack) - Free tier, serverless functions
- **Heroku** (Full-stack) - Complete application hosting
- **Docker** (Self-hosted) - Complete control
- **GitHub Pages** (Frontend) - Free static hosting

### Manual Production Build
```bash
# Install all dependencies
npm run install-all

# Build the frontend
npm run build

# The build files will be in client/build/
```

### Hosting Options

| Platform | Type | Free Tier | Best For |
|----------|------|-----------|----------|
| **Netlify** | Frontend | ✅ Yes | React apps, static sites |
| **Vercel** | Full-stack | ✅ Yes | Full-stack apps, serverless |
| **Railway** | Full-stack | ✅ Limited | Modern alternative to Heroku |
| **Heroku** | Full-stack | ❌ No | Complete applications |
| **Docker** | Self-hosted | ✅ Yes | Custom deployments |
| **GitHub Pages** | Frontend | ✅ Yes | Simple static hosting |

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-production-jwt-secret
DB_PATH=./database/hotel.db
UPLOAD_PATH=./uploads
```

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Davies Qunyu**
- GitHub: [@daviesqunyu](https://github.com/daviesqunyu)

## 🙏 Acknowledgments

- Material-UI team for the excellent React components
- React team for the amazing frontend framework
- Express.js team for the robust backend framework
- All open-source contributors who made this project possible

---

**Davis Hotel Management System** - Complete hotel management solution for the modern hospitality industry.