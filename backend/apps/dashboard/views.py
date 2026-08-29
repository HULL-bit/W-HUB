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

        self._hr_widget(data, perms, user)
        self._personal_widgets(data, user)
        return Response(data)

    @staticmethod
    def _hr_widget(data, perms, user):
        if not ("hr.view" in perms or user.is_super_admin):
            return
        from django.utils import timezone

        from apps.hr.models import Contract, Employee, LeaveRequest, LeaveStatus

        today = timezone.now().date()
        data["widgets"]["hr"] = {
            "headcount": Employee.objects.exclude(hr_status="left").count(),
            "pending_leave": LeaveRequest.objects.filter(status=LeaveStatus.IN_REVIEW).count(),
            "contracts_expiring": Contract.objects.filter(
                end_date__range=(today, today + timezone.timedelta(days=60))
            ).count(),
        }

    @staticmethod
    def _personal_widgets(data, user):
        from apps.correspondence.models import Mail, MailStatus
        from apps.hr.models import LeaveRequest

        data["widgets"]["my_mail"] = Mail.objects.filter(
            assigned_to=user
        ).exclude(status__in=[MailStatus.PROCESSED, MailStatus.ARCHIVED]).count()
        data["widgets"]["my_leave_pending"] = LeaveRequest.objects.filter(
            employee__user=user, status="in_review"
        ).count()

    @staticmethod
    def _shortcuts(perms: set[str]) -> list[dict]:
        catalog = [
            ("tasks.submit", "Soumettre une tâche", "/tasks"),
            ("tasks.assign", "Assigner une tâche", "/tasks/new"),
            ("documents.send", "Envoyer un document", "/documents/send"),
            ("meetings.create", "Démarrer une visio", "/meetings/new"),
            ("mail.register", "Enregistrer un courrier", "/mail/new"),
            ("hr.view", "Tableau de bord RH", "/hr"),
            ("hr.leave.validate", "Valider des congés", "/leave/validate"),
            ("accounts.manage", "Gérer les comptes", "/admin/users"),
            ("audit.view", "Journal d'audit", "/admin/audit"),
        ]
        shortcuts = [{"label": "Demander un congé", "url": "/leave"}]
        shortcuts += [
            {"label": label, "url": url}
            for code, label, url in catalog
            if code in perms
        ]
        return shortcuts
