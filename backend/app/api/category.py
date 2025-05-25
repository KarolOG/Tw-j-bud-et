from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import db_dependency
from app.api.auth import verify_token
from app.dbmodels import Category, CategoryType, User
from pydantic import BaseModel
from enum import Enum as PyEnum

router = APIRouter(
    prefix="/category",
    tags=["Category"]
)


class CategoryTypeEnum(str, PyEnum):
    income = "income"
    expense = "expense"


class CategoryCreate(BaseModel):
    name: str
    type: CategoryTypeEnum

class CategoryUpdate(BaseModel):
    name: Optional[str]
    type: Optional[CategoryTypeEnum]

class CategoryOut(BaseModel):
    id: int
    name: str
    type: CategoryTypeEnum

    class Config:
        orm_mode = True


@router.post("/", response_model=CategoryOut)
async def create_category(
    new_cat: CategoryCreate,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    category = Category(
        name=new_cat.name,
        type=new_cat.type,
        user_id=current_user["id"]
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/", response_model=List[CategoryOut])
async def get_user_categories(
    db: db_dependency,
    type: Optional[CategoryTypeEnum] = None,
    current_user: dict = Depends(verify_token)
):
    stmt = select(Category).where(Category.user_id == current_user["id"])
    if type:
        stmt = stmt.where(Category.type == type)
    categories = db.execute(stmt).scalars().all()
    return categories


@router.get("/{category_id}", response_model=CategoryOut)
async def get_category(
    category_id: int,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    category = db.get(Category, category_id)
    if not category or category.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}")
async def update_category(
    category_id: int,
    updated: CategoryUpdate,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    category = db.get(Category, category_id)
    if not category or category.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Category not found")

    if updated.name:
        category.name = updated.name
    if updated.type:
        category.type = updated.type

    db.commit()
    db.refresh(category)
    return {"message": "Category updated", "category": category}


@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: db_dependency,
    current_user: dict = Depends(verify_token)
):
    category = db.get(Category, category_id)
    if not category or category.user_id != current_user["id"]:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}
