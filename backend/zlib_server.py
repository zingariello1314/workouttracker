"""
Backend FastAPI pour BookFinder - Recherche et téléchargement via Z-Library.
Les identifiants Z-Library doivent être dans .env (ZLIB_EMAIL, ZLIB_PASSWORD).
Lancement : uvicorn zlib_server:app --reload --port 8000
"""
import asyncio
import base64
import hashlib
import hmac
import json
import os
import warnings
import re
import secrets
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import Body, FastAPI, HTTPException, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from dotenv import load_dotenv

def _load_env():
    """Charge les .env comme Vite côté racine : `.env` puis `.env.local`, puis `backend/.env` et `backend/.env.local` (chaque fichier suivant écrase les clés précédentes). Ainsi `AUTH_JWT_SECRET` peut vivre dans `.env.local` à la racine. utf-8-sig évite un BOM qui casse le nom de la première variable sous Windows."""
    root = Path(__file__).resolve().parent.parent
    backend_dir = Path(__file__).resolve().parent
    candidates = [
        root / ".env",
        root / ".env.local",
        backend_dir / ".env",
        backend_dir / ".env.local",
    ]
    _kwargs = {"override": True, "encoding": "utf-8-sig"}
    for path in candidates:
        if not path.exists():
            continue
        try:
            load_dotenv(str(path), **_kwargs)
        except TypeError:
            load_dotenv(str(path), override=True)
    load_dotenv(override=False)

_load_env()

