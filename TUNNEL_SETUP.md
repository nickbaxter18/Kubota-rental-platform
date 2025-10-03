# 🌐 Cloudflare Tunnel Setup Guide

## 🚨 Problem: Bad Gateway Error

The tunnel is showing a **Bad Gateway** error because:
1. **Missing tunnel authentication** - Cloudflare tunnel needs proper credentials
2. **Services not running** - Backend/frontend not started correctly
3. **Database dependency** - Backend failing without database connection

## ✅ Solution: Complete Setup Process

### **Step 1: Authenticate Cloudflare Tunnel**

First, you need to authenticate the tunnel with your Cloudflare account:

```bash
cd kubota-rental-platform

# Login to Cloudflare (this will open a browser)
cloudflared tunnel login

# Create the tunnel
./setup-tunnel.sh
```

**What this does:**
- ✅ Creates tunnel if it doesn't exist
- ✅ Sets up proper credentials
- ✅ Configures tunnel routing
- ✅ Starts tunnel with correct configuration

### **Step 2: Start Application Services**

In a **NEW terminal**, start the services:

```bash
cd kubota-rental-platform

# Start frontend and backend
./start-services.sh
```

**What this does:**
- ✅ Starts backend server (port 3001)
- ✅ Starts frontend server (port 3000)
- ✅ Verifies services are running
- ✅ Provides health check endpoints

### **Step 3: Verify Everything Works**

**Check local services:**
```bash
# Frontend health
curl http://localhost:3000/api/health

# Backend health
curl http://localhost:3001/health

# Tunnel status
cloudflared tunnel list
```

**Check tunnel endpoints:**
```bash
# Frontend through tunnel
curl https://editor.udigitai.io/api/health

# API through tunnel
curl https://api.udigitai.io/health
```

## 📋 Quick Fix Commands

### **If tunnel is already created but not working:**

```bash
cd kubota-rental-platform

# Stop any existing tunnels
pkill -f cloudflared

# Start services first
./start-services.sh

# In new terminal, start tunnel
./setup-tunnel.sh
```

### **If you need to recreate tunnel:**

```bash
# Clean up existing tunnel
cloudflared tunnel delete udigit-rentals

# Create fresh tunnel
./setup-tunnel.sh
```

## 🔍 Troubleshooting

### **"cloudflared: command not found"**
```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### **"Cannot determine default origin certificate"**
```bash
# Run the authentication process
cloudflared tunnel login
./setup-tunnel.sh
```

### **"Bad Gateway" error**
```bash
# Check if services are running locally
curl http://localhost:3000/api/health
curl http://localhost:3001/health

# If not running, start them
./start-services.sh

# Check tunnel logs
cat tunnel.log
```

### **"503 Service Unavailable"**
- Wait 30-60 seconds for tunnel initialization
- Check if services are responding locally
- Verify tunnel configuration

## 📊 Expected Result

After successful setup:

- ✅ **Local Services**: http://localhost:3000 & http://localhost:3001
- ✅ **Tunnel URLs**: https://editor.udigitai.io & https://api.udigitai.io
- ✅ **Health Checks**: Both local and tunnel endpoints respond
- ✅ **No Bad Gateway**: Tunnel properly routes to services

## 🚀 Production Deployment

For production deployment with Docker:

```bash
# Build and start all services
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose logs -f

# Check health
curl https://your-domain.com/api/health
```

## 📝 Environment Variables

Make sure your `.env` file includes:

```env
# Tunnel Configuration
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token

# Application URLs
NEXT_PUBLIC_API_URL=https://api.udigitai.io
FRONTEND_URL=https://editor.udigitai.io
```

## 🆘 Getting Help

If you still have issues:

1. **Check logs**: `cat tunnel.log`
2. **Verify services**: `./start-services.sh`
3. **Check tunnel status**: `cloudflared tunnel list`
4. **Test locally first**: Ensure services work on localhost
5. **Wait for initialization**: Tunnel may take 30-60 seconds to start

---

**🎯 The tunnel should now work properly!** 🚀
