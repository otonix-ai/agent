#!/bin/bash

set -e

echo "🚀 Otonix Agent Setup"
echo "======================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Installing Python 3..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "Installing curl..."
    sudo apt-get install -y curl
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Installing jq..."
    sudo apt-get install -y jq
fi

echo "✓ Python, curl, and jq are installed"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Create .env from template if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp config.example.env .env
    echo "✓ .env created"
    echo ""
    echo "⚠️  Please edit .env with your API keys:"
    echo "   - ANTHROPIC_API_KEY or OPENAI_API_KEY"
    echo "   - OTONIX_API_KEY (from https://app.otonix.tech)"
    echo ""
    echo "You can edit it with: nano .env"
else
    echo "✓ .env already exists"
fi

# Make agent.py executable
chmod +x agent.py
echo "✓ Made agent.py executable"

echo ""
echo "Setup complete! 🎉"
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Run: python3 agent.py"
