"""Réglages de développement local."""
# ruff: noqa: F403, F405
import os
import sys

from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ["*"]

# Sous pytest : stockage fichier local, jamais MinIO/S3 — même si infra/.env
# fournit MINIO_ACCESS_KEY (sinon les tests d'upload bloquent sur un endpoint
# S3 injoignable depuis l'hôte).
if "pytest" in sys.modules or os.environ.get("PYTEST_VERSION"):
    STORAGES = {
        **STORAGES,
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    }

# Base SQLite par défaut en dev/test pour éviter d'exiger PostgreSQL en local.
if os.environ.get("USE_SQLITE", "1") == "1":
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }

CELERY_TASK_ALWAYS_EAGER = True
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Front local (ports variables) : CORS ouvert en développement uniquement.
CORS_ALLOW_ALL_ORIGINS = True

# Pas de limitation de débit en dev / tests (réactivée en production).
REST_FRAMEWORK = {**REST_FRAMEWORK, "DEFAULT_THROTTLE_CLASSES": [], "DEFAULT_THROTTLE_RATES": {}}

