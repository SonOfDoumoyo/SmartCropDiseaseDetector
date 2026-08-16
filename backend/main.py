import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import predict
from app.services.model_service import ModelService
from app.services.redis_service import RedisService


load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Load AI model
    await ModelService.load()

    # Connect Redis
    await RedisService.connect()

    print("✅ Model loaded and Redis connected.")

    yield

    # Cleanup
    await RedisService.disconnect()


app = FastAPI(
    title="Smart Crop Disease Identification API",
    version="1.0.0",
    lifespan=lifespan
)


origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173"
).split(",")


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    predict.router,
    prefix="/api"
)


@app.get("/")
async def root():

    return {
        "status": "ok",
        "message": "Smart Crop Disease Identification API is running."
    }


@app.get("/health")
async def health():

    return {
        "status": "healthy"
    }