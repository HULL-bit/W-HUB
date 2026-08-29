# Schéma de la base de données

État après la **Phase 1**. Le schéma s'enrichit à chaque phase.

## Diagramme (Phase 1)

```mermaid
erDiagram
    ROLE ||--o{ ROLE_PERMISSION : "socle"
    PERMISSION ||--o{ ROLE_PERMISSION : ""
    ROLE ||--o{ USER : "rôle principal"
    USER ||--o{ USER_PERMISSION_OVERRIDE : "exceptions"
    PERMISSION ||--o{ USER_PERMISSION_OVERRIDE : ""
    USER ||--o{ USER_PERMISSION_OVERRIDE : "granted_by"
    DEPARTMENT ||--o{ USER : "membres"
    DEPARTMENT ||--o{ DEPARTMENT : "parent"
    DEPARTMENT ||--o{ TEAM : ""
    TEAM ||--o{ TEAM_MEMBERSHIP : ""
    USER ||--o{ TEAM_MEMBERSHIP : ""
    USER ||--o{ USER : "manager (organigramme)"
    USER ||--o{ LOGIN_ATTEMPT : ""
    USER ||--o{ NOTIFICATION : "destinataire"
    USER ||--o| NOTIFICATION_PREFERENCE : ""
    USER ||--o{ AUDIT_LOG_ENTRY : "auteur"

    USER {
        uuid id PK
        string email UK
        string first_name
        string last_name
        int role_id FK
        int department_id FK
        uuid manager_id FK
        bool is_super_admin
        string status
        string preferred_language
        string timezone
        int failed_login_count
        datetime locked_until
        datetime last_password_change
        bool is_2fa_enabled
        string totp_secret
    }
    ROLE {
        int id PK
        string slug UK
        string name
        bool is_system
    }
    PERMISSION {
        int id PK
        string code UK
        string label
        string module
    }
    USER_PERMISSION_OVERRIDE {
        int id PK
        uuid user_id FK
        int permission_id FK
        string effect "grant|deny"
        string scope_type "global|module|department|project"
        string scope_id
        uuid granted_by_id FK
        datetime created_at
        datetime revoked_at
    }
    DEPARTMENT {
        int id PK
        string name
        string code UK
        int parent_id FK
        uuid head_id FK
    }
    TEAM {
        int id PK
        string name
        int department_id FK
        uuid lead_id FK
    }
    AUDIT_LOG_ENTRY {
        bigint id PK
        datetime timestamp
        uuid actor_id FK
        string actor_label
        bool actor_is_admin
        string module
        string action
        string severity
        string target_type
        string target_id
        json changes
        string ip_address
    }
    NOTIFICATION {
        bigint id PK
        uuid recipient_id FK
        string type
        string title
        bool is_read
        datetime created_at
    }
```

## Moteur de permission effective

```
effective(user, code, scope) :
  si user.is_super_admin                       → True
  base   = code ∈ permissions(role de l'user)
  ovs    = overrides actifs (non révoqués) de l'user pour `code`, dont le périmètre correspond à `scope`
  si un ov.effect == "deny" dans ovs           → False
  si un ov.effect == "grant" dans ovs          → True
  sinon                                        → base
```

Implémentation : `backend/apps/permissions/services.py`
(`has_permission`, `effective_permissions`, `Scope`).

## Journal d'audit — garanties d'immuabilité

- `AuditLogEntry.save()` lève une exception si `pk` est déjà défini (pas d'`UPDATE`).
- `AuditLogEntry.delete()` lève une exception (la purge de rétention utilise `_raw_delete`).
- Aucun `ModelViewSet` d'écriture : seules `list` / `retrieve` / `export` sont exposées.
- Rétention : `apps/audit/tasks.purge_audit_log` (archive CSV vers MinIO, puis purge > 365 j).

## Migrations

```
accounts/0001_initial, 0002_initial
organization/0001_initial
permissions/0001_initial, 0002_seed_catalog   # catalogue de permissions + rôles système
audit/0001_initial
notifications/0001_initial
```
