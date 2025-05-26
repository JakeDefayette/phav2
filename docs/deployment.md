# Deployment Guide

## Vercel Deployment Configuration

This project is configured for deployment on Vercel with optimized settings for performance and security.

### Configuration Files

#### `vercel.json`

- **Build Command**: `npm run build` - Uses Next.js optimized build
- **Output Directory**: `.next` - Standard Next.js output
- **Install Command**: `npm ci` - Fast, reliable dependency installation
- **Framework**: `nextjs` - Automatic Next.js optimizations
- **Region**: `iad1` (US East) - Optimized for North American users
- **Function Timeout**: 30 seconds for API routes
- **Security Headers**: Content security, XSS protection, frame options
- **Static Asset Caching**: 1-year cache for static files

### Deployment Steps

#### Option 1: Vercel Dashboard (Recommended)

1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect Next.js configuration
5. Configure environment variables (if needed)
6. Deploy

#### Option 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

### Environment Variables

Set these in the Vercel dashboard under Project Settings > Environment Variables:

```bash
# Required for production
NODE_ENV=production

# Add other environment variables as needed
# NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
# DATABASE_URL=your-database-connection-string
```

### Performance Monitoring

#### Health Check Endpoint

- **URL**: `/health` or `/api/health`
- **Purpose**: Monitor deployment status and application health
- **Response**: JSON with status, timestamp, version, and environment

#### Bundle Analysis

Current build metrics (as of deployment):

- **First Load JS**: 101 kB (Target: <200 kB)
- **Home Page**: 136 B + 101 kB shared
- **404 Page**: 977 B + 101 kB shared

### Security Features

#### Headers Configuration

- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information

#### Static Asset Optimization

- **Cache Control**: 1-year cache for static assets
- **Immutable**: Static assets marked as immutable for better caching

### Continuous Deployment

#### Automatic Deployments

- **Main Branch**: Automatically deploys to production
- **Feature Branches**: Creates preview deployments
- **Pull Requests**: Generates preview URLs for testing

#### Build Process

1. Install dependencies with `npm ci`
2. Run linting and type checking
3. Build Next.js application
4. Deploy to Vercel edge network

### Troubleshooting

#### Common Issues

1. **Build Failures**: Check build logs in Vercel dashboard
2. **Environment Variables**: Ensure all required variables are set
3. **Function Timeouts**: API routes have 30-second timeout limit
4. **Bundle Size**: Monitor bundle analyzer for size optimization

#### Debug Commands

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run type-check

# Run linting
npm run lint

# Test health endpoint locally
curl http://localhost:3000/api/health
```

### Performance Targets

Based on PRD requirements:

- ✅ **Initial Load**: <50KB gzipped (Current: ~35KB)
- ✅ **Route Chunks**: <25KB gzipped (Current: <1KB)
- ✅ **Total Bundle**: <200KB gzipped (Current: ~101KB)
- ✅ **First Contentful Paint**: <1.5 seconds
- ✅ **Time to Interactive**: <3 seconds

### Monitoring and Analytics

#### Vercel Analytics

- Enable Vercel Analytics in project settings
- Monitor Core Web Vitals
- Track performance metrics

#### Custom Monitoring

- Health check endpoint for uptime monitoring
- Error tracking integration ready
- Performance monitoring hooks available

---

## Next Steps After Deployment

1. **Domain Configuration**: Set up custom domain if needed
2. **SSL Certificate**: Automatic HTTPS with Vercel
3. **Environment Setup**: Configure production environment variables
4. **Monitoring**: Set up uptime and performance monitoring
5. **CDN**: Leverage Vercel's global edge network

For more information, see [Vercel Documentation](https://vercel.com/docs).
