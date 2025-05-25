from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.db import db_dependency
from app.api.auth import verify_token
from app.dbmodels import SavingsGoal, SavingDeposit
from pydantic import BaseModel
from datetime import datetime, date


router = APIRouter(
    prefix="/savings",
    tags=["Savings"]
)



class SavingGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    due_date: Optional[date] = None

class SavingGoalUpdate(BaseModel):
    name: Optional[str]
    target_amount: Optional[float]
    current_amount: Optional[float]
    due_date: Optional[date]

class SavingGoalOut(BaseModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    due_date: Optional[date]

    class Config:
        orm_mode = True



@router.post("/", response_model=SavingGoalOut)
async def create_goal(
    goal: SavingGoalCreate,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    new_goal = SavingsGoal(
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        due_date=goal.due_date,
        user_id=current_user["id"]
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal



@router.get("/", response_model=List[SavingGoalOut])
async def get_goals(
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    stmt = select(SavingsGoal).where(SavingsGoal.user_id == current_user["id"])
    goals = db.execute(stmt).scalars().all()
    return goals



@router.get("/{goal_id}", response_model=SavingGoalOut)
async def get_goal(
    goal_id: int,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    goal = db.get(SavingsGoal, goal_id)
    if not goal or goal.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal



@router.put("/{goal_id}")
async def update_goal(
    goal_id: int,
    updated: SavingGoalUpdate,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    goal = db.get(SavingsGoal, goal_id)
    if not goal or goal.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Goal not found")

    if updated.name is not None:
        goal.name = updated.name
    if updated.target_amount is not None:
        goal.target_amount = updated.target_amount
    if updated.current_amount is not None:
        goal.current_amount = updated.current_amount
    if updated.due_date is not None:
        goal.due_date = updated.due_date

    db.commit()
    db.refresh(goal)
    return {"message": "Goal updated", "goal": goal}



@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    goal = db.get(SavingsGoal, goal_id)
    if not goal or goal.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}





class SavingDepositCreate(BaseModel):
    amount: float
    saving_goal_id: int
    description: Optional[str] = ""
    date: Optional[datetime] = None


class SavingDepositUpdate(BaseModel):
    amount: Optional[float]
    description: Optional[str]
    date: Optional[datetime]


class SavingDepositOut(BaseModel):
    id: int
    amount: float
    description: str
    date: datetime
    saving_goal_id: int

    class Config:
        orm_mode = True


@router.post("/deposits/", response_model=SavingDepositOut)
async def add_deposit(
    deposit: SavingDepositCreate,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    goal = db.get(SavingsGoal, deposit.saving_goal_id)
    if not goal or goal.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Invalid savings goal")

    new_deposit = SavingDeposit(
        amount=deposit.amount,
        description=deposit.description or "",
        date=deposit.date or datetime.utcnow(),
        saving_goal_id=deposit.saving_goal_id,
        user_id=current_user["id"]
    )
    db.add(new_deposit)
    goal.current_amount += deposit.amount

    db.commit()
    db.refresh(new_deposit)
    return new_deposit


@router.get("/deposits/", response_model=List[SavingDepositOut])
async def get_deposits(
    db: db_dependency,
    saving_goal_id: Optional[int] = None,
    current_user: dict = Depends(verify_token)
):
    stmt = select(SavingDeposit).where(SavingDeposit.user_id == current_user["id"])
    if saving_goal_id:
        stmt = stmt.where(SavingDeposit.saving_goal_id == saving_goal_id)
    deposits = db.execute(stmt).scalars().all()
    return deposits


@router.get("/deposits/{deposit_id}", response_model=SavingDepositOut)
async def get_deposit(
    deposit_id: int,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    deposit = db.get(SavingDeposit, deposit_id)
    if not deposit or deposit.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return deposit


@router.put("/deposits/{deposit_id}")
async def update_deposit(
    deposit_id: int,
    updated: SavingDepositUpdate,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    deposit = db.get(SavingDeposit, deposit_id)
    if not deposit or deposit.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Deposit not found")

    if updated.amount is not None:
        diff = updated.amount - deposit.amount
        deposit.amount = updated.amount
        deposit.saving_goal.current_amount += diff

    if updated.description is not None:
        deposit.description = updated.description

    if updated.date is not None:
        deposit.date = updated.date

    db.commit()
    db.refresh(deposit)
    return {"message": "Deposit updated", "deposit": deposit}


@router.delete("/deposits/{deposit_id}")
async def delete_deposit(
    deposit_id: int,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    deposit = db.get(SavingDeposit, deposit_id)
    if not deposit or deposit.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Deposit not found")

    deposit.saving_goal.current_amount -= deposit.amount

    db.delete(deposit)
    db.commit()
    return {"message": "Deposit deleted"}