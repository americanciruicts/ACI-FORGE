#!/bin/bash

# ACI Dashboard Monitoring Script
# This script monitors all containers and sends alerts if any are down

LOG_FILE="/var/log/aci-dashboard-monitor.log"
ALERT_EMAIL="preet@americancircuits.com"
SLACK_WEBHOOK=""  # Add your Slack webhook URL if needed

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local message="$1"
    log_message "ALERT: $message"
    
    # Send email alert (requires mailutils to be installed)
    # echo "$message" | mail -s "ACI Dashboard Alert" "$ALERT_EMAIL"
    
    # Send Slack alert (uncomment and configure webhook)
    # if [ ! -z "$SLACK_WEBHOOK" ]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"ACI Dashboard Alert: $message\"}" \
    #         "$SLACK_WEBHOOK"
    # fi
}

# Check container health
check_containers() {
    local unhealthy_containers=()
    local containers=("aci-dashboard_frontend_1" "aci-dashboard_backend_1" "aci-dashboard_nginx_1" "aci-dashboard_redis_1")
    
    for container in "${containers[@]}"; do
        if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
            unhealthy_containers+=("$container")
        fi
    done
    
    if [ ${#unhealthy_containers[@]} -gt 0 ]; then
        local message="The following containers are down: ${unhealthy_containers[*]}"
        send_alert "$message"
        
        # Attempt to restart the containers
        log_message "Attempting to restart failed containers..."
        docker-compose -f /home/tony/ACI-DASHBOARD/docker-compose.yml up -d
        
        sleep 30
        
        # Check again after restart attempt
        local still_down=()
        for container in "${unhealthy_containers[@]}"; do
            if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
                still_down+=("$container")
            fi
        done
        
        if [ ${#still_down[@]} -gt 0 ]; then
            send_alert "CRITICAL: Failed to restart containers: ${still_down[*]}"
        else
            log_message "Successfully restarted all containers"
        fi
    else
        log_message "All containers are running healthy"
    fi
}

# Check disk space
check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -gt 85 ]; then
        send_alert "Disk space is critically low: ${usage}% used"
    fi
}

# Check memory usage
check_memory() {
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$memory_usage" -gt 90 ]; then
        send_alert "Memory usage is critically high: ${memory_usage}%"
    fi
}

# Main monitoring loop
log_message "Starting ACI Dashboard monitoring..."

while true; do
    check_containers
    check_disk_space
    check_memory
    
    # Wait 2 minutes before next check
    sleep 120
done