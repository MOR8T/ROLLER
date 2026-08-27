import logging

from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.models.about_certificate import AboutCertificate
from app.models.about_content import AboutContent
from app.models.about_timeline_item import AboutTimelineItem
from app.models.user import User
from app.utils.security import hash_password

logger = logging.getLogger(__name__)


def seed_initial_admin() -> None:
    """
    Creates the first admin user from INITIAL_ADMIN_* env vars, if set and if
    no user with that username exists yet. There is no `/register` endpoint —
    this is the only way a fresh database gets a user to log in with.

    Idempotent: safe to call on every startup, including against an already
    seeded database or one with no INITIAL_ADMIN_* configured at all.
    """
    settings = get_settings()

    if not (
        settings.initial_admin_username
        and settings.initial_admin_email
        and settings.initial_admin_password
    ):
        logger.info("Initial admin seed skipped: INITIAL_ADMIN_* not fully set")
        return

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.initial_admin_username).first()
        if existing:
            logger.info(
                "Initial admin seed skipped: user %r already exists",
                settings.initial_admin_username,
            )
            return

        user = User(
            username=settings.initial_admin_username,
            email=settings.initial_admin_email,
            hashed_password=hash_password(settings.initial_admin_password),
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        logger.info("Seeded initial admin user %r", settings.initial_admin_username)
    finally:
        db.close()


# The real copy the client supplied for `/about` (2026-08-26/27), written up
# to this session's `messages/ru.json`. Duplicated across all four locale
# columns exactly as `messages/{ru,tj,en,tr}.json` currently duplicates it —
# translation is a follow-up task, not something invented here.
_STORY_PARAGRAPHS = "\n\n".join(
    [
        "Группа компаний ROLLER — первопроходец и признанный эксперт на рынке строительных "
        "материалов Таджикистана. Компания основана в 2006 году и стала первым производителем "
        "материалов из ПВХ в республике. Сегодня мы — один из лидеров по производству "
        "ПВХ-профилей для окон и дверей, обшивочного пластика и кабель-каналов.",
        "За годы работы компания зарекомендовала себя как надёжная и опытная организация, "
        "объединяющая профессионалов своего дела. Мы успешно работаем во всех сегментах рынка "
        "— выполняем как индивидуальные частные заказы, так и крупные оптовые поставки.",
        "Опираясь на многолетний опыт и успех в ПВХ-индустрии, в 2025 году открыта компания "
        "ООО «Алюминийи Аввалин», запустившая современное производство высококачественных "
        "алюминиевых профильных систем.",
        "Наша основная цель — производство качественной продукции с гарантией. Для этого мы "
        "сотрудничаем с передовыми европейскими и турецкими компаниями: Krauss Maffei, Renolit, "
        "Mikrosan, Akdeniz, Dow, Kronos, Baerlocher Kimya San. Tic. Ltd. Şti, CNT Conta.",
    ]
)

_ABOUT_CONTENT_SEED = dict(
    hero_title="Двадцать лет производим профильные системы в Таджикистане",
    hero_description=(
        "Начали в 2006 году с ПВХ-профиля и выросли до полного цикла: экструзия, сборка "
        "конструкций, замер, монтаж и сервис. Слоган остаётся прежним — тепло и комфорт для "
        "каждого дома."
    ),
    story_title="Первый производитель ПВХ в Таджикистане",
    story_paragraphs=_STORY_PARAGRAPHS,
    timeline_title="Как компания росла",
    timeline_description=(
        "Четыре точки, по которым видно, чем ROLLER сегодня отличается от мастерской 2006 года."
    ),
    certificates_title="Сертификаты и партнёрства",
    certificates_description=(
        "Национальная сертификация собственной продукции ROLLER, а также сертификаты и "
        "дилерские грамоты поставщиков сырья, фурнитуры и оборудования."
    ),
    clients_title="Дорогие клиенты",
    clients_quote=(
        "Высшая оценка деятельности нашей компании — это ваше доверие. С момента нашего "
        "появления на рынке Таджикистана нашей первостепенной задачей было завоевание вашего "
        "доверия и соответствие вашим ожиданиям. Мы предлагаем доступные цены и высокое "
        "качество продукции и всегда открыты для реализации ваших предложений по цене и "
        "качеству услуг."
    ),
)

_ABOUT_CONTENT_LOCALE_FIELDS = [
    "hero_title",
    "hero_description",
    "story_title",
    "story_paragraphs",
    "timeline_title",
    "timeline_description",
    "certificates_title",
    "certificates_description",
    "clients_title",
    "clients_quote",
]


def seed_about_content(db: Session | None = None) -> None:
    """
    Creates the single `about_content` row (id=1) if it doesn't exist yet,
    seeded with the real copy the client supplied this session. Idempotent —
    safe to call on every startup, and safe to call mid-request from
    `routes/about_content.py`'s defensive fallback (which passes its own
    session so this doesn't open a second one on top of it).
    """
    owns_session = db is None
    db = db or SessionLocal()
    try:
        if db.query(AboutContent).first():
            if owns_session:
                logger.info("About content seed skipped: row already exists")
            return

        values = {}
        for field in _ABOUT_CONTENT_LOCALE_FIELDS:
            text = _ABOUT_CONTENT_SEED[field]
            for locale in ("ru", "tj", "en", "tr"):
                values[f"{field}_{locale}"] = text

        content = AboutContent(
            **values,
            stat_years_value=20,
            stat_years_suffix="+",
            stat_projects_value=1000,
            stat_projects_suffix="+",
            stat_employees_value=400,
            stat_employees_suffix="+",
            stat_tonnage_value=10000,
            stat_tonnage_suffix="+",
        )
        db.add(content)
        db.commit()
        if owns_session:
            logger.info("Seeded about_content row")
    finally:
        if owns_session:
            db.close()


_ABOUT_TIMELINE_SEED = [
    dict(
        year="2006",
        title="Начало",
        description="Компания основана как производитель материалов из ПВХ — первый в Таджикистане.",
    ),
    dict(
        year="2010-е",
        title="Линейка брендов",
        description=(
            "От одной серии к четырём: ЭКОЛАЙН, ROLLER, UNOPEN и STELLA — от эконома до "
            "премиума."
        ),
    ),
    dict(
        year="2025",
        title="ООО «Алюмини Аввалин»",
        description=(
            "Новый этап: алюминиевые профильные системы, холодная АЛД-45 и тёплая ТЕРМО 60."
        ),
    ),
    dict(
        year="2026",
        title="Масштаб",
        description="1000+ сданных объектов, 400 сотрудников, более 10 000 тонн алюминия в год.",
    ),
]


def seed_about_timeline(db: Session | None = None) -> None:
    """Same idempotency contract as `seed_about_content` — see its docstring."""
    owns_session = db is None
    db = db or SessionLocal()
    try:
        if db.query(AboutTimelineItem).first():
            if owns_session:
                logger.info("About timeline seed skipped: rows already exist")
            return

        for position, item in enumerate(_ABOUT_TIMELINE_SEED):
            values = {}
            for field in ("year", "title", "description"):
                for locale in ("ru", "tj", "en", "tr"):
                    values[f"{field}_{locale}"] = item[field]
            db.add(AboutTimelineItem(**values, position=position))

        db.commit()
        if owns_session:
            logger.info("Seeded %d about_timeline_items rows", len(_ABOUT_TIMELINE_SEED))
    finally:
        if owns_session:
            db.close()


# `image` points at the existing static files in `frontend/public/about/`
# rather than `uploads/about-certificates/` — no file copy needed, since
# `AboutCertificateOut.image_path` is served the same way a partner logo
# already is: prefixed with the backend URL only when it starts with
# `/uploads/`, used as-is otherwise (`lib/about.ts`, mirroring
# `lib/partners.ts`'s `resolveLogoSrc`).
_ABOUT_CERTIFICATES_SEED = [
    dict(title="Сертификат соответствия — ПВХ-профили", image="/about/certificates/tj-pvc-conformity.jpg"),
    dict(title="Сертификат соответствия — алюминиевые профили", image="/about/certificates/tj-aluminium-conformity.jpg"),
    dict(title="Система менеджмента качества", image="/about/certificates/deva-iso-9001-2015.jpg"),
    dict(title="Управление удовлетворённостью клиентов", image="/about/certificates/deva-iso-10002-2018.jpg"),
    dict(title="Система экологического менеджмента", image="/about/certificates/deva-iso-14001-2015.jpg"),
    dict(title="Охрана труда и безопасность", image="/about/certificates/deva-iso-45001-2018.jpg"),
    dict(title="Система энергоменеджмента", image="/about/certificates/renolit-iso-50001-2011.jpg"),
    dict(title="Официальный дилер Fornax", image="/about/certificates/fornax-dealer.jpg"),
    dict(title="Официальный дилер Fores", image="/about/certificates/fores-dealer.jpg"),
    dict(title="Официальный дилер Tek Metal", image="/about/certificates/tek-metal-dealer.jpg"),
    dict(title="Поставщик — Akdeniz Kimya", image="/about/certificates/akdeniz-kimya-letter.jpg"),
    dict(title="Сертификат соответствия CE", image="/about/certificates/benart-ce-conformity.jpg"),
    dict(title="Поставщик — Pulver Kimya", image="/about/certificates/pulver-kimya-letter.jpg"),
    dict(title="Поставщик — Koçak Bantçılık", image="/about/certificates/kocak-bantcilik-letter.jpg"),
]


def seed_about_certificates(db: Session | None = None) -> None:
    """Same idempotency contract as `seed_about_content` — see its docstring."""
    owns_session = db is None
    db = db or SessionLocal()
    try:
        if db.query(AboutCertificate).first():
            if owns_session:
                logger.info("About certificates seed skipped: rows already exist")
            return

        for position, item in enumerate(_ABOUT_CERTIFICATES_SEED):
            values = {f"title_{locale}": item["title"] for locale in ("ru", "tj", "en", "tr")}
            db.add(AboutCertificate(**values, image_path=item["image"], position=position))

        db.commit()
        if owns_session:
            logger.info("Seeded %d about_certificates rows", len(_ABOUT_CERTIFICATES_SEED))
    finally:
        if owns_session:
            db.close()
