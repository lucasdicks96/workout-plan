# STAGE 1: Bauen
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiere das gesamte Projekt ins Image (Dank .dockerignore ohne node_modules)
COPY . .

# Installiert alle Root- und Workspace-Abhängigkeiten
RUN npm ci

# Baut den Server. (Falls "shared" zwingend vorher gebaut werden muss, 
# füge davor ein: RUN npm run build -w shared)
RUN npm run build -w server


# STAGE 2: Produktion
FROM node:20-alpine
WORKDIR /app

# Wir kopieren wieder die package.json Dateien für die Workspace-Struktur
COPY . .

# Wir installieren NUR die Produktions-Abhängigkeiten
RUN npm ci --omit=dev

# Wir überschreiben die leeren Ordner mit dem fertig kompilierten Code
COPY --from=builder /app/server/dist ./server/dist
# Falls "shared" einen eigenen dist-Ordner generiert, kommentiere das ein:
# COPY --from=builder /app/shared/dist ./shared/dist

EXPOSE 8080

# Starte den Server-Workspace
CMD ["npm", "run", "start", "-w", "server"]