"""
Méta API Phase 2 — horloge serveur (sync / débogage).
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI


def register_meta_routes(app: FastAPI) -> None:
    @app.get("/api/v1/server-time")
    async def api_v1_server_time():
        """Heure UTC du serveur (ISO 8601). Aligné sur `contracts/serverTime.v1.js`."""
        return {"serverTime": datetime.now(timezone.utc).isoformat()}
