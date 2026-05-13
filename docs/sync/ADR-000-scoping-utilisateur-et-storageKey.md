# ADR-000 — Scoping utilisateur & clés de stockage (local)

## Statut

**Accepté (brouillon opérationnel)** — à réviser si la politique « appareil partagé » change.

## Contexte

L’application mélange :

- un **utilisateur authentifié** (`AuthContext`, `currentUser.id`, `role`) ;
- des **clés de persistance** (`storageKey`, `userId`, `main`, `anonymous`) dispersées dans les hooks et services.

Sans règle claire, une future sync **cloud** risque d’associer des blobs au mauvais compte ou de dupliquer des données.

## Décision

1. **`storageKey` workout / contexte** (référence : `WorkoutContext.jsx`) :
   - `main` si `isAdminUser(currentUser)` ;
   - sinon `user-${currentUser.id}` ;
   - sinon `anonymous` si non authentifié.

2. **Source de vérité pour le scope « entraînement »** : le couple **`(authenticated, currentUser.id, role)`** détermine `storageKey` ; les repositories workout **ne recalculent pas** ce scope eux-mêmes — ils reçoivent un `scopeKey` / `storageKey` explicite (injection).

3. **Domaines non workout** : aujourd’hui hétérogène (ex. XP par `userId` dans `QuietQuestDB`, nutrition par stores + `userId` sur enregistrements, Garmin `userId` optionnel). **Règle cible Phase 1** : chaque nouveau repository expose `forUser(userId)` ou reçoit un **`UserScope`** unique dérivé de `AuthContext`.

4. **Appareil partagé** : par défaut **non supporté** (un navigateur = un profil actif). Toute évolution multi-profils local nécessite un ADR dédié.

## Conséquences

- Les migrations cloud **doivent** mapper `storageKey` / `userId` serveur ↔ client de façon explicite.
- Les comptes **serverManaged** sans hash local ne sont **pas** des comptes « locaux » pour `VITE_AUTH_MODE=local` (voir discussion auth hybride).

## Références code

- `src/context/WorkoutContext.jsx` — `storageKey`, `useWorkoutData`, `useWorkoutContextStorage`
- `src/utils/authMigration.js` — migrations anonymes → `userId`
