// config/toolsConfig.js

import { Activity, Globe, Shield, Lock, Search, Database, Target, Code, AlertTriangle, Wifi } from "lucide-react";

export const toolsConfig = {
  groups: {
    networkAnalysis: {
      name: "Network Analysis",
      tools: {

        nessus: {
          id: 15,
          name: "Nessus Scanner",
          icon: <Shield size={24} />,
          iconBgColor: "#004731", // Nessus dark green
          description: "Tenable Nessus REST API Integration",
          customComponent: "NessusTool",
          windowWidth: 1100,
          windowHeight: 700,
          buildCommand: () => "",
          config: { inputs: [] },
          enabled: true,
        },
        nmap: {
          id: 1,
          name: "Network Mapper",
          icon: <Activity size={24} />,
          description: "Scan networks and discover hosts and services",
          customComponent: "NmapTool",
          initialValues: {
            target: "",
            scanType: "quick",
            ports: "",
            osDetection: false,
            serviceVersion: true,
          },
          buildCommand: (values) => {
            let command = `nmap ${values.target} `;
            const scanTypes = {
              quick: "-T4 -F",
              full: "-p- -sV -O",
              udp: "-sU",
              custom: `${values.ports ? `-p ${values.ports}` : ""} ` +
                      `${values.osDetection ? "-O " : ""}` +
                      `${values.serviceVersion ? "-sV " : ""}`,
            };
            // Ensure target is present before adding scan type options
            if (!values.target) return "echo 'Error: Target is required.'";
            return (command + scanTypes[values.scanType]).trim();
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target",
                placeholder: "Enter IP/CIDR (e.g., 192.168.1.0/24)",
              },
              {
                name: "scanType",
                type: "select",
                label: "Scan Type",
                options: [
                  { value: "quick", label: "Quick (-T4 -F)" },
                  { value: "full", label: "Full (-p- -sV -O)" },
                  { value: "udp", label: "UDP (-sU)" },
                  { value: "custom", label: "Custom" },
                ],
              },
              {
                name: "ports",
                type: "text",
                label: "Ports",
                placeholder: "e.g., 80,443,100-200",
                visibleWhen: { field: "scanType", value: "custom" },
              },
              {
                name: "osDetection",
                type: "checkbox",
                label: "OS Detection (-O)",
                visibleWhen: { field: "scanType", value: "custom" },
              },
              {
                name: "serviceVersion",
                type: "checkbox",
                label: "Service Version (-sV)",
                visibleWhen: { field: "scanType", value: "custom" },
              },
            ],
          },
          aiProcessing: {
            prompt: `Analyze these nmap results:\n{output}\nProvide a summary focusing on open ports, detected services/versions, and potential OS. Highlight any significant security concerns or interesting findings.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },

      },
    }, // End networkAnalysis Group

    webSecurity: {
      name: "Web Security",
      tools: {
        nikto: {
          id: 4,
          name: "Nikto",
          icon: <Lock size={24} />,
          description: "Scan web servers for known vulnerabilities",
          customComponent: "NiktoTool",
          initialValues: {
            target: "",
            port: "80", // Add default port
            tuning: "", // Add option for tuning
          },
          buildCommand: (values) => {
             if (!values.target) return "echo 'Error: Target URL/IP is required.'";
             let command = `nikto -h ${values.target}`;
             if (values.port && values.port !== "80") { // Only add -p if not default
                command += ` -p ${values.port}`;
             }
             if (values.tuning) {
                command += ` -Tuning ${values.tuning}`;
             }
             return command;
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Target URL/IP",
                placeholder: "Enter target host (e.g., example.com or 1.2.3.4)",
              },
              {
                name: "port",
                type: "text",
                label: "Port (optional)",
                placeholder: "Default: 80/443 based on scheme",
              },
              {
                 name: "tuning",
                 type: "select",
                 label: "Tuning (optional)",
                 options: [
                    { value: "", label: "Default (Multiple)" },
                    { value: "0", label: "File Upload" },
                    { value: "1", label: "Interesting File / Seen in logs" },
                    { value: "2", label: "Misconfiguration / Default File" },
                    { value: "3", label: "Information Disclosure" },
                    // ... Add other tuning options 4-9, a-c, x ...
                    { value: "x", label: "Reverse Tuning Options" },
                 ]
              }
            ],
          },
          aiProcessing: {
            prompt: `Analyze these Nikto scan results:\n{output}\nSummarize the findings, focusing on detected vulnerabilities (like outdated software, insecure configurations, specific CVEs mentioned), information disclosure issues, and recommended remediation steps. Prioritize critical findings.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },
        httpx: {
          id: 16,
          name: "HTTPX Toolkit",
          icon: <Activity size={24} />,
          iconBgColor: "#ea580c", // Orange
          description: "Advanced HTTP probing and technology fingerprinting",
          customComponent: "HttpxTool",
          windowWidth: 1000,
          windowHeight: 650,
          buildCommand: () => "",
          config: { inputs: [] },
          enabled: true,
        },
        katana: {
          id: 17,
          name: "Katana Crawler",
          icon: <Activity size={24} />,
          iconBgColor: "#4f46e5", // Indigo
          description: "Next-generation web crawler and spider",
          customComponent: "KatanaTool",
          windowWidth: 1000,
          windowHeight: 650,
          buildCommand: () => "",
          config: { inputs: [] },
          enabled: true,
        },
      },
    }, // End webSecurity Group

    infoGathering: {
      name: "Info Gathering",
      tools: {

        theHarvester: {
          id: 6,
          name: "theHarvester",
          icon: <Activity size={24} />,
          description: "Gather emails and subdomains from public sources",
          customComponent: "HarvesterTool",
          initialValues: {
            target: "",
            source: "google,bing", // Combine sources
            limit: 500, // Add limit option
          },
          buildCommand: (values) => {
             if (!values.target) return "echo 'Error: Domain is required.'";
             // theHarvester might need API keys for some sources, handle that separately if needed.
             return `theHarvester -d ${values.target} -b ${values.source || 'google,bing'} -l ${values.limit || 500}`;
          },
          config: {
            inputs: [
              {
                name: "target",
                type: "text",
                label: "Domain",
                placeholder: "Enter target domain (e.g., example.com)",
              },
              {
                name: "source",
                type: "text", // Changed to text for multiple sources
                label: "Data Sources (comma-sep)",
                 placeholder: "e.g., google,bing,linkedin",
                 // You could use a multi-select component if your UI framework supports it
              },
              {
                 name: "limit",
                 type: "number",
                 label: "Result Limit per Source",
                 placeholder: "e.g., 500",
              }
            ],
          },
          aiProcessing: {
            prompt: `Analyze these theHarvester results:\n{output}\nSummarize the findings. List the discovered email addresses, hosts/subdomains, and any associated IP addresses found. Mention the sources from which information was gathered.`,
          },
          processResult: (rawOutput, aiOutput) =>
            aiOutput?.trim() ? aiOutput : rawOutput,
          enabled: true,
        },

      },
    }, // End infoGathering Group

    phishingTools: {
      name: "Phishing Tools",
      tools: {
        maxPhisher: {
          id: 11,
          name: "MaxPhisher",
          icon: <AlertTriangle size={24} />,
          description: "Advanced phishing toolkit for educational use", // Short description for grid/tooltip
          isInfoOnly: true, // *** Key Flag ***
          info: { // *** Detailed info for the card ***
            description: "MaxPhisher is a comprehensive phishing toolkit designed to create and manage sophisticated phishing campaigns for ethical hacking and security awareness training. Use cases include security awareness training, authorized penetration testing, and educational demonstrations.",
            usage: "To use MaxPhisher (ensure you have authorization):\n1. Open your terminal.\n2. Run the command: `maxphisher`\n3. Follow the interactive menu to select templates.\n4. Configure attack settings and deployment options.\n\n**WARNING:** For educational and authorized testing purposes ONLY. Unauthorized use is illegal and unethical.",
            risk: "High",
            tags: ["Phishing", "Social Engineering", "Credential Harvesting", "Security Training"],
          },
          enabled: true, // Still controlled by vmStatus
        },

        // Add other phishing tools here following the same pattern
      }
    }, // End phishingTools Group
    dosTools: {
      name: "DoS Tools",
      tools: {
          wrk: {
              id: 14,
              name: "WRK Benchmark",
              icon: <Wifi size={24} />,
              iconBgColor: "#0f172a",
              description: "High-performance HTTP benchmarking & stress testing",
              customComponent: "WrkTool",
              windowWidth: 900,
              windowHeight: 640,
              // buildCommand / config not used — WrkTool handles its own execution
              buildCommand: () => "",
              config: { inputs: [] },
              enabled: true,
          },

      }
  }, // End groups
  
}

};