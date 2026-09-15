from backend.app.ingestion.contracts import PatentSourceAdapter
from backend.app.models import (
    ApplicationApplicant,
    ApplicationInventor,
    PatentAbstract,
    PatentApplicant,
    PatentApplication,
    PatentCitation,
    PatentClaim,
    PatentClassification,
    PatentDescription,
    PatentFamily,
    PatentFamilyMember,
    PatentInventor,
    PatentLegalEvent,
    PatentPriority,
    SourceRecord,
)


def test_patent_fact_tables_are_separate_and_constrained() -> None:
    assert PatentFamily.__table__.schema == "patent"
    assert PatentApplication.__table__.schema == "patent"
    assert PatentClaim.__table__.schema == "patent"
    assert PatentClaim.__table__.c.publication_id.nullable is False

    expected_models = {
        PatentAbstract,
        PatentDescription,
        PatentApplicant,
        PatentInventor,
        ApplicationApplicant,
        ApplicationInventor,
        PatentClassification,
        PatentPriority,
        PatentCitation,
        PatentLegalEvent,
        PatentFamilyMember,
        SourceRecord,
    }
    assert all(model.__table__.schema == "patent" for model in expected_models)

    claim_constraints = {item.name for item in PatentClaim.__table__.constraints}
    source_constraints = {item.name for item in SourceRecord.__table__.constraints}
    assert "uq_patent_claim_publication_claim_no" in claim_constraints
    assert "uq_patent_source_record_source_key" in source_constraints


def test_external_adapter_contract_is_defined_without_source_integration() -> None:
    required_methods = {
        "search",
        "fetch_record",
        "fetch_fulltext",
        "fetch_family",
        "fetch_legal_events",
        "health_check",
    }
    assert required_methods <= set(PatentSourceAdapter.__dict__)
