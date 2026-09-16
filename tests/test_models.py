from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from backend.app.api.projects import project_detail
from backend.app.models import (
    PatentApplication,
    PatentClaim,
    PatentFamily,
    PatentPublication,
    PatentStatus,
    ProjectPatent,
    SourceRecord,
)


def test_phase_one_patent_model_contract() -> None:
    assert PatentFamily.__tablename__ == "family"
    assert PatentApplication.__tablename__ == "application"
    assert PatentPublication.__tablename__ == "publication"
    assert PatentClaim.__tablename__ == "claim"
    assert SourceRecord.__tablename__ == "source_record"

    publication_columns = PatentPublication.__table__.c
    assert {"publication_number", "application_id", "title", "status"} <= set(
        publication_columns.keys()
    )
    assert PatentStatus.DISCOVERED.value == "DISCOVERED"
    assert PatentStatus.ACTIVE.value == "ACTIVE"

    publication_constraints = {
        constraint.name for constraint in PatentPublication.__table__.constraints
    }
    claim_constraints = {constraint.name for constraint in PatentClaim.__table__.constraints}
    assert "patent_status" in publication_constraints
    assert "uq_patent_claim_publication_claim_no" in claim_constraints


def test_project_patent_relation_type_contract() -> None:
    columns = ProjectPatent.__table__.c
    assert "relation_type" in columns
    assert columns.relation_type.nullable is False
    assert columns.relation_type.default.arg == "EXTERNAL"
    constraints = {constraint.name for constraint in ProjectPatent.__table__.constraints}
    assert "ck_company_project_patent_relation_type" in constraints


def test_project_detail_separates_company_and_external_patents() -> None:
    def patent(number: str, country: str, relation_type: str) -> SimpleNamespace:
        publication = SimpleNamespace(
            id=uuid4(),
            publication_number=number,
            title=number,
            application=SimpleNamespace(country=country),
        )
        return SimpleNamespace(
            publication=publication,
            relation_type=relation_type,
            relevance_score=85,
            relation_reason="fixture",
        )

    now = datetime.now(timezone.utc)
    project = SimpleNamespace(
        id=uuid4(),
        code="PRJ-TEST",
        name="测试项目",
        description=None,
        status="ACTIVE",
        organization=SimpleNamespace(id=uuid4(), code="ORG", name="组织"),
        department=None,
        owner=None,
        technologies=[],
        documents=[],
        patents=[
            patent("CN1", "CN", "COMPANY"),
            patent("US1", "US", "EXTERNAL"),
        ],
        created_at=now,
        updated_at=now,
    )

    data = project_detail(project)

    assert [item["publication_number"] for item in data["company_patents"]] == ["CN1"]
    assert [item["publication_number"] for item in data["external_related_patents"]] == ["US1"]
    assert not set(item["publication_number"] for item in data["company_patents"]) & set(
        item["publication_number"] for item in data["external_related_patents"]
    )

    project.patents = []
    empty_data = project_detail(project)
    assert empty_data["company_patents"] == []
    assert empty_data["external_related_patents"] == []
