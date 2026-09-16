import os
import subprocess
import sys
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, text
from sqlalchemy.exc import IntegrityError


DATABASE_URL = os.getenv("DATABASE_URL")
pytestmark = pytest.mark.integration


def _client() -> TestClient:
    if not DATABASE_URL:
        message = "DATABASE_URL is required for PostgreSQL API integration tests"
        if os.getenv("REQUIRE_POSTGRES_INTEGRATION") == "1":
            pytest.fail(message)
        pytest.skip(message)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        message = f"PostgreSQL is unavailable: {exc}"
        if os.getenv("REQUIRE_POSTGRES_INTEGRATION") == "1":
            pytest.fail(message)
        pytest.skip(message)

    from backend.app.main import app

    return TestClient(app)


def test_phase2_api_happy_path_and_permissions() -> None:
    client = _client()

    login = client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "Admin-Phase2-2026!"},
    )
    assert login.status_code == 200
    assert login.json()["code"] == "OK"
    assert login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {login.json()['data']['access_token']}"}

    me = client.get("/api/v1/me", headers=admin_headers)
    assert me.status_code == 200
    assert me.json()["data"]["username"] == "admin"

    patents = client.get("/api/v1/patents", headers=admin_headers)
    assert patents.status_code == 200
    assert patents.json()["data"]["total"] == 3
    list_item = patents.json()["data"]["items"][0]
    assert {
        "id",
        "family_id",
        "title",
        "publication_number",
        "application_number",
        "country",
        "applicant_names",
        "publication_date",
        "ipc_codes",
        "cpc_codes",
        "legal_status",
        "status",
        "source_codes",
        "updated_at",
    } <= set(list_item)
    assert isinstance(list_item["applicant_names"], list)
    patent_id = list_item["id"]

    detail = client.get(f"/api/v1/patents/{patent_id}", headers=admin_headers)
    assert detail.status_code == 200
    detail_data = detail.json()["data"]
    assert len(detail_data["claims"]) >= 1
    assert len(detail_data["family_members"]) == 3
    assert {"references", "cited_by"} == set(detail_data["citations"])
    assert isinstance(detail_data["discovery_path"], list)
    assert isinstance(detail_data["normalized_fields"], dict)

    family = client.get(f"/api/v1/patents/{patent_id}/family", headers=admin_headers)
    assert family.status_code == 200
    assert len(family.json()["data"]) == 3

    sources = client.get(f"/api/v1/patents/{patent_id}/sources", headers=admin_headers)
    assert sources.status_code == 200
    assert len(sources.json()["data"]) == 1
    assert sources.json()["data"][0]["raw_data"]["source_record_id"]

    citations = client.get(f"/api/v1/patents/{patent_id}/citations", headers=admin_headers)
    assert citations.status_code == 200
    assert {"references", "cited_by"} == set(citations.json()["data"])

    projects = client.get("/api/v1/projects", headers=admin_headers)
    assert projects.status_code == 200
    assert projects.json()["data"]["total"] == 1
    project_item = projects.json()["data"]["items"][0]
    assert {"organization", "department", "owner", "technologies", "created_at", "updated_at"} <= set(
        project_item
    )
    organization_id = project_item["organization"]["id"]
    project = client.get(f"/api/v1/projects/{project_item['id']}", headers=admin_headers)
    assert project.status_code == 200
    assert {"documents", "company_patents", "external_related_patents"} <= set(project.json()["data"])

    technologies = client.get("/api/v1/technologies", headers=admin_headers)
    assert technologies.status_code == 200
    assert technologies.json()["data"]["total"] == 2

    documents = client.get("/api/v1/documents", headers=admin_headers)
    assert documents.status_code == 200
    document_id = documents.json()["data"]["items"][0]["id"]
    versions = client.get(f"/api/v1/documents/{document_id}/versions", headers=admin_headers)
    assert versions.status_code == 200
    assert len(versions.json()["data"]) == 2

    analyst_login = client.post(
        "/api/v1/auth/login",
        json={"username": "ip.analyst", "password": "Patent-Review-2026!"},
    )
    assert analyst_login.status_code == 200
    analyst_headers = {
        "Authorization": f"Bearer {analyst_login.json()['data']['access_token']}"
    }
    denied = client.post(
        "/api/v1/projects",
        headers=analyst_headers,
        json={
            "organization_id": organization_id,
            "code": "PRJ-DENIED-001",
            "name": "权限测试项目",
        },
    )
    assert denied.status_code == 403
    assert denied.json()["code"] == "PERMISSION_DENIED"


