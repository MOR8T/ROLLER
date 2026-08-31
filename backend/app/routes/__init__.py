from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.hero_slides import router as hero_slides_router
from app.routes.partners import router as partners_router
from app.routes.news import router as news_router
from app.routes.product_categories import router as product_categories_router
from app.routes.products import router as products_router
from app.routes.showrooms import router as showrooms_router
from app.routes.about_content import router as about_content_router
from app.routes.about_timeline import router as about_timeline_router
from app.routes.about_certificates import router as about_certificates_router
from app.routes.contact_info import router as contact_info_router
from app.routes.contact_interests import router as contact_interests_router
from app.routes.social_links import router as social_links_router
from app.routes.leads import router as leads_router
from app.routes.calculator_settings import router as calculator_settings_router
from app.routes.calculator_schemes import router as calculator_schemes_router

__all__ = [
    "auth_router",
    "users_router",
    "hero_slides_router",
    "partners_router",
    "news_router",
    "product_categories_router",
    "products_router",
    "showrooms_router",
    "about_content_router",
    "about_timeline_router",
    "about_certificates_router",
    "contact_info_router",
    "contact_interests_router",
    "social_links_router",
    "leads_router",
    "calculator_settings_router",
    "calculator_schemes_router",
]
