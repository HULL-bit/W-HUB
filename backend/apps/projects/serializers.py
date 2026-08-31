from __future__ import annotations

from rest_framework import serializers

from .models import Indicator, Milestone, ProgressUpdate, Project


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ["id", "project", "title", "description", "due_date", "status", "order", "completed_at"]
        read_only_fields = ["completed_at"]


class IndicatorSerializer(serializers.ModelSerializer):
    attainment = serializers.IntegerField(read_only=True)

    class Meta:
        model = Indicator
        fields = [
            "id", "project", "name", "unit", "baseline_value", "target_value",
            "current_value", "attainment", "updated_at",
        ]
        read_only_fields = ["updated_at"]


class ProgressUpdateSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = ProgressUpdate
        fields = ["id", "project", "author", "author_name", "date", "body", "spent_amount", "created_at"]
        read_only_fields = ["author", "created_at"]

    def get_author_name(self, obj) -> str:
        if not obj.author_id:
            return "—"
        return obj.author.get_full_name() or obj.author.email


class ProjectListSerializer(serializers.ModelSerializer):
    lead_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source="department.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    progress = serializers.IntegerField(read_only=True)
    member_count = serializers.IntegerField(source="members.count", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id", "code", "name", "summary", "status", "status_display", "lead", "lead_name",
            "department", "department_name", "donor", "budget", "currency", "location",
            "application_deadline", "start_date", "end_date", "progress", "member_count",
            "updated_at",
        ]

    def get_lead_name(self, obj) -> str | None:
        return (obj.lead.get_full_name() or obj.lead.email) if obj.lead_id else None


class ProjectDetailSerializer(ProjectListSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    indicators = IndicatorSerializer(many=True, read_only=True)
    updates = ProgressUpdateSerializer(many=True, read_only=True)
    members_detail = serializers.SerializerMethodField()

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + [
            "description", "members", "members_detail", "created_by", "created_at",
            "milestones", "indicators", "updates",
        ]

    def get_members_detail(self, obj) -> list[dict]:
        return [
            {"id": str(u.id), "name": u.get_full_name() or u.email}
            for u in obj.members.all()
        ]


class ProjectWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id", "code", "name", "summary", "description", "status", "lead", "department",
            "members", "donor", "budget", "currency", "location",
            "application_deadline", "start_date", "end_date",
        ]
        read_only_fields = ["id"]
