import os

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.services.model_service import ModelService
from app.services.redis_service import RedisService


router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAX_MB = float(os.getenv("MAX_IMAGE_SIZE_MB", "10"))


@router.post("/predict")
async def predict(
    request: Request,
    file: UploadFile = File(...)
):
    # -----------------------------
    # 1. Rate limiting
    # -----------------------------
    client_ip = request.client.host if request.client else "unknown"

    allowed = await RedisService.check_rate_limit(client_ip)

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again in a minute."
        )

    # -----------------------------
    # 2. Validate file type
    # -----------------------------
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload a JPEG, PNG, or WebP image."
        )

    # -----------------------------
    # 3. Read image
    # -----------------------------
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty."
        )

    # -----------------------------
    # 4. Validate image size
    # -----------------------------
    size_mb = len(image_bytes) / (1024 * 1024)

    if size_mb > MAX_MB:
        raise HTTPException(
            status_code=413,
            detail=(
                f"Image size {size_mb:.1f} MB exceeds "
                f"the {MAX_MB:g} MB limit."
            )
        )

    # -----------------------------
    # 5. Check Redis cache
    # -----------------------------
    image_hash = RedisService.image_hash(image_bytes)

    cached = await RedisService.get_cached(image_hash)

    if cached:
        cached["from_cache"] = True
        return JSONResponse(content=cached)

    # -----------------------------
    # 6. Run AI prediction
    # -----------------------------
    try:
        result = ModelService.predict(image_bytes)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Could not process image: {str(e)}"
        )

    # -----------------------------
    # 7. Cache result
    # -----------------------------
    result["from_cache"] = False

    await RedisService.set_cached(
        image_hash,
        result
    )

    return JSONResponse(content=result)