#!/bin/bash

# ACI Dashboard Startup Script
# This script ensures the dashboard starts correctly every time

set -e  # Exit on error

echo "================================================"
echo "  ACI Dashboard Startup Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found!${NC}"
    echo "Please run this script from the ACI-DASHBOARD directory"
    exit 1
fi

# Check if /etc/hosts has the required entry
echo "Checking /etc/hosts configuration..."
if ! grep -q "acidashboard.aci.local" /etc/hosts; then
    echo -e "${YELLOW}Warning: acidashboard.aci.local not found in /etc/hosts${NC}"
    echo ""
    echo "Please add the following entry to /etc/hosts:"
    echo -e "${GREEN}127.0.0.1 acidashboard.aci.local${NC}"
    echo ""
    echo "Run this command:"
    echo -e "${GREEN}sudo sh -c 'echo \"127.0.0.1 acidashboard.aci.local\" >> /etc/hosts'${NC}"
    echo ""
    echo "You can still access the dashboard via: http://localhost:2005"
    echo ""
else
    echo -e "${GREEN}✓ /etc/hosts is configured correctly${NC}"
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

# Stop any existing containers
echo ""
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Start all services
echo ""
echo "Starting ACI Dashboard services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "Waiting for services to become healthy..."
sleep 5

# Check container status
echo ""
echo "Container Status:"
docker-compose ps

# Check if nginx is healthy
echo ""
echo "Checking nginx health..."
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f http://localhost:2005/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Nginx is healthy and responding${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "${RED}✗ Nginx failed to become healthy${NC}"
        echo "Check logs with: docker logs aci-dashboard_nginx_1"
        exit 1
    fi
    echo "Waiting for nginx... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

# Display access information
echo ""
echo "================================================"
echo -e "${GREEN}  ACI Dashboard is now running!${NC}"
echo "================================================"
echo ""
echo "Access the dashboard at:"
echo -e "${GREEN}  • http://localhost:2005${NC}"
if grep -q "acidashboard.aci.local" /etc/hosts; then
    echo -e "${GREEN}  • http://acidashboard.aci.local:2005${NC}"
fi
echo ""
echo "Service Ports (2000 series):"
echo "  • Database (PostgreSQL): 2001"
echo "  • Cache (Redis):        2002"
echo "  • Backend API:          2003"
echo "  • Frontend:             2004"
echo "  • Nginx (Web):          2005"
echo ""
echo "Useful Commands:"
echo "  • View logs:     docker-compose logs -f"
echo "  • Stop:          docker-compose down"
echo "  • Restart:       docker-compose restart"
echo "  • Status:        docker-compose ps"
echo ""
echo "================================================"
