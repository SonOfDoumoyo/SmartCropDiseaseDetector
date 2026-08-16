import hashlib
import json
import os
from typing import Any

import redis.asyncio as redis


class RedisService:

    # ==========================================
    # Configuration
    # ==========================================

    REDIS_URL = os.getenv(
        "REDIS_URL",
        "redis://localhost:6379"
    )

    CACHE_TTL = int(
        os.getenv(
            "REDIS_CACHE_TTL",
            "3600"
        )
    )

    RATE_LIMIT = int(
        os.getenv(
            "RATE_LIMIT",
            "30"
        )
    )

    RATE_LIMIT_WINDOW = int(
        os.getenv(
            "RATE_LIMIT_WINDOW",
            "60"
        )
    )

    client = None

    # ==========================================
    # Connect
    # ==========================================

    @classmethod
    async def connect(cls):

        print("🔴 Connecting to Redis...")

        cls.client = redis.from_url(
            cls.REDIS_URL,
            decode_responses=True
        )

        # Test connection
        await cls.client.ping()

        print("✅ Redis connected.")

    # ==========================================
    # Disconnect
    # ==========================================

    @classmethod
    async def disconnect(cls):

        if cls.client:

            await cls.client.aclose()

            cls.client = None

            print("🔴 Redis disconnected.")

    # ==========================================
    # Make image hash
    # ==========================================

    @staticmethod
    def image_hash(image_bytes: bytes) -> str:

        return hashlib.sha256(
            image_bytes
        ).hexdigest()

    # ==========================================
    # Get cached prediction
    # ==========================================

    @classmethod
    async def get_cached(
        cls,
        image_hash: str
    ) -> dict[str, Any] | None:

        if cls.client is None:
            return None

        key = f"smartcrop:prediction:{image_hash}"

        cached = await cls.client.get(key)

        if cached is None:
            return None

        try:
            return json.loads(cached)

        except json.JSONDecodeError:

            # Delete corrupted cache entry
            await cls.client.delete(key)

            return None

    # ==========================================
    # Cache prediction
    # ==========================================

    @classmethod
    async def set_cached(
        cls,
        image_hash: str,
        result: dict[str, Any]
    ):

        if cls.client is None:
            return

        key = f"smartcrop:prediction:{image_hash}"

        await cls.client.set(
            key,
            json.dumps(result),
            ex=cls.CACHE_TTL
        )

    # ==========================================
    # Rate limiting
    # ==========================================

    @classmethod
    async def check_rate_limit(
        cls,
        client_ip: str
    ) -> bool:

        if cls.client is None:
            return True

        key = f"smartcrop:rate:{client_ip}"

        current = await cls.client.incr(key)

        # First request
        if current == 1:

            await cls.client.expire(
                key,
                cls.RATE_LIMIT_WINDOW
            )

        return current <= cls.RATE_LIMIT

    # ==========================================
    # Clear prediction cache
    # ==========================================

    @classmethod
    async def clear_cache(cls):

        if cls.client is None:
            return

        keys = []

        async for key in cls.client.scan_iter(
            match="smartcrop:prediction:*"
        ):
            keys.append(key)

        if keys:
            await cls.client.delete(*keys)

        print(
            f"🧹 Cleared {len(keys)} cached predictions."
        )