# 🛡️ Sentry Installation Guide

## Prerequisites

You'll need Node.js and npm installed on your system.

### Install Node.js

**Windows:**
1. Download from https://nodejs.org/
2. Run the installer
3. Verify: `node --version` and `npm --version`

**macOS:**
```bash
# Using Homebrew
brew install node

# Or download from https://nodejs.org/
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm
```

## Quick Setup

```bash
# Clone or download the project
cd sentry-alert-deduplication

# Install dependencies
npm install

# Run the demo
npm run demo

# Start the web server
npm start
```

## Available Commands

```bash
# Interactive demo (recommended first run)
npm run demo

# Start web dashboard on http://localhost:3000
npm start

# Development mode with auto-restart
npm run dev

# Simple test without dependencies
npm run test
```

## Project Structure

```
sentry-alert-deduplication/
├── src/
│   ├── index.js              # Express server & dashboard
│   ├── superops-api.js       # SuperOps API simulation
│   ├── deduplication-engine.js # Core deduplication logic
│   ├── demo.js               # Interactive demo scenarios
│   └── test.js               # Simple test script
├── package.json              # Dependencies & scripts
├── README.md                 # Project overview
└── INSTALL.md               # This file
```

## Demo Scenarios

### 1. Command Line Demo
```bash
npm run demo
```
Shows two scenarios:
- Network outage alert storm (25 → 3 alerts)
- Mixed infrastructure alerts (40 → 6 alerts)

### 2. Web Dashboard
```bash
npm start
# Visit http://localhost:3000
```
Interactive dashboard with:
- Real-time metrics
- Alert processing statistics  
- Demo button for live testing

### 3. API Integration
```bash
# Send alerts via webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '[{"type":"CPU_HIGH","severity":"CRITICAL","message":"Test alert"}]'

# Get current metrics
curl http://localhost:3000/api/metrics
```

## Troubleshooting

**"npm not found"**
- Install Node.js from https://nodejs.org/

**"Cannot find module"**
- Run `npm install` to install dependencies

**Port 3000 in use**
- Set different port: `PORT=3001 npm start`

**Demo not working**
- Try the simple test: `npm run test`
- Check console for error messages

## SuperOps Integration

To integrate with real SuperOps API:

1. Update `src/superops-api.js`:
   ```javascript
   const superOpsAPI = new SuperOpsAPI({
     baseURL: 'https://your-superops-instance.com/api',
     apiKey: 'your-api-key',
     simulationMode: false  // Use real API
   });
   ```

2. Configure webhook in SuperOps to point to:
   ```
   POST https://your-server.com/webhook
   ```

3. Deploy to production server (AWS, Azure, etc.)

## Next Steps

1. **Test the demo**: `npm run demo`
2. **Explore the dashboard**: `npm start`
3. **Review the code**: Check `src/` files
4. **Customize rules**: Modify suppression rules in `deduplication-engine.js`
5. **Deploy**: Set up production environment

## Support

For hackathon questions or issues:
- Check the console output for error details
- Review the README.md for project overview
- Test with `npm run test` for basic functionality

---

🚀 **Ready for SuperHack 2025!** This project demonstrates 80%+ alert noise reduction through intelligent deduplication.