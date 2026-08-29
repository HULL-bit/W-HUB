from django.contrib import admin

from .models import (
    CareerEvent,
    Contract,
    Employee,
    EmployeeDocument,
    HealthRecord,
    LeaveBalance,
    LeaveRequest,
    LeaveType,
    PublicHoliday,
)


class ContractInline(admin.TabularInline):
    model = Contract
    extra = 0


class CareerEventInline(admin.TabularInline):
    model = CareerEvent
    extra = 0


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("matricule", "user", "job_title", "employment_type", "hr_status", "hire_date")
    list_filter = ("employment_type", "hr_status")
    search_fields = ("matricule", "user__email", "user__first_name", "user__last_name")
    inlines = [ContractInline, CareerEventInline]


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "label", "annual_quota_days", "paid", "requires_certificate")


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "year", "entitled_days", "taken_days", "remaining_days")
    list_filter = ("year", "leave_type")


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ("employee", "leave_type", "start_date", "end_date", "working_days", "status")
    list_filter = ("status", "leave_type")
    date_hierarchy = "start_date"


@admin.register(PublicHoliday)
class PublicHolidayAdmin(admin.ModelAdmin):
    list_display = ("date", "label")


@admin.register(HealthRecord)
class HealthRecordAdmin(admin.ModelAdmin):
    list_display = ("employee", "record_type", "label", "date", "expiry_date")
    list_filter = ("record_type",)


admin.site.register(EmployeeDocument)
admin.site.register(CareerEvent)
admin.site.register(Contract)
