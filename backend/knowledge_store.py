"""
Catalogue Base de connaissances — métadonnées SQLite (séparé de auth_server.db / workout).
Contenu partagé : admin écrit, utilisateurs connectés lisent.
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

_DB_PATH = Path(__file__).resolve().parent / "knowledge_store.db"


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def db_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_knowledge_db() -> None:
    conn = db_conn()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS knowledge_categories (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              slug TEXT NOT NULL UNIQUE,
              color TEXT,
              sort_order INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS knowledge_videos (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              r2_object_key TEXT NOT NULL,
              thumbnail_key TEXT,
              duration_sec INTEGER,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS knowledge_video_categories (
              video_id TEXT NOT NULL,
              category_id TEXT NOT NULL,
              PRIMARY KEY (video_id, category_id),
              FOREIGN KEY (video_id) REFERENCES knowledge_videos(id) ON DELETE CASCADE,
              FOREIGN KEY (category_id) REFERENCES knowledge_categories(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS knowledge_articles (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              body TEXT NOT NULL DEFAULT '',
              external_url TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS knowledge_article_categories (
              article_id TEXT NOT NULL,
              category_id TEXT NOT NULL,
              PRIMARY KEY (article_id, category_id),
              FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE,
              FOREIGN KEY (category_id) REFERENCES knowledge_categories(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS knowledge_notes (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              body TEXT NOT NULL DEFAULT '',
              source_urls TEXT NOT NULL DEFAULT '[]',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS knowledge_note_categories (
              note_id TEXT NOT NULL,
              category_id TEXT NOT NULL,
              PRIMARY KEY (note_id, category_id),
              FOREIGN KEY (note_id) REFERENCES knowledge_notes(id) ON DELETE CASCADE,
              FOREIGN KEY (category_id) REFERENCES knowledge_categories(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS knowledge_user_prefs (
              user_id TEXT PRIMARY KEY,
              hidden_category_ids TEXT NOT NULL DEFAULT '[]',
              updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_videos_created ON knowledge_videos(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_articles_created ON knowledge_articles(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_notes_created ON knowledge_notes(created_at DESC);
            """
        )
        conn.commit()
    finally:
        conn.close()


def _slugify(name: str) -> str:
    import re

    s = name.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "categorie"


def _category_ids_for(conn: sqlite3.Connection, table: str, item_col: str, item_id: str) -> list[str]:
    rows = conn.execute(
        f"SELECT category_id FROM {table} WHERE {item_col} = ?",
        (item_id,),
    ).fetchall()
    return [str(r["category_id"]) for r in rows]


def list_categories(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT * FROM knowledge_categories ORDER BY sort_order ASC, name ASC"
    ).fetchall()
    return [dict(r) for r in rows]


def create_category(conn: sqlite3.Connection, name: str, color: Optional[str] = None) -> dict[str, Any]:
    cid = _new_id("cat")
    now = _utc_now()
    slug_base = _slugify(name)
    slug = slug_base
    n = 1
    while conn.execute("SELECT 1 FROM knowledge_categories WHERE slug = ?", (slug,)).fetchone():
        n += 1
        slug = f"{slug_base}-{n}"
    conn.execute(
        "INSERT INTO knowledge_categories (id, name, slug, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (cid, name.strip(), slug, color, 0, now),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM knowledge_categories WHERE id = ?", (cid,)).fetchone()
    return dict(row)


def delete_category(conn: sqlite3.Connection, category_id: str) -> bool:
    cur = conn.execute("DELETE FROM knowledge_categories WHERE id = ?", (category_id,))
    conn.commit()
    return cur.rowcount > 0


def _apply_hidden_categories(
    category_ids: list[str], hidden: set[str]
) -> list[str]:
    return [c for c in category_ids if c not in hidden]


