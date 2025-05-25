from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.db import db_dependency
from app.dbmodels import User
from datetime import timedelta
from app.api.auth import pwd_context
from sqlalchemy.orm import Session
from sqlalchemy import Select, or_
from typing import Optional
import app.api.auth as auth
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(
    prefix='/user',
    tags=['Users']
)

class UserCreateBM(BaseModel):
    password: str
    email: str
    full_name: str

class UserUpdateBM(BaseModel):
    password: Optional[str] = None
    full_name: Optional[str] = None

def get_user(db: Session, email: str = None, id: int = None):
    filters = []

    if email:
        filters.append(User.email == email)
    if id:
        filters.append(User.id == id)

    if not filters:
        return None
    stmt = Select(User).where(or_(*filters))

    return db.execute(stmt).scalar_one_or_none()

def HTTPError(code: int, detail:str):
    return HTTPException(status_code=code, detail=detail)



@router.post("/register")
async def add_user(user: UserCreateBM, db: db_dependency):
    userdb = get_user(db=db, email=user.email)
    if userdb:
        raise HTTPError(400, "Email is already taken")
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        hashed_password = hashed_password,
        email = user.email,
        full_name = user.full_name
    )
    db.add(db_user)
    db.commit()
    return("User Created")


@router.post("/login")
def login(db: db_dependency, form_data: OAuth2PasswordRequestForm = Depends()):
    user = auth.authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPError(401, "Invalid user or password")
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email,
              "id": user.id},
        expires_delta = access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}



@router.get("/")
async def get_users(
    db: db_dependency,
    email: Optional[str] = None,
    current_user: dict = Depends(auth.verify_token)
    ):
    filters = []
    if email:
        filters.append(User.email == email)
    
    stmt = Select(User).where(*filters)
    users = db.execute(stmt).scalars().all()

    users_list = []
    for user in users:
        user_dict = user.__dict__.copy()
        user_dict.pop("hashed_password", None)
        
        users_list.append(user_dict)

    return users_list


@router.get("/me")
async def user_me(
    db: db_dependency, 
    current_user: dict = Depends(auth.verify_token)
):
    try:
        user = get_user(db=db,id=current_user.get("id"))
        if not user:
            raise HTTPError(404,"User does not exist")
        
        user_dict = user.__dict__.copy()
        user_dict.pop("hashed_password", None)

        return user_dict
    except Exception as e:
        raise HTTPError(500, f"Internal server error: {str(e)}")



@router.get("/{user_id}")
async def get_specific_user(
    user_id: int,
    db: db_dependency, 
    current_user: dict = Depends(auth.verify_token) 
):
    user = get_user(db=db, id=user_id)
    if not user:
        raise HTTPError(404,"User does not exist")
    
    user_dict = user.__dict__.copy()
    user_dict.pop("hashed_password", None)

    return user_dict



@router.put("/{user_id}")
async def get_specific_user(
    user_id: int,
    db: db_dependency,
    new_user: UserUpdateBM,
    current_user: dict = Depends(auth.verify_token),
):
    if current_user.get("id") != user_id:
        raise HTTPError(403, "Insufficient permissions")
    user = get_user(db=db,id=user_id)
    if not user:
        raise HTTPError(404, "User does not exist")
    if new_user.full_name:
        user.full_name = new_user.full_name
    if new_user.password:
        hashed_password = pwd_context.hash(new_user.password)
        user.hashed_password = hashed_password

    db.commit()
    db.refresh(user)
    return {"message": f"User {user.id} updated"}


@router.delete("/{user_id}")
async def user_delete(
    user_id: int,
    db: db_dependency,
    current_user: dict = Depends(auth.verify_token)
):
    if current_user.get("id") != user_id:
        raise HTTPError(403, "Insufficient permissions")
    user = get_user(db=db,id=user_id)
    if not user:
        raise HTTPError(404, "User does not exist")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
    
