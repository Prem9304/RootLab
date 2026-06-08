FROM kalilinux/kali-rolling

# Fix GPG keys before update to prevent Debian repository signature verification errors
ADD https://archive.kali.org/archive-key.asc /etc/apt/trusted.gpg.d/kali-archive-keyring.asc
RUN chmod 644 /etc/apt/trusted.gpg.d/kali-archive-keyring.asc

# Update system and install core toolkit via DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get upgrade -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    nmap traceroute iputils-ping dnsutils whois nikto gobuster sqlmap \
    theharvester dirb masscan fierce dnsrecon sublist3r ffuf wfuzz git \
    python3 python3-pip curl wget vim nano wordlists metasploit-framework aircrack-ng hydra

# Install Python dependencies and break system packages lock to enforce pip global install in Kali
RUN pip3 install requests beautifulsoup4 colorama pyfiglet --break-system-packages

# Set up custom Phishing and DoS binaries
RUN cd /opt && \
    git clone https://github.com/Prem9304/MaxPhisher.git && cd MaxPhisher && chmod +x maxphisher.py && \
    ln -sf /opt/MaxPhisher/maxphisher.py /usr/local/bin/maxphisher

RUN cd /tmp && \
    wget https://raw.githubusercontent.com/gkbrk/slowloris/master/slowloris.py && \
    chmod +x slowloris.py && mv slowloris.py /usr/local/bin/slowloris

# Download extended wordlists (SecLists)
RUN cd /usr/share/wordlists && git clone https://github.com/danielmiessler/SecLists.git || true

# Inject terminal aliases securely
RUN echo "alias nmapquick='nmap -T4 -F'" >> /root/.bashrc && \
    echo "alias nmapfull='nmap -p- -sV -O'" >> /root/.bashrc && \
    echo "alias gobusterdir='gobuster dir -w /usr/share/wordlists/dirb/common.txt'" >> /root/.bashrc

# Ensure the container does not exit when detached natively
CMD ["tail", "-f", "/dev/null"]
