#!/bin/bash

# Setup Vercel CLI for local development
# This allows Claude to interact with Vercel through bash commands

echo "🚀 Setting up Vercel CLI..."

# Install Vercel CLI globally
npm install -g vercel

echo "✅ Vercel CLI installed!"
echo ""
echo "To connect to your Vercel project:"
echo "1. Run: vercel login"
echo "2. Run: vercel link"
echo "3. Select your existing project when prompted"
echo ""
echo "Useful commands:"
echo "  vercel dev     - Run development server with env vars"
echo "  vercel pull    - Pull environment variables"
echo "  vercel deploy  - Deploy to preview"
echo "  vercel --prod  - Deploy to production"
echo "  vercel logs    - View function logs"
echo ""
echo "Claude can then use these commands via the Bash tool!"