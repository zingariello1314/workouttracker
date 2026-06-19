"""Tests unitaires — knowledge_store."""

import knowledge_store as ks


def test_category_and_video_crud(tmp_path, monkeypatch):
    db_file = tmp_path / "test_knowledge.db"
    monkeypatch.setattr(ks, "_DB_PATH", db_file)
    ks.init_knowledge_db()

    conn = ks.db_conn()
    try:
        cat = ks.create_category(conn, "Motivation", "#a78bfa")
        assert cat["name"] == "Motivation"

        video = ks.create_video(
            conn,
            title="Pliométrie",
            r2_object_key="videos/test.mp4",
            category_ids=[cat["id"]],
        )
        assert video["title"] == "Pliométrie"

        items, total = ks.list_videos(conn, category_id=cat["id"])
        assert total == 1
        assert items[0]["id"] == video["id"]

        deleted = ks.delete_video(conn, video["id"])
        assert deleted is not None
    finally:
        conn.close()


def test_user_hidden_categories_filter(tmp_path, monkeypatch):
    db_file = tmp_path / "test_knowledge2.db"
    monkeypatch.setattr(ks, "_DB_PATH", db_file)
    ks.init_knowledge_db()

    conn = ks.db_conn()
    try:
        cat_a = ks.create_category(conn, "Motivation")
        cat_b = ks.create_category(conn, "Technique")
        ks.create_video(conn, title="V1", r2_object_key="v1.mp4", category_ids=[cat_a["id"]])
        ks.create_video(conn, title="V2", r2_object_key="v2.mp4", category_ids=[cat_b["id"]])

        items, total = ks.list_videos(conn, hidden_category_ids={cat_a["id"]})
        assert total == 1
        assert items[0]["title"] == "V2"

        ks.set_user_prefs(conn, "user-1", [cat_b["id"]])
        prefs = ks.get_user_prefs(conn, "user-1")
        assert cat_b["id"] in prefs["hiddenCategoryIds"]
    finally:
        conn.close()
