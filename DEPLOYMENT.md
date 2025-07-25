# 🚀 Davis Hotel Management System - Deployment Guide

This guide provides multiple options for deploying the Davis Hotel Management System to various hosting platforms.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Basic knowledge of command line

## 🎯 Quick Start

Run the automated deployment script:
```bash
./deploy.sh
```

This interactive script will guide you through various deployment options.

## 🌐 Hosting Options

### 1. Netlify (Frontend Only) - **Recommended for Frontend**

**Pros:** Free tier, easy setup, great for React apps, automatic deployments
**Cons:** Frontend only, need separate backend hosting

#### Steps:
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Build the project: `npm run build`
3. Deploy: `netlify deploy --prod --dir=client/build`

#### Automatic Deployment:
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `client/build`
4. Netlify will auto-deploy on every push to main

### 2. Vercel (Full-stack) - **Recommended for Full-stack**

**Pros:** Free tier, supports both frontend and backend, serverless functions
**Cons:** Function timeout limits on free tier

#### Steps:
1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel --prod`
3. Follow the prompts

#### Automatic Deployment:
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the configuration from `vercel.json`

### 3. Heroku (Full-stack) - **Good for Complete Apps**

**Pros:** Full application hosting, database support, easy scaling
**Cons:** No free tier anymore, requires payment

#### Steps:
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   ```
4. Deploy: `git push heroku main`

### 4. Docker (Self-hosted) - **Best for Control**

**Pros:** Complete control, consistent environments, scalable
**Cons:** Requires server management

#### Steps:
1. Build image: `docker build -t davis-hotel .`
2. Run container: `docker run -d -p 5000:5000 davis-hotel`

#### Using Docker Compose:
```bash
docker-compose up -d
```

### 5. GitHub Pages (Frontend Only) - **Free Static Hosting**

**Pros:** Free, integrated with GitHub, simple
**Cons:** Static only, no backend support

#### Steps:
1. Build the project: `npm run build`
2. Create gh-pages branch
3. Copy build files to root
4. Push to gh-pages branch

### 6. Railway - **Modern Alternative to Heroku**

**Pros:** Simple deployment, good free tier, automatic deployments
**Cons:** Newer platform

#### Steps:
1. Connect GitHub repository to Railway
2. Railway will automatically detect and deploy

### 7. DigitalOcean App Platform

**Pros:** Managed platform, good performance, reasonable pricing
**Cons:** No free tier

#### Steps:
1. Create app on DigitalOcean App Platform
2. Connect GitHub repository
3. Configure build and run commands

## 🔧 Environment Configuration

### Production Environment Variables

Create a `.env` file in the server directory:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secure-jwt-secret-key
DB_PATH=./database/hotel.db
UPLOAD_PATH=./uploads
```

### Frontend Environment Variables

Create a `.env` file in the client directory:

```env
REACT_APP_API_URL=https://your-backend-url.com
```

## 📊 Performance Optimization

### Frontend Optimizations
- Build optimization is already configured in `package.json`
- Code splitting implemented
- Lazy loading for components
- Image optimization

### Backend Optimizations
- Compression middleware enabled
- Security headers with Helmet
- Request logging with Morgan
- Efficient database queries

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default JWT secret
- [ ] Use HTTPS in production
- [ ] Set up proper CORS configuration
- [ ] Enable rate limiting
- [ ] Secure database access
- [ ] Regular security updates

### Environment Security
```bash
# Generate secure JWT secret
openssl rand -base64 32
```

## 📈 Monitoring and Analytics

### Recommended Tools
- **Frontend:** Google Analytics, Hotjar
- **Backend:** New Relic, DataDog, or built-in monitoring
- **Uptime:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm run install-all
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Netlify
      uses: netlify/actions/cli@master
      with:
        args: deploy --dir=client/build --prod
      env:
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version (18+ required)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for missing dependencies

#### Database Issues
- Ensure database directory exists
- Check file permissions
- Verify SQLite installation

#### CORS Errors
- Configure CORS in server for your domain
- Check API URL in frontend environment variables

#### Memory Issues
- Increase Node.js memory limit: `--max-old-space-size=4096`
- Optimize build process
- Use production build

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review server logs
3. Check browser console for frontend issues
4. Verify environment variables
5. Test locally first

## 🔗 Useful Links

- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Heroku Documentation](https://devcenter.heroku.com/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

---

**Davis Hotel Management System** - Choose the deployment option that best fits your needs and budget!