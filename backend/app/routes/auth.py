from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, Token, RefreshRequest
from app.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

def _issue_tokens(username: str) -> Token:
    access_token = create_access_token(
        data={"sub": username},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_token = create_refresh_token(
        data={"sub": username},
        expires_delta=timedelta(hours=settings.refresh_token_expire_hours),
    )
    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Авторизация пользователя"""
    user = db.query(User).filter(
        User.username == user_data.username
    ).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not active"
        )

    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have admin access"
        )

    return _issue_tokens(user.username)

@router.post("/refresh", response_model=Token)
async def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Обновление пары токенов по refresh_token. Ротация: каждый вызов выдаёт
    новый refresh_token, старый после этого просто становится неиспользуемым
    на стороне клиента — токены здесь stateless (без записи в БД), как и
    остальная auth-схема в этом проекте, так что явного отзыва старого токена
    до его собственного истечения нет.
    """
    token_data = decode_refresh_token(payload.refresh_token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user = db.query(User).filter(
        User.username == token_data["username"]
    ).first()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return _issue_tokens(user.username)