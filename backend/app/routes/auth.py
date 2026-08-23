from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, Token
from app.utils.security import verify_password, create_access_token
from app.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

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

    access_token_expires = timedelta(
        minutes=settings.access_token_expire_minutes
    )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}