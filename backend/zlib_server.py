"""
Backend FastAPI pour BookFinder - Recherche et téléchargement via Z-Library.
Les identifiants Z-Library doivent être dans .env (ZLIB_EMAIL, ZLIB_PASSWORD).
Lancement : uvicorn zlib_server:app --reload --port 8000
"""
import asyncio
import os
import re
import secrets
import time
from pathlib import Path
from typing import Optional

from fastapi import Body, FastAPI, HTTPException, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from dotenv import load_dotenv

def _load_env():
    """Charge .env racine puis backend/. utf-8-sig évite un BOM qui casse le nom de la première variable sous Windows."""
    root = Path(__file__).resolve().parent.parent
    root_env = root / ".env"
    backend_env = Path(__file__).resolve().parent / ".env"
    _kwargs = {"override": True, "encoding": "utf-8-sig"}
    try:
        if root_env.exists():
            load_dotenv(str(root_env), **_kwargs)
        if backend_env.exists():
            load_dotenv(str(backend_env), **_kwargs)
    except TypeError:
        # python-dotenv très ancien sans encoding=
        if root_env.exists():
            load_dotenv(str(root_env), override=True)
        if backend_env.exists():
            load_dotenv(str(backend_env), override=True)
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
    if not has_email or not has_password:
        print("[zlib_server] Fichier .env attendu a la racine du projet (a cote de 'backend/') avec ZLIB_EMAIL=... et ZLIB_PASSWORD=...", flush=True)
        return
    try:
        import zlibrary
        lib = zlibrary.AsyncZlib()
        await lib.login(ZLIB_EMAIL, ZLIB_PASSWORD)
        print("[zlib_server] Connexion Z-Library OK", flush=True)
    except Exception as e:
        print(f"[zlib_server] Erreur connexion Z-Library: {e}", flush=True)
        lib = None


@app.get("/health")
async def health():
    return {"status": "ok", "zlib_ready": lib is not None}


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
