#!/bin/bash

# 🚀 JeanTrail OS - One-Click Startup Script
# Author: Jean AI Assistant
# Version: 1.0

set -e  # Exit on any error

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# JeanTrail Logo
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🚀 JEANTRAIL OS - AI-Powered Browser                    ║
║    Future of Web Browsing with AI Assistant                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Check system requirements
check_requirements() {
    print_step "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker found: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose found: $(docker-compose --version)"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm found: $(npm --version)"
    
    # Check available memory
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 16 ]; then
        print_warning "System has less than 16GB RAM. Performance may be limited."
        print_warning "Recommended: 16GB+ RAM for optimal performance"
    else
        print_success "System memory: ${TOTAL_MEM}GB RAM ✓"
    fi
    
    # Check available disk space
    DISK_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$DISK_SPACE" -lt 10 ]; then
        print_error "Less than 10GB disk space available. Please free up space."
        exit 1
    fi
    print_success "Available disk space: ${DISK_SPACE}GB ✓"
}

# Setup environment
setup_environment() {
    print_step "Setting up environment..."
    
    # Create necessary directories
    mkdir -p logs outputs models temp database
    
    # Copy environment file if not exists
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
        else
            print_warning ".env.example not found. Creating basic .env file..."
            cat > .env << EOL
# JeanTrail OS Environment Variables
NODE_ENV=development
PORT=1420
TAURI_DEV_PORT=1420

# Database Configuration
DATABASE_URL=postgresql://jeantrail:password@localhost:5432/jeantrail
REDIS_URL=redis://localhost:6379

# AI Services Configuration
QWEN_API_URL=http://localhost:8001
SDXL_API_URL=http://localhost:8002
WHISPER_API_URL=http://localhost:8003
COQUI_TTS_API_URL=http://localhost:8004

# Jean AI Configuration
JEAN_API_KEY=your-jean-api-key
JEAN_MODEL=qwen-3-72b
JEAN_TEMPERATURE=0.7
JEAN_MAX_TOKENS=2048

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:1420

# Logging
LOG_LEVEL=info
LOG_FILE=logs/jeantrail.log
EOL
            print_success "Created basic .env file"
        fi
    else
        print_success ".env file already exists"
    fi
}

# Start AI Services (Docker)
start_ai_services() {
    print_step "Starting AI Services with Docker..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.ai.yml down --remove-orphans 2>/dev/null || true
    
    # Build and start services
    print_status "Building Docker images..."
    docker-compose -f docker-compose.ai.yml build --no-cache
    
    print_status "Starting AI services..."
    docker-compose -f docker-compose.ai.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    if docker-compose -f docker-compose.ai.yml ps | grep -q "Up (healthy)"; then
        print_success "AI Services are running and healthy! ✓"
    else
        print_warning "Some services may still be starting..."
        docker-compose -f docker-compose.ai.yml ps
    fi
}

# Install Node Dependencies
install_dependencies() {
    print_step "Installing Node.js dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for the first time..."
        npm install
    else
        print_status "Checking for dependency updates..."
        npm ci --silent || npm install
    fi
    print_success "Dependencies installed ✓"
}

# Start Frontend
start_frontend() {
    print_step "Starting JeanTrail Frontend..."
    
    # Kill existing processes
    pkill -f "vite\|npm run dev" 2>/dev/null || true
    
    # Start development server
    print_status "Starting Vite development server..."
    npm run dev > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    sleep 10
    
    # Check if frontend is running
    if curl -s http://localhost:1420 > /dev/null; then
        print_success "Frontend is running on http://localhost:1420 ✓"
    else
        print_error "Frontend failed to start. Check logs/frontend.log"
        exit 1
    fi
}

# Display URLs and Information
show_success() {
    echo -e "\n${GREEN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                     🎉 SUCCESS! 🎉                        ║
║                                                              ║
║  JeanTrail OS is now running and ready to use!              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${CYAN}📱 Access URLs:${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:1420${NC}"
    echo -e "   Public URL: ${GREEN}https://1420-e5de072f-dd5b-4414-84a6-2970706134ec.sandbox-service.public.prod.myninja.ai${NC}"
    
    echo -e "\n${CYAN}🤖 AI Services:${NC}"
    echo -e "   Qwen-3 API: ${BLUE}http://localhost:8001${NC}"
    echo -e "   SDXL API: ${BLUE}http://localhost:8002${NC}"
    echo -e "   Whisper API: ${BLUE}http://localhost:8003${NC}"
    echo -e "   Coqui TTS API: ${BLUE}http://localhost:8004${NC}"
    
    echo -e "\n${CYAN}🗄️  Databases:${NC}"
    echo -e "   PostgreSQL: ${BLUE}localhost:5432${NC}"
    echo -e "   Redis: ${BLUE}localhost:6379${NC}"
    
    echo -e "\n${CYAN}📊 Monitoring:${NC}"
    echo -e "   Logs: ${BLUE}./logs/${NC}"
    echo -e "   Docker Status: ${BLUE}docker-compose -f docker-compose.ai.yml ps${NC}"
    
    echo -e "\n${CYAN}🛑 Stop Services:${NC}"
    echo -e "   Stop All: ${YELLOW}./stop.sh${NC}"
    echo -e "   Stop AI Only: ${YELLOW}docker-compose -f docker-compose.ai.yml down${NC}"
    
    echo -e "\n${GREEN}Jean AI Assistant is ready to help! 🚀${NC}\n"
}

# Error handling
handle_error() {
    print_error "Something went wrong during startup."
    print_status "Checking logs..."
    echo -e "\n${YELLOW}Docker logs:${NC}"
    docker-compose -f docker-compose.ai.yml logs --tail=20
    echo -e "\n${YELLOW}Frontend logs:${NC}"
    tail -20 logs/frontend.log 2>/dev/null || echo "No frontend logs found"
    exit 1
}

# Trap errors
trap 'handle_error' ERR

# Main execution
main() {
    echo -e "${PURPLE}🚀 Starting JeanTrail OS...${NC}\n"
    
    check_requirements
    setup_environment
    start_ai_services
    install_dependencies
    start_frontend
    show_success
    
    # Keep script running
    echo -e "${CYAN}Press Ctrl+C to stop all services...${NC}"
    while true; do
        sleep 5
    done
}

# Handle Ctrl+C gracefully
cleanup() {
    echo -e "\n${YELLOW}Shutting down JeanTrail OS...${NC}"
    pkill -f "vite\|npm run dev" 2>/dev/null || true
    docker-compose -f docker-compose.ai.yml down
    print_success "All services stopped. Goodbye! 👋"
    exit 0
}

trap cleanup INT

# Start the magic
main "$@"