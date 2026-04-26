# Domain partage (sans UI)

But:

- centraliser la logique metier commune desktop + mobile-web,
- sans aucun couplage CSS ou composant visuel.

Contenu attendu:

- types metier,
- schemas de validation,
- regles de calcul (records, score, aggregates),
- helpers de resolution de conflits.

Interdits:

- imports React UI,
- imports CSS,
- acces direct DOM/browser.
