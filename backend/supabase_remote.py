"""
Miroir optionnel des intentions vers Supabase (PostgREST).
Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (uniquement serveur).
"""

from __future__ import annotations

import os
from typing import Any

import aiohttp

_LOG_PREFIX = "[supabase_remote]"


def supabase_url() -> str:
    return (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")


def supabase_service_role_key() -> str:
    return (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()


def is_supabase_configured() -> bool:
    return bool(supabase_url() and supabase_service_role_key())


async def ping_supabase() -> bool:
    """True si l’hôte Supabase répond (endpoint auth health). False sinon."""
    base = supabase_url()
    key = supabase_service_role_key()
    if not base or not key:
        return False
    url = f"{base}/auth/v1/health"
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    timeout = aiohttp.ClientTimeout(total=3.0)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=headers) as resp:
                return resp.status == 200
    except Exception as exc:
        print(f"{_LOG_PREFIX} ping échoué: {exc}", flush=True)
        return False


async def mirror_intention_v1(
    user_id: str,
    client_mutation_id: str,
    intent: str,
    payload: dict[str, Any],
    response_json: dict[str, Any],
) -> None:
    """Upsert logique : insert ; conflit unique ignoré (idempotence déjà gérée côté SQLite)."""
    if not is_supabase_configured():
        return
    base = supabase_url()
    key = supabase_service_role_key()
    url = f"{base}/rest/v1/momentum_intentions_v1"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    row = {
        "user_id": user_id,
        "client_mutation_id": client_mutation_id,
        "intent": intent,
        "payload": payload,
        "response_json": response_json,
    }
    timeout = aiohttp.ClientTimeout(total=8.0)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, headers=headers, json=[row]) as resp:
                if resp.status in (200, 201, 204):
                    return
                if resp.status == 409:
                    return
                text = await resp.text()
                print(
                    f"{_LOG_PREFIX} POST momentum_intentions_v1 status={resp.status} body={text[:500]}",
                    flush=True,
                )
    except Exception as exc:
        print(f"{_LOG_PREFIX} mirror échoué: {exc}", flush=True)
