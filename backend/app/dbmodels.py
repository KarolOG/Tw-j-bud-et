from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase
from sqlalchemy import String, Integer, LargeBinary, Boolean, ForeignKey, DateTime, Enum, Float
from app.db import Base
from typing import List, Optional
from enum import Enum as PyEnum


class CategoryType(str, PyEnum):
    income = "income"
    expense = "expense"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String)

    categories: Mapped[List["Category"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    savings_goals: Mapped[List["SavingsGoal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    saving_deposits: Mapped[List["SavingDeposit"]] = relationship(back_populates="user")



class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    type: Mapped[CategoryType] = mapped_column(Enum(CategoryType), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    user: Mapped["User"] = relationship(back_populates="categories")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="category")



class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[Optional[str]] = mapped_column(String)
    date: Mapped[DateTime] = mapped_column(DateTime)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    category: Mapped["Category"] = relationship(back_populates="transactions")
    user: Mapped["User"] = relationship(back_populates="transactions")



class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)
    target_amount: Mapped[float] = mapped_column(Float)
    current_amount: Mapped[float] = mapped_column(default=0.0)
    due_date: Mapped[DateTime] = mapped_column(DateTime, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    user: Mapped["User"] = relationship(back_populates="savings_goals")
    deposits: Mapped[List["SavingDeposit"]] = relationship(back_populates="saving_goal", cascade="all, delete-orphan")



class SavingDeposit(Base):
    __tablename__ = "saving_deposits"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(String, nullable=True)
    date: Mapped[DateTime] = mapped_column(DateTime)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    saving_goal_id: Mapped[int] = mapped_column(ForeignKey("savings_goals.id"))

    user: Mapped["User"] = relationship()
    saving_goal: Mapped["SavingsGoal"] = relationship(back_populates="deposits")