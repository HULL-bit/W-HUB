from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.audit.models import AuditLogEntry
from apps.notifications.models import Notification
from apps.permissions.services import effective_permissions


class DashboardView(APIView):
    """Vue d'accueil adaptée au rôle (section 2.8).

    Le contenu s'enrichira à chaque phase (tâches, courrier, documents...).
    En phase 1 : identité, permissions effectives, notifications, raccourcis,
    et widgets d'administration pour les rôles habilités.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        perms = {c for c, m in effective_permissions(user).items() if m["granted"]}

        data = {
            "user": {
                "id": str(user.id),
                "full_name": user.get_full_name(),
                "email": user.email,
                "role": user.role_slug,
                "is_super_admin": user.is_super_admin,
                "department": user.department_id,
            },
            "permissions": sorted(perms),
            "notifications": {
                "unread": Notification.objects.filter(
                    recipient=user, is_read=False
                ).count(),
                "latest": list(
                    Notification.objects.filter(recipient=user)
                    .values("id", "title", "url", "created_at", "is_read")[:5]
                ),
            },
            "shortcuts": self._shortcuts(perms),
            "widgets": {},
        }

        if "accounts.view" in perms or user.is_super_admin:
            data["widgets"]["administration"] = {
                "users_total": User.objects.count(),
                "users_active": User.objects.filter(is_active=True).count(),
                "users_locked": User.objects.filter(
                    locked_until__isnull=False
                ).count(),
            }
        if "audit.view" in perms or user.is_super_admin:
            data["widgets"]["audit"] = {
                "entries_total": AuditLogEntry.objects.count(),
                "critical_recent": AuditLogEntry.objects.filter(
                    severity="critical"
                ).count(),
            }
        return Response(data)

    @staticmethod
    def _shortcuts(perms: set[str]) -> list[dict]:
        catalog = [
            ("tasks.submit", "Soumettre une tâche", "/tasks"),
            ("tasks.assign", "Assigner une tâche", "/tasks/new"),
            ("documents.send", "Envoyer un document", "/documents/send"),
            ("meetings.create", "Démarrer une visio", "/meetings/new"),
            ("accounts.manage", "Gérer les comptes", "/admin/users"),
            ("audit.view", "Journal d'audit", "/admin/audit"),
        ]
        return [
            {"label": label, "url": url}
            for code, label, url in catalog
            if code in perms
        ]
