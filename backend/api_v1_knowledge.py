"""
API v1 — Base de connaissances (catalogue central, admin write / users read).
Vidéos : fichiers sur Cloudflare R2 ; métadonnées SQLite knowledge_store.db.
"""

from __future__ import annotations

from typing import Any, Callable, Optional

from fastapi import Body, FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, Field

import knowledge_store as ks
import r2_storage as r2


def _require_user(get_user, authorization: Optional[str]):
    return get_user(authorization)


def _require_admin(user) -> None:
    if str(user["role"]) != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")


def _hidden_set(conn, user_id: str) -> set[str]:
    prefs = ks.get_user_prefs(conn, user_id)
    return set(prefs.get("hiddenCategoryIds") or [])


class CategoryCreateBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    color: Optional[str] = None


class VideoCreateBody(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    objectKey: str = Field(min_length=1)
    description: Optional[str] = None
    thumbnailKey: Optional[str] = None
    durationSec: Optional[int] = None
    categoryIds: list[str] = Field(default_factory=list)


class VideoUploadUrlBody(BaseModel):
    filename: str = ""
    contentType: str = "video/mp4"


class ArticleCreateBody(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    body: str = ""
    externalUrl: Optional[str] = None
    categoryIds: list[str] = Field(default_factory=list)


class ArticleUpdateBody(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    externalUrl: Optional[str] = None
    categoryIds: Optional[list[str]] = None


class NoteCreateBody(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    body: str = ""
    sourceUrls: list[str] = Field(default_factory=list)
    categoryIds: list[str] = Field(default_factory=list)


class NoteUpdateBody(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    sourceUrls: Optional[list[str]] = None
    categoryIds: Optional[list[str]] = None


class UserPrefsBody(BaseModel):
    hiddenCategoryIds: list[str] = Field(default_factory=list)


def register_knowledge_routes(
    app: FastAPI,
    get_user_from_access_token: Callable[[Optional[str]], Any],
    knowledge_db_conn: Callable[[], Any],
) -> None:
    """Enregistre les routes Base de connaissances."""

    @app.get("/api/v1/knowledge/status")
    def knowledge_status(
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        _require_user(get_user_from_access_token, authorization)
        return {
            "ok": True,
            "r2": r2.r2_status(),
        }

    @app.get("/api/v1/knowledge/categories")
    def list_categories(
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            return {"items": ks.list_categories(conn)}
        finally:
            conn.close()

    @app.post("/api/v1/knowledge/categories")
    def create_category(
        body: CategoryCreateBody,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            return ks.create_category(conn, body.name, body.color)
        finally:
            conn.close()

    @app.delete("/api/v1/knowledge/categories/{category_id}")
    def delete_category(
        category_id: str,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            ok = ks.delete_category(conn, category_id)
            if not ok:
                raise HTTPException(status_code=404, detail="Catégorie introuvable")
            return {"ok": True}
        finally:
            conn.close()

    @app.get("/api/v1/knowledge/videos")
    def list_videos(
        authorization: Optional[str] = Header(default=None),
        categoryId: Optional[str] = Query(default=None),
        search: Optional[str] = Query(default=None),
        offset: int = Query(default=0, ge=0),
        limit: int = Query(default=20, ge=1, le=50),
        applyHidden: bool = Query(default=True),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            hidden = _hidden_set(conn, str(user["id"])) if applyHidden else set()
            items, total = ks.list_videos(
                conn,
                category_id=categoryId,
                search=search,
                hidden_category_ids=hidden,
                offset=offset,
                limit=limit,
            )
            return {"items": items, "total": total, "offset": offset, "limit": limit}
        finally:
            conn.close()

    @app.get("/api/v1/knowledge/videos/{video_id}")
    def get_video(
        video_id: str,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            row = ks.get_video(conn, video_id)
            if not row:
                raise HTTPException(status_code=404, detail="Vidéo introuvable")
            return row
        finally:
            conn.close()

    @app.get("/api/v1/knowledge/videos/{video_id}/play-url")
    def video_play_url(
        video_id: str,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            row = ks.get_video(conn, video_id)
            if not row:
                raise HTTPException(status_code=404, detail="Vidéo introuvable")
            if not r2.is_r2_configured():
                raise HTTPException(status_code=503, detail="R2 non configuré")
            url = r2.create_presigned_download_url(row["r2_object_key"])
            thumb = None
            if row.get("thumbnail_key"):
                try:
                    thumb = r2.create_presigned_download_url(row["thumbnail_key"])
                except Exception:
                    thumb = None
            return {"playUrl": url, "thumbnailUrl": thumb}
        finally:
            conn.close()

    @app.post("/api/v1/knowledge/videos/upload-url")
    def video_upload_url(
        body: VideoUploadUrlBody,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        if not r2.is_r2_configured():
            raise HTTPException(status_code=503, detail="R2 non configuré")
        key = r2.new_video_object_key(body.filename)
        return r2.create_presigned_upload_url(key, content_type=body.contentType)

    @app.post("/api/v1/knowledge/videos")
    def create_video(
        body: VideoCreateBody,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            return ks.create_video(
                conn,
                title=body.title,
                r2_object_key=body.objectKey,
                description=body.description,
                thumbnail_key=body.thumbnailKey,
                duration_sec=body.durationSec,
                category_ids=body.categoryIds,
            )
        finally:
            conn.close()

    @app.delete("/api/v1/knowledge/videos/{video_id}")
    def delete_video(
        video_id: str,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            row = ks.delete_video(conn, video_id)
            if not row:
                raise HTTPException(status_code=404, detail="Vidéo introuvable")
            if r2.is_r2_configured():
                try:
                    r2.delete_object(row["r2_object_key"])
                    if row.get("thumbnail_key"):
                        r2.delete_object(row["thumbnail_key"])
                except Exception:
                    pass
            return {"ok": True}
        finally:
            conn.close()

    @app.get("/api/v1/knowledge/articles")
    def list_articles(
        authorization: Optional[str] = Header(default=None),
        categoryId: Optional[str] = Query(default=None),
        search: Optional[str] = Query(default=None),
        offset: int = Query(default=0, ge=0),
        limit: int = Query(default=20, ge=1, le=50),
        applyHidden: bool = Query(default=True),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            hidden = _hidden_set(conn, str(user["id"])) if applyHidden else set()
            items, total = ks.list_articles(
                conn,
                category_id=categoryId,
                search=search,
                hidden_category_ids=hidden,
                offset=offset,
                limit=limit,
            )
            return {"items": items, "total": total, "offset": offset, "limit": limit}
        finally:
            conn.close()

    @app.get("/api/v1/knowledge/articles/{article_id}")
    def get_article(
        article_id: str,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            row = ks.get_article(conn, article_id)
            if not row:
                raise HTTPException(status_code=404, detail="Article introuvable")
            return row
        finally:
            conn.close()

    @app.post("/api/v1/knowledge/articles")
    def create_article(
        body: ArticleCreateBody,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            return ks.create_article(
                conn,
                title=body.title,
                body=body.body,
                external_url=body.externalUrl,
                category_ids=body.categoryIds,
            )
        finally:
            conn.close()

    @app.patch("/api/v1/knowledge/articles/{article_id}")
    def update_article(
        article_id: str,
        body: ArticleUpdateBody,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            row = ks.update_article(
                conn,
                article_id,
                title=body.title,
                body=body.body,
                external_url=body.externalUrl,
                category_ids=body.categoryIds,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Article introuvable")
            return row
        finally:
            conn.close()

    @app.delete("/api/v1/knowledge/articles/{article_id}")
    def delete_article(
        article_id: str,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            ok = ks.delete_article(conn, article_id)
            if not ok:
                raise HTTPException(status_code=404, detail="Article introuvable")
            return {"ok": True}
        finally:
            conn.close()

    @app.get("/api/v1/knowledge/notes")
    def list_notes(
        authorization: Optional[str] = Header(default=None),
        categoryId: Optional[str] = Query(default=None),
        search: Optional[str] = Query(default=None),
        offset: int = Query(default=0, ge=0),
        limit: int = Query(default=20, ge=1, le=50),
        applyHidden: bool = Query(default=True),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            hidden = _hidden_set(conn, str(user["id"])) if applyHidden else set()
            items, total = ks.list_notes(
                conn,
                category_id=categoryId,
                search=search,
                hidden_category_ids=hidden,
                offset=offset,
                limit=limit,
            )
            return {"items": items, "total": total, "offset": offset, "limit": limit}
        finally:
            conn.close()

    @app.get("/api/v1/knowledge/notes/{note_id}")
    def get_note(
        note_id: str,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            row = ks.get_note(conn, note_id)
            if not row:
                raise HTTPException(status_code=404, detail="Note introuvable")
            return row
        finally:
            conn.close()

    @app.post("/api/v1/knowledge/notes")
    def create_note(
        body: NoteCreateBody,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            return ks.create_note(
                conn,
                title=body.title,
                body=body.body,
                source_urls=body.sourceUrls,
                category_ids=body.categoryIds,
            )
        finally:
            conn.close()

    @app.patch("/api/v1/knowledge/notes/{note_id}")
    def update_note(
        note_id: str,
        body: NoteUpdateBody,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            row = ks.update_note(
                conn,
                note_id,
                title=body.title,
                body=body.body,
                source_urls=body.sourceUrls,
                category_ids=body.categoryIds,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Note introuvable")
            return row
        finally:
            conn.close()

    @app.delete("/api/v1/knowledge/notes/{note_id}")
    def delete_note(
        note_id: str,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        _require_admin(user)
        conn = knowledge_db_conn()
        try:
            ok = ks.delete_note(conn, note_id)
            if not ok:
                raise HTTPException(status_code=404, detail="Note introuvable")
            return {"ok": True}
        finally:
            conn.close()

    @app.get("/api/v1/knowledge/user-prefs")
    def get_user_prefs(
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            return ks.get_user_prefs(conn, str(user["id"]))
        finally:
            conn.close()

    @app.put("/api/v1/knowledge/user-prefs")
    def put_user_prefs(
        body: UserPrefsBody,
        authorization: Optional[str] = Header(default=None),
    ) -> dict[str, Any]:
        user = _require_user(get_user_from_access_token, authorization)
        conn = knowledge_db_conn()
        try:
            return ks.set_user_prefs(conn, str(user["id"]), body.hiddenCategoryIds)
        finally:
            conn.close()
