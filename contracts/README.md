# API v1 Contracts

These files are the shared Phase 2 integration contracts between the backend and
frontend:

- `openapi/openapi-v1.yaml`: REST API paths and DTO field requirements.
- `search/internal-search-v1.json`: internal search response shape. `hit_reasons`
  belongs only to this contract and is not part of the Patent Fact API.
- `events/patent-events-v1.json`: external patent acquisition event envelope and
  adapter-facing payloads.

All REST responses use:

```json
{
  "code": 0,
  "data": {},
  "message": "ok",
  "trace_id": "..."
}
```

The backend owns the canonical patent facts. Raw `SourceRecord.raw_data` is
immutable acquisition evidence and is never replaced by normalized values.
`patent.abstract` and `patent.description` are the canonical text tables;
legacy text columns on `patent.publication` remain read-only compatibility
fallbacks during the migration window.