app = FastAPI(title="BookFinder API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

lib = None


def _get_zlib_credentials():
    email = (os.getenv("ZLIB_EMAIL") or "").strip()
    password = (os.getenv("ZLIB_PASSWORD") or "").strip()
    return email, password


def _zlib_startup_disabled() -> bool:
    v = (os.getenv("ZLIB_DISABLE_STARTUP") or "").strip().lower()
    return v in ("1", "true", "yes", "on")


def _zlib_startup_error_hint(exc: BaseException) -> str:
    err = str(exc).lower()
    if "dns" in err or "getaddrinfo" in err or "cannot connect to host" in err:
        return (
            " Réseau/DNS (VPN, pare-feu, résolveur Windows). "
            "Pour démarrer sans BookFinder : ZLIB_DISABLE_STARTUP=1 dans .env."
        )
    return ""


@app.on_event("startup")
async def startup():
    global lib
    # Recharger .env au démarrage
    _load_env()
    ZLIB_EMAIL, ZLIB_PASSWORD = _get_zlib_credentials()
    # Diagnostic (sans afficher les valeurs) - flush pour voir en direct quand lancé par Node
    has_email = bool(ZLIB_EMAIL)
    has_password = bool(ZLIB_PASSWORD)
    msg = f"[zlib_server] .env: ZLIB_EMAIL={'defini' if has_email else 'MANQUANT'}, ZLIB_PASSWORD={'defini' if has_password else 'MANQUANT'}"
    print(msg, flush=True)
    if _zlib_startup_disabled():
        print(
            "[zlib_server] Z-Library (BookFinder) ignoré au démarrage (ZLIB_DISABLE_STARTUP). "
            "Auth, /api/v1 et /health restent disponibles ; zlib_ready=false.",
            flush=True,
        )
        lib = None
    elif not has_email or not has_password:
        print("[zlib_server] Fichier .env attendu a la racine du projet (a cote de 'backend/') avec ZLIB_EMAIL=... et ZLIB_PASSWORD=...", flush=True)
        return
    else:
        try:
            import zlibrary
            lib = zlibrary.AsyncZlib()
            await lib.login(ZLIB_EMAIL, ZLIB_PASSWORD)
            print("[zlib_server] Connexion Z-Library OK", flush=True)
        except Exception as e:
            hint = _zlib_startup_error_hint(e)
            print(
                f"[zlib_server] Z-Library (BookFinder) indisponible au démarrage — zlib_ready=false.{hint} Détail: {e}",
                flush=True,
            )
            lib = None
    try:
        _auth_init_db()
    except Exception as e:
        print(f"[zlib_server] Erreur init auth DB: {e}", flush=True)


@app.get("/health")
async def health():
    return {"status": "ok", "zlib_ready": lib is not None}


@app.get("/api/v1/health")
async def momentum_api_v1_health():
    """Jalon API Momentum (contrat partagé avec `contracts/apiHealth.v1.js`)."""
    from supabase_remote import is_supabase_configured, ping_supabase

    auth_db_ready = AUTH_DB_PATH.is_file()
    payload: dict[str, Any] = {
        "service": "momentum-api",
        "version": 1,
        "status": "ok",
        "zlib_ready": lib is not None,
        "auth_db_ready": auth_db_ready,
    }
    sc = is_supabase_configured()
    payload["supabase_configured"] = sc
    if sc:
        payload["supabase_reachable"] = await ping_supabase()
    return payload


@app.get("/search")
async def search(
    q: str = Query(..., min_length=1),
    format_filter: str = Query(None, alias="format"),
):
    """Recherche de livres. format_filter optionnel : epub, pdf, etc."""
    if lib is None:
        raise HTTPException(
            status_code=503,
            detail="Service Z-Library non configuré. Vérifiez ZLIB_EMAIL et ZLIB_PASSWORD dans .env.",
        )
    try:
        paginator = await lib.search(q=q.strip(), count=10)
        results = await paginator.next()
        books = []
        for book in results or []:
            ext = (book.get("extension") or "").lower()
            if format_filter:
                fmt = format_filter.lower()
                if fmt not in ext and ext != fmt:
                    continue
            books.append({
                "id": book.get("id"),
                "name": book.get("name"),
                "author": book.get("author"),
                "extension": book.get("extension"),
                "size": book.get("size"),
                "cover": book.get("cover"),
            })
        return {"results": books}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/download/{book_id}")
async def download(book_id: str):
    """Télécharge un livre par ID et stream le fichier."""
    if lib is None:
        raise HTTPException(
            status_code=503,
            detail="Service Z-Library non configuré.",
        )
    try:
        book = await lib.get_by_id(book_id)
        if not book:
            raise HTTPException(status_code=404, detail="Livre non trouvé")
        download_url = await book.fetch()
        if not download_url:
            raise HTTPException(status_code=502, detail="Impossible d'obtenir l'URL de téléchargement")

        # Si l'API renvoie directement l'URL, on redirige ou on stream
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(download_url) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=502, detail="Erreur lors du téléchargement")
                content_type = resp.headers.get("Content-Type", "application/octet-stream")
                disp = resp.headers.get("Content-Disposition") or ""
                if "filename=" in disp:
                    import re
                    m = re.search(r'filename="?([^";\n]+)"?', disp)
                    filename = (m.group(1).strip() if m else f"book_{book_id}")
                else:
                    filename = f"book_{book_id}"
                data = await resp.read()

        return StreamingResponse(
            iter([data]),
            media_type=content_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(data)),
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ---------------------------------------------------------------------------
# Verrouillage app Momentum : code par e-mail + jeton de reinitialisation
# Configurez RESEND_API_KEY (+ APP_LOCK_EMAIL_FROM) ou SMTP_* dans .env
# Mode dev : APP_LOCK_DEV_MAIL=1 affiche le code dans la console du serveur
# ---------------------------------------------------------------------------

_APP_LOCK_PENDING: dict[str, dict] = {}
_APP_LOCK_TOKENS: dict[str, dict] = {}
_APP_LOCK_REQ_TS: dict[str, list[float]] = {}
_APP_LOCK_VERIFY_TS: dict[str, list[float]] = {}
_AUTH_AUDIT_EVENTS: list[dict] = []
_AUTH_AUDIT_MAX = 2000

# ---------------------------------------------------------------------------
# Auth serveur (P3) - mode progressif, compatible front existant
# ---------------------------------------------------------------------------

AUTH_DB_PATH = Path(__file__).resolve().parent / "auth_server.db"
if not (os.getenv("AUTH_JWT_SECRET") or "").strip():
    warnings.warn(
        "AUTH_JWT_SECRET absent : un secret JWT aléatoire est généré à chaque démarrage du "
        "processus (les access tokens déjà émis ne sont plus valides jusqu’au prochain "
        "/auth/refresh). Pour des sessions stables, définis AUTH_JWT_SECRET dans backend/.env "
        "ou .env à la racine (voir backend/.env.example).",
        stacklevel=1,
    )
