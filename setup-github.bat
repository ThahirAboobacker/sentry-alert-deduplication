@echo off
echo 🛡️ Setting up Sentry GitHub Repository
echo =====================================

echo.
echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding all files...
git add .

echo.
echo Step 3: Creating initial commit...
git commit -m "🛡️ Initial commit: Sentry Alert Deduplication - SuperHack 2025

✨ Features:
- 88%% alert noise reduction
- Smart deduplication engine
- Critical alert protection
- SuperOps integration ready
- Bulletproof demo system

🏆 SuperHack 2025 - Service Efficiency Improvement"

echo.
echo Step 4: Setting main branch...
git branch -M main

echo.
echo ✅ Git repository initialized successfully!
echo.
echo 📋 Next steps:
echo 1. Create a new repository on GitHub named: sentry-alert-deduplication
echo 2. Copy the repository URL
echo 3. Run: git remote add origin YOUR_REPO_URL
echo 4. Run: git push -u origin main
echo.
echo 🚀 Or use GitHub CLI:
echo gh repo create sentry-alert-deduplication --public --description "🛡️ Sentry: AI-powered alert deduplication for SuperOps - Reduces alert fatigue by 88%% | SuperHack 2025"
echo git push -u origin main

pause