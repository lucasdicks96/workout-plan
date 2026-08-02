# ==========================================
# STAGE 1: Build-Stage (Kompilierung)
# ==========================================
# Verwendet das schlanke Node.js Alpine-Image als temporäre Bau-Umgebung.
FROM node:20-alpine AS builder

# Setzt das Arbeitsverzeichnis innerhalb des Containers
WORKDIR /app

# Kopiert den Quellcode in das Arbeitsverzeichnis für den Build-Prozess
COPY . .

# Installiert alle Abhängigkeiten (inkl. devDependencies) exakt laut package-lock.json
RUN npm ci

# Kompiliert den TypeScript-Code des Server-Workspaces zu ausführbarem JavaScript
RUN npm run build -w server


# ==========================================
# STAGE 2: Produktions-Stage (Laufzeitumgebung)
# ==========================================
# Startet mit einem frischen Image ohne Entwicklungs-Build-Tools zur Minimierung der Image-Größe
FROM node:24-alpine

# Setzt das finale Arbeitsverzeichnis für die Anwendung
WORKDIR /app

# WICHTIG: Überträgt die Rechte des Arbeitsverzeichnisses an den integrierten, unprivilegierten "node"-User.
# Dies ist zwingend erforderlich, damit der Logger (z. B. Winston) Logdateien wie "error.log" im laufenden Betrieb anlegen darf.
RUN chown -R node:node /app

# Wechselt vom System-Root-Benutzer zum unprivilegierten "node"-Benutzer (Sicherheits-Best-Practice)
USER node

# Kopiert die Projektdateien direkt mit den korrekten Eigentumsrechten des "node"-Users
COPY --chown=node:node . .

# Installiert ausschließlich Produktions-Abhängigkeiten (ohne devDependencies) als "node"-User
RUN npm ci --omit=dev

# Kopiert den in Stage 1 (builder) fertig kompilierten JavaScript-Code in den Produktions-Container
COPY --chown=node:node --from=builder /app/server/dist ./server/dist
# COPY --chown=node:node --from=builder /app/shared/dist ./shared/dist

# Dokumentiert den Port, auf dem die Express-Anwendung lauscht
EXPOSE 5000

# Startbefehl zum Ausführen des Server-Workspaces im Produktionsmodus
CMD ["npm", "run", "start", "-w", "server"]