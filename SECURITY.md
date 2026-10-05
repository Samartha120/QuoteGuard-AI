# Security Architecture & Policies

## Authentication Architecture
QuoteGuard AI uses a hybrid, cookie-based authentication system:
- **No LocalStorage:** Authentication tokens are never exposed to frontend JavaScript via `localStorage` or `sessionStorage`.
- **Secure Cookies:** Access and Refresh tokens are injected directly into the browser via `HttpOnly`, `Secure`, and `SameSite=Lax` cookies. 
- **Session Lifecycle:** `access_token` lives for 24 hours. `refresh_token` lives for 7 days on the `/api/auth/refresh` path. Logout deletes both cookies server-side.

## OTP Implementation
- **Registration Flow:** Users are first created in a `pending_users` database table.
- **Cryptographic Generation:** A true random 6-digit OTP is generated using Python's `secrets` module.
- **Hash at Rest:** OTPs are never stored in plaintext. They are hashed using `bcrypt` and verified identically to passwords.
- **Brute Force Protection:** OTPs expire strictly in 5 minutes and the entire pending record is wiped after 5 failed verification attempts.

## CORS Configuration
- **Development vs Production:** Development allows specific local origins (Vite/Next/FastAPI). Production must be configured via environment variables to tightly restrict origins.
- **Allowed Methods:** Global wildcard methods are restricted. Only `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]` are allowed.

## Security Headers
The FastAPI backend uses middleware to enforce strict HTTP security headers:
- `X-Content-Type-Options: nosniff` (Prevents MIME sniffing)
- `X-Frame-Options: DENY` (Prevents clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (Enforces HTTPS in production)
- `Content-Security-Policy` (Strict API profile, defaults to `none` and restricts frame-ancestors).

## Rate Limiting
- Hard limits are applied on OTP verification failures (max 5 attempts).

## Database Security
- **SQL Injection Prevention:** All queries use SQLAlchemy ORM parameterization. No dynamic SQL is executed.

## Vulnerability Reporting
For any security-related inquiries or vulnerability reports, please contact the repository administrators. Do NOT open public issues for security vulnerabilities.
