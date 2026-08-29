from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

api_v1 = [
    path("", include("apps.accounts.urls")),
    path("", include("apps.organization.urls")),
    path("", include("apps.permissions.urls")),
    path("", include("apps.audit.urls")),
    path("", include("apps.notifications.urls")),
    path("", include("apps.dashboard.urls")),
    path("", include("apps.validation.urls")),
    path("", include("apps.hr.urls")),
    path("", include("apps.correspondence.urls")),
    path("", include("apps.tasks.urls")),
    path("", include("apps.documents.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include((api_v1, "api"), namespace="v1")),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/schema/swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]
