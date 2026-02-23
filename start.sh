#!/bin/bash

# OpenFund dApp Startup Script
echo "🚀 Starting OpenFund dApp Setup..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    echo "   cd frontend && ./start.sh"
    exit 1
fi

echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

echo "🔧 Checking environment variables..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating basic .env file..."
    cat > .env << EOF
# Pinata Configuration
VITE_PINATA_API_KEY=8997f0f6dd99c9a0d60b
VITE_PINATA_SECRET_KEY=61e74a1e6c5c43c8469a213f8874db941c3a6dada6c161601b8bfb4eb8a56c2e
EOF
    echo "✅ Basic .env file created"
else
    echo "✅ Environment file exists"
fi

echo "🌐 Starting development server..."
echo ""
echo "📱 OpenFund dApp will be available at:"
echo "   🌐 Local: http://localhost:5173/"
echo "   🔗 Network: http://localhost:5173/ (use --host to expose)"
echo ""
echo "🎯 Features to test:"
echo "   • Network Selection (Base Sepolia / Ethereum Sepolia)"
echo "   • Wallet Connection (MetaMask)"
echo "   • Campaign Creation"
echo "   • Multi-network Support"
echo ""
echo "🛑 To stop the server: Press Ctrl+C"
echo "=================================="
echo ""

# Start the development server
npm run dev