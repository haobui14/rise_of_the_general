# Railway Deployment Guide

This guide will help you deploy the Rise of the General game to Railway.

## Prerequisites

- A [Railway account](https://railway.app/)
- Railway CLI installed (optional): `npm install -g @railway/cli`
- Git repository pushed to GitHub, GitLab, or Bitbucket

## Architecture Overview

Your application will be deployed as three separate services on Railway:

1. **Backend API** (Fastify server)
2. **Frontend** (React SPA served with Nginx)
3. **MongoDB Database** (Railway plugin)

## Step-by-Step Deployment

### 1. Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway and select your repository
5. Railway will detect your project

### 2. Set Up MongoDB Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add MongoDB"**
3. Railway will provision a MongoDB instance
4. Note: The database URL will be available as `MONGO_URL` environment variable

### 3. Deploy the Backend API

#### Option A: Using Railway Dashboard

1. In your project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Railway will create a new service
4. Go to **Settings** tab:
   - Set **Root Directory** to `/` (leave empty for root)
   - Railway will use the `railway.json` configuration automatically

#### Configure Environment Variables

Click on the **Variables** tab and add:

```bash
PORT=3001
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production
```

**Important Notes:**
- `${{MongoDB.MONGO_URL}}` references the MongoDB service
- `${{Frontend.RAILWAY_PUBLIC_DOMAIN}}` will reference your frontend URL (add this after frontend is deployed)
- Generate a strong JWT_SECRET: `openssl rand -base64 32`

#### Deploy

1. The service will automatically deploy
2. Check the **Deployments** tab for build logs
3. Once deployed, note the public URL (e.g., `https://your-app.up.railway.app`)

### 4. Deploy the Frontend

1. In your project, click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Go to **Settings** tab:
   - Set **Root Directory** to `/`
   - Change the **Dockerfile Path** to `apps/web/Dockerfile`

#### Configure Environment Variables

Click on the **Variables** tab and add:

```bash
VITE_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

This will automatically use the backend service URL.

#### Deploy

1. Click **Deploy** or push changes to trigger deployment
2. Once deployed, copy the public frontend URL

### 5. Update Backend CORS Configuration

1. Go back to the **Backend service**
2. Update the `CORS_ORIGIN` variable to match your frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend.up.railway.app
   ```
3. Or use a wildcard for development (not recommended for production):
   ```
   CORS_ORIGIN=*
   ```

### 6. Seed the Database

After both services are deployed, you need to seed the game data.

#### Option A: Using Railway CLI

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Select the backend service
railway service

# Run the seed script
railway run pnpm seed
```

#### Option B: Using One-off Commands in Dashboard

1. Go to your backend service
2. Click on the **Settings** tab
3. Under **Deploy**, find **"One-off Commands"**
4. Run: `pnpm seed`

### 7. Configure Custom Domains (Optional)

#### For Backend:
1. Go to backend service **Settings**
2. Click **"Generate Domain"** or add a custom domain
3. Update `CORS_ORIGIN` to match the custom domain

#### For Frontend:
1. Go to frontend service **Settings**
2. Click **"Generate Domain"** or add a custom domain
3. Update backend's `CORS_ORIGIN` if needed

## Environment Variables Reference

### Backend Service

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (Railway sets this automatically) | `3001` |
| `MONGODB_URI` | MongoDB connection string | `${{MongoDB.MONGO_URL}}` |
| `JWT_SECRET` | Secret key for JWT signing | `use-openssl-rand-base64-32` |
| `CORS_ORIGIN` | Allowed CORS origin (frontend URL) | `https://your-app.up.railway.app` |
| `NODE_ENV` | Environment mode | `production` |

### Frontend Service

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.your-app.up.railway.app` |

## Monitoring and Logs

### View Logs
1. Click on any service
2. Go to the **Deployments** tab
3. Click on the latest deployment to view logs

### Check Service Health
- Backend: Visit `https://your-backend-url.up.railway.app/health`
- Frontend: Visit your frontend URL

## Troubleshooting

### Build Failures

**Issue:** "pnpm not found"
- Solution: Railway should auto-detect pnpm from `package.json`. Ensure `"packageManager": "pnpm@10.6.2"` is set.

**Issue:** "Cannot find module"
- Solution: Check that all dependencies are in `package.json` and `pnpm-workspace.yaml` is properly configured.

### Connection Issues

**Issue:** Frontend can't connect to backend
- Check `CORS_ORIGIN` on backend matches frontend URL exactly
- Verify `VITE_API_URL` on frontend is correct
- Check Network tab in browser DevTools for CORS errors

**Issue:** Backend can't connect to MongoDB
- Verify `MONGODB_URI` is set correctly
- Check MongoDB service is running
- Review backend logs for connection errors

### Database Issues

**Issue:** "No factions/ranks/items found"
- Run the seed script: `railway run pnpm seed`
- Check backend logs during seeding

### CORS Errors

**Issue:** "Access-Control-Allow-Origin" errors
- Update backend `CORS_ORIGIN` to match your frontend domain exactly
- Don't use wildcards in production
- Ensure protocol matches (https:// vs http://)

## Scaling

Railway automatically scales based on usage. For manual scaling:

1. Go to service **Settings**
2. Under **Resources**, adjust:
   - Memory allocation
   - CPU allocation
   - Number of replicas

## Pricing

- Railway offers a free tier with $5/month credit
- Each service consumes resources based on usage
- MongoDB plugin costs extra
- See [Railway Pricing](https://railway.app/pricing) for details

## CI/CD

Railway automatically:
- Builds on every push to your main branch
- Runs health checks
- Rolls back on failure
- Zero-downtime deployments

To disable auto-deploy:
1. Go to service **Settings**
2. Under **Deploy**, toggle off **"Auto Deploy"**

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGIN` (no wildcards)
- [ ] Use HTTPS for all domains
- [ ] Review Railway's [security best practices](https://docs.railway.app/reference/security)
- [ ] Enable Railway's built-in DDoS protection
- [ ] Set up monitoring and alerts

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Fastify Documentation](https://www.fastify.io/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Review this guide's troubleshooting section
3. Search [Railway Discord](https://discord.gg/railway)
4. Open an issue in your repository
