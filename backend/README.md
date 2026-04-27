# BookFinder API (Z-Library)

Backend FastAPI pour le sous-onglet **BookFinder** de l’onglet Livres.

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Configuration

**Ne jamais mettre ton mot de passe dans le code.** Crée un fichier `.env` à la racine de `backend/` (il est ignoré par Git) :

```env
ZLIB_EMAIL=ton_email@example.com
ZLIB_PASSWORD=ton_mot_de_passe
```

Tu peux copier `.env.example` en `.env` puis remplir les valeurs.

## Lancement

```bash
uvicorn zlib_server:app --reload --port 8000
```

Le frontend (Vite) est configuré pour proxyifier `/api/zlib` vers `http://localhost:8000`. Lance aussi l’app (ex. `npm run dev`) pour utiliser BookFinder dans l’onglet Livres.

## Endpoints

- `GET /health` — état du service et connexion Z-Library
- `GET /search?q=...&format=epub|pdf` — recherche de livres
- `GET /download/{book_id}` — téléchargement d’un livre par ID

### Endpoints Auth (P3 - progressif)

- `POST /auth/register` — création compte serveur
- `POST /auth/login` — login, renvoie `accessToken` + `refreshToken`
- `POST /auth/refresh` — rotation refresh token
- `POST /auth/logout` — révocation refresh token
- `GET /auth/me` — profil depuis access token
- `POST /auth/change-password` — changement mot de passe serveur
- `POST /auth/audit/events` — ingestion audit trail front
- `GET /auth/audit/events` — lecture audit trail
