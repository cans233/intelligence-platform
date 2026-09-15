from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.cors import CORSMiddleware

from backend.app.api.auth import router as auth_router, user_dto
from backend.app.api.common import ok, trace_id
from backend.app.api.dependencies import get_current_user
from backend.app.api.documents import router as documents_router
from backend.app.api.errors import ApiHttpException
from backend.app.api.patents import router as patents_router
from backend.app.api.projects import router as projects_router
from backend.app.api.system import router as system_router
from backend.app.api.technologies import router as technologies_router
from backend.app.core.config import settings
from backend.app.db.session import engine


app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(patents_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(technologies_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")


@app.exception_handler(ApiHttpException)
async def api_error_handler(request: Request, exc: ApiHttpException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "data": None,
            "message": exc.message,
            "trace_id": trace_id(request),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "data": exc.errors(),
            "message": "请求参数校验失败",
            "trace_id": trace_id(request),
        },
    )


@app.get("/api/v1/me", tags=["auth"])
def current_user(request: Request, user=Depends(get_current_user)):
    return ok(user_dto(user).model_dump(mode="json"), request)


@app.get("/api/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/ready", tags=["system"])
def ready() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready"}
