from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.lead import Lead
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadOut, LeadReviewUpdate, QuickLeadCreate

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    """Public — this is intake, not admin content; any visitor may post one."""
    lead = Lead(kind="full", **payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/quick", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_quick_lead(payload: QuickLeadCreate, db: Session = Depends(get_db)):
    """Public, same as above."""
    lead = Lead(kind="quick", **payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("", response_model=list[LeadOut])
async def list_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Lead).order_by(Lead.created_at.desc()).all()


@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: int,
    payload: LeadReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена — возможно, её уже удалили",
        )

    lead.is_reviewed = payload.is_reviewed
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена — возможно, её уже удалили",
        )

    db.delete(lead)
    db.commit()
