# STAGE 1: Bauen
FROM node:20-alpine AS builder
WORKDIR /app

COPY . .
RUN npm ci

# Hole die API_URL aus der docker-compose und stelle sie Vite beim Bauen zur Verfügung
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w client


# STAGE 2: Produktion mit Nginx
FROM nginx:alpine
# Kopiere die fertigen React-Dateien in den Nginx-Webserver
COPY --from=builder /app/client/dist /usr/share/nginx/html
# Kopiere deine Nginx-Konfiguration
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]