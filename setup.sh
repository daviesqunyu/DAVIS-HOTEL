#!/bin/bash

# Davis Hotel Management System Setup Script
echo "🏨 Setting up Davis Hotel Management System..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v14 or higher) first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
echo "✅ Server dependencies installed"

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
npm install
echo "✅ Client dependencies installed"

# Go back to root
cd ..

# Initialize database
echo "🗄️  Initializing database..."
cd server
npm run init-db
cd ..
echo "✅ Database initialized with sample data"

# Create environment file if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "⚙️  Creating environment configuration..."
    cat > server/.env << EOL
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=./database/hotel.db
UPLOAD_PATH=./uploads
EOL
    echo "✅ Environment file created"
else
    echo "⚙️  Environment file already exists"
fi

# Create uploads directory
mkdir -p server/uploads
echo "✅ Uploads directory created"

echo ""
echo "🎉 Setup completed successfully!"
echo "================================================"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev          # Start both frontend and backend"
echo "   npm run server       # Start backend only"
echo "   npm run client       # Start frontend only"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "🔑 Default login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📖 For more information, see README.md"
echo ""