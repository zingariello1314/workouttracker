"""
Cloudflare R2 (API S3-compatible) — stockage vidéos Base de connaissances uniquement.
Variables : R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
Optionnel : R2_PUBLIC_BASE_URL (domaine custom pour lecture publique)
"""

from __future__ import annotations

import os
import uuid
from typing import Any, Optional

_CLIENT = None


def is_r2_configured() -> bool:
    return bool(
        (os.getenv("R2_ACCOUNT_ID") or "").strip()
        and (os.getenv("R2_ACCESS_KEY_ID") or "").strip()
        and (os.getenv("R2_SECRET_ACCESS_KEY") or "").strip()
        and (os.getenv("R2_BUCKET_NAME") or "").strip()
    )


def r2_endpoint() -> str:
    account = (os.getenv("R2_ACCOUNT_ID") or "").strip()
    return f"https://{account}.r2.cloudflarestorage.com"


def r2_bucket() -> str:
    return (os.getenv("R2_BUCKET_NAME") or "").strip()


def _get_client():
    global _CLIENT
    if _CLIENT is not None:
        return _CLIENT
    if not is_r2_configured():
        raise RuntimeError(
            "R2 non configuré. Définir R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, "
            "R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME dans .env"
        )
    import boto3

    _CLIENT = boto3.client(
        "s3",
        endpoint_url=r2_endpoint(),
        aws_access_key_id=(os.getenv("R2_ACCESS_KEY_ID") or "").strip(),
        aws_secret_access_key=(os.getenv("R2_SECRET_ACCESS_KEY") or "").strip(),
        region_name="auto",
    )
    return _CLIENT


def new_video_object_key(filename: str = "") -> str:
    ext = ""
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()[:8]
    suffix = f".{ext}" if ext in ("mp4", "webm", "mov", "m4v") else ".mp4"
    return f"videos/{uuid.uuid4().hex}{suffix}"


def new_thumbnail_object_key() -> str:
    return f"thumbnails/{uuid.uuid4().hex}.jpg"


def create_presigned_upload_url(
    object_key: str,
    *,
    content_type: str = "video/mp4",
    expires_sec: int = 3600,
) -> dict[str, Any]:
    client = _get_client()
    url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": r2_bucket(),
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_sec,
        HttpMethod="PUT",
    )
    return {"uploadUrl": url, "objectKey": object_key, "expiresIn": expires_sec}


def create_presigned_download_url(object_key: str, *, expires_sec: int = 7200) -> str:
    public_base = (os.getenv("R2_PUBLIC_BASE_URL") or "").strip().rstrip("/")
    if public_base:
        return f"{public_base}/{object_key.lstrip('/')}"
    client = _get_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": r2_bucket(), "Key": object_key},
        ExpiresIn=expires_sec,
        HttpMethod="GET",
    )


def delete_object(object_key: str) -> None:
    if not object_key:
        return
    client = _get_client()
    client.delete_object(Bucket=r2_bucket(), Key=object_key)


def r2_status() -> dict[str, Any]:
    return {
        "configured": is_r2_configured(),
        "bucket": r2_bucket() if is_r2_configured() else None,
        "hasPublicBaseUrl": bool((os.getenv("R2_PUBLIC_BASE_URL") or "").strip()),
    }