def list_videos(
    conn: sqlite3.Connection,
    *,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    hidden_category_ids: Optional[set[str]] = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict[str, Any]], int]:
    hidden = hidden_category_ids or set()
    params: list[Any] = []
    where: list[str] = []

    if category_id:
        where.append(
            "v.id IN (SELECT video_id FROM knowledge_video_categories WHERE category_id = ?)"
        )
        params.append(category_id)
    elif hidden:
        placeholders = ",".join("?" * len(hidden))
        where.append(
            f"""v.id NOT IN (
              SELECT vc.video_id FROM knowledge_video_categories vc
              WHERE vc.category_id IN ({placeholders})
            )"""
        )
        params.extend(list(hidden))

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        where.append("(LOWER(v.title) LIKE ? OR LOWER(COALESCE(v.description, '')) LIKE ?)")
        params.extend([q, q])

    clause = f"WHERE {' AND '.join(where)}" if where else ""
    total = conn.execute(
        f"SELECT COUNT(*) AS c FROM knowledge_videos v {clause}",
        params,
    ).fetchone()["c"]

    rows = conn.execute(
        f"""
        SELECT v.* FROM knowledge_videos v
        {clause}
        ORDER BY v.created_at DESC
        LIMIT ? OFFSET ?
        """,
        [*params, limit, offset],
    ).fetchall()

    out = []
    for row in rows:
        item = dict(row)
        cats = _category_ids_for(conn, "knowledge_video_categories", "video_id", item["id"])
        item["categoryIds"] = _apply_hidden_categories(cats, hidden)
        out.append(item)
    return out, int(total)


def get_video(conn: sqlite3.Connection, video_id: str) -> Optional[dict[str, Any]]:
    row = conn.execute("SELECT * FROM knowledge_videos WHERE id = ?", (video_id,)).fetchone()
    if not row:
        return None
    item = dict(row)
    item["categoryIds"] = _category_ids_for(conn, "knowledge_video_categories", "video_id", video_id)
    return item


