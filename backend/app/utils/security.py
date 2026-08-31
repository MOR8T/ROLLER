from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Создание access JWT токена (короткоживущий, для Authorization: Bearer)"""
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode = {**data, "type": "access", "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Создание refresh JWT токена (долгоживущий, годится только для /api/auth/refresh)"""
    expire = datetime.utcnow() + (
        expires_delta or timedelta(hours=settings.refresh_token_expire_hours)
    )
    to_encode = {**data, "type": "refresh", "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def _decode_token(token: str, expected_type: str) -> dict | None:
    """
    Общая логика декодирования. `expected_type` не даёт refresh-токену
    пройти как access (и наоборот) — без этой проверки refresh-токен можно
    было бы подставить в Authorization и пользоваться им как access-токеном
    все 30 дней его жизни.
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
    except JWTError:
        return None

    if payload.get("type") != expected_type:
        return None

    username: str = payload.get("sub")
    if username is None:
        return None
    return {"username": username}

def decode_access_token(token: str) -> dict | None:
    """Декодирование access JWT токена"""
    return _decode_token(token, "access")

def decode_refresh_token(token: str) -> dict | None:
    """Декодирование refresh JWT токена"""
    return _decode_token(token, "refresh")