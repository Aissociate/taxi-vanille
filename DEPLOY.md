# Déploiement Taxi Vanille — VPS Hostinger

Cible : `app.taxivanille.yt` sur un VPS Ubuntu/Debian, derrière nginx + Let's Encrypt.

## Prérequis

- VPS Ubuntu 22.04 ou Debian 12, **2 Go RAM minimum** (4 Go recommandé), 20 Go disque, accès `root` ou `sudo`.
- DNS : enregistrement `A` `app.taxivanille.yt` → IP du VPS (vérifier avec `dig app.taxivanille.yt` avant Certbot).
- Ports ouverts dans le firewall : **22** (SSH), **80** (HTTP), **443** (HTTPS).

---

## 1. Préparation du VPS

```bash
# Mises à jour
apt update && apt upgrade -y

# Docker + compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin git

# Firewall basique (si pas déjà fait par Hostinger)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 2. Récupérer le code

```bash
mkdir -p /opt && cd /opt
git clone <URL_DU_REPO> taxivanille
cd taxivanille
```

## 3. Copier le fichier d'environnement

Depuis ta machine locale, transfère `.env.production` vers le VPS (il n'est pas committé) :

```bash
# Depuis ton poste, dans le worktree
scp .env.production root@VPS_IP:/opt/taxivanille/.env
```

Puis sur le VPS :

```bash
chmod 600 /opt/taxivanille/.env
```

> ⚠️ Les secrets dans `.env.production` ont été générés une seule fois. Si tu les régénères, **redéploie** tout (les anciens JWT seront invalidés).

## 4. Premier démarrage (HTTP seulement)

```bash
cd /opt/taxivanille

# Build + démarrage
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Vérifications
docker compose ps                                       # tous "healthy" / "running"
curl -i http://localhost/health                         # doit répondre 200 OK
curl -s http://localhost/api/v1/health | jq             # {"status":"ok","db":true,...}
```

Si les containers ne démarrent pas, regarder les logs :

```bash
docker compose logs backend --tail 100
docker compose logs nginx --tail 50
```

À ce stade, l'app est joignable sur `http://app.taxivanille.yt` (HTTP non chiffré — temporaire).

## 5. Activer HTTPS (Let's Encrypt)

**Pré-requis** : le DNS doit déjà pointer vers le VPS et le port 80 doit être ouvert (le challenge HTTP-01 de Certbot passe par là).

### 5.1 — Émettre le certificat

```bash
cd /opt/taxivanille

docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile tls \
  run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d app.taxivanille.yt \
  --email admin@taxivanille.yt \
  --agree-tos --no-eff-email
```

Tu dois voir `Successfully received certificate` et les fichiers sont stockés dans le volume Docker `certbot_certs`.

### 5.2 — Activer le bloc HTTPS dans nginx

Édite [nginx/nginx.conf](nginx/nginx.conf) :

1. Dans le bloc `server { listen 80; ... }` : **décommenter** le `location / { return 301 https://... }` (juste après le bloc Certbot challenge).
2. À la fin du fichier : **décommenter tout le bloc `server { listen 443 ssl http2; ... }`**.

Puis recharger nginx :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 5.3 — Lancer le renouvellement auto

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile tls up -d certbot
```

Le service `certbot` tourne en boucle et renouvelle tous les 12 h si besoin (Let's Encrypt renouvelle quand il reste < 30 jours).

### 5.4 — Vérifier

```bash
curl -I https://app.taxivanille.yt/health        # 200 OK
curl -I http://app.taxivanille.yt/               # 301 vers https
```

Tester aussi la note SSL : https://www.ssllabs.com/ssltest/analyze.html?d=app.taxivanille.yt

## 6. Créer le premier compte direction

Le seed crée 36 chauffeurs (PIN `1234`) mais **pas d'utilisateur web**. À créer en SQL :

```bash
# Générer un hash bcrypt pour le mot de passe
docker compose exec backend node -e "console.log(require('bcrypt').hashSync('TON_MOT_DE_PASSE', 10))"

# Puis insérer
docker compose exec postgres psql -U taxivanille -d taxivanille -c \
  "INSERT INTO web_users (id, email, full_name, role, password_hash, active)
   VALUES (gen_random_uuid(), 'admin@taxivanille.yt', 'Admin', 'direction',
           '<HASH_BCRYPT_COLLE_ICI>', true);"
```

Ensuite tu peux te connecter sur `https://app.taxivanille.yt/login` et créer les autres comptes via l'UI (page **Utilisateurs**, direction-only).

---

## Maintenance

### Mettre à jour le code

```bash
cd /opt/taxivanille
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Les migrations SQL nouvelles dans `database/migrations/` sont appliquées au **premier démarrage de Postgres** seulement (script `docker-entrypoint-initdb.d`). Pour appliquer une nouvelle migration sur une DB existante :

```bash
docker compose exec -T postgres psql -U taxivanille -d taxivanille < database/migrations/013_xxx.sql
```

### Backups Postgres

À mettre en cron `/etc/cron.daily/taxivanille-backup` :

```bash
#!/bin/bash
set -e
DEST=/var/backups/taxivanille
mkdir -p "$DEST"
docker compose -f /opt/taxivanille/docker-compose.yml exec -T postgres \
  pg_dump -U taxivanille taxivanille | gzip > "$DEST/db-$(date +%F).sql.gz"
# Garder 14 jours
find "$DEST" -name 'db-*.sql.gz' -mtime +14 -delete
```

`chmod +x` ce script.

### Logs

```bash
docker compose logs -f backend          # logs backend en live
docker compose logs --tail 200 nginx    # nginx accès + erreurs
```

### Redémarrer / arrêter

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml down       # arrête tout (volumes préservés)
```

---

## Ce qui reste à configurer plus tard

Variables vides dans `.env.production` — l'app fonctionne sans, mais certaines features sont désactivées :

| Variable | Effet si vide |
|----------|---------------|
| `MAPBOX_TOKEN` | Cartes web utilisent OpenStreetMap (fallback) |
| `S3_*` | Upload de documents chauffeurs désactivé |
| `FCM_SERVER_KEY` | Pas de notifications push sur l'app Android |

Pour les activer : renseigner la variable dans `/opt/taxivanille/.env` puis :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend
```

## Dépannage

| Symptôme | Cause probable | Fix |
|----------|----------------|-----|
| `backend` reste `unhealthy` | DB pas prête, ou JWT_SECRET manquant | `docker compose logs backend` — chercher `[boot]` |
| 502 Bad Gateway sur `/` | `web` pas démarré | `docker compose ps`, puis `logs web` |
| 502 sur `/api/` | Backend planté | `logs backend` |
| Certbot échoue | DNS pas propagé ou port 80 fermé | `dig app.taxivanille.yt` + `curl http://app.taxivanille.yt/.well-known/acme-challenge/test` |
| `CORS error` dans le navigateur | `ALLOWED_ORIGINS` ne contient pas l'origine | Mettre à jour `.env`, `up -d --force-recreate backend` |
