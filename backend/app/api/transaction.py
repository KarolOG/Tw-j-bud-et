from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.db import db_dependency
from app.api.auth import verify_token
from app.dbmodels import Transaction, Category
from pydantic import BaseModel
from fastapi.responses import JSONResponse

router = APIRouter(
    prefix="/transaction",
    tags=["Transaction"]
)


class TransactionCreate(BaseModel):
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None
    category_id: int

class TransactionUpdate(BaseModel):
    amount: Optional[float]
    description: Optional[str]
    date: Optional[datetime]
    category_id: Optional[int]

class TransactionOut(BaseModel):
    id: int
    amount: float
    description: Optional[str]
    date: datetime
    category_id: int
    category_name: Optional[str]
    category_type: Optional[str]

    class Config:
        orm_mode = True



@router.post("/")
async def create_transaction(
    new_tx: TransactionCreate,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    category = db.get(Category, new_tx.category_id)
    if not category or category.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Invalid category for this user")

    tx = Transaction(
        amount=new_tx.amount,
        description=new_tx.description,
        date=new_tx.date or datetime.utcnow(),
        category_id=new_tx.category_id,
        user_id=current_user["id"]
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx



@router.get("/", response_model=List[TransactionOut])
async def get_transactions(
    db: db_dependency,
    category_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: dict = Depends(verify_token)
):
    stmt = select(Transaction).where(Transaction.user_id == current_user["id"]).order_by(Transaction.date.desc())
    if category_id:
        stmt = stmt.where(Transaction.category_id == category_id)
    if date_from:
        stmt = stmt.where(Transaction.date >= date_from)
    if date_to:
        stmt = stmt.where(Transaction.date <= date_to)

    transactions = db.execute(stmt).scalars().all()
    return [
    {
        **tx.__dict__,
        "category_name": tx.category.name if tx.category else None,
        "category_type": tx.category.type if tx.category else None,
    }
    for tx in transactions
    ]



@router.get("/{transaction_id}")
async def get_transaction(
    transaction_id: int,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    tx = db.get(Transaction, transaction_id)
    if not tx or tx.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.put("/{transaction_id}")
async def update_transaction(
    transaction_id: int,
    new_tx: TransactionUpdate,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    tx = db.get(Transaction, transaction_id)
    if not tx or tx.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if new_tx.category_id:
        cat = db.get(Category, new_tx.category_id)
        if not cat or cat.user_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Invalid category")

        tx.category_id = new_tx.category_id
    if new_tx.amount is not None:
        tx.amount = new_tx.amount
    if new_tx.description is not None:
        tx.description = new_tx.description
    if new_tx.date is not None:
        tx.date = new_tx.date

    db.commit()
    db.refresh(tx)
    return {"message": "Transaction updated", "transaction": tx}



@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    tx = db.get(Transaction, transaction_id)
    if not tx or tx.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted"}
