# Déploiement & maintenance — Wagadu Hub

## Environnements

| Env | Branche | Settings backend | `.env` |
|---|---|---|---|
| Développement | toute branche | `wagadu.settings.dev` | `infra/.env` local |
| Préproduction (staging) | `develop` | `wagadu.settings.prod` | secrets GitHub env `staging` |
| Production | `main` | `wagadu.settings.prod` | secrets GitHub env `production` |

## Conteneurs (`infra/docker-compose.yml`)

`nginx`, `backend` (gunicorn), `frontend` (Next standalone), `postgres`,
`redis`, `celery-worker`, `celery-beat`, `minio`.
Rocket.Chat et Jitsi seront ajoutés en Phase 5.

`docker-compose.override.yml` (chargé automatiquement) adapte le tout pour le
développement local (hot-reload, ports exposés, settings dev).

## Premier déploiement (serveur)

```bash
git clone https://github.com/HULL-bit/W-HUB.git /opt/wagadu-hub
cd /opt/wagadu-hub
cp infra/.env.example infra/.env      # puis renseigner les secrets
# Générer une clé : python -c "import secrets;print(secrets.token_urlsafe(50))"

# Certificats TLS dans infra/nginx/certs/ (fullchain.pem + privkey.pem)

docker compose -f infra/docker-compose.yml up -d --build
docker compose -f infra/docker-compose.yml exec backend python manage.py createsuperadmin
```

L'`entrypoint.sh` du backend exécute `migrate` + `collectstatic` à chaque
démarrage du conteneur.

## CI/CD (GitHub Actions)

- **`.github/workflows/ci.yml`** — à chaque push / PR : lint (`ruff`, `eslint`),
  tests (`pytest`, `vitest`), vérification des migrations, build des images Docker.
- **`.github/workflows/deploy.yml`** — push sur `develop` (staging) ou `main`
  (production) : build + push des images vers GHCR, déploiement SSH
  (`git pull` + `docker compose up -d` + `migrate`), notification.

### Secrets requis (Settings → Secrets → Actions)

`SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `DEPLOY_PATH`.
Par environnement : les valeurs `.env` de staging / production.
`GITHUB_TOKEN` est fourni automatiquement pour GHCR.

## Sauvegarde & restauration

`infra/scripts/backup.sh` (à planifier via cron, hors pipeline) :

- `pg_dump` PostgreSQL → `db-<timestamp>.sql.gz`
- archive `tar` du volume MinIO → `minio-<timestamp>.tar.gz`
- rétention locale 14 j ; externalisation à brancher (`rclone`, S3 tiers…).

Restauration PostgreSQL :

```bash
gunzip -c db-<timestamp>.sql.gz | \
  docker compose -f infra/docker-compose.yml exec -T postgres psql -U wagadu -d wagadu
```

Tester périodiquement la restauration (section 11 du cahier des charges).

## Journal d'audit — rétention

Tâche Celery `apps.audit.tasks.purge_audit_log` : archive les entrées de plus de
365 jours en CSV vers MinIO (`audit-archives/`), puis les purge. À planifier via
`django_celery_beat` (interface d'admin Django ou fixture) — p. ex. tous les jours à 03:00.

## Sécurité — check-list de mise en production

- [ ] `DJANGO_SECRET_KEY` unique et secret
- [ ] `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS` restreint
- [ ] Certificat TLS valide, redirection HTTP→HTTPS active
- [ ] Mots de passe PostgreSQL / MinIO changés
- [ ] Sauvegardes planifiées et testées
- [ ] `createsuperadmin` exécuté une seule fois ; comptes admins créés par le Super Admin
