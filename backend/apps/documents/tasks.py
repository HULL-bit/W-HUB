"""Purge de la corbeille documentaire (Celery beat)."""
from __future__ import annotations

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from .models import Document


@shared_task
def purge_trashed_documents() -> dict:
    days = settings.WAGADU.get("DOC_TRASH_RETENTION_DAYS", 30)
    cutoff = timezone.now() - timezone.timedelta(days=days)
    stale = Document.objects.filter(deleted_at__lt=cutoff)
    count = stale.count()
    for document in stale:
        for version in document.versions.all():
            version.file.delete(save=False)
        document.delete()
    return {"purged": count}
