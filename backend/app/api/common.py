from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse


def trace_id(request: Request) -> str:
    return request.headers.get("x-trace-id") or str(uuid4())


def ok(data, request: Request, message: str = "ok") -> dict:
    return {"code": 0, "data": data, "message": message, "trace_id": trace_id(request)}


def error_response(request: Request, status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"code": code, "data": None, "message": message, "trace_id": trace_id(request)},
    )
