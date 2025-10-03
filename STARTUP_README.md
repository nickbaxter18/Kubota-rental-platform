# 🚀 Kubota Rental Platform - Complete Startup Guide

## 📋 Quick Start (One Command)

```bash
cd kubota-rental-platform
./start-with-tunnel.sh
```

## 🛠️ Manual Setup Process

### Step 1: Environment Setup
```bash
cd kubota-rental-platform

# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp codex-meta-data/.env.example codex-meta-data/.env

# Edit .env files with your credentials
nano .env
nano codex-meta-data/.env
```

### Step 2: Start Services

#### Option A: Start Everything (Recommended)
```bash
# Start both frontend and backend with tunnel
./start-with-tunnel.sh
```

#### Option B: Start Services Individually

**Terminal 1 - Backend:**
```bash
cd backend
pnpm start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```

**Terminal 3 - Cloudflare Tunnel:**
```bash
./setup-tunnel.sh
```

### Step 3: Verify Everything Works

**Check Local Services:**
```bash
# Frontend health
curl http://localhost:3000/api/health

# Backend health
curl http://localhost:3001/health

# Tunnel status
cloudflared tunnel list
```

**Check Tunnel URLs:**
```bash
# Direct tunnel URLs (immediate access)
curl https://87fea528-8ef4-4a46-8eac-7654976bfe49.cfargotunnel.com/api/health
curl https://87fea528-8ef4-4a46-8eac-7654976bfe49.cfargotunnel.com/health

# Production URLs (after DNS setup)
curl https://editor.udigitai.io/api/health
curl https://api.udigitai.io/health
```

## 🌐 Tunnel Configuration

### Current Setup
- **Tunnel Name**: `udigit-rentals`
- **Tunnel ID**: `87fea528-8ef4-4a46-8eac-7654976bfe49`
- **Frontend Route**: `editor.udigitai.io` → `localhost:3000`
- **Backend Route**: `api.udigitai.io` → `localhost:3001`

### Direct Access URLs (No DNS Wait)
- **Frontend**: `https://87fea528-8ef4-4a46-8eac-7654976bfe49.cfargotunnel.com`
- **Backend**: `https://87fea528-8ef4-4a46-8eac-7654976bfe49.cfargotunnel.com`

### Production URLs (After DNS)
- **Frontend**: `https://editor.udigitai.io`
- **Backend**: `https://api.udigitai.io`

## 🔧 Service Management

### Check Running Processes
```bash
# Check all services
ps aux | grep -E "(nest|next|cloudflared)" | grep -v grep

# Check tunnel status
cloudflared tunnel list

# Check tunnel info
cloudflared tunnel info udigit-rentals
```

### Stop All Services
```bash
# Stop everything
pkill -f "nest.js\|next\|cloudflared"

# Wait for cleanup
sleep 3
```

### Restart Individual Services

**Restart Backend:**
```bash
pkill -f "nest.js start"
cd backend && pnpm start:dev
```

**Restart Frontend:**
```bash
pkill -f "next dev"
cd frontend && pnpm dev
```

**Restart Tunnel:**
```bash
pkill -f cloudflared
./setup-tunnel.sh
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. "Port already in use"
```bash
# Find what's using the port
netstat -tulpn | grep :3000

# Kill the process
kill -9 <PID>

# Or use different ports in .env
FRONTEND_PORT=3001
BACKEND_PORT=3002
```

#### 2. Tunnel Connection Issues
```bash
# Check tunnel logs
tail -f tunnel.log

# Restart tunnel
pkill -f cloudflared
./setup-tunnel.sh

# Check tunnel credentials
ls -la ~/.cloudflared/
```

#### 3. Services Not Starting
```bash
# Check for dependency issues
cd backend && pnpm install
cd frontend && pnpm install

# Check environment variables
cat .env | grep -E "(DATABASE|REDIS|STRIPE)"

# Clear cache and restart
rm -rf node_modules/.cache
rm -rf .next
```

#### 4. Database Connection Issues
```bash
# Check if database is running
docker ps | grep postgres

# Start database
docker-compose up -d postgres

# Check database connection
psql -h localhost -U kubota_user -d kubota_rentals
```

#### 5. Cloudflare Tunnel Not Working
```bash
# Check if tunnel exists
cloudflared tunnel list

