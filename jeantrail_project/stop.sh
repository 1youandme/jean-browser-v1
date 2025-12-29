#!/bin/bash

# 🛑 JeanTrail OS - Stop All Services Script
# Author: Jean AI Assistant
# Version: 1.0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping JeanTrail OS Services...${NC}"

# Stop Docker services
echo -e "${YELLOW}Stopping AI Services (Docker)...${NC}"
docker-compose -f docker-compose.ai.yml down --remove-orphans 2>/dev/null || true

# Stop Node.js processes
echo -e "${YELLOW}Stopping Frontend Server...${NC}"
pkill -f "vite\|npm run dev" 2>/dev/null || true

# Stop Tauri processes
echo -e "${YELLOW}Stopping Tauri...${NC}"
pkill -f "tauri\|cargo tauri" 2>/dev/null || true

# Clean up any remaining processes
echo -e "${YELLOW}Cleaning up remaining processes...${NC}"
pkill -f "node.*1420\|npm.*dev" 2>/dev/null || true

echo -e "${GREEN}✅ All JeanTrail OS services stopped successfully!${NC}"
echo -e "${BLUE}Goodbye! 👋${NC}"