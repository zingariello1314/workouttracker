"""
Backend FastAPI pour BookFinder - Recherche et téléchargement via Z-Library.
Les identifiants Z-Library doivent être dans .env (ZLIB_EMAIL, ZLIB_PASSWORD).
Lancement : uvicorn zlib_server:app --reload --port 8000
"""
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

def _load_env():
    # Racine du projet = parent du dossier backend/
    root = Path(__file__).resolve().parent.parent
    root_env = root / ".env"
    backend_env = Path(__file__).resolve().parent / ".env"
    # override=True pour que le .env écrase toute variable déjà définie
    if root_env.exists():
        load_dotenv(str(root_env), override=True)
    if backend_env.exists():
        load_dotenv(str(backend_env), override=True)
    # Au cas où : charger aussi depuis le répertoire courant (cwd au lancement)
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
