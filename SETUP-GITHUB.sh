#!/bin/bash

echo "🚀 Setting up GitHub for Daily Test Simulator"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first:"
    echo "   brew install git"
    exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Daily Test Simulator"
else
    echo "✅ Git repository already initialized"
fi

# Add remote
echo ""
echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/77akshat-byte/daily-test-simulator.git

# Ask for GitHub token
echo ""
echo "🔑 Enter your GitHub Personal Access Token:"
echo "   (paste and press Enter - it won't show while typing)"
read -s GITHUB_TOKEN

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push https://${GITHUB_TOKEN}@github.com/77akshat-byte/daily-test-simulator.git main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub"
    echo ""
    echo "Next steps:"
    echo "1. Go to Cloudflare Dashboard → Workers & Pages"
    echo "2. Click 'Create Application' → 'Pages' → 'Connect to Git'"
    echo "3. Select 'daily-test-simulator' repository"
    echo "4. Add your environment variables and D1 binding"
    echo "5. Deploy!"
else
    echo ""
    echo "❌ Push failed. Please check your token and try again."
fi