def create_video(
    conn: sqlite3.Connection,
    *,
    title: str,
    r2_object_key: str,
    description: Optional[str] = None,
    thumbnail_key: Optional[str] = None,
    duration_sec: Optional[int] = None,
    category_ids: Optional[list[str]] = None,
) -> dict[str, Any]:
    vid = _new_id("vid")
    now = _utc_now()
    conn.execute(
        """
        INSERT INTO knowledge_videos
          (id, title, description, r2_object_key, thumbnail_key, duration_sec, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (vid, title.strip(), description, r2_object_key, thumbnail_key, duration_sec, now, now),
    )
    for cid in category_ids or []:
        conn.execute(
            "INSERT OR IGNORE INTO knowledge_video_categories (video_id, category_id) VALUES (?, ?)",
            (vid, cid),
        )
    conn.commit()
    return get_video(conn, vid)  # type: ignore[return-value]


def update_video_categories(conn: sqlite3.Connection, video_id: str, category_ids: list[str]) -> None:
    conn.execute("DELETE FROM knowledge_video_categories WHERE video_id = ?", (video_id,))
    for cid in category_ids:
        conn.execute(
            "INSERT OR IGNORE INTO knowledge_video_categories (video_id, category_id) VALUES (?, ?)",
            (video_id, cid),
        )
    conn.commit()


def delete_video(conn: sqlite3.Connection, video_id: str) -> Optional[dict[str, Any]]:
    row = get_video(conn, video_id)
    if not row:
        return None
    conn.execute("DELETE FROM knowledge_videos WHERE id = ?", (video_id,))
    conn.commit()
    return row


def list_articles(
    conn: sqlite3.Connection,
    *,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    hidden_category_ids: Optional[set[str]] = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict[str, Any]], int]:
    hidden = hidden_category_ids or set()
    params: list[Any] = []
    where: list[str] = []

    if category_id:
        where.append(
            "a.id IN (SELECT article_id FROM knowledge_article_categories WHERE category_id = ?)"
        )
        params.append(category_id)
    elif hidden:
        placeholders = ",".join("?" * len(hidden))
        where.append(
            f"""a.id NOT IN (
              SELECT ac.article_id FROM knowledge_article_categories ac
              WHERE ac.category_id IN ({placeholders})
            )"""
        )
        params.extend(list(hidden))

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        where.append("(LOWER(a.title) LIKE ? OR LOWER(a.body) LIKE ?)")
        params.extend([q, q])

    clause = f"WHERE {' AND '.join(where)}" if where else ""
    total = conn.execute(
        f"SELECT COUNT(*) AS c FROM knowledge_articles a {clause}",
        params,
    ).fetchone()["c"]
    rows = conn.execute(
        f"""
        SELECT a.id, a.title, a.external_url, a.created_at, a.updated_at,
               substr(a.body, 1, 280) AS excerpt
        FROM knowledge_articles a
        {clause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
        """,
        [*params, limit, offset],
    ).fetchall()
    out = []
    for row in rows:
        item = dict(row)
        item["categoryIds"] = _category_ids_for(conn, "knowledge_article_categories", "article_id", item["id"])
        out.append(item)
    return out, int(total)


def get_article(conn: sqlite3.Connection, article_id: str) -> Optional[dict[str, Any]]:
    row = conn.execute("SELECT * FROM knowledge_articles WHERE id = ?", (article_id,)).fetchone()
    if not row:
        return None
    item = dict(row)
    item["categoryIds"] = _category_ids_for(conn, "knowledge_article_categories", "article_id", article_id)
    return item


def create_article(
    conn: sqlite3.Connection,
    *,
    title: str,
    body: str = "",
    external_url: Optional[str] = None,
    category_ids: Optional[list[str]] = None,
) -> dict[str, Any]:
    aid = _new_id("art")
    now = _utc_now()
    conn.execute(
        """
        INSERT INTO knowledge_articles (id, title, body, external_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (aid, title.strip(), body, external_url, now, now),
    )
    for cid in category_ids or []:
        conn.execute(
            "INSERT OR IGNORE INTO knowledge_article_categories (article_id, category_id) VALUES (?, ?)",
            (aid, cid),
        )
    conn.commit()
    return get_article(conn, aid)  # type: ignore[return-value]


def update_article(
    conn: sqlite3.Connection,
    article_id: str,
    *,
    title: Optional[str] = None,
    body: Optional[str] = None,
    external_url: Optional[str] = None,
    category_ids: Optional[list[str]] = None,
) -> Optional[dict[str, Any]]:
    row = get_article(conn, article_id)
    if not row:
        return None
    now = _utc_now()
    conn.execute(
        """
        UPDATE knowledge_articles
        SET title = ?, body = ?, external_url = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            title.strip() if title is not None else row["title"],
            body if body is not None else row["body"],
            external_url if external_url is not None else row["external_url"],
            now,
            article_id,
        ),
    )
    if category_ids is not None:
        conn.execute("DELETE FROM knowledge_article_categories WHERE article_id = ?", (article_id,))
        for cid in category_ids:
            conn.execute(
                "INSERT OR IGNORE INTO knowledge_article_categories (article_id, category_id) VALUES (?, ?)",
                (article_id, cid),
            )
    conn.commit()
    return get_article(conn, article_id)


def delete_article(conn: sqlite3.Connection, article_id: str) -> bool:
    cur = conn.execute("DELETE FROM knowledge_articles WHERE id = ?", (article_id,))
    conn.commit()
    return cur.rowcount > 0


def list_notes(
    conn: sqlite3.Connection,
    *,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    hidden_category_ids: Optional[set[str]] = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict[str, Any]], int]:
    hidden = hidden_category_ids or set()
    params: list[Any] = []
    where: list[str] = []

    if category_id:
        where.append(
            "n.id IN (SELECT note_id FROM knowledge_note_categories WHERE category_id = ?)"
        )
        params.append(category_id)
    elif hidden:
        placeholders = ",".join("?" * len(hidden))
        where.append(
            f"""n.id NOT IN (
              SELECT nc.note_id FROM knowledge_note_categories nc
              WHERE nc.category_id IN ({placeholders})
            )"""
        )
        params.extend(list(hidden))

    if search and search.strip():
        q = f"%{search.strip().lower()}%"
        where.append("(LOWER(n.title) LIKE ? OR LOWER(n.body) LIKE ?)")
        params.extend([q, q])

    clause = f"WHERE {' AND '.join(where)}" if where else ""
    total = conn.execute(
        f"SELECT COUNT(*) AS c FROM knowledge_notes n {clause}",
        params,
    ).fetchone()["c"]
    rows = conn.execute(
        f"""
        SELECT n.id, n.title, n.source_urls, n.created_at, n.updated_at,
               substr(n.body, 1, 280) AS excerpt
        FROM knowledge_notes n
        {clause}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
        """,
        [*params, limit, offset],
    ).fetchall()
    out = []
    for row in rows:
        item = dict(row)
        try:
            item["sourceUrls"] = json.loads(item.pop("source_urls") or "[]")
        except json.JSONDecodeError:
            item["sourceUrls"] = []
        item["categoryIds"] = _category_ids_for(conn, "knowledge_note_categories", "note_id", item["id"])
        out.append(item)
    return out, int(total)


def get_note(conn: sqlite3.Connection, note_id: str) -> Optional[dict[str, Any]]:
    row = conn.execute("SELECT * FROM knowledge_notes WHERE id = ?", (note_id,)).fetchone()
    if not row:
        return None
    item = dict(row)
    try:
        item["sourceUrls"] = json.loads(item.pop("source_urls") or "[]")
    except json.JSONDecodeError:
        item["sourceUrls"] = []
    item["categoryIds"] = _category_ids_for(conn, "knowledge_note_categories", "note_id", note_id)
    return item


def create_note(
    conn: sqlite3.Connection,
    *,
    title: str,
    body: str = "",
    source_urls: Optional[list[str]] = None,
    category_ids: Optional[list[str]] = None,
) -> dict[str, Any]:
    nid = _new_id("note")
    now = _utc_now()
    conn.execute(
        """
        INSERT INTO knowledge_notes (id, title, body, source_urls, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (nid, title.strip(), body, json.dumps(source_urls or []), now, now),
    )
    for cid in category_ids or []:
        conn.execute(
            "INSERT OR IGNORE INTO knowledge_note_categories (note_id, category_id) VALUES (?, ?)",
            (nid, cid),
        )
    conn.commit()
    return get_note(conn, nid)  # type: ignore[return-value]


def update_note(
    conn: sqlite3.Connection,
    note_id: str,
    *,
    title: Optional[str] = None,
    body: Optional[str] = None,
    source_urls: Optional[list[str]] = None,
    category_ids: Optional[list[str]] = None,
) -> Optional[dict[str, Any]]:
    row = get_note(conn, note_id)
    if not row:
        return None
    now = _utc_now()
    conn.execute(
        """
        UPDATE knowledge_notes
        SET title = ?, body = ?, source_urls = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            title.strip() if title is not None else row["title"],
            body if body is not None else row["body"],
            json.dumps(source_urls if source_urls is not None else row.get("sourceUrls", [])),
            now,
            note_id,
        ),
    )
    if category_ids is not None:
        conn.execute("DELETE FROM knowledge_note_categories WHERE note_id = ?", (note_id,))
        for cid in category_ids:
            conn.execute(
                "INSERT OR IGNORE INTO knowledge_note_categories (note_id, category_id) VALUES (?, ?)",
                (note_id, cid),
            )
    conn.commit()
    return get_note(conn, note_id)


def delete_note(conn: sqlite3.Connection, note_id: str) -> bool:
    cur = conn.execute("DELETE FROM knowledge_notes WHERE id = ?", (note_id,))
    conn.commit()
    return cur.rowcount > 0


def get_user_prefs(conn: sqlite3.Connection, user_id: str) -> dict[str, Any]:
    row = conn.execute(
        "SELECT * FROM knowledge_user_prefs WHERE user_id = ?", (user_id,)
    ).fetchone()
    if not row:
        return {"userId": user_id, "hiddenCategoryIds": []}
    try:
        hidden = json.loads(row["hidden_category_ids"] or "[]")
    except json.JSONDecodeError:
        hidden = []
    return {"userId": user_id, "hiddenCategoryIds": hidden}


def set_user_prefs(conn: sqlite3.Connection, user_id: str, hidden_category_ids: list[str]) -> dict[str, Any]:
    now = _utc_now()
    conn.execute(
        """
        INSERT INTO knowledge_user_prefs (user_id, hidden_category_ids, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          hidden_category_ids = excluded.hidden_category_ids,
          updated_at = excluded.updated_at
        """,
        (user_id, json.dumps(hidden_category_ids), now),
    )
    conn.commit()
    return get_user_prefs(conn, user_id)
