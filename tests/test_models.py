from backend.app.models import (
    PatentApplication,
    PatentClaim,
    PatentFamily,
    PatentPublication,
    PatentStatus,
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
