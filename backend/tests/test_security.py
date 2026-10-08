import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.file_utils import sanitize_filename, save_uploaded_file, MAX_FILE_SIZE_BYTES
from app.db.session import SessionLocal
from app.db.models import User
from app.core.security import hash_password, create_access_token
from fastapi import HTTPException

client = TestClient(app)


def test_security_headers_present():
    """Verify that essential HTTP security headers and Request ID are present."""
    response = client.get("/api/health")
    assert response.status_code == 200
    
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Content-Security-Policy" in headers
    assert "Strict-Transport-Security" in headers
    assert "X-Request-ID" in headers
    assert "X-RateLimit-Limit" in headers


def test_path_traversal_prevention_in_filenames():
    """Verify that path traversal characters in filenames are sanitized."""
    traversal_name = "../../../etc/passwd.pdf"
    cleaned = sanitize_filename(traversal_name)
    assert "/" not in cleaned
    assert "\\" not in cleaned
    assert ".." not in cleaned
    assert cleaned.endswith(".pdf")


def test_unsupported_file_extension_rejected():
    """Verify that dangerous executables or scripts are rejected."""
    with pytest.raises(HTTPException) as exc_info:
        sanitize_filename("malicious_script.exe")
    assert exc_info.value.status_code == 400

    with pytest.raises(HTTPException) as exc_info:
        sanitize_filename("shell.sh")
    assert exc_info.value.status_code == 400


def test_payload_size_limit():
    """Verify that file size exceeding MAX_FILE_SIZE_BYTES is rejected."""
    oversized_data = b"0" * (MAX_FILE_SIZE_BYTES + 10)
    with pytest.raises(HTTPException) as exc_info:
        save_uploaded_file(oversized_data, "large.pdf")
    assert exc_info.value.status_code == 413


def test_auth_email_validation():
    """Verify that invalid email formats are caught by schema validation."""
    response = client.post("/api/auth/login", json={"email": "not-an-email", "password": "pass"})
    assert response.status_code == 422


def test_csrf_origin_check():
    """Verify that state-changing requests with an unauthorized Origin header are rejected."""
    response = client.post(
        "/api/auth/logout",
        headers={"Origin": "https://attacker-malicious-site.com"}
    )
    assert response.status_code == 403
    assert "CSRF" in response.json()["detail"]


def test_enumeration_protection_on_register():
    """Verify that registering an already registered email does not leak account existence."""
    # sales.manager@vertexind.com is the seeded account
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Another User",
            "email": "sales.manager@vertexind.com",
            "password": "SecurePassword123!"
        }
    )
    assert response.status_code == 200 or response.status_code == 201
    assert "verification code" in response.json()["message"].lower()


def test_short_password_rejected():
    """Verify that passwords under 8 characters are rejected."""
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Short Pw",
            "email": "shortpw@vertexind.com",
            "password": "123"
        }
    )
    assert response.status_code == 422


def test_logout_token_revocation():
    """Verify that logging out revokes the access token server-side."""
    db = SessionLocal()
    user = db.query(User).filter(User.email == "sales.manager@vertexind.com").first()
    db.close()
    assert user is not None

    # Login to obtain cookies
    login_res = client.post(
        "/api/auth/login",
        json={"email": "sales.manager@vertexind.com", "password": "quoteguard123"}
    )
    assert login_res.status_code == 200

    # Fetch /me with session cookies
    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 200

    # Logout
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200

    # Subsequent /me without cookie or with revoked cookie must fail
    me_after = client.get("/api/auth/me")
    assert me_after.status_code == 401
