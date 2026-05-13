# ADR-004 — Recommandations stack (gratuit, fonctionnel, mobile annexe)

## Statut

**Recommandation** — à valider par toi ; objectif : **0 € au démarrage**, **maximum de fonctionnel vite**, **aligné** avec serveur comme vérité + **projet mobile séparé** sans retoucher le front desktop.

---

## 1. Supabase vs API maison + Postgres

**Ce que tu veux implicitement** : un vrai backend sans te battre des mois, gratuit pour commencer, et que le **mobile annexe** consomme la même chose que le futur **Remote** du desktop.

| Critère | Supabase (Postgres + Auth + RLS) | API maison (ex. FastAPI + Neon Postgres) |
|--------|-----------------------------------|------------------------------------------|
| Gratuit démarrage | Oui (free tier) | Oui (Neon/Supabase Postgres free + hébergement API free tier limité) |
| Temps jusqu’à « compte + données persistées » | **Très court** (Auth + tables + RLS) | Plus long (tout coder : auth refresh, policies, etc.) |
| Cohérence avec ton **FastAPI actuel** (8000, livres, auth SQLite) | Deux briques : **FastAPI inchangé** pour BookFinder + **Supabase** pour compte/sync métier ; ou migration auth plus tard | **Une** stack Python possible en étendant `zlib_server` + Postgres |
| Mobile Expo / RN | **SDK officiel**, temps réel optionnel | `fetch` + JWT maison (déjà proche de ce que tu as) |

**Recommandation** : **Supabase** pour la **nouvelle** couche « compte + données sync » (Phase 2), en **gardant** le FastAPI BookFinder **isolé** sur le même dépôt ou derrière le même domaine en reverse-proxy. Tu obtiens le plus **fonctionnel gratuit intelligent** pour le mobile et les RLS sans réécrire la sécurité multi-utilisateur.

**Alternative** si tu refuses tout SaaS : FastAPI + **Neon** (Postgres gratuit) + JWT déjà en place étendu — plus de contrôle, plus de code à toi.

---

## 2. Où vivent les contrats (Zod / OpenAPI)

**Ce que tu veux** : un seul endroit pour que **desktop** et **mobile annexe** parlent la même langue.

**Recommandation** : dossier **`contracts/`** à la racine (déjà amorcé) — schémas Zod versionnés ; le mobile importe ce dossier via **git submodule** ou **package npm privé** plus tard ; pas besoin de monorepo lourd au début.

---

## 3. Repo mobile : séparé ou dans le monorepo

**Ce que tu veux** : ne **pas** casser le desktop en bricolant le mobile dans les mêmes composants.

**Recommandation** : **dépôt séparé** `momentum-mobile` (ou équivalent) dès que tu ouvres Expo — le moins de risque de « fuites » d’imports UI. Le monorepo `apps/mobile` reste valable si tu maîtrises déjà Turborepo/pnpm ; pas indispensable.

---

## 4. Garmin (déjà ADR-002)

**Ce que tu veux** : pas exploser coût/stockage cloud pour du sport wearables.

**Recommandation** : rester sur **Voie A** (local first, métadonnées / export côté cloud si besoin) — **gratuit**, **adapté** à un premier produit cloud.

---

## 5. Conflits offline (ADR-001)

**Ce que tu veux** : éviter les bugs XP double ou transactions dupliquées sans CRDT inutile.

**Recommandation** : **`clientMutationId`** + faits append-only + **recompute** agrégats côté serveur pour l’XP « officiel » — déjà dans ADR-001 ; **Supabase** gère bien les lignes avec `updated_at` + contraintes uniques pour l’idempotence.

---

## Synthèse une phrase

> **Supabase (gratuit) pour auth + données utilisateur + RLS**, **contrats dans `contracts/`**, **app mobile dans un repo à part**, **FastAPI BookFinder conservé** ; Garmin **Voie A** ; conflits **idempotence + événements** — c’est le combo le plus **fonctionnel / intelligent / adapté** à ton objectif sans payer ni fusionner le front desktop avec le mobile.

Quand tu tranches « oui ADR-004 », on pourra ajouter un ADR **Décidé** qui remplace le statut *Recommandation* et verrouiller la stack pour la Phase 2.
