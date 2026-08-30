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
        from django.db.models import Q
        from django.utils import timezone

        from apps.correspondence.models import Mail, MailStatus
        from apps.hr.models import LeaveRequest
        from apps.tasks.models import Task, TaskStatus

        data["widgets"]["my_mail"] = Mail.objects.filter(
            assigned_to=user
        ).exclude(status__in=[MailStatus.PROCESSED, MailStatus.ARCHIVED]).count()
        data["widgets"]["my_leave_pending"] = LeaveRequest.objects.filter(
            employee__user=user, status="in_review"
        ).count()

        my_tasks = Task.objects.filter(assignments__user=user).exclude(status=TaskStatus.DONE)
        data["widgets"]["my_tasks_open"] = my_tasks.distinct().count()
        data["widgets"]["my_tasks_overdue"] = my_tasks.filter(
            due_at__lt=timezone.now()
        ).distinct().count()
        data["widgets"]["my_tasks_to_review"] = Task.objects.filter(
            created_by=user, status=TaskStatus.IN_REVIEW
        ).count()

        from apps.documents.models import DocumentRecipient
        from apps.meetings.models import Meeting, MeetingStatus

        data["widgets"]["my_documents_unread"] = DocumentRecipient.objects.filter(
            user=user, is_read=False, document__deleted_at__isnull=True
        ).count()

        data["widgets"]["next_meetings"] = list(
            Meeting.objects.filter(
                Q(organizer=user) | Q(participants=user),
                status=MeetingStatus.SCHEDULED,
                start__gte=timezone.now(),
            ).distinct().order_by("start")
            .values("id", "title", "start")[:3]
        )

    @staticmethod
    def _shortcuts(perms: set[str]) -> list[dict]:
        catalog = [
            ("tasks.submit", "Soumettre une tâche", "/tasks"),
            ("tasks.assign", "Assigner une tâche", "/tasks/new"),
            ("documents.send", "Envoyer un document", "/documents/send"),
            ("meetings.create", "Planifier une réunion", "/meetings/new"),
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
