# Grant Trader Deployment Guide

## Quick Start (Local with Ngrok)

### Starting the App
```bash
cd /Users/tyler/Desktop/Claude\ Code/grant-trader
./start.sh
```

This will:
- Start the backend server on port 3001
- Start the frontend on port 3000
- Start ngrok tunnel and display your public URL
- Show all process IDs and log locations

### Stopping the App
```bash
./stop.sh
```

### Limitations of Ngrok Free Tier
- **Session Duration**: Tunnels close when your computer sleeps or the terminal closes
- **Inactivity Timeout**: 2 hours of no traffic
- **URL Changes**: The URL changes each time you restart (unless you upgrade)
- **Interstitial Page**: Visitors see a warning page on first visit
- **No Persistence**: Processes don't survive computer restarts

---

## Production Deployment Options

For sharing with collaborators and keeping it online 24/7, here are your options:

### Option 1: Ngrok Pro ($8-20/month)
**Best for**: Quick sharing, testing, or short-term collaboration

**Pros**:
- Same setup you have now
- Reserved domain (same URL every time)
- No interstitial warning page
- Longer session times

**Cons**:
- Still requires your computer to be on
- Not truly production-ready

**Setup**: Upgrade at https://ngrok.com/pricing

---

### Option 2: Railway.app (Free tier + ~$5-10/month)
**Best for**: Production deployment without DevOps headaches

**Pros**:
- Easy deployment (similar to Vercel)
- Always online
- Free PostgreSQL database
- Automatic SSL
- Custom domain support

**Cons**:
- Need to migrate from SQLite to PostgreSQL

**Estimated Cost**: $5-10/month

---

### Option 3: Render.com (Free tier available)
**Best for**: Completely free deployment

**Pros**:
- Free tier exists
- PostgreSQL database included
- Custom domain support

**Cons**:
- Free tier has cold starts (30-60 seconds)

**Estimated Cost**: $0 (free) or $7/month (always-on)

---

## My Recommendation

**For Immediate Sharing**: Ngrok Pro ($8/month)
**For Long-Term**: Railway.app ($5-10/month)
**If Budget is $0**: Render.com free tier
