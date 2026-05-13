"""
Routes jalons Phase 2 — namespace /api/v1 (intentions + profil aligné contrats).

Idempotence : table SQLite `mutation_idempotency_v1` (même fichier que l'auth).
Miroir optionnel : Supabase `momentum_intentions_v1` si `SUPABASE_*` est défini.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from fastapi import FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, Field

from supabase_remote import mirror_intention_v1


class MutationEnvelopeV1(BaseModel):
    """Aligné sur contracts/mutationEnvelope.v1.js (Zod)."""

    clientMutationId: str = Field(..., min_length=1)
    intent: str = Field(..., min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)


def _idem_load(conn: sqlite3.Connection, user_id: str, client_mutation_id: str) -> dict[str, Any] | None:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT response_json FROM mutation_idempotency_v1
        WHERE user_id = ? AND client_mutation_id = ?
        """,
        (user_id, client_mutation_id),
    )
    row = cur.fetchone()
    if not row:
        return None
    return json.loads(row["response_json"])


def _idem_insert(conn: sqlite3.Connection, user_id: str, client_mutation_id: str, response: dict[str, Any], created_at: str) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO mutation_idempotency_v1 (user_id, client_mutation_id, response_json, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (user_id, client_mutation_id, json.dumps(response, separators=(",", ":"), ensure_ascii=False), created_at),
    )


def register_phase2_routes(
    app: FastAPI,
    get_user_from_access_token: Callable[[Optional[str]], Any],
    db_conn: Callable[[], sqlite3.Connection],
) -> None:
    """Enregistre les routes Phase 2 sur `app` (appelé depuis zlib_server après définition auth)."""

    @app.get("/api/v1/user-profile")
    async def api_v1_user_profile(authorization: Optional[str] = Header(default=None)):
        """
        Profil minimal aligné sur `contracts/userProfile.v1.js` (UserProfileV1Schema).
        Auth : même Bearer que GET /auth/me.
        """
        user = get_user_from_access_token(authorization)
        role = str(user["role"] or "user")
        if role not in ("user", "admin"):
            role = "user"
        return {
            "id": user["id"],
            "username": user["username"],
            "displayName": user["username"],
            "role": role,
            "updatedAt": user["updated_at"],
        }

    @app.post("/api/v1/intentions/mutation")
    async def api_v1_intentions_mutation(
        body: MutationEnvelopeV1,
        authorization: Optional[str] = Header(default=None),
    ):
        """
        Point d'entrée pilote « intention » avec clé d'idempotence (clientMutationId).
        Réponse stable pour un même (userId, clientMutationId) en base SQLite.
        """
        user = get_user_from_access_token(authorization)
        uid = str(user["id"])
        now_iso = datetime.now(timezone.utc).isoformat()

        out: dict[str, Any] = {
            "accepted": True,
            "clientMutationId": body.clientMutationId,
            "intent": body.intent,
            "userId": uid,
            "phase": 2,
            "note": "Stub métier ; idempotence SQLite ; miroir Supabase si configuré.",
        }

        conn = db_conn()
        try:
            existing = _idem_load(conn, uid, body.clientMutationId)
            if existing is not None:
                conn.rollback()
                return {**existing, "idempotentReplay": True}

            try:
                _idem_insert(conn, uid, body.clientMutationId, out, now_iso)
                conn.commit()
                await mirror_intention_v1(
                    uid,
                    body.clientMutationId,
                    body.intent,
                    dict(body.payload),
                    dict(out),
                )
                return out
            except sqlite3.IntegrityError:
                conn.rollback()
                existing2 = _idem_load(conn, uid, body.clientMutationId)
                if existing2 is not None:
                    return {**existing2, "idempotentReplay": True}
                raise HTTPException(status_code=409, detail="Conflit idempotence ; réessayez.")
        finally:
            conn.close()

    @app.get("/api/v1/intentions/recent")
    async def api_v1_intentions_recent(
        authorization: Optional[str] = Header(default=None),
        limit: int = Query(50, ge=1, le=200),
    ):
        """Dernières intentions enregistrées pour l'utilisateur (cache idempotence local)."""
        user = get_user_from_access_token(authorization)
        uid = str(user["id"])
        conn = db_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT client_mutation_id, response_json, created_at
                FROM mutation_idempotency_v1
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (uid, limit),
            )
            rows = cur.fetchall()
        finally:
            conn.close()
        items: list[dict[str, Any]] = []
        for row in rows:
            try:
                j = json.loads(row["response_json"])
            except json.JSONDecodeError:
                j = {}
            items.append(
                {
                    "clientMutationId": row["client_mutation_id"],
                    "intent": j.get("intent", ""),
                    "accepted": j.get("accepted"),
                    "createdAt": row["created_at"],
                }
            )
        return {"items": items}
