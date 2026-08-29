# Plan de livraison — Wagadu Hub

Livraison par phases (section 12 du cahier des charges). Une phase est validée
selon la *Definition of Done* avant de passer à la suivante.

| Phase | Contenu | État |
|---|---|---|
| **1 — Socle technique** | Auth JWT, utilisateurs/rôles/permissions (rôle + exception individuelle), Super Admin, tableau de bord de base, journal d'audit, Docker Compose, CI/CD minimal, `createsuperadmin` | ✅ Livrée |
| 2 — RH & Courrier | Fiches employés, congés (validation multi-niveaux), module Courrier | ⏳ À venir |
| 3 — Tâches | Assignation, soumission, commentaires, rappels | ⏳ |
| 4 — Documents | Diffusion ciblée + espace documentaire général | ⏳ |
| 5 — Communication temps réel | Rocket.Chat + Jitsi (SSO), Agenda personnel | ⏳ |
| 6 — Finalisation | Demandes transverses, compléments, exports, tableaux de bord avancés | ⏳ |

## Definition of Done (chaque phase)

- [ ] Modèles de données créés et migrés
- [ ] API testée (cas nominaux + permissions)
- [ ] Interface front fonctionnelle et connectée à l'API
- [ ] Notifications associées en place si prévues
- [ ] Actions sensibles tracées dans le journal d'audit
- [ ] Documentation de la phase ajoutée à `/docs`

## Décisions structurantes

| Sujet | Décision | Date |
|---|---|---|
| Rétention journal d'audit | 12 mois glissants, archivage CSV vers MinIO puis purge (Celery beat) | 2026-08-29 |
| Circuits de validation | Modélisés multi-niveaux configurables dès le départ | 2026-08-29 |
| 2FA | Socle prêt (TOTP activable), enforcement par rôle repoussé en phase 6 | 2026-08-29 |
| Authentification API | JWT (SimpleJWT) access court + refresh avec blacklist | 2026-08-29 |
