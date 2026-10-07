# Release portable ZIP — Momentum

Ce document décrit **comment publier** une version téléchargeable sans casser ton flux de travail quotidien.

Le site `momentum-os.download` (repo séparé) ne fait que **pointer** vers le ZIP produit ici.

---

## Principe

```text
Tu codes ici (git, npm run dev)     ← inchangé
        │
        │ npm run package:portable
        ▼
 dist-release/Momentum-portable-….zip
        │
        │ upload manuel / hébergeur
        ▼
 bouton DOWNLOAD du site officiel
```

Tu peux continuer à travailler après chaque release. Mettre à jour le téléchargement = **regénérer le ZIP** et remplacer le fichier hébergé.

---

## Commandes

À la racine du repo Momentum :

```bash
# ZIP complet (inclut dossiergifs / médias lourds — peut dépasser 1 Go)
npm run package:portable

# ZIP léger (sans dossiergifs ni fonds d'écran perso)
npm run package:portable:lite
```

Sortie : `dist-release/Momentum-portable-<version>-<date>.zip`  
(`dist-release/` est gitignoré.)

---

## Ce que le ZIP contient

- Code app (`src/`, `public/`, `backend/` sans secrets, `scripts/`, configs)
- `LIRE-MOI.txt`, `start-momentum.bat`, `start-momentum.ps1`, `VERSION-PORTABLE.txt`
- `package.json` / `package-lock.json`, `backend/requirements.txt`, `.env.example`

## Ce qui est toujours exclu (sécurité / propreté)

- `node_modules/`, `.venv/`
- `.env*` (sauf `.env.example`)
- `*.db` (dont `backend/auth_server.db`)
- stores JSON runtime backend (`*_store.json`)
- `graft/`, caches, rapports de tests, IDE, `.git/`

---

## Checklist publication

1. Commit / tag optionnel de la version dans `package.json`
2. `npm run package:portable` (ou `:lite`)
3. Tester une fois : dézipper dans un **autre** dossier → `start-momentum.bat`
4. Uploader le ZIP sur l’hébergement du domaine
5. Mettre à jour `DOWNLOAD_URL` + `CURRENT_VERSION` sur le site (repo séparé)
6. Continuer à coder ici normalement

---

## Données utilisateurs

Les données vivent surtout dans le **navigateur** (IndexedDB).  
Un re-téléchargement du ZIP **ne synchronise pas** tout via le seul login.

Conseiller dans la com’ / LIRE-MOI :

- Export avant mise à jour (Paramètres)
- Ou garder le même navigateur / profil en remplaçant seulement les fichiers du projet

---

## Ne pas faire

- Ne pas fusionner le site de download dans ce repo
- Ne pas committer `dist-release/*.zip`
- Ne pas inclure ton `.env` ni ta `auth_server.db` dans un ZIP public
