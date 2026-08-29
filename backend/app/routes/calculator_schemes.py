from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.calculator_scheme import CalculatorScheme
from app.models.user import User
from app.schemas.calculator_scheme import (
    CalculatorSchemeCreate,
    CalculatorSchemeOut,
    CalculatorSchemeReorderRequest,
    CalculatorSchemeUpdate,
)

router = APIRouter(prefix="/api/calculator-schemes", tags=["calculator-schemes"])


def count_columns(geometry: dict) -> int:
    """
    How many sashes wide the scheme reads — the group the picker files it under.

    Denormalised into a column on write so listing and sorting do not walk
    every tree. A vertical split is a row of columns, so its children add up;
    a horizontal one stacks, so the widest row wins.
    """
    if "split" not in geometry:
        return 1
    child_counts = [count_columns(child["node"]) for child in geometry["children"]]
    if geometry["split"] == "v":
        return sum(child_counts)
    return max(child_counts)


@router.get("", response_model=list[CalculatorSchemeOut])
async def list_calculator_schemes(db: Session = Depends(get_db)):
    """
    Public — what the calculator offers.

    Disabled schemes are filtered out here rather than by the caller: that is
    the whole point of the flag, and a public endpoint that hands out retired
    schemes and trusts the frontend to hide them is one refactor away from
    showing them.
    """
    return (
        db.query(CalculatorScheme)
        .filter(CalculatorScheme.enabled.is_(True))
        .order_by(CalculatorScheme.position)
        .all()
    )


@router.get("/all", response_model=list[CalculatorSchemeOut])
async def list_all_calculator_schemes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Every scheme, disabled ones included — the admin panel's list.

    Registered ahead of `/{scheme_id}` on purpose: FastAPI matches path
    *shape*, so `/all` would otherwise be swallowed as `scheme_id="all"`."""
    return db.query(CalculatorScheme).order_by(CalculatorScheme.position).all()


@router.post("", response_model=CalculatorSchemeOut, status_code=status.HTTP_201_CREATED)
async def create_calculator_scheme(
    payload: CalculatorSchemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(CalculatorScheme).filter(CalculatorScheme.key == payload.key).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Схема с ключом «{payload.key}» уже существует",
        )

    geometry = payload.geometry.model_dump()
    max_position = db.query(func.max(CalculatorScheme.position)).scalar()

    scheme = CalculatorScheme(
        key=payload.key,
        kind=payload.kind,
        arch=payload.arch,
        geometry=geometry,
        columns=count_columns(geometry),
        default_width_mm=payload.default_width_mm,
        default_height_mm=payload.default_height_mm,
        enabled=payload.enabled,
        position=(max_position or 0) + 1,
    )
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return scheme


@router.post("/reorder", response_model=list[CalculatorSchemeOut])
async def reorder_calculator_schemes(
    payload: CalculatorSchemeReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ahead of `/{scheme_id}` for the same reason as `/all` above."""
    schemes = {scheme.id: scheme for scheme in db.query(CalculatorScheme).all()}

    if set(payload.ordered_ids) != set(schemes.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список схем устарел — обновите страницу и попробуйте снова",
        )

    for position, scheme_id in enumerate(payload.ordered_ids):
        schemes[scheme_id].position = position

    db.commit()
    return db.query(CalculatorScheme).order_by(CalculatorScheme.position).all()


@router.patch("/{scheme_id}", response_model=CalculatorSchemeOut)
async def update_calculator_scheme(
    scheme_id: int,
    payload: CalculatorSchemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scheme = db.query(CalculatorScheme).filter(CalculatorScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Схема не найдена — возможно, её уже удалили",
        )

    if payload.kind is not None:
        scheme.kind = payload.kind
    if payload.enabled is not None:
        scheme.enabled = payload.enabled
    if payload.default_width_mm is not None:
        scheme.default_width_mm = payload.default_width_mm
    if payload.default_height_mm is not None:
        scheme.default_height_mm = payload.default_height_mm

    # `clear_arch` and `arch` are separate because an omitted field and an
    # explicit null are the same value over JSON — see the schema's comment.
    if payload.clear_arch:
        scheme.arch = None
    elif payload.arch is not None:
        scheme.arch = payload.arch

    if payload.geometry is not None:
        geometry = payload.geometry.model_dump()
        scheme.geometry = geometry
        scheme.columns = count_columns(geometry)

    db.commit()
    db.refresh(scheme)
    return scheme


@router.delete("/{scheme_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calculator_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scheme = db.query(CalculatorScheme).filter(CalculatorScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Схема не найдена — возможно, её уже удалили",
        )

    db.delete(scheme)
    db.commit()
