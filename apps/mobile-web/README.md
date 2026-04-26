# Mobile Web App (separee du desktop)

Objectif:

- construire une version web mobile avec une esthetique propre,
- sans impacter ni le fonctionnement ni l'esthetique desktop.

Regles obligatoires:

1. Ne pas importer de CSS desktop (`src/styles/*` desktop interdit ici).
2. Ne pas reutiliser des composants UI desktop couples au style desktop.
3. Consommer la data uniquement via `packages/client-sdk`.
4. Reutiliser la logique metier uniquement via `packages/domain`.

MVP prioritaire:

- sport `today`,
- sport `calendar`,
- sport `exercises`,
- sport `performance-challenges`,
- sport `garmin` (lecture d'abord).
- livres `bibliothèque`
- livres `statistiques`
- livres `calendrier`
- quêtes `aujourd'hui`
- quêtes `calendrier`
- quêtes `mes quêtes`
- quêtes `cette semaine`
- paramètres
- dashboard 