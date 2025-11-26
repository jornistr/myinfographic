# Railway Deployment Guide

## Quick Start

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Push your code to GitHub
   - In Railway: "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure Environment Variables**
   In Railway dashboard, add these variables:
   ```
   NODE_ENV=production
   LLM_API_KEY=your_google_api_key_here
   NANO_BANANA_API_KEY=your_google_api_key_here
   ```

4. **Deploy!**
   - Railway will automatically build and deploy
   - You'll get a URL like: `https://myinfographic-production.up.railway.app`

## Alternative: Deploy without GitHub

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set NODE_ENV=production
railway variables set LLM_API_KEY=your_key_here
railway variables set NANO_BANANA_API_KEY=your_key_here

# Deploy
railway up
```

## Build Process

Railway will automatically:
1. Install dependencies: `npm install`
2. Build frontend: `npm run build` (builds React app to `client/dist`)
3. Start server: `npm start` (runs `node server/index.js`)

The server will serve the built React app on the same port.

## Cost

- **Free tier**: $5 credit per month
- Your app will use approximately $1-2/month
- No credit card required to start

## Monitoring

- View logs in Railway dashboard
- Check deployment status
- Monitor resource usage

## Troubleshooting

**Build fails:**
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility

**App doesn't load:**
- Check environment variables are set
- View logs for errors
- Ensure `NODE_ENV=production` is set

**API errors:**
- Verify Google API key is valid
- Check API quotas in Google Cloud Console
