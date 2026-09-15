from collections.abc import Callable, Generator
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from backend.app.api.errors import ApiHttpException
from backend.app.db.session import SessionLocal
from backend.app.models import Permission, Role, User, UserRole
from backend.app.core.security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        return _raise(request, 401, "AUTH_REQUIRED", "需要登录")
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        return _raise(request, 401, "INVALID_TOKEN", "登录凭证无效或已过期")
    user = db.scalar(
        select(User)
        .options(selectinload(User.user_roles).selectinload(UserRole.role))
        .where(User.id == user_id)
    )
    if user is None or not user.is_active:
        return _raise(request, 401, "INVALID_TOKEN", "用户不存在或已停用")
    return user


def require_permission(permission_code: str) -> Callable:
    def dependency(
        request: Request,
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        allowed = db.scalar(
            select(Permission.id)
            .join(Permission.role_permissions)
            .join(Role)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user.id,
                Permission.code == permission_code,
            )
        )
        if allowed is None:
            return _raise(request, 403, "PERMISSION_DENIED", "没有执行该操作的权限")
        return user

    return dependency


def _raise(request: Request, status: int, code: str, message: str):
    raise ApiHttpException(status, code, message)