# Delete and recreate if needed
cloudflared tunnel delete udigit-rentals
./setup-tunnel.sh

# Check DNS configuration
nslookup editor.udigitai.io
```

## 📊 Health Check Endpoints

### Local Endpoints
- **Frontend**: `http://localhost:3000/api/health`
- **Backend**: `http://localhost:3001/health`

### Tunnel Endpoints
- **Frontend**: `https://87fea528-8ef4-4a46-8eac-7654976bfe49.cfargotunnel.com/api/health`
- **Backend**: `https://87fea528-8ef4-4a46-8eac-7654976bfe49.cfargotunnel.com/health`

### Expected Responses
**Frontend Health:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-01T23:13:44.966Z",
  "service": "frontend",
  "version": "1.0.0",
  "environment": "development"
}
```

**Backend Health:**
- Should return HTML page (NestJS default page)

## 🔐 Required Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://kubota_user:password@localhost:5432/kubota_rentals

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-key

# DocuSign
DOCUSIGN_CLIENT_ID=your-docusign-client-id
DOCUSIGN_CLIENT_SECRET=your-docusign-secret

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

### Frontend (.env)
```env
# API URLs
NEXT_PUBLIC_API_URL=https://api.udigitai.io
NEXT_PUBLIC_FRONTEND_URL=https://editor.udigitai.io

# Stripe (Public Key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🚀 Production Deployment

### Using Docker
```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose logs -f

# Check health
curl https://editor.udigitai.io/api/health
```

### Manual Deployment
```bash
# Build frontend
cd frontend && pnpm build

# Start backend with production settings
cd backend && pnpm start:prod

# Start tunnel
./setup-tunnel.sh
```

## 📝 Key Files & Directories

### Important Configuration Files
- `tunnel-config.yml` - Cloudflare tunnel routing
- `.env` - Main environment variables
- `codex-meta-data/.env` - Additional environment variables
- `docker-compose.yml` - Development environment
- `docker-compose.production.yml` - Production environment

### Service Directories
- `backend/` - NestJS API server
- `frontend/` - Next.js frontend application
- `codex-meta-data/` - Additional configuration

### Tunnel Files
- `setup-tunnel.sh` - Tunnel setup script
- `start-tunnel.sh` - Simple tunnel start
- `TUNNEL_SETUP.md` - Detailed tunnel documentation

## 🔍 Monitoring & Logs

### Check Service Logs
```bash
# Backend logs (in terminal where backend is running)
# Frontend logs (in terminal where frontend is running)

# Tunnel logs
tail -f tunnel.log

# System logs
journalctl -u cloudflared -f
```

### Monitor Processes
```bash
# Real-time process monitoring
htop

# Check port usage
netstat -tulpn

# Check disk usage
df -h
```

## 🆘 Emergency Procedures

### If Everything Breaks
```bash
# Complete reset
cd kubota-rental-platform

# Stop everything
pkill -f "nest\|next\|cloudflared"

# Clear all caches
rm -rf node_modules/.cache
rm -rf .next
rm -rf backend/dist

# Reinstall dependencies
pnpm install

# Restart everything
./start-with-tunnel.sh
```

### If Tunnel Breaks
```bash
# Quick tunnel fix
./quick-tunnel-fix.sh

# Or manual fix
pkill -f cloudflared
./setup-tunnel.sh
```

## 📞 Support Information

### Current Configuration
- **Project**: Kubota Rental Platform
- **Frontend Port**: 3000
- **Backend Port**: 3001
- **Tunnel Name**: udigit-rentals
- **Tunnel ID**: 87fea528-8ef4-4a46-8eac-7654976bfe49

### Contact Information
- **Emergency Phone**: (506) 643-1575
- **Email**: nickbaxter@udigit.ca
- **Service Area**: Southern New Brunswick

---

## 🎯 Summary

**Your Kubota rental platform is now fully configured with:**
- ✅ Frontend (Next.js) on port 3000
- ✅ Backend (NestJS) on port 3001
- ✅ Cloudflare Tunnel properly routing both services
- ✅ Direct tunnel URLs for immediate testing
- ✅ Production-ready configuration

**Use `./start-with-tunnel.sh` for the quickest startup, or follow the manual steps above for more control.**

🚀 **Happy renting!**
