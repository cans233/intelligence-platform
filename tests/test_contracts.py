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
        "/jobs",
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


def test_openapi_core_methods_security_and_envelope_refs() -> None:
    contract = yaml.safe_load(
        (ROOT / "contracts" / "openapi" / "openapi-v1.yaml").read_text(encoding="utf-8")
    )
    paths = contract["paths"]
    assert "post" in paths["/documents"]
    assert paths["/auth/login"]["post"]["security"] == []
    protected = [
        ("/me", "get"),
        ("/patents", "get"),
        ("/patents/{id}", "get"),
        ("/patents/{id}/claims", "get"),
        ("/patents/{id}/family", "get"),
        ("/patents/{id}/citations", "get"),
        ("/patents/{id}/sources", "get"),
        ("/projects", "get"),
        ("/projects", "post"),
        ("/technologies", "get"),
        ("/documents", "get"),
        ("/documents", "post"),
        ("/jobs", "get"),
    ]
    for path, method in protected:
        operation = paths[path][method]
        assert operation.get("security") in (None, [{"bearerAuth": []}])
        response_ref = operation["responses"]["200"]["$ref"]
        response_name = response_ref.rsplit("/", 1)[-1]
        response = contract["components"]["responses"][response_name]
        schema_ref = response["content"]["application/json"]["schema"].get("$ref")
        assert schema_ref
        envelope = contract["components"]["schemas"][schema_ref.rsplit("/", 1)[-1]]
        data_ref = next(
            item["properties"]["data"]["$ref"]
            for item in envelope["allOf"]
            if "properties" in item and "data" in item["properties"]
        )
        assert data_ref.startswith("#/components/schemas/")


def test_error_envelope_code_is_string() -> None:
    contract = yaml.safe_load(
        (ROOT / "contracts" / "openapi" / "openapi-v1.yaml").read_text(encoding="utf-8")
    )
    envelope = contract["components"]["schemas"]["Envelope"]
    assert envelope["properties"]["code"]["type"] == "string"
    assert contract["components"]["responses"]["EnvelopeError"]["content"]["application/json"]["schema"][
        "$ref"
    ] == "#/components/schemas/Envelope"


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


def test_openapi_methods_security_and_typed_envelopes() -> None:
    contract = yaml.safe_load(
        (ROOT / "contracts" / "openapi" / "openapi-v1.yaml").read_text(encoding="utf-8")
    )
    paths = contract["paths"]
    assert set(paths["/documents"]) >= {"get", "post"}
    assert "requestBody" in paths["/documents"]["post"]
    assert paths["/documents"]["post"]["requestBody"]["content"]["application/json"]["schema"]["$ref"].endswith(
        "/DocumentCreate"
    )
    assert "requestBody" in paths["/projects/{id}"]["patch"]
    assert paths["/auth/login"]["post"]["security"] == []
    assert contract["security"] == [{"bearerAuth": []}]

    schemas = contract["components"]["schemas"]
    assert schemas["Envelope"]["properties"]["code"]["type"] == "string"
    expected_data_refs = {
        "EnvelopeLogin": "/EnvelopeLoginData",
        "EnvelopeMe": "/User",
        "EnvelopePatentList": "/PatentPage",
        "EnvelopePatentDetail": "/PatentDetail",
        "EnvelopeProjectList": "/ProjectPage",
        "EnvelopeProjectDetail": "/Project",
        "EnvelopeTechnologyList": "/TechnologyPage",
        "EnvelopeTechnologyDetail": "/Technology",
        "EnvelopeDocumentList": "/DocumentPage",
        "EnvelopeDocumentDetail": "/Document",
    }
    for name, suffix in expected_data_refs.items():
        data = schemas[name]["allOf"][1]["properties"]["data"]
        assert data["$ref"].endswith(suffix)
