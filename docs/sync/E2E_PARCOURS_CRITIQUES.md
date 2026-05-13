# Parcours E2E Playwright (filet refactor)

À exécuter **avant / après** gros changements repositories ou sync. Liste minimale v1 :

1. **Auth** — page login visible → saisie identifiants → arrivée onglet aujourd’hui (ou erreur attendue).
2. **Aujourd’hui** — affichage séance du jour → cocher un exercice (si présent) → pas d’erreur console bloquante.
3. **XP** — barre / module quête visible après action XP (selon données).
4. **Dashboard** — chargement sans crash (tuiles principales).

Extensions futures : finance (ajout ligne test), livres, nutrition (repas test).

**CI** : optionnel ; minimum = `npx playwright test` documenté en local sur branche sensible.
