#!/bin/bash

# RootLab - Kali Linux Tools Installation Script
# This script installs all required cybersecurity tools for the RootLab platform

echo "🚀 RootLab - Installing Cybersecurity Tools on Kali Linux"
echo "=========================================================="

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install basic networking and analysis tools
echo "🔍 Installing Network Analysis Tools..."
apt install -y nmap traceroute iputils-ping dnsutils whois

# Install web security tools
echo "🌐 Installing Web Security Tools..."
apt install -y nikto gobuster sqlmap dirb dirbuster

# Install information gathering tools
echo "📊 Installing Information Gathering Tools..."
apt install -y theharvester recon-ng maltego

# Install additional useful tools
echo "🛠️ Installing Additional Security Tools..."
apt install -y \
    masscan \
    zmap \
    fierce \
    dnsrecon \
    sublist3r \
    amass \
    ffuf \
    wfuzz \
    burpsuite \
    zaproxy \
    metasploit-framework

# Install phishing tools (use with caution and authorization only)
echo "⚠️ Installing Phishing Tools (Educational Use Only)..."

# Install MaxPhisher
if [ ! -d "/opt/MaxPhisher" ]; then
    echo "Installing MaxPhisher..."
    cd /opt
    git clone https://github.com/KasRoudra/MaxPhisher.git
    cd MaxPhisher
    chmod +x maxphisher.sh
    # Install dependencies
    bash maxphisher.sh --install-deps 2>/dev/null || true
    # Create proper executable script
    cat > /usr/local/bin/maxphisher << 'EOF'
#!/bin/bash
cd /opt/MaxPhisher
bash maxphisher.sh "$@"
EOF
    chmod +x /usr/local/bin/maxphisher
    # Add to PATH if not already there
    echo 'export PATH="/usr/local/bin:$PATH"' >> /root/.bashrc
    echo "MaxPhisher installed. Run with: maxphisher"
fi

# Install Zphisher
if [ ! -d "/opt/zphisher" ]; then
    echo "Installing Zphisher..."
    cd /opt
    git clone https://github.com/htr-tech/zphisher.git
    cd zphisher
    chmod +x zphisher.sh
    # Create proper executable script
    cat > /usr/local/bin/zphisher << 'EOF'
#!/bin/bash
cd /opt/zphisher
bash zphisher.sh "$@"
EOF
    chmod +x /usr/local/bin/zphisher
    echo "Zphisher installed. Run with: zphisher"
fi

# Install DoS tools (use with extreme caution and authorization only)
echo "💥 Installing DoS Tools (Educational Use Only)..."

# Install Slowloris
if [ ! -f "/usr/local/bin/slowloris" ]; then
    echo "Installing Slowloris..."
    cd /tmp
    wget https://raw.githubusercontent.com/gkbrk/slowloris/master/slowloris.py
    chmod +x slowloris.py
    mv slowloris.py /usr/local/bin/slowloris
    echo "Slowloris installed. Run with: slowloris"
fi

# Install Python dependencies for various tools
echo "🐍 Installing Python dependencies..."
pip3 install --upgrade pip
pip3 install requests beautifulsoup4 colorama pyfiglet

# Install additional wordlists
echo "📚 Installing Wordlists..."
apt install -y wordlists
if [ ! -d "/usr/share/wordlists/SecLists" ]; then
    cd /usr/share/wordlists
    git clone https://github.com/danielmiessler/SecLists.git
    echo "SecLists wordlists installed"
fi

# Set up proper permissions
echo "🔐 Setting up permissions..."
chmod +x /usr/local/bin/* 2>/dev/null || true

# Create useful aliases
echo "⚡ Creating useful aliases..."
cat >> /root/.bashrc << 'EOF'

# RootLab Tool Aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias nmapquick='nmap -T4 -F'
alias nmapfull='nmap -p- -sV -O'
alias gobusterdir='gobuster dir -w /usr/share/wordlists/dirb/common.txt'
alias niktobasic='nikto -h'

# Safety reminders
alias maxphisher='echo "⚠️  WARNING: Use only with explicit authorization!" && /usr/local/bin/maxphisher'
alias zphisher='echo "⚠️  WARNING: Use only with explicit authorization!" && /usr/local/bin/zphisher'
alias slowloris='echo "⚠️  WARNING: Use only with explicit authorization!" && /usr/local/bin/slowloris'
EOF

# Verify installations
echo "✅ Verifying tool installations..."
echo "Checking core tools:"

tools_to_check=(
    "nmap"
    "nikto"
    "gobuster"
    "sqlmap"
    "theharvester"
    "whois"
    "dig"
    "traceroute"
    "ping"
)

for tool in "${tools_to_check[@]}"; do
    if command -v "$tool" &> /dev/null; then
        echo "✅ $tool - Installed"
    else
        echo "❌ $tool - Not found"
    fi
done

# Check custom installations
echo "Checking custom tools:"
if [ -f "/usr/local/bin/maxphisher" ]; then
    echo "✅ MaxPhisher - Installed"
else
    echo "❌ MaxPhisher - Not found"
fi

if [ -f "/usr/local/bin/zphisher" ]; then
    echo "✅ Zphisher - Installed"
else
    echo "❌ Zphisher - Not found"
fi

if [ -f "/usr/local/bin/slowloris" ]; then
    echo "✅ Slowloris - Installed"
else
    echo "❌ Slowloris - Not found"
fi

echo ""
echo "🎉 Installation Complete!"
echo "=========================================================="
echo "📋 Summary of installed tools:"
echo "   • Network Analysis: nmap, traceroute, ping"
echo "   • Web Security: nikto, gobuster, sqlmap"
echo "   • Info Gathering: theharvester, whois, dig"
echo "   • Phishing Tools: MaxPhisher, Zphisher"
echo "   • DoS Tools: Slowloris"
echo "   • Wordlists: SecLists, default Kali wordlists"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTICE:"
echo "   • Use phishing and DoS tools ONLY with explicit authorization"
echo "   • These tools are for educational and authorized testing purposes"
echo "   • Unauthorized use is illegal and unethical"
echo ""
echo "🔄 Please restart your terminal or run 'source ~/.bashrc' to use aliases"
echo "🚀 Your RootLab environment is ready!"