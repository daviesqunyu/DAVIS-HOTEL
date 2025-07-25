#!/bin/bash

# Davis Hotel Management System Deployment Script
echo "🚀 Davis Hotel Management System - Deployment Script"
echo "===================================================="

# Function to display menu
show_menu() {
    echo ""
    echo "Choose deployment option:"
    echo "1) Build for production"
    echo "2) Deploy to Netlify (Frontend)"
    echo "3) Deploy to Vercel (Full-stack)"
    echo "4) Deploy with Docker"
    echo "5) Deploy to Heroku"
    echo "6) Setup GitHub Pages"
    echo "7) Exit"
    echo ""
}

# Function to build for production
build_production() {
    echo "📦 Building for production..."
    
    # Install dependencies
    npm run install-all
    
    # Build client
    cd client
    npm run build
    cd ..
    
    echo "✅ Production build completed!"
    echo "📁 Frontend build files are in: client/build/"
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "🌐 Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    build_production
    
    echo "🚀 Deploying to Netlify..."
    cd client
    netlify deploy --prod --dir=build
    cd ..
    
    echo "✅ Deployed to Netlify!"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "⚡ Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Deployed to Vercel!"
}

# Function to deploy with Docker
deploy_docker() {
    echo "🐳 Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        return 1
    fi
    
    echo "🔨 Building Docker image..."
    docker build -t davis-hotel .
    
    echo "🚀 Starting Docker container..."
    docker run -d -p 5000:5000 --name davis-hotel-app davis-hotel
    
    echo "✅ Deployed with Docker!"
    echo "🌐 Application is running at: http://localhost:5000"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "🟣 Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        echo "❌ Heroku CLI is not installed. Please install it first."
        return 1
    fi
    
    # Create Heroku app
    echo "Creating Heroku app..."
    heroku create davis-hotel-$(date +%s)
    
    # Set environment variables
    heroku config:set NODE_ENV=production
    heroku config:set JWT_SECRET=$(openssl rand -base64 32)
    
    # Deploy
    git push heroku main
    
    echo "✅ Deployed to Heroku!"
}

# Function to setup GitHub Pages
setup_github_pages() {
    echo "📚 Setting up GitHub Pages..."
    
    build_production
    
    # Create gh-pages branch
    git checkout -b gh-pages
    
    # Copy build files to root
    cp -r client/build/* .
    
    # Commit and push
    git add .
    git commit -m "Deploy to GitHub Pages"
    git push origin gh-pages
    
    git checkout main
    
    echo "✅ GitHub Pages setup completed!"
    echo "🌐 Your site will be available at: https://daviesqunyu.github.io/DAVIS-HOTEL/"
}

# Main script
while true; do
    show_menu
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1)
            build_production
            ;;
        2)
            deploy_netlify
            ;;
        3)
            deploy_vercel
            ;;
        4)
            deploy_docker
            ;;
        5)
            deploy_heroku
            ;;
        6)
            setup_github_pages
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please try again."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done