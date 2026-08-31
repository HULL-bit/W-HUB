from rest_framework.routers import DefaultRouter

from .views import (
    IndicatorViewSet,
    MilestoneViewSet,
    ProgressUpdateViewSet,
    ProjectViewSet,
)

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="projects")
router.register("project-milestones", MilestoneViewSet, basename="project-milestones")
router.register("project-indicators", IndicatorViewSet, basename="project-indicators")
router.register("project-updates", ProgressUpdateViewSet, basename="project-updates")

urlpatterns = router.urls
