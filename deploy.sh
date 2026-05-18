#!/bin/bash
# deploy.sh — Déploiement Taxi Vanille sur VPS
# Usage : bash /opt/taxivanille/deploy.sh
#
# Ce que ça fait :
#   1. git pull
#   2. Applique toute nouvelle migration SQL (database/migrations/0XX_*.sql)
#   3. Rebuild les services Docker affectés par le diff
#   4. Vérifie la santé de la stack

set -euo pipefail

cd /opt/taxivanille

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# --force : rebuild même si pas de nouveau commit (utile après un git pull manuel)
# --all   : rebuild tous les services (équivalent --force avec tout le diff)
FORCE_REBUILD=false
REBUILD_ALL=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE_REBUILD=true ;;
    --all)   FORCE_REBUILD=true; REBUILD_ALL=true ;;
  esac
done

echo "▶ Récupération des changements..."
BEFORE=$(git rev-parse HEAD)
git pull origin main
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ] && [ "$FORCE_REBUILD" = "false" ]; then
  echo "✓ Rien à déployer (déjà à jour sur $AFTER)."
  echo "  Lance avec --force pour rebuild quand même."
  exit 0
fi

if [ "$REBUILD_ALL" = "true" ]; then
  CHANGED="backend/ web/ nginx/ docker-compose.yml database/migrations/"
elif [ "$BEFORE" = "$AFTER" ]; then
  # --force sans nouveaux commits : on rebuild ce qui a été modifié dans le dernier commit
  CHANGED=$(git diff --name-only "HEAD~1" "HEAD")
else
  CHANGED=$(git diff --name-only "$BEFORE" "$AFTER")
fi
echo "▶ Fichiers modifiés depuis $BEFORE :"
echo "$CHANGED" | sed 's/^/   /'

# ── Migrations SQL ──────────────────────────────────────────────────────────
NEW_MIGRATIONS=$(echo "$CHANGED" | grep -E '^database/migrations/0[0-9]+_.*\.sql$' || true)
if [ -n "$NEW_MIGRATIONS" ]; then
  echo "▶ Application des migrations SQL :"
  for migration in $NEW_MIGRATIONS; do
    if [ -f "$migration" ]; then
      echo "   → $migration"
      $COMPOSE exec -T postgres psql -U taxivanille -d taxivanille < "$migration"
    fi
  done
fi

# ── Rebuild backend si code TS modifié ──────────────────────────────────────
if echo "$CHANGED" | grep -qE '^backend/'; then
  echo "▶ Rebuild backend..."
  $COMPOSE up -d --build backend
fi

# ── Rebuild web si code TS/React modifié ────────────────────────────────────
if echo "$CHANGED" | grep -qE '^web/'; then
  echo "▶ Rebuild web..."
  $COMPOSE up -d --build web
fi

# ── nginx : recreate si conf change (bind-mount file = doit recreate) ──────
if echo "$CHANGED" | grep -qE '^nginx/'; then
  echo "▶ Recreate nginx..."
  $COMPOSE up -d --force-recreate nginx
fi

# ── docker-compose.yml : up -d global pour réappliquer les changements ─────
if echo "$CHANGED" | grep -qE '^docker-compose'; then
  echo "▶ Reconfiguration Docker Compose..."
  $COMPOSE up -d
fi

# ── Healthcheck final ───────────────────────────────────────────────────────
echo "▶ Attente que la stack soit healthy (max 30s)..."
sleep 5
$COMPOSE ps

echo ""
echo "▶ Test API health :"
curl -sf https://app.taxivanille.yt/api/v1/health | head -c 200 && echo ""

echo ""
echo "✓ Déploiement terminé : $AFTER"
