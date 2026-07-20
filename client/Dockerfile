# ==========================================
# STAGE 1: Build-Stage (Kompilierung des Frontends)
# ==========================================
# Nutzt das schlanke Node.js Alpine-Image zum Installieren der Abhängigkeiten 
# und zum Generieren der statischen Produktions-Assets mit Vite.
FROM node:20-alpine AS builder

# Setzt das Arbeitsverzeichnis innerhalb des Containers
WORKDIR /app

# Kopiert den gesamten Quellcode in das Arbeitsverzeichnis
COPY . .

# Installiert alle Abhängigkeiten exakt laut package-lock.json
RUN npm ci

# Empfängt Build-Argumente (z. B. aus der docker-compose.yml) und setzt sie als Umgebungsvariablen.
# Dies ist notwendig, da Vite Umgebungsvariablen (VITE_*) während der Kompilierung fest in den JavaScript-Code einbettet.
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_API_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_API_URL=$VITE_API_URL

# Kompiliert die React/Vite-Anwendung des Client-Workspaces für die Produktion
RUN npm run build -w client


# ==========================================
# STAGE 2: Produktions-Stage (Nginx Webserver)
# ==========================================
# Verwendet ein minimales Nginx-Alpine-Image zur Bereitstellung der statischen Dateien
FROM nginx:alpine

# Kopiert die in Stage 1 fertig kompilierten HTML-, JS- und CSS-Dateien in das Nginx-Standard-Verzeichnis
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Ersetzt die Nginx-Standardkonfiguration durch unsere eigene nginx.conf (SPA-Routing & Reverse-Proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Dokumentiert den HTTP-Standardport 80 für den Container-Betrieb
EXPOSE 80

# Startet Nginx im Vordergrund (`daemon off;`), damit der Docker-Container aktiv bleibt
CMD ["nginx", "-g", "daemon off;"]