# Railway Deployment - Quick Start

## 🚀 Deploy in 5 Minutes

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select this repository

### Step 2: Add MongoDB
1. Click **"+ New"** → **"Database"** → **"Add MongoDB"**
2. Railway provisions the database automatically

### Step 3: Deploy Backend
1. Click **"+ New"** → **"Empty Service"**
2. Connect to your GitHub repo
3. Settings:
   - Leave root directory empty
   - Railway uses `railway.json` automatically

**Environment Variables:**
```env
PORT=3001
MONGODB_URI=${{MongoDB.MONGO_URL}}
JWT_SECRET=<generate-with-openssl-rand-base64-32>
CORS_ORIGIN=*
NODE_ENV=production
```

### Step 4: Deploy Frontend
1. Click **"+ New"** → **"Empty Service"**
2. Connect to your GitHub repo
3. Settings → **Custom Build Settings**:
   - Dockerfile Path: `apps/web/Dockerfile`

**Environment Variables:**
```env
VITE_API_URL=https://<your-backend-url>.up.railway.app
```

### Step 5: Seed Database
Using Railway CLI:
```bash
railway login
railway link
railway service  # select backend
railway run pnpm seed
```

Or in Railway dashboard:
1. Backend service → **Settings** → **Deploy**
2. Run one-off command: `pnpm seed`

### Step 6: Update CORS
1. Copy your frontend URL from Railway
2. Backend → Variables → Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://<your-frontend-url>.up.railway.app
   ```

## ✅ Done!

Visit your frontend URL and start playing!

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions and troubleshooting.

## Local Docker Testing (Optional)

Test the Docker builds locally before deploying:

### Backend:
```bash
# From project root
docker build -f apps/server/Dockerfile -t rotg-backend .
docker run -p 3001:3001 \
  -e MONGODB_URI=mongodb://localhost:27018/rise_of_the_general \
  -e JWT_SECRET=test-secret \
  -e CORS_ORIGIN=* \
  rotg-backend
```

### Frontend:
```bash
# From project root
docker build -f apps/web/Dockerfile -t rotg-frontend .
docker run -p 8080:80 rotg-frontend
```

Visit http://localhost:8080
