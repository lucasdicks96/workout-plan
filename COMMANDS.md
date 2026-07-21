# 🛠️ Projekt Cheatsheet & Befehle

Eine Übersicht aller wichtigen Befehle für lokale Entwicklung, Docker-Verwaltung, Datenbank-Operationen und Server-Wartung.

---

## 🚀 1. Demo-User Seeden (Seed-Skript)

### Lokale Entwicklung

```bash
# Befehl: npm run seed:demo <email> [password]
npm run seed:demo recruiter@company.de StartPasswort123!

# Führt das Seeding direkt im laufenden Backend-Container aus
docker compose exec backend npm run seed:demo firma-xyz@workout.de MeinSicheresPasswort123!
```

# Container im Hintergrund starten

docker compose up -d

# Container stoppen (Daten bleiben in Volumes erhalten)

docker compose down

# Live-Logs des Backends mitlesen

docker compose logs -f backend

# Live-Logs aller Container mitlesen

docker compose logs -f

# Status aller Projekt-Container anzeigen

docker compose ps

# Ressourcenverbrauch (CPU / RAM) der Container anzeigen

docker stats

# Bauen und Starten nach Code-Änderungen

docker compose up -d --build

# Erneutes Bauen ERZWINGEN (ignoriert den Build-Cache)

# Nutzen, wenn npm-Packages oder System-Dependencies nicht greifen

docker compose build --no-cache

# Container neu erstellen, selbst wenn sich nichts an der Config geändert hat

docker compose up -d --force-recreate

# Speicherauslastung prüfen: Wie viel Platz belegen Container, Images & Cache?

docker system df

# Build-Cache leeren (Hauptgrund für volle Server-Festplatten!)

docker builder prune -f

# Ungenutzte / verwaiste Images löschen (Dangling Images)

docker image prune

# ALLE nicht verwendeten Images löschen

docker image prune -a

# Der große Frühjahrsputz (gestoppte Container, ungenutzte Netzwerke & Images)

docker system prune -a

# ⚠️ RADIKALER CLEANUP (Löscht ZUSÄTZLICH ungenutzte Volumes / Datenbank-Daten)

# ACHTUNG: Nur nutzen, wenn keine Daten verloren gehen dürfen!

docker system prune -a --volumes
