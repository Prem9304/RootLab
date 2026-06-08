const { execSync } = require('child_process');

async function installNessus() {
    console.log("Fetching latest Nessus version from Tenable API...");
    try {
        const response = await fetch("https://www.tenable.com/downloads/api/v2/pages/nessus");
        const data = await response.json();
        
        let targetUrl = null;
        for (const release in data.releases.latest) {
            const files = data.releases.latest[release];
            const deb = files.find(f => f.file.includes('ubuntu') && f.file.endsWith('.deb') && f.file.includes('amd64'));
            if (deb) {
                targetUrl = deb.file_url;
                break;
            }
        }

        if (!targetUrl) {
            console.error("Could not find a valid Debian package for Nessus.");
            process.exit(1);
        }

        console.log(`Found package URL: ${targetUrl}`);
        console.log("Downloading inside kali-default container...");

        // Download using curl inside container
        execSync(`docker exec kali-default bash -c "curl -s -L -o /tmp/Nessus.deb '${targetUrl}'"`, { stdio: 'inherit' });

        console.log("Installing Nessus...");
        execSync(`docker exec kali-default bash -c "dpkg -i /tmp/Nessus.deb"`, { stdio: 'inherit' });

        console.log("Starting Nessusd daemon...");
        execSync(`docker exec kali-default bash -c "/etc/init.d/nessusd start || /opt/nessus/sbin/nessusd -D"`, { stdio: 'inherit' });

        console.log("Nessus installation complete! Service started.");
        console.log("Remember: Port 8834 must be accessible to configure the license.");
    } catch (e) {
        console.error("Failed to install Nessus:", e.message);
    }
}

installNessus();
