# Client SDK partage

But:

- fournir une couche API unique pour desktop et mobile-web.

Responsabilites:

- appels HTTP vers backend `/v1`,
- gestion auth token/session,
- retries simples et mapping d'erreurs,
- signatures stables par domaine (`today`, `calendar`, etc.).

Interdits:

- logique de presentation UI,
- styles ou composants,
- dependances aux specifics desktop.