def test_phase2_api_not_found_and_auth_failures() -> None:
    client = _client()
    missing_id = UUID("00000000-0000-0000-0000-000000000000")

    missing = client.get(f"/api/v1/patents/{missing_id}")
    assert missing.status_code == 404
    assert missing.json()["code"] == "PATENT_NOT_FOUND"

    unauthorized = client.get("/api/v1/me")
    assert unauthorized.status_code == 401
    assert unauthorized.json()["code"] == "AUTH_REQUIRED"


def test_patent_api_requires_read_permission() -> None:
    client = _client()
    missing_id = UUID("00000000-0000-0000-0000-000000000000")

    unauthenticated = client.get("/api/v1/patents")
    assert unauthenticated.status_code == 401
    assert unauthenticated.json()["code"] == "AUTH_REQUIRED"
    assert client.get(f"/api/v1/patents/{missing_id}/sources").status_code == 401

    from backend.app.db.session import SessionLocal
    from backend.app.models import Permission, RolePermission, User, UserRole

    removed_links = []
    with SessionLocal() as db:
        analyst = db.scalar(select(User).where(User.username == "ip.analyst"))
        assert analyst is not None
        permission = db.scalar(select(Permission).where(Permission.code == "patent.read"))
        assert permission is not None
        role_ids = db.scalars(select(UserRole.role_id).where(UserRole.user_id == analyst.id)).all()
        links = db.scalars(
            select(RolePermission).where(
                RolePermission.permission_id == permission.id,
                RolePermission.role_id.in_(role_ids),
            )
        ).all()
        removed_links = [(link.role_id, link.permission_id) for link in links]
        for link in links:
            db.delete(link)
        db.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={"username": "ip.analyst", "password": "Patent-Review-2026!"},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['data']['access_token']}"}
    try:
        denied = client.get("/api/v1/patents", headers=headers)
        assert denied.status_code == 403
        assert denied.json()["code"] == "PERMISSION_DENIED"
    finally:
        with SessionLocal() as db:
            for role_id, permission_id in removed_links:
                db.add(RolePermission(role_id=role_id, permission_id=permission_id))
            db.commit()


def test_phase2_database_constraints_and_source_preservation() -> None:
    client = _client()
    del client

    from backend.app.db.session import SessionLocal
    from backend.app.models import PatentClaim, PatentPublication, SourceRecord

    subprocess.run(
        [sys.executable, "scripts/seed_fixtures.py"],
        check=True,
        env=os.environ.copy(),
    )
    with SessionLocal() as db:
        publication = db.scalar(
            select(PatentPublication).where(
                PatentPublication.publication_number == "CN118765432A"
            )
        )
        assert publication is not None
        original_source = db.scalar(
            select(SourceRecord).where(
                SourceRecord.source_record_id == "CNIPA-CN118765432A"
            )
        )
        assert original_source is not None
        original_raw = dict(original_source.raw_data)

        duplicate = PatentClaim(
            publication_id=publication.id,
            claim_no=1,
            claim_type="DEPENDENT",
            text="重复权利要求约束测试",
        )
        db.add(duplicate)
        with pytest.raises(IntegrityError):
            db.flush()
        db.rollback()

    subprocess.run(
        [sys.executable, "scripts/seed_fixtures.py"],
        check=True,
        env=os.environ.copy(),
    )
    with SessionLocal() as db:
        source = db.scalar(
            select(SourceRecord).where(
                SourceRecord.source_record_id == "CNIPA-CN118765432A"
            )
        )
        assert source is not None
        assert source.raw_data == original_raw
