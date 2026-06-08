#!/bin/bash

# RootLab - Docker Kali Container Setup Script
# This script sets up a Kali container with all required tools for RootLab

echo "🐳 RootLab - Setting up Kali Docker Container"
echo "=============================================="

# Function to run commands in Kali container
run_in_kali() {
    docker exec -it kali-default bash -c "$1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Pull latest Kali Linux image
echo "📥 Pulling latest Kali Linux image..."
docker pull kalilinux/kali-rolling

# Stop and remove existing container if it exists
echo "🧹 Cleaning up existing container..."
docker stop kali-default 2>/dev/null || true
docker rm kali-default 2>/dev/null || true

# Create and start new Kali container
echo "🚀 Creating new Kali container..."
docker run -d \
    --name kali-default \
    --hostname kali-default \
    -p 4444:4444 \
    -p 8080:8080 \
    -p 3000:3000 \
    --cap-add=NET_ADMIN \
    --cap-add=SYS_PTRACE \
    --security-opt seccomp=unconfined \
    -v rootlab-data:/data \
    kalilinux/kali-rolling \
    tail -f /dev/null

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Update system and install tools
echo "📦 Installing tools in container..."
run_in_kali "apt update && apt upgrade -y"

# Install core tools
run_in_kali "apt install -y \
    nmap \
    traceroute \
    iputils-ping \
    dnsutils \
    whois \
    nikto \
    gobuster \
    sqlmap \
    theharvester \
    dirb \
    masscan \
    fierce \
    dnsrecon \
    sublist3r \
    ffuf \
    wfuzz \
    git \
    python3 \
    python3-pip \
    curl \
    wget \
    vim \
    nano"

# Install Python dependencies
run_in_kali "pip3 install requests beautifulsoup4 colorama pyfiglet"

# Fix whois for .in domains
run_in_kali "echo '\\.in$ whois.nixiregistry.in' > /etc/whois.conf"

# Install MaxPhisher
run_in_kali "cd /opt && git clone https://github.com/KasRoudra/MaxPhisher.git && cd MaxPhisher && chmod +x maxphisher.sh && ln -sf /opt/MaxPhisher/maxphisher.sh /usr/local/bin/maxphisher"

# Install Zphisher
run_in_kali "cd /opt && git clone https://github.com/htr-tech/zphisher.git && cd zphisher && chmod +x zphisher.sh && ln -sf /opt/zphisher/zphisher.sh /usr/local/bin/zphisher"

# Install Slowloris
run_in_kali "cd /tmp && wget https://raw.githubusercontent.com/gkbrk/slowloris/master/slowloris.py && chmod +x slowloris.py && mv slowloris.py /usr/local/bin/slowloris"

# Install wordlists
run_in_kali "apt install -y wordlists && cd /usr/share/wordlists && git clone https://github.com/danielmiessler/SecLists.git"

# Set up aliases
run_in_kali "cat >> /root/.bashrc << 'EOF'

# RootLab Tool Aliases
alias ll='ls -alF'
alias nmapquick='nmap -T4 -F'
alias nmapfull='nmap -p- -sV -O'
alias gobusterdir='gobuster dir -w /usr/share/wordlists/dirb/common.txt'
alias niktobasic='nikto -h'

# Safety reminders
alias maxphisher='echo \"⚠️  WARNING: Use only with explicit authorization!\" && /usr/local/bin/maxphisher'
alias zphisher='echo \"⚠️  WARNING: Use only with explicit authorization!\" && /usr/local/bin/zphisher'
alias slowloris='echo \"⚠️  WARNING: Use only with explicit authorization!\" && /usr/local/bin/slowloris'
EOF"

echo "✅ Kali container setup complete!"
echo ""
echo "🔧 Container Details:"
echo "   Name: kali-default"
echo "   Ports: 4444, 8080, 3000"
echo "   Volume: rootlab-data"
echo ""
echo "🚀 Usage Commands:"
echo "   Connect to container: docker exec -it kali-default bash"
echo "   Stop container: docker stop kali-default"
echo "   Start container: docker start kali-default"
echo "   Remove container: docker rm kali-default"
echo ""
echo "⚠️  Security Notice: Use tools responsibly and only with authorization!"