#!/bin/bash

# RootLab - Tool Verification Script
# This script verifies that all required tools are properly installed

echo "🔍 RootLab - Verifying Tool Installation"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
check_tool() {
    local tool=$1
    local description=$2
    
    if command -v "$tool" &> /dev/null; then
        echo -e "${GREEN}✅ $tool${NC} - $description"
        return 0
    else
        echo -e "${RED}❌ $tool${NC} - $description (NOT FOUND)"
        return 1
    fi
}

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $(basename $file)${NC} - $description"
        return 0
    else
        echo -e "${RED}❌ $(basename $file)${NC} - $description (NOT FOUND)"
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $(basename $dir)${NC} - $description"
        return 0
    else
        echo -e "${RED}❌ $(basename $dir)${NC} - $description (NOT FOUND)"
        return 1
    fi
}

echo -e "${YELLOW}📊 Network Analysis Tools:${NC}"
check_tool "nmap" "Network discovery and security auditing"
check_tool "traceroute" "Network path tracing"
check_tool "ping" "Network connectivity testing"

echo ""
echo -e "${YELLOW}🌐 Web Security Tools:${NC}"
check_tool "nikto" "Web server scanner"
check_tool "gobuster" "Directory/file brute-forcer"
check_tool "sqlmap" "SQL injection testing"

echo ""
echo -e "${YELLOW}🔍 Information Gathering Tools:${NC}"
check_tool "whois" "Domain registration lookup"
check_tool "dig" "DNS lookup utility"
check_tool "theharvester" "Email and subdomain harvester"

echo ""
echo -e "${YELLOW}⚠️ Phishing Tools (Educational Use Only):${NC}"
check_file "/usr/local/bin/maxphisher" "MaxPhisher toolkit"
check_file "/usr/local/bin/zphisher" "Zphisher automated tool"

echo ""
echo -e "${YELLOW}💥 DoS Tools (Educational Use Only):${NC}"
check_file "/usr/local/bin/slowloris" "Slowloris DoS tool"

echo ""
echo -e "${YELLOW}📚 Wordlists:${NC}"
check_dir "/usr/share/wordlists" "Default wordlists directory"
check_dir "/usr/share/wordlists/SecLists" "SecLists wordlist collection"

echo ""
echo -e "${YELLOW}🐍 Python Dependencies:${NC}"
python3 -c "import requests; print('✅ requests - HTTP library')" 2>/dev/null || echo -e "${RED}❌ requests${NC} - HTTP library (NOT FOUND)"
python3 -c "import bs4; print('✅ beautifulsoup4 - HTML parsing')" 2>/dev/null || echo -e "${RED}❌ beautifulsoup4${NC} - HTML parsing (NOT FOUND)"
python3 -c "import colorama; print('✅ colorama - Terminal colors')" 2>/dev/null || echo -e "${RED}❌ colorama${NC} - Terminal colors (NOT FOUND)"

echo ""
echo -e "${YELLOW}🧪 Quick Tool Tests:${NC}"

# Test nmap
if command -v nmap &> /dev/null; then
    echo -n "Testing nmap version: "
    nmap --version | head -1 | cut -d' ' -f3
fi

# Test nikto
if command -v nikto &> /dev/null; then
    echo -n "Testing nikto version: "
    nikto -Version 2>/dev/null | grep "Nikto" | head -1 || echo "Version check failed"
fi

# Test gobuster
if command -v gobuster &> /dev/null; then
    echo -n "Testing gobuster version: "
    gobuster version 2>/dev/null || echo "Version check failed"
fi

# Test sqlmap
if command -v sqlmap &> /dev/null; then
    echo -n "Testing sqlmap version: "
    sqlmap --version 2>/dev/null | head -1 || echo "Version check failed"
fi

echo ""
echo "🎯 Testing with safe targets:"
echo "   • ping -c 1 8.8.8.8 (Google DNS)"
ping -c 1 8.8.8.8 > /dev/null 2>&1 && echo -e "${GREEN}✅ Ping test successful${NC}" || echo -e "${RED}❌ Ping test failed${NC}"

echo "   • dig google.com (DNS lookup)"
dig google.com +short > /dev/null 2>&1 && echo -e "${GREEN}✅ DNS lookup successful${NC}" || echo -e "${RED}❌ DNS lookup failed${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}🎉 Tool verification complete!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT REMINDERS:${NC}"
echo "   • Always obtain proper authorization before testing"
echo "   • Use tools only on systems you own or have permission to test"
echo "   • Phishing and DoS tools are for educational purposes only"
echo "   • Follow responsible disclosure practices"
echo ""
echo -e "${GREEN}🚀 Your RootLab environment is ready for ethical hacking!${NC}"