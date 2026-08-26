from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.hero_slides import router as hero_slides_router
from app.routes.partners import router as partners_router
from app.routes.news import router as news_router
from app.routes.product_categories import router as product_categories_router
from app.routes.showrooms import router as showrooms_router

__all__ = [
    "auth_router",
    "users_router",
    "hero_slides_router",
    "partners_router",
    "news_router",
    "product_categories_router",
    "showrooms_router",
]
