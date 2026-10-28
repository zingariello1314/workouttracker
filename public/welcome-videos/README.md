# Vidéos d’accueil Momentum

Déposez ici vos fichiers vidéo (`.mp4`, `.webm`, `.mov`).

Puis régénérez le manifeste :

```bash
node scripts/build-welcome-videos.mjs
```

Chaque fichier devient une entrée de la bibliothèque commune (comme les bannières images).
Les utilisateurs choisissent ensuite dans **Paramètres → Images d’accueil** quelles vidéos
inclure dans leur rotation, avec son et boucle individuels.

Organisation conseillée :

```
public/welcome-videos/
  ma-video.mp4
  autre-ambiance.webm
  manifest.json   # généré — ne pas éditer à la main sauf besoin
```
