from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.hero_slides import router as hero_slides_router
from app.routes.partners import router as partners_router

__all__ = ["auth_router", "users_router", "hero_slides_router", "partners_router"]
