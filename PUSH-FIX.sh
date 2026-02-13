#!/bin/bash

echo "🔧 Pushing fixed build script to GitHub"
echo ""

# Check current branch
BRANCH=$(git branch --show-current 2>/dev/null)

if [ -z "$BRANCH" ]; then
    echo "📝 Creating main branch..."
    git checkout -b main
    BRANCH="main"
fi

echo "📍 Current branch: $BRANCH"
echo ""

# Stage the fixed file
echo "📦 Staging build-optimized.js..."
git add build-optimized.js

# Commit
echo "💾 Committing changes..."
git commit -m "Fix build script - use ES module syntax"

# Ask for token
echo ""
echo "🔑 Enter your GitHub Personal Access Token:"
read -s GITHUB_TOKEN

# Push
echo ""
echo "📤 Pushing to GitHub (branch: $BRANCH)..."
git push https://${GITHUB_TOKEN}@github.com/77akshat-byte/daily-test-simulator.git $BRANCH --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Fixed build script is now on GitHub"
    echo ""
    echo "🎯 Cloudflare will automatically detect the change and redeploy"
    echo "   Check: https://dash.cloudflare.com → Workers & Pages → daily-test-simulator"
else
    echo ""
    echo "❌ Push failed"
    echo ""
    echo "Manual option:"
    echo "1. Go to: https://github.com/77akshat-byte/daily-test-simulator"
    echo "2. Click 'Add file' → 'Upload files'"
    echo "3. Drag build-optimized.js from your folder"
    echo "4. Commit changes"
fi
