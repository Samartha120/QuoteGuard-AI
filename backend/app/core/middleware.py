import time
import uuid
from typing import Dict, List, Tuple
from urllib.parse import urlparse
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Applies modern HTTP security headers to protect against XSS, clickjacking,
    MIME-sniffing, cross-origin leaks, and framing."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # Baseline protective headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Content Security Policy: strict API profile, tailored for Swagger UI on docs
        path = request.url.path
        if path in ("/docs", "/redoc", f"{settings.API_V1_STR}/openapi.json"):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://fastapi.tiangolo.com; "
                "frame-ancestors 'none';"
            )
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'none'; "
                "base-uri 'none'; "
                "form-action 'none'; "
                "frame-ancestors 'none';"
            )

        return response


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Protects cookie-authenticated state-changing operations against CSRF.
    Validates Origin and Referer against allowed CORS origins on POST/PUT/PATCH/DELETE."""

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in self.SAFE_METHODS:
            return await call_next(request)

        # Check only state-changing API endpoints
        if not request.url.path.startswith(settings.API_V1_STR):
            return await call_next(request)

        # In dev or demo mode, allow requests without Origin/Referer if custom header is present
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        allowed_origins = set(settings.cors_origins)

        if origin:
            if origin not in allowed_origins:
                logger.warning(f"CSRF violation: Origin '{origin}' rejected.")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF validation failed: unauthorized origin."}
                )
        elif referer:
            parsed = urlparse(referer)
            referer_origin = f"{parsed.scheme}://{parsed.netloc}"
            if referer_origin not in allowed_origins:
                logger.warning(f"CSRF violation: Referer origin '{referer_origin}' rejected.")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF validation failed: unauthorized referer."}
                )

        return await call_next(request)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding-window in-memory rate limiter to prevent brute force attacks, credential stuffing,
    and API flooding.
    
    Tiers:
    - Auth Tier (Login/Register/OTP Verification): 5 requests / 60 seconds
    - Heavy Compute Tier (RFQ Processing / Uploads / Eval Run): 30 requests / 60 seconds
    - Standard API Tier: 120 requests / 60 seconds
    """

    def __init__(self, app):
        super().__init__(app)
        self._history: Dict[str, List[float]] = {}
        self._last_cleanup = time.time()

    def _cleanup_old_entries(self, now: float) -> None:
        if now - self._last_cleanup < 30.0:
            return
        self._last_cleanup = now
        stale_keys = []
        for key, timestamps in self._history.items():
            self._history[key] = [t for t in timestamps if now - t < 60.0]
            if not self._history[key]:
                stale_keys.append(key)
        for key in stale_keys:
            self._history.pop(key, None)

    def _get_tier_and_limit(self, path: str) -> Tuple[str, int]:
        if (
            path.startswith("/api/auth/login")
            or path.startswith("/api/auth/register")
            or path.startswith("/api/auth/verify")
        ):
            return "auth", 10  # 10 attempts per minute per IP for auth
        if "/process" in path or path.endswith("/upload") or path.startswith("/api/evaluation/run"):
            return "compute", 30
        return "general", 120

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        now = time.time()
        self._cleanup_old_entries(now)

        client_ip = self._get_client_ip(request)
        tier, limit = self._get_tier_and_limit(request.url.path)
        key = f"{client_ip}:{tier}"

        timestamps = self._history.setdefault(key, [])
        valid_timestamps = [t for t in timestamps if now - t < 60.0]
        self._history[key] = valid_timestamps

        if len(valid_timestamps) >= limit:
            oldest = valid_timestamps[0]
            retry_after = int(max(1, 60.0 - (now - oldest)))
            logger.warning(f"Rate limit exceeded for IP {client_ip} on tier '{tier}' (path: {request.url.path})")
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please slow down and try again later.",
                    "tier": tier,
                    "retry_after_seconds": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                }
            )

        valid_timestamps.append(now)
        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - len(valid_timestamps)))
        return response


class RequestTrackingMiddleware(BaseHTTPMiddleware):
    """Attaches a unique Request ID to each HTTP transaction for end-to-end tracing and auditing."""

    async def dispatch(self, request: Request, call_next) -> Response:
        req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        request.state.request_id = req_id
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
