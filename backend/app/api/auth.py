from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from backend.app.api.common import ok
from backend.app.api.dependencies import get_current_user, get_db
from backend.app.api.schemas import LoginDto, LoginRequest, UserDto
from backend.app.core.security import create_access_token, verify_password
from backend.app.models import User, UserRole

router = APIRouter(prefix="/auth", tags=["auth"])


def user_dto(user: User) -> UserDto:
    return UserDto(
        id=user.id,
        username=user.username,
        email=user.email,
        display_name=user.display_name,
        roles=[item.role.code for item in user.user_roles],
    )


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User)
        .options(selectinload(User.user_roles).selectinload(UserRole.role))
        .where(User.username == payload.username)
    )
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        from backend.app.api.errors import ApiHttpException

        raise ApiHttpException(401, "INVALID_CREDENTIALS", "用户名或密码错误")
    data = LoginDto(token=create_access_token(user.id), user=user_dto(user))
    return ok(data.model_dump(mode="json"), request)
