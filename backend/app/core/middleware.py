import time
import uuid
from typing import Dict, List, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.logging import logger


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Applies modern HTTP security headers to protect against XSS, clickjacking,
    MIME-sniffing, and other web vulnerabilities."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # Essential Web Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        
        # HSTS (enforce TLS in production environments)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Content Security Policy (allows local Vite dev server and Google fonts)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data:; "
            "connect-src 'self' http://localhost:* ws://localhost:*; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp

        return response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Sliding-window in-memory rate limiter to prevent brute force attacks and API flooding.
    
    Tiers:
    - Auth Tier (Login/Register/Refresh): 20 requests / 60 seconds
    - Heavy Compute Tier (RFQ Processing / Uploads / Eval Run): 40 requests / 60 seconds
    - Standard API Tier: 240 requests / 60 seconds
    """

    def __init__(self, app):
        super().__init__(app)
        # Structure: {ip_and_tier: [timestamp1, timestamp2, ...]}
        self._history: Dict[str, List[float]] = {}
        self._last_cleanup = time.time()

    def _cleanup_old_entries(self, now: float) -> None:
        """Periodically purges timestamps older than 60 seconds to prevent unbounded memory growth."""
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
        if path.startswith("/api/auth/login") or path.startswith("/api/auth/register") or path.startswith("/api/auth/refresh"):
            return "auth", 20
        if "/process" in path or path.endswith("/upload") or path.startswith("/api/evaluation/run"):
            return "compute", 40
        return "general", 240

    def _get_client_ip(self, request: Request) -> str:
        # Check standard reverse proxy headers
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next) -> Response:
        # Allow preflight OPTIONS requests without throttling
        if request.method == "OPTIONS":
            return await call_next(request)

        now = time.time()
        self._cleanup_old_entries(now)

        client_ip = self._get_client_ip(request)
        tier, limit = self._get_tier_and_limit(request.url.path)
        key = f"{client_ip}:{tier}"

        timestamps = self._history.setdefault(key, [])
        # Keep only timestamps within the last 60 seconds
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
    """Attaches a unique Request ID to each HTTP transaction for end-to-end tracing."""

    async def dispatch(self, request: Request, call_next) -> Response:
        req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        request.state.request_id = req_id
        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
