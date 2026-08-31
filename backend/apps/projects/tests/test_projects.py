import pytest

from apps.projects.models import Milestone, Project

pytestmark = pytest.mark.django_db


@pytest.fixture
def project(db, make_user):
    lead = make_user("lead@wagadu.africa", "chef")
    return Project.objects.create(code="P-1", name="Projet test", status="active", lead=lead, created_by=lead)


def test_employee_can_view_but_not_create(api, make_user):
    emp = make_user("e@wagadu.africa", "employe")
    api.force_authenticate(emp)
    assert api.get("/api/v1/projects/").status_code == 200
    res = api.post("/api/v1/projects/", {"code": "X1", "name": "X"}, format="json")
    assert res.status_code == 403


def test_chef_creates_project_and_becomes_member(api, make_user):
    chef = make_user("c@wagadu.africa", "chef")
    api.force_authenticate(chef)
    res = api.post(
        "/api/v1/projects/",
        {"code": "NEW-1", "name": "Nouveau projet", "status": "prospect", "lead": str(chef.id)},
        format="json",
    )
    assert res.status_code == 201
    project = Project.objects.get(code="NEW-1")
    assert chef in project.members.all()


def test_progress_reflects_milestones(api, project, make_user):
    Milestone.objects.create(project=project, title="A", status="done")
    Milestone.objects.create(project=project, title="B", status="todo")
    api.force_authenticate(project.lead)
    data = api.get(f"/api/v1/projects/{project.id}/").data
    assert data["progress"] == 50


def test_milestone_done_sets_completed_date(api, project):
    m = Milestone.objects.create(project=project, title="Jalon", status="todo")
    api.force_authenticate(project.lead)
    api.patch(f"/api/v1/project-milestones/{m.id}/", {"status": "done"}, format="json")
    m.refresh_from_db()
    assert m.completed_at is not None


def test_set_status_action(api, project):
    api.force_authenticate(project.lead)
    res = api.post(f"/api/v1/projects/{project.id}/set-status/", {"status": "completed"}, format="json")
    assert res.status_code == 200
    project.refresh_from_db()
    assert project.status == "completed"


def test_set_status_rejects_unknown(api, project):
    api.force_authenticate(project.lead)
    assert api.post(f"/api/v1/projects/{project.id}/set-status/", {"status": "wat"}, format="json").status_code == 400


def test_progress_update_records_author(api, project):
    api.force_authenticate(project.lead)
    res = api.post(
        f"/api/v1/projects/{project.id}/updates/",
        {"date": "2026-08-31", "body": "Avancement du mois"},
        format="json",
    )
    assert res.status_code == 201
    assert project.updates.first().author == project.lead


def test_mine_filter(api, project, make_user):
    other = make_user("o@wagadu.africa", "chef")
    Project.objects.create(code="P-2", name="Autre", status="active", lead=other, created_by=other)
    api.force_authenticate(project.lead)
    rows = api.get("/api/v1/projects/?mine=1").data["results"]
    assert {r["code"] for r in rows} == {"P-1"}
