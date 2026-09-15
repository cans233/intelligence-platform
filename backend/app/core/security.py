import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from backend.app.core.config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    iterations = 240_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"pbkdf2_sha256${iterations}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode(),
            _unb64(salt),
            int(iterations),
        )
        return hmac.compare_digest(_b64(digest), expected)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: UUID) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_ttl_minutes)
    payload = {"sub": str(user_id), "exp": int(expires_at.timestamp())}
    encoded_payload = _b64(json.dumps(payload, separators=(",", ":")).encode())
    signature = hmac.new(
        settings.auth_secret.encode(),
        encoded_payload.encode(),
        hashlib.sha256,
    ).digest()
    return f"{encoded_payload}.{_b64(signature)}"


def decode_access_token(token: str) -> UUID | None:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        expected = hmac.new(
            settings.auth_secret.encode(),
            encoded_payload.encode(),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(_b64(expected), encoded_signature):
            return None
        payload = json.loads(_unb64(encoded_payload))
        if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            return None
        return UUID(payload["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
