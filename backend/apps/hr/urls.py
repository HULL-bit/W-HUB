from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CareerEventViewSet,
    ContractViewSet,
    EmployeeDocumentViewSet,
    EmployeeViewSet,
    HealthRecordViewSet,
    HrDashboardView,
    LeaveBalanceViewSet,
    LeaveRequestViewSet,
    LeaveTypeViewSet,
    PublicHolidayViewSet,
)

router = DefaultRouter()
router.register("hr/employees", EmployeeViewSet)
router.register("hr/contracts", ContractViewSet)
router.register("hr/employee-documents", EmployeeDocumentViewSet)
router.register("hr/career-events", CareerEventViewSet)
router.register("hr/health-records", HealthRecordViewSet)
router.register("hr/public-holidays", PublicHolidayViewSet)
router.register("hr/leave-types", LeaveTypeViewSet)
router.register("hr/leave-balances", LeaveBalanceViewSet)
router.register("hr/leave-requests", LeaveRequestViewSet)

urlpatterns = [
    path("hr/dashboard/", HrDashboardView.as_view(), name="hr-dashboard"),
    *router.urls,
]
