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


class SettingsSnapshotPutV1(BaseModel):
    """Corps `PUT /api/v1/settings/snapshot` — aligné sur contracts/settingsSnapshot.v1.js."""

    clientMutationId: str = Field(..., min_length=1)
    settings: dict[str, Any] = Field(default_factory=dict)


class WorkoutAggregatePutV1(BaseModel):
    """Corps `PUT /api/v1/workout/aggregate` — aligné sur contracts/workoutAggregateSnapshot.v1.js."""

    clientMutationId: str = Field(..., min_length=1)
    aggregate: dict[str, Any] = Field(default_factory=dict)


class SportProgramContextPutV1(BaseModel):
    """Corps `PUT /api/v1/sport/program-context` — aligné sur contracts/sportProgramContext.v1.js."""

    clientMutationId: str = Field(..., min_length=1)
    programs: list[dict[str, Any]] = Field(default_factory=list)
    activeProgram: dict[str, Any] | None = None
    weekVariant: str = Field(default="A", min_length=1, max_length=8)
    isGymMode: bool = False


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

    @app.get("/api/v1/settings/snapshot")
    async def api_v1_settings_snapshot_get(authorization: Optional[str] = Header(default=None)):
        """
        Pilote « Settings » Phase 2 : lecture d’un snapshot JSON par utilisateur (SQLite `user_cloud_settings_v1`).
        """
        user = get_user_from_access_token(authorization)
        uid = str(user["id"])
        conn = db_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT payload_json, updated_at FROM user_cloud_settings_v1 WHERE user_id = ?",
                (uid,),
            )
            row = cur.fetchone()
            if not row:
                return {"settings": {}, "updatedAt": None}
            try:
                settings = json.loads(row["payload_json"])
            except json.JSONDecodeError:
                settings = {}
            if not isinstance(settings, dict):
                settings = {}
            return {"settings": settings, "updatedAt": row["updated_at"]}
        finally:
            conn.close()

    @app.put("/api/v1/settings/snapshot")
    async def api_v1_settings_snapshot_put(
        body: SettingsSnapshotPutV1,
        authorization: Optional[str] = Header(default=None),
    ):
        """
        Pilote « Settings » Phase 2 : écriture LWW + idempotence `(userId, clientMutationId)` (même table que intentions).
        """
        user = get_user_from_access_token(authorization)
        uid = str(user["id"])
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = db_conn()
        try:
            existing = _idem_load(conn, uid, body.clientMutationId)
            if existing is not None:
                conn.rollback()
                return {**existing, "idempotentReplay": True}

            payload_json = json.dumps(dict(body.settings), separators=(",", ":"), ensure_ascii=False)
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO user_cloud_settings_v1 (user_id, payload_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                  payload_json = excluded.payload_json,
                  updated_at = excluded.updated_at
                """,
                (uid, payload_json, now_iso),
            )

            out: dict[str, Any] = {
                "accepted": True,
                "clientMutationId": body.clientMutationId,
                "updatedAt": now_iso,
                "settings": dict(body.settings),
                "phase": 2,
                "note": "Settings snapshot (pilote Phase 2) ; idempotence SQLite.",
            }
            try:
                _idem_insert(conn, uid, body.clientMutationId, out, now_iso)
                conn.commit()
                return out
            except sqlite3.IntegrityError:
                conn.rollback()
                existing2 = _idem_load(conn, uid, body.clientMutationId)
                if existing2 is not None:
                    return {**existing2, "idempotentReplay": True}
                raise HTTPException(status_code=409, detail="Conflit idempotence ; réessayez.")
        finally:
            conn.close()

    @app.get("/api/v1/sport/program-context")
    async def api_v1_sport_program_context_get(authorization: Optional[str] = Header(default=None)):
        """
        Pilote « Sport » : lecture du contexte programmes (SQLite `user_sport_program_context_v1`).
        """
        user = get_user_from_access_token(authorization)
        uid = str(user["id"])
        conn = db_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT payload_json, updated_at FROM user_sport_program_context_v1 WHERE user_id = ?",
                (uid,),
            )
            row = cur.fetchone()
            if not row:
                return {
                    "programs": [],
                    "activeProgram": None,
                    "weekVariant": "A",
                    "isGymMode": False,
                    "updatedAt": None,
                }
            try:
                blob = json.loads(row["payload_json"])
            except json.JSONDecodeError:
                blob = {}
            if not isinstance(blob, dict):
                blob = {}
            programs = blob.get("programs")
            if not isinstance(programs, list):
                programs = []
            programs = [p for p in programs if isinstance(p, dict)]
            ap = blob.get("activeProgram")
            active_program = ap if isinstance(ap, dict) else None
            wv = blob.get("weekVariant")
            week_variant = wv if isinstance(wv, str) and wv else "A"
            week_variant = week_variant[:8]
            gm = blob.get("isGymMode")
            is_gym = bool(gm) if isinstance(gm, bool) else False
            return {
                "programs": programs,
                "activeProgram": active_program,
                "weekVariant": week_variant,
                "isGymMode": is_gym,
                "updatedAt": row["updated_at"],
            }
        finally:
            conn.close()

    @app.put("/api/v1/sport/program-context")
    async def api_v1_sport_program_context_put(
        body: SportProgramContextPutV1,
        authorization: Optional[str] = Header(default=None),
    ):
        """
        Pilote « Sport » : écriture LWW + idempotence `(userId, clientMutationId)`.
        """
        user = get_user_from_access_token(authorization)
        uid = str(user["id"])
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = db_conn()
        try:
            existing = _idem_load(conn, uid, body.clientMutationId)
            if existing is not None:
                conn.rollback()
                return {**existing, "idempotentReplay": True}

            envelope = {
                "programs": list(body.programs),
                "activeProgram": dict(body.activeProgram) if body.activeProgram is not None else None,
                "weekVariant": body.weekVariant,
                "isGymMode": body.isGymMode,
            }
            payload_json = json.dumps(envelope, separators=(",", ":"), ensure_ascii=False)
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO user_sport_program_context_v1 (user_id, payload_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                  payload_json = excluded.payload_json,
                  updated_at = excluded.updated_at
                """,
                (uid, payload_json, now_iso),
            )

            out: dict[str, Any] = {
                "accepted": True,
                "clientMutationId": body.clientMutationId,
                "updatedAt": now_iso,
                "programs": envelope["programs"],
                "activeProgram": envelope["activeProgram"],
                "weekVariant": envelope["weekVariant"],
                "isGymMode": envelope["isGymMode"],
                "phase": 2,
                "note": "Sport program context (pilote) ; idempotence SQLite.",
            }
            try:
                _idem_insert(conn, uid, body.clientMutationId, out, now_iso)
                conn.commit()
                return out
            except sqlite3.IntegrityError:
                conn.rollback()
                existing2 = _idem_load(conn, uid, body.clientMutationId)
                if existing2 is not None:
                    return {**existing2, "idempotentReplay": True}
                raise HTTPException(status_code=409, detail="Conflit idempotence ; réessayez.")
        finally:
            conn.close()

    @app.get("/api/v1/workout/aggregate")
    async def api_v1_workout_aggregate_get(authorization: Optional[str] = Header(default=None)):
        """
        Pilote « workout » : lecture snapshot agrégat — SQLite `user_workout_aggregate_v1`.
        """
        user = get_user_from_access_token(authorization)
        uid = str(user["id"])
        conn = db_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT payload_json, updated_at FROM user_workout_aggregate_v1 WHERE user_id = ?",
                (uid,),
            )
            row = cur.fetchone()
            if not row:
                return {"aggregate": {}, "updatedAt": None}
            try:
                blob = json.loads(row["payload_json"])
            except json.JSONDecodeError:
                blob = {}
            if not isinstance(blob, dict):
                blob = {}
            agg = blob.get("aggregate")
            if not isinstance(agg, dict):
                agg = {}
            return {"aggregate": agg, "updatedAt": row["updated_at"]}
        finally:
            conn.close()

    @app.put("/api/v1/workout/aggregate")
    async def api_v1_workout_aggregate_put(
        body: WorkoutAggregatePutV1,
        authorization: Optional[str] = Header(default=None),
    ):
        """
        Pilote « workout » : écriture LWW snapshot agrégat + idempotence `(userId, clientMutationId)`.
        """
        user = get_user_from_access_token(authorization)
        uid = str(user["id"])
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = db_conn()
        try:
            existing = _idem_load(conn, uid, body.clientMutationId)
            if existing is not None:
                conn.rollback()
                return {**existing, "idempotentReplay": True}

            envelope = {"aggregate": dict(body.aggregate)}
            payload_json = json.dumps(envelope, separators=(",", ":"), ensure_ascii=False)
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO user_workout_aggregate_v1 (user_id, payload_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                  payload_json = excluded.payload_json,
                  updated_at = excluded.updated_at
                """,
                (uid, payload_json, now_iso),
            )

            out: dict[str, Any] = {
                "accepted": True,
                "clientMutationId": body.clientMutationId,
                "updatedAt": now_iso,
                "aggregate": dict(body.aggregate),
                "phase": 2,
                "note": "Workout aggregate snapshot (pilote) ; idempotence SQLite.",
            }
            try:
                _idem_insert(conn, uid, body.clientMutationId, out, now_iso)
                conn.commit()
                return out
            except sqlite3.IntegrityError:
                conn.rollback()
                existing2 = _idem_load(conn, uid, body.clientMutationId)
                if existing2 is not None:
                    return {**existing2, "idempotentReplay": True}
                raise HTTPException(status_code=409, detail="Conflit idempotence ; réessayez.")
        finally:
            conn.close()
