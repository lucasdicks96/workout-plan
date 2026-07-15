# STAGE 1: Bauen (Bleibt unverändert)
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build -w server

# STAGE 2: Produktion
FROM node:20-alpine
WORKDIR /app

# WICHTIG: Rechte für das Arbeitsverzeichnis an den "node"-User übergeben, 
# damit Winston später die Datei "error.log" anlegen und schreiben darf!
RUN chown -R node:node /app

# Ab hier als unberechtigter "node" User weiterarbeiten
USER node

# Dateien direkt mit den richtigen Eigentumsrechten kopieren
COPY --chown=node:node . .

# Pakete als "node" User installieren (verhindert Permission Errors)
RUN npm ci --omit=dev

# Den fertig kompilierten Code aus Stage 1 rüberziehen
COPY --chown=node:node --from=builder /app/server/dist ./server/dist
# COPY --chown=node:node --from=builder /app/shared/dist ./shared/dist

EXPOSE 5000

CMD ["npm", "run", "start", "-w", "server"]