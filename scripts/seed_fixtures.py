"""Load deterministic phase two fixtures into PostgreSQL."""
import json
from datetime import date, datetime, timezone
from pathlib import Path
from uuid import UUID, uuid5

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.security import hash_password
from backend.app.db.session import SessionLocal
from backend.app.models import (
    ApplicationApplicant,
    ApplicationInventor,
    Department,
    Document,
    DocumentVersion,
    Organization,
    ParsedContent,
    PatentAbstract,
    PatentApplicant,
    PatentApplication,
    PatentClassification,
    PatentClaim,
    PatentCitation,
    PatentDescription,
    PatentFamily,
    PatentFamilyMember,
    PatentInventor,
    PatentLegalEvent,
    PatentPriority,
    PatentPublication,
    Project,
    ProjectDocument,
    ProjectPatent,
    ProjectTechnology,
    Role,
    Technology,
    TechnologyPatent,
    User,
    UserRole,
    Permission,
    RolePermission,
    SourceRecord,
)

ROOT = Path(__file__).resolve().parents[1]
NAMESPACE = UUID("0dd9a74b-758e-4e46-a3f7-744e6c1c8f52")


def stable(kind: str, value: str) -> UUID:
    return uuid5(NAMESPACE, f"{kind}:{value}")


def load_json(path: str):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def get_or_create(db: Session, model, identity: dict, values: dict | None = None):
    instance = db.scalar(select(model).filter_by(**identity))
    if instance is None:
        instance = model(**identity, **(values or {}))
        db.add(instance)
        db.flush()
    elif values:
        for key, value in values.items():
            setattr(instance, key, value)
    return instance


def seed_users(db: Session) -> dict[str, User]:
    users = {}
    permission_names = {
        "project.read": "查看项目",
        "project.write": "编辑项目",
        "technology.read": "查看技术",
        "document.read": "查看文档",
        "document.write": "上传文档",
        "job.read": "查看任务",
    }
    for item in load_json("fixtures/users/phase2_users.json"):
        user = get_or_create(
            db,
            User,
            {"username": item["username"]},
            {
                "id": stable("user", item["username"]),
                "email": item["email"],
                "display_name": item["display_name"],
                "password_hash": hash_password(item["password"]),
                "is_active": True,
            },
        )
        role = get_or_create(
            db,
            Role,
            {"code": item["role_code"]},
            {"id": stable("role", item["role_code"]), "name": item["role_name"]},
        )
        get_or_create(db, UserRole, {"user_id": user.id, "role_id": role.id})
        role_permissions = set(permission_names)
        if item["role_code"] == "ip_analyst":
            role_permissions -= {"project.write", "document.write"}
        for code in role_permissions:
            permission = get_or_create(
                db,
                Permission,
                {"code": code},
                {"id": stable("permission", code), "name": permission_names[code]},
            )
            get_or_create(db, RolePermission, {"role_id": role.id, "permission_id": permission.id})
        for code in set(permission_names) - role_permissions:
            permission = db.scalar(select(Permission).where(Permission.code == code))
            if permission is not None:
                existing = db.scalar(
                    select(RolePermission).where(
                        RolePermission.role_id == role.id,
                        RolePermission.permission_id == permission.id,
                    )
                )
                if existing is not None:
                    db.delete(existing)
        users[item["username"]] = user
    return users


