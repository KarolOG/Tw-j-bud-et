from fastapi import FastAPI
import app.api.user as APIuser
import app.api.category as APIcategory
import app.api.transaction as APItransaction
import app.api.reports as APIreports
import app.api.savings as APIsavings
from app.db import Base, engine
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
app.include_router(APIuser.router)
app.include_router(APIcategory.router)
app.include_router(APItransaction.router)
app.include_router(APIreports.router)
app.include_router(APIsavings.router)

Base.metadata.create_all(bind=engine)



origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "App is working"}