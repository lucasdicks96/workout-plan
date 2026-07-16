# Workout Tracker – Full-Stack Web Application & Infrastructure

Eine responsive Full-Stack-Webanwendung zur strukturierten Erfassung und Analyse von Trainingsdaten. Das Projekt fokussiert sich neben der reinen Softwareentwicklung insbesondere auf die Umsetzung einer sicheren, containerisierten Systemarchitektur in einer Proxmox-Umgebung.

**Live-Demo:** [lucaslabs.dev](https://lucaslabs.dev)

## Architektur & Tech Stack

### Frontend & Backend
* **Frontend:** React, TypeScript, Tailwind CSS
* **Backend:** Node.js, Express (REST-API), Axios
* **Datenbank:** PostgreSQL 

### Infrastruktur & Virtualisierung
* **Virtualisierungsumgebung:** Proxmox VE auf dedizierter Hardware
* **Containerisierung:** Systemtrennung durch Bereitstellung von Datenbank und Applikation in separaten Linux Containern (LXC) sowie Docker (orchestriert via Docker Compose)
* **Netzwerk & Routing:** Anbindung ohne externe Router-Portfreigaben mittels Cloudflare Tunnels; nachgeschaltetes Routing über einen Nginx Reverse Proxy

### Implementierte Sicherheitsmechanismen
* **Bot-Mitigation:** Integration von Cloudflare Turnstile zur Absicherung des Registrierungsprozesses
* **Traffic Control:** Implementierung von Rate-Limiting auf API-Ebene zum Schutz vor Brute-Force- und DDoS-Anfragen
* **Request Security:** Absicherung durch CSRF-Tokens sowie restriktive CORS-Konfigurationen