def seed_patents(db: Session) -> dict[str, PatentPublication]:
    publications = {}
    for path in (
        "fixtures/patents/cn_millimeter_vco.json",
        "fixtures/patents/us_millimeter_vco.json",
        "fixtures/patents/ep_millimeter_vco.json",
    ):
        item = load_json(path)
        family = get_or_create(
            db, PatentFamily, {"family_id": item["family_id"]}, {"id": stable("family", item["family_id"])}
        )
        application = get_or_create(
            db,
            PatentApplication,
            {"application_number": item["application_number"]},
            {
                "id": stable("application", item["application_number"]),
                "family_id": family.family_id,
                "country": item["country"],
                "filing_date": date.fromisoformat(item["filing_date"]),
            },
        )
        publication = get_or_create(
            db,
            PatentPublication,
            {"publication_number": item["publication_number"]},
            {
                "id": stable("publication", item["publication_number"]),
                "application_id": application.id,
                "title": item["title"],
                "publication_date": date.fromisoformat(item["publication_date"]),
                "legal_status": item["legal_status"],
                "status": "ACTIVE",
            },
        )
        source = db.scalar(
            select(SourceRecord).filter_by(
                source_code=item["source_code"],
                source_record_id=item["source_record_id"],
            )
        )
        if source is None:
            source = SourceRecord(
                id=stable("source", item["source_record_id"]),
                publication_id=publication.id,
                source_code=item["source_code"],
                source_record_id=item["source_record_id"],
                raw_data=item,
                fetched_at=datetime.now(timezone.utc),
            )
            db.add(source)
            db.flush()
        else:
            source.publication_id = publication.id
            source.fetched_at = datetime.now(timezone.utc)
        applicant = get_or_create(
            db,
            PatentApplicant,
            {"external_entity_key": f"{item['country']}:{item['applicant']}"},
            {"id": stable("applicant", item["applicant"]), "canonical_name": item["applicant"], "country": item["country"]},
        )
        inventor_links = []
        for name in item["inventors"]:
            inventor = get_or_create(
                db,
                PatentInventor,
                {"external_entity_key": f"{item['country']}:{name}"},
                {"id": stable("inventor", name), "canonical_name": name, "country": item["country"]},
            )
            inventor_links.append(inventor)
        get_or_create(db, ApplicationApplicant, {"application_id": application.id, "applicant_id": applicant.id})
        for order, inventor in enumerate(inventor_links, 1):
            get_or_create(
                db,
                ApplicationInventor,
                {"application_id": application.id, "inventor_id": inventor.id},
                {"display_order": order},
            )
        get_or_create(
            db, PatentAbstract, {"publication_id": publication.id, "language": "en" if item["country"] != "CN" else "zh"},
            {"id": stable("abstract", item["publication_number"]), "text": item["abstract"], "source_record_id": source.id},
        )
        get_or_create(
            db, PatentDescription, {"publication_id": publication.id, "language": "en" if item["country"] != "CN" else "zh"},
            {"id": stable("description", item["publication_number"]), "text": item["description"], "source_record_id": source.id},
        )
        for classification in item["classifications"]:
            get_or_create(
                db,
                PatentClassification,
                {"publication_id": publication.id, "scheme": classification["scheme"], "code": classification["code"]},
                {"raw_code": classification["code"], "source_record_id": source.id},
            )
        get_or_create(
            db,
            PatentPriority,
            {"application_id": application.id, "priority_number": item["priority_number"]},
            {"priority_date": date.fromisoformat(item["priority_date"]), "country": item["country"], "source_record_id": source.id},
        )
        for claim in item["claims"]:
            get_or_create(
                db,
                PatentClaim,
                {"publication_id": publication.id, "claim_no": claim["claim_no"]},
                {"id": stable("claim", f"{item['publication_number']}:{claim['claim_no']}"), "claim_type": claim["claim_type"], "text": claim["text"]},
            )
        for event in item["legal_events"]:
            get_or_create(
                db,
                PatentLegalEvent,
                {"publication_id": publication.id, "event_date": date.fromisoformat(event["event_date"]), "event_code": event["event_code"], "source_record_id": source.id},
                {"event_description": event["event_description"], "legal_status": event["legal_status"]},
            )
        get_or_create(
            db,
            PatentFamilyMember,
            {"family_id": family.family_id, "publication_id": publication.id},
            {"id": stable("family-member", item["publication_number"]), "country": item["country"], "member_role": "PUBLICATION"},
        )
        publications[item["publication_number"]] = publication
    us_publication = publications["US20250123456A1"]
    cn_publication = publications["CN118765432A"]
    us_source = db.scalar(
        select(SourceRecord).where(SourceRecord.source_record_id == "USPTO-US20250123456A1")
    )
    get_or_create(
        db,
        PatentCitation,
        {
            "citing_publication_id": us_publication.id,
            "cited_publication_id": cn_publication.id,
            "cited_publication_number": None,
        },
        {
            "id": stable("citation", "US20250123456A1:CN118765432A"),
            "citation_type": "BACKWARD",
            "source_record_id": us_source.id if us_source else None,
        },
    )
    return publications


def seed_company_documents(db: Session, users: dict[str, User], publications: dict[str, PatentPublication]) -> None:
    item = load_json("fixtures/projects/mmwave_project.json")
    organization = get_or_create(
        db, Organization, {"code": item["organization_code"]}, {"id": stable("organization", item["organization_code"]), "name": item["organization_name"]},
    )
    department = get_or_create(
        db, Department, {"organization_id": organization.id, "name": item["department_name"]}, {"id": stable("department", item["department_code"]), "code": item["department_code"]},
    )
    project = get_or_create(
        db, Project, {"code": item["project_code"]}, {"id": stable("project", item["project_code"]), "organization_id": organization.id, "department_id": department.id, "owner_id": users["ip.analyst"].id, "name": item["project_name"], "description": item["description"], "status": item["status"]},
    )
    for value in item["technologies"]:
        technology = get_or_create(
            db, Technology, {"name": value["name"]}, {"id": stable("technology", value["name"]), "domain": value["domain"], "lifecycle_stage": value["lifecycle_stage"], "keywords": value["keywords"]},
        )
        get_or_create(db, ProjectTechnology, {"project_id": project.id, "technology_id": technology.id})
        for publication_number in item["patent_publication_numbers"]:
            get_or_create(db, TechnologyPatent, {"technology_id": technology.id, "publication_id": publications[publication_number].id})
    for publication_number in item["patent_publication_numbers"]:
        get_or_create(db, ProjectPatent, {"project_id": project.id, "publication_id": publications[publication_number].id}, {"relevance_score": 85, "relation_reason": "毫米波收发前端技术链关联"})
    doc_item = load_json("fixtures/documents/mmwave_requirements.json")
    document = get_or_create(
        db, Document, {"name": doc_item["name"]}, {"id": stable("document", doc_item["name"]), "project_id": project.id, "uploaded_by": users["ip.analyst"].id, "file_type": doc_item["file_type"], "storage_location": doc_item["storage_location"], "confidentiality": doc_item["confidentiality"], "current_version_no": 2},
    )
    get_or_create(db, ProjectDocument, {"project_id": project.id, "document_id": document.id})
    for version in doc_item["versions"]:
        version_key = f"{doc_item['name']}:{version['version_no']}"
        dv = get_or_create(
            db, DocumentVersion, {"document_id": document.id, "version_no": version["version_no"]}, {"id": stable("document-version", version_key), "file_type": doc_item["file_type"], "storage_location": version["storage_location"], "checksum": version["checksum"], "uploaded_by": users["ip.analyst"].id, "parse_status": version["parse_status"]},
        )
        get_or_create(db, ParsedContent, {"document_version_id": dv.id, "content_type": "TEXT"}, {"id": stable("parsed-content", version_key), "content": version["content"], "parser_name": "fixture-parser", "parser_version": "1.0"})


def main() -> None:
    with SessionLocal() as db:
        users = seed_users(db)
        publications = seed_patents(db)
        seed_company_documents(db, users, publications)
        db.commit()
        print(f"seeded users={len(users)} publications={len(publications)}")


if __name__ == "__main__":
    main()