AUTH_JWT_SECRET = (os.getenv("AUTH_JWT_SECRET") or "").strip() or secrets.token_hex(32)
AUTH_ACCESS_TTL_MIN = int((os.getenv("AUTH_ACCESS_TTL_MIN") or "15").strip())
AUTH_REFRESH_TTL_DAYS = int((os.getenv("AUTH_REFRESH_TTL_DAYS") or "30").strip())


def _auth_db_conn():
    conn = sqlite3.connect(str(AUTH_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _auth_init_db():
    conn = _auth_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                email TEXT,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                token_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                revoked INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS mutation_idempotency_v1 (
                user_id TEXT NOT NULL,
                client_mutation_id TEXT NOT NULL,
                response_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (user_id, client_mutation_id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_cloud_settings_v1 (
                user_id TEXT PRIMARY KEY,
                payload_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_sport_program_context_v1 (
                user_id TEXT PRIMARY KEY,
                payload_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS user_workout_aggregate_v1 (
                user_id TEXT PRIMARY KEY,
                payload_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def _auth_now_iso():
    return datetime.now(timezone.utc).isoformat()


def _auth_b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _auth_b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def _auth_sign(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _auth_b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _auth_b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    to_sign = f"{header_b64}.{payload_b64}".encode("utf-8")
    sig = hmac.new(AUTH_JWT_SECRET.encode("utf-8"), to_sign, hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_auth_b64url_encode(sig)}"


def _auth_verify(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Token invalide")
    header_b64, payload_b64, sig_b64 = parts
    to_sign = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected = hmac.new(AUTH_JWT_SECRET.encode("utf-8"), to_sign, hashlib.sha256).digest()
    provided = _auth_b64url_decode(sig_b64)
    if not hmac.compare_digest(expected, provided):
        raise HTTPException(status_code=401, detail="Signature invalide")
    payload = json.loads(_auth_b64url_decode(payload_b64).decode("utf-8"))
    exp = payload.get("exp")
    if not isinstance(exp, int) or int(time.time()) >= exp:
        raise HTTPException(status_code=401, detail="Token expiré")
    return payload


def _auth_hash_password(password: str, salt_hex: str) -> str:
    salt = bytes.fromhex(salt_hex)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200000)
    return derived.hex()


def _auth_make_user_payload(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "role": row["role"],
        "serverManaged": True,
    }


def _auth_issue_tokens(user_row: sqlite3.Row) -> dict:
    now = datetime.now(timezone.utc)
    access_exp = now + timedelta(minutes=AUTH_ACCESS_TTL_MIN)
    refresh_exp = now + timedelta(days=AUTH_REFRESH_TTL_DAYS)
    access_payload = {
        "sub": user_row["id"],
        "typ": "access",
        "role": user_row["role"],
        "exp": int(access_exp.timestamp()),
        "iat": int(now.timestamp()),
    }
    access_token = _auth_sign(access_payload)
    refresh_raw = secrets.token_urlsafe(48)
    refresh_hash = hashlib.sha256(refresh_raw.encode("utf-8")).hexdigest()
    token_id = secrets.token_hex(16)
    conn = _auth_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO refresh_tokens (token_id, user_id, token_hash, expires_at, revoked, created_at)
            VALUES (?, ?, ?, ?, 0, ?)
            """,
            (token_id, user_row["id"], refresh_hash, refresh_exp.isoformat(), _auth_now_iso()),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "accessToken": access_token,
        "refreshToken": refresh_raw,
        "accessExpiresAt": access_exp.isoformat(),
        "refreshExpiresAt": refresh_exp.isoformat(),
    }


def _auth_extract_bearer(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization manquant")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization invalide")
    return authorization[7:].strip()


def _auth_get_user_from_access_token(authorization: Optional[str]) -> sqlite3.Row:
    token = _auth_extract_bearer(authorization)
    payload = _auth_verify(token)
    if payload.get("typ") != "access":
        raise HTTPException(status_code=401, detail="Type de token invalide")
    user_id = payload.get("sub")
    conn = _auth_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        return row
    finally:
        conn.close()


def _app_lock_norm_email(email: str) -> str:
    return (email or "").strip().lower()


def _app_lock_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


def _app_lock_prune_ts(store: dict[str, list[float]], email: str, window: float) -> None:
    now = time.time()
    arr = [t for t in store.get(email, []) if now - t < window]
    if arr:
        store[email] = arr
    elif email in store:
        del store[email]


@app.post("/auth/audit/events")
async def auth_audit_event(payload: dict = Body(default={})):
    event = {
        "id": payload.get("id") or secrets.token_hex(8),
        "eventType": payload.get("eventType") or "unknown",
        "timestamp": payload.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "payload": payload.get("payload") or {},
    }
    _AUTH_AUDIT_EVENTS.append(event)
    if len(_AUTH_AUDIT_EVENTS) > _AUTH_AUDIT_MAX:
        del _AUTH_AUDIT_EVENTS[0 : len(_AUTH_AUDIT_EVENTS) - _AUTH_AUDIT_MAX]
    return {"ok": True}


@app.get("/auth/audit/events")
async def auth_audit_events(limit: int = Query(100, ge=1, le=500)):
    items = _AUTH_AUDIT_EVENTS[-limit:]
    return {"events": items, "count": len(items)}


@app.post("/auth/register")
async def auth_register(payload: dict = Body(default={})):
    username = str(payload.get("username") or "").strip()
    email = (str(payload.get("email") or "").strip() or None)
    password = str(payload.get("password") or "")
    if len(username) < 2 or len(password) < 6:
        raise HTTPException(status_code=400, detail="Identifiants invalides")

    now = _auth_now_iso()
    user_id = secrets.token_hex(16)
    salt = secrets.token_hex(16)
    password_hash = _auth_hash_password(password, salt)

    conn = _auth_db_conn()
    try:
        cur = conn.cursor()
        try:
            cur.execute(
                """
                INSERT INTO users (id, username, email, password_hash, password_salt, role, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'user', ?, ?)
                """,
                (user_id, username, email, password_hash, salt, now, now),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="Nom d'utilisateur déjà pris")
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cur.fetchone()
    finally:
        conn.close()

    tokens = _auth_issue_tokens(user)
    return {"user": _auth_make_user_payload(user), **tokens}


@app.post("/auth/login")
async def auth_login(payload: dict = Body(default={})):
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Identifiants manquants")

    conn = _auth_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Identifiants invalides")
        expected = _auth_hash_password(password, user["password_salt"])
        if not hmac.compare_digest(expected, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Identifiants invalides")
    finally:
        conn.close()

    tokens = _auth_issue_tokens(user)
    return {"user": _auth_make_user_payload(user), **tokens}


@app.post("/auth/refresh")
async def auth_refresh(payload: dict = Body(default={})):
    refresh_token = str(payload.get("refreshToken") or "")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token manquant")
    refresh_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()

    conn = _auth_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT rt.*, u.id as u_id, u.username, u.email, u.role
            FROM refresh_tokens rt
            JOIN users u ON u.id = rt.user_id
            WHERE rt.token_hash = ? AND rt.revoked = 0
            ORDER BY rt.created_at DESC LIMIT 1
            """,
            (refresh_hash,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Refresh token invalide")
        exp = datetime.fromisoformat(row["expires_at"])
        if datetime.now(timezone.utc) >= exp:
            raise HTTPException(status_code=401, detail="Refresh token expiré")
        # rotation
        cur.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token_id = ?", (row["token_id"],))
        conn.commit()
        user_row = {
            "id": row["u_id"],
            "username": row["username"],
            "email": row["email"],
            "role": row["role"],
        }
    finally:
        conn.close()

    class _Row(dict):
        def __getitem__(self, k):
            return dict.get(self, k)

    user = _Row(user_row)
    tokens = _auth_issue_tokens(user)
    return {"user": _auth_make_user_payload(user), **tokens}


@app.post("/auth/logout")
async def auth_logout(payload: dict = Body(default={})):
    refresh_token = str(payload.get("refreshToken") or "")
    if refresh_token:
        refresh_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        conn = _auth_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?", (refresh_hash,))
            conn.commit()
        finally:
            conn.close()
    return {"ok": True}


@app.get("/auth/me")
async def auth_me(authorization: Optional[str] = Header(default=None)):
    user = _auth_get_user_from_access_token(authorization)
    return {"user": _auth_make_user_payload(user)}


@app.post("/auth/change-password")
async def auth_change_password(
    payload: dict = Body(default={}),
    authorization: Optional[str] = Header(default=None),
):
    user = _auth_get_user_from_access_token(authorization)
    old_password = str(payload.get("oldPassword") or "")
    new_password = str(payload.get("newPassword") or "")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Mot de passe trop court")
    expected = _auth_hash_password(old_password, user["password_salt"])
    if not hmac.compare_digest(expected, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Ancien mot de passe invalide")

    new_salt = secrets.token_hex(16)
    new_hash = _auth_hash_password(new_password, new_salt)
    conn = _auth_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?",
            (new_hash, new_salt, _auth_now_iso(), user["id"]),
        )
        cur.execute("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", (user["id"],))
        conn.commit()
    finally:
        conn.close()
    return {"ok": True}


async def _app_lock_send_email(to_addr: str, subject: str, text: str) -> tuple[bool, str]:
    resend_key = (os.getenv("RESEND_API_KEY") or "").strip()
    from_addr = (os.getenv("APP_LOCK_EMAIL_FROM") or "Momentum <onboarding@resend.dev>").strip()

    if resend_key:
        import aiohttp

        payload = {
            "from": from_addr,
            "to": [to_addr],
            "subject": subject,
            "text": text,
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.resend.com/emails",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {resend_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=aiohttp.ClientTimeout(total=20),
                ) as resp:
                    body = await resp.text()
                    if resp.status not in (200, 201):
                        return False, f"Resend HTTP {resp.status}: {body[:500]}"
        except Exception as e:
            return False, str(e)
        return True, ""

    smtp_host = (os.getenv("SMTP_HOST") or "").strip()
    if smtp_host:
        import smtplib
        from email.mime.text import MIMEText

        port = int(os.getenv("SMTP_PORT") or "587")
        user = (os.getenv("SMTP_USER") or "").strip()
        password = (os.getenv("SMTP_PASSWORD") or "").strip()
        smtp_from = (os.getenv("SMTP_FROM") or user or from_addr).strip()

        def _sync_smtp():
            msg = MIMEText(text, "plain", "utf-8")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = to_addr
            with smtplib.SMTP(smtp_host, port, timeout=25) as smtp:
                smtp.ehlo()
                if port == 587:
                    smtp.starttls()
                    smtp.ehlo()
                if user:
                    smtp.login(user, password)
                smtp.sendmail(smtp_from, [to_addr], msg.as_string())

        try:
            await asyncio.to_thread(_sync_smtp)
        except Exception as e:
            return False, str(e)
        return True, ""

    if (os.getenv("APP_LOCK_DEV_MAIL") or "").strip() in ("1", "true", "yes"):
        print(
            f"[app-lock][DEV] Code pour {to_addr} — ne pas utiliser en production\n{text}\n",
            flush=True,
        )
        return True, "dev_console"

    return False, "Configurer RESEND_API_KEY ou SMTP_HOST, ou APP_LOCK_DEV_MAIL=1 pour le dev."


@app.post("/app-lock/request-code")
async def app_lock_request_code(payload: dict = Body(...)):
    """Envoie un code a 6 chiffres a l'adresse e-mail (lien avec le compte cote client)."""
    email = _app_lock_norm_email(str(payload.get("email") or ""))
    if not _app_lock_valid_email(email):
        raise HTTPException(status_code=400, detail="Adresse e-mail invalide.")

    _app_lock_prune_ts(_APP_LOCK_REQ_TS, email, 3600)
    reqs = _APP_LOCK_REQ_TS.get(email, [])
    if len(reqs) >= 5:
        raise HTTPException(status_code=429, detail="Trop de demandes. Reessayez dans une heure.")

    code = f"{secrets.randbelow(1000000):06d}"
    exp = time.time() + 900
    _APP_LOCK_PENDING[email] = {"code": code, "exp": exp, "attempts": 0}
    reqs.append(time.time())
    _APP_LOCK_REQ_TS[email] = reqs

    subject = "Momentum — code de recuperation du verrouillage"
    body = (
        f"Votre code Momentum (verrouillage d'application) est : {code}\n\n"
        "Il expire dans 15 minutes. Si vous n'etes pas a l'origine de cette demande, ignorez ce message.\n"
    )

    ok, info = await _app_lock_send_email(email, subject, body)
    if not ok:
        _APP_LOCK_PENDING.pop(email, None)
        raise HTTPException(status_code=503, detail=info)

    out: dict = {"ok": True, "expiresIn": 900}
    if info == "dev_console":
        out["devMode"] = True
        out["message"] = "Mode developpement : le code est affiche dans le terminal du backend (uvicorn)."
    return out


@app.post("/app-lock/verify-code")
async def app_lock_verify_code(payload: dict = Body(...)):
    """Verifie le code recu par e-mail ; renvoie un jeton a usage unique pour reinitialiser le code cote app."""
    email = _app_lock_norm_email(str(payload.get("email") or ""))
    code = (str(payload.get("code") or "")).strip()
    if not _app_lock_valid_email(email) or not re.match(r"^\d{6}$", code):
        raise HTTPException(status_code=400, detail="E-mail ou code invalide.")

    _app_lock_prune_ts(_APP_LOCK_VERIFY_TS, email, 600)
    vs = _APP_LOCK_VERIFY_TS.get(email, [])
    if len(vs) >= 12:
        raise HTTPException(status_code=429, detail="Trop de tentatives. Reessayez plus tard.")

    row = _APP_LOCK_PENDING.get(email)
    if not row or time.time() > row["exp"]:
        vs.append(time.time())
        _APP_LOCK_VERIFY_TS[email] = vs
        raise HTTPException(status_code=400, detail="Code expire ou inconnu. Demandez un nouveau code.")

    if row["attempts"] >= 8:
        _APP_LOCK_PENDING.pop(email, None)
        raise HTTPException(status_code=400, detail="Trop d'echecs. Demandez un nouveau code.")

    if row["code"] != code:
        row["attempts"] += 1
        vs.append(time.time())
        _APP_LOCK_VERIFY_TS[email] = vs
        raise HTTPException(status_code=400, detail="Code incorrect.")

    _APP_LOCK_PENDING.pop(email, None)
    token = secrets.token_urlsafe(32)
    _APP_LOCK_TOKENS[token] = {"email": email, "exp": time.time() + 600}
    return {"ok": True, "resetToken": token, "expiresIn": 600}


@app.post("/app-lock/consume-reset-token")
async def app_lock_consume_reset_token(payload: dict = Body(...)):
    """Consomme le jeton (une seule fois) apres reinitialisation reussie du code cote client."""
    email = _app_lock_norm_email(str(payload.get("email") or ""))
    token = (str(payload.get("resetToken") or "")).strip()
    if not email or not token:
        raise HTTPException(status_code=400, detail="Parametres manquants.")

    row = _APP_LOCK_TOKENS.get(token)
    if not row or row.get("email") != email or time.time() > row["exp"]:
        raise HTTPException(status_code=400, detail="Jeton invalide ou expire.")

    del _APP_LOCK_TOKENS[token]
    return {"ok": True}


# ---------------------------------------------------------------------------
# GitHub OAuth + proxy GraphQL (module « Code » Momentum)
# .env racine ou backend/ : GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
# Le navigateur n'appelle jamais GitHub avec le secret ; échange code → token ici.
# ---------------------------------------------------------------------------


def _github_oauth_secret():
    return (os.getenv("GITHUB_CLIENT_SECRET") or "").strip()


@app.post("/api/github/oauth/exchange")
async def github_oauth_exchange(payload: dict = Body(...)):
    """Échange le code OAuth GitHub contre un access_token (JSON).

    - client_id : peut être envoyé par le frontend (même valeur que VITE_GITHUB_CLIENT_ID),
      sinon variable GITHUB_CLIENT_ID côté serveur.
    - client_secret : toujours GITHUB_CLIENT_SECRET dans .env (racine ou backend/) — jamais dans le navigateur.
    """
    # Recharger .env à chaque échange : évite le cas « variable ajoutée après le démarrage d’uvicorn »
    # (--reload ne recharge pas automatiquement les changements dans .env seul).
    _load_env()
    csec = _github_oauth_secret()
    if not csec:
        raise HTTPException(
            status_code=503,
            detail=(
                "GITHUB_CLIENT_SECRET manquant : ajoute-le dans .env à la racine du projet ou dans backend/.env, "
                "puis redémarre uvicorn (port 8000). Le Client ID peut rester uniquement dans .env.local (VITE_GITHUB_CLIENT_ID)."
            ),
        )
    code = (str(payload.get("code") or "")).strip()
    redirect_uri = (str(payload.get("redirect_uri") or "")).strip()
    cid = (str(payload.get("client_id") or "")).strip() or (os.getenv("GITHUB_CLIENT_ID") or "").strip()
    if not cid:
        raise HTTPException(
            status_code=400,
            detail="client_id manquant : définis VITE_GITHUB_CLIENT_ID (.env.local) ou GITHUB_CLIENT_ID (.env serveur).",
        )
    if not code or not redirect_uri:
        raise HTTPException(status_code=400, detail="Paramètres requis : code, redirect_uri.")

    import aiohttp
    from urllib.parse import urlencode

    body = urlencode(
        {
            "client_id": cid,
            "client_secret": csec,
            "code": code,
            "redirect_uri": redirect_uri,
        }
    )
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://github.com/login/oauth/access_token",
                data=body,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=25),
            ) as resp:
                data = await resp.json(content_type=None)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Échec contact GitHub OAuth: {e}") from e

    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail="Réponse GitHub invalide.")
    if data.get("error"):
        raise HTTPException(
            status_code=400,
            detail=data.get("error_description") or data.get("error") or "oauth_error",
        )
    token = (data.get("access_token") or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token absent dans la réponse GitHub.")

    return {
        "access_token": token,
        "token_type": data.get("token_type") or "bearer",
        "scope": data.get("scope") or "",
    }


@app.post("/api/github/graphql")
async def github_graphql_proxy(
    request: Request,
    x_github_token: Optional[str] = Header(default=None, alias="X-GitHub-Token"),
):
    """Proxy vers api.github.com/graphql (évite le blocage CORS du navigateur)."""
    token = (x_github_token or "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Header X-GitHub-Token requis.")
    try:
        body = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Corps JSON invalide.") from exc

    import aiohttp

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.github.com/graphql",
                json=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "User-Agent": "MomentumDashboard/1.0",
                },
                timeout=aiohttp.ClientTimeout(total=45),
            ) as resp:
                text = await resp.text()
                return Response(content=text, media_type="application/json", status_code=resp.status)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


@app.get("/api/github/rest/user")
async def github_rest_user_me(
    x_github_token: Optional[str] = Header(default=None, alias="X-GitHub-Token"),
):
    """Valide un PAT ou token OAuth et renvoie le profil public GitHub."""
    token = (x_github_token or "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Header X-GitHub-Token requis.")

    import aiohttp

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "MomentumDashboard/1.0",
                },
                timeout=aiohttp.ClientTimeout(total=20),
            ) as resp:
                text = await resp.text()
                return Response(content=text, media_type="application/json", status_code=resp.status)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e


# --- Phase 2 : intentions + profil v1 (contrats partagés) ---
try:
    from api_v1_phase2 import register_phase2_routes

    register_phase2_routes(app, _auth_get_user_from_access_token, _auth_db_conn)
except Exception as _phase2_exc:
    print(f"[zlib_server] Phase2 routes non chargées: {_phase2_exc}", flush=True)

try:
    from api_v1_meta import register_meta_routes

    register_meta_routes(app)
except Exception as _meta_exc:
    print(f"[zlib_server] Routes méta Phase2 non chargées: {_meta_exc}", flush=True)

try:
    from knowledge_store import init_knowledge_db, db_conn as _knowledge_db_conn
    from api_v1_knowledge import register_knowledge_routes

    init_knowledge_db()
    register_knowledge_routes(app, _auth_get_user_from_access_token, _knowledge_db_conn)
except Exception as _knowledge_exc:
    print(f"[zlib_server] Routes Base de connaissances non chargées: {_knowledge_exc}", flush=True)
