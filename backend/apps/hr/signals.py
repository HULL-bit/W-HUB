"""Déclenchement automatique des processus d'intégration / de départ."""
from __future__ import annotations

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Employee, HrStatus, LifecycleKind


@receiver(post_save, sender=Employee)
def _auto_onboarding(sender, instance, created, **kwargs):
    if not created:
        return
    from .lifecycle import start_lifecycle
    from .models import LifecycleTemplate

    if LifecycleTemplate.objects.filter(kind=LifecycleKind.ONBOARDING, is_default=True).exists():
        start_lifecycle(employee=instance, kind=LifecycleKind.ONBOARDING, actor=None)


@receiver(pre_save, sender=Employee)
def _capture_status(sender, instance, **kwargs):
    if instance.pk:
        instance._previous_hr_status = (
            Employee.objects.filter(pk=instance.pk).values_list("hr_status", flat=True).first()
        )


@receiver(post_save, sender=Employee)
def _auto_offboarding(sender, instance, created, **kwargs):
    if created:
        return
    previous = getattr(instance, "_previous_hr_status", None)
    if previous != HrStatus.LEFT and instance.hr_status == HrStatus.LEFT:
        from .lifecycle import start_lifecycle
        from .models import LifecycleTemplate

        if LifecycleTemplate.objects.filter(kind=LifecycleKind.OFFBOARDING, is_default=True).exists():
            start_lifecycle(employee=instance, kind=LifecycleKind.OFFBOARDING, actor=None)
