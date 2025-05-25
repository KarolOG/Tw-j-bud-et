from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, extract
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db import db_dependency
from app.api.auth import verify_token
from app.dbmodels import Transaction, Category, CategoryType

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/balance")
async def get_balance(
    db: db_dependency,
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(verify_token)
):
    stmt = select(
        Category.type,
        func.sum(Transaction.amount)
    ).join(Category).where(Transaction.user_id == current_user["id"])

    if year:
        stmt = stmt.where(extract("year", Transaction.date) == year)
    if month:
        stmt = stmt.where(extract("month", Transaction.date) == month)

    stmt = stmt.group_by(Category.type)
    result = db.execute(stmt).all()

    income = sum(row[1] for row in result if row[0] == CategoryType.income)
    expense = sum(row[1] for row in result if row[0] == CategoryType.expense)

    return {
        "income": income,
        "expense": expense,
        "balance": income - expense
    }


@router.get("/monthly-averages")
async def get_monthly_averages(
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    stmt = select(
        extract("year", Transaction.date).label("year"),
        extract("month", Transaction.date).label("month"),
        Category.type,
        func.sum(Transaction.amount).label("total")
    ).join(Category).where(Transaction.user_id == current_user["id"]).group_by(
        "year", "month", Category.type
    )

    results = db.execute(stmt).all()

    monthly_data = {}
    for year, month, type_, total in results:
        key = f"{int(year)}-{int(month):02d}"
        if key not in monthly_data:
            monthly_data[key] = {"income": 0, "expense": 0}
        monthly_data[key][type_.value] = total

    return monthly_data


@router.get("/expenses-by-category")
async def expenses_by_category(
    db: db_dependency,
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(verify_token)
):
    stmt = select(
        Category.name,
        func.sum(Transaction.amount)
    ).join(Category).where(
        Transaction.user_id == current_user["id"],
        Category.type == CategoryType.expense
    )

    if year:
        stmt = stmt.where(extract("year", Transaction.date) == year)
    if month:
        stmt = stmt.where(extract("month", Transaction.date) == month)

    stmt = stmt.group_by(Category.name)
    results = db.execute(stmt).all()

    return [{"category": name, "amount": amount} for name, amount in results]


@router.get("/balance-over-time")
async def balance_over_time(
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    stmt = select(
        extract("year", Transaction.date).label("year"),
        extract("month", Transaction.date).label("month"),
        Category.type,
        func.sum(Transaction.amount)
    ).join(Category).where(
        Transaction.user_id == current_user["id"]
    ).group_by("year", "month", Category.type)

    results = db.execute(stmt).all()

    timeline = {}
    for year, month, type_, total in results:
        key = f"{int(year)}-{int(month):02d}"
        if key not in timeline:
            timeline[key] = {"income": 0, "expense": 0}
        timeline[key][type_.value] += total

    history = []
    cumulative_balance = 0
    for period in sorted(timeline.keys()):
        income = timeline[period].get("income", 0)
        expense = timeline[period].get("expense", 0)
        balance = income - expense
        cumulative_balance += balance
        history.append({
            "period": period,
            "income": income,
            "expense": expense,
            "balance": balance,
            "cumulative_balance": cumulative_balance
        })

    return history
