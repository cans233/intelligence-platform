import json
from pathlib import Path

import yaml

from backend.app.main import app


ROOT = Path(__file__).resolve().parents[1]


def test_openapi_contract_is_parseable_and_covers_v1_routes() -> None:
    contract = yaml.safe_load(
        (ROOT / "contracts" / "openapi" / "openapi-v1.yaml").read_text(encoding="utf-8")
    )
    assert contract["openapi"].startswith("3.")
    assert contract["servers"][0]["url"] == "/api/v1"
    def normalize(path: str) -> str:
        return (
            path.replace("{patent_id}", "{id}")
            .replace("{project_id}", "{id}")
            .replace("{technology_id}", "{id}")
            .replace("{document_id}", "{id}")
        )

    contract_paths = {normalize(path) for path in contract["paths"]}
    actual_paths = {
        path.removeprefix("/api/v1")
        for path in app.openapi()["paths"]
        if path.startswith("/api/v1/")
    }
    assert {
        "/auth/login",
        "/me",
        "/patents",
        "/patents/{id}",
        "/patents/{id}/claims",
        "/patents/{id}/family",
        "/patents/{id}/citations",
        "/patents/{id}/sources",
        "/projects",
        "/projects/{id}",
        "/technologies",
        "/technologies/{id}",
        "/documents",
        "/documents/{id}",
        "/documents/{id}/versions",
    } <= contract_paths
    assert {normalize(path) for path in actual_paths} <= contract_paths

    required = set(contract["components"]["schemas"]["PatentListItem"]["required"])
    assert {
        "applicant_names",
        "ipc_codes",
        "cpc_codes",
        "source_codes",
        "updated_at",
    } <= required


def test_search_and_event_contracts_keep_boundary_fields_separate() -> None:
    search = json.loads(
        (ROOT / "contracts" / "search" / "internal-search-v1.json").read_text(encoding="utf-8")
    )
    event = json.loads(
        (ROOT / "contracts" / "events" / "patent-events-v1.json").read_text(encoding="utf-8")
    )
    search_item = search["properties"]["data"]["properties"]["items"]["items"]["properties"]
    assert "hit_reasons" in search_item
    assert "hit_reasons" not in event["properties"]["data"]["properties"]
    assert "discovery_path" in event["properties"]["data"]["properties"]
