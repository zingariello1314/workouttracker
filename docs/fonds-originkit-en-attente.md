# Fonds Originkit encore à ajouter

Écrit le 29 septembre 2026. Le quota Originkit (10 téléchargements par jour) était épuisé vers 3 h 40. Aucun de ces onze composants n’est dans le dépôt : ni le fichier source, ni le fond dans l’application.

Nouvel essai le 30 septembre 2026 vers 0 h 20 : le quota du nouveau créneau était déjà plein (10/10, réinitialisation annoncée dans environ 20 h). La commande a été lancée, aucun fichier n’a été écrit. Ne pas inventer les visuels en attendant.

Ne pas inventer un shader de remplacement. Lancer la commande indiquée, puis porter le vrai source dans un worker, comme les fonds déjà en place.

Ne pas écrire la clé API dans un fichier. L’exporter seulement dans le shell (`ORIGINKIT_API_KEY`), lancer la commande, puis la retirer. Ne pas la committer.

## Déjà dans l’application — ne pas les refaire

Momentum (vert, ne pas y toucher), Saturne, Disque d’accrétion, Vortex de chaînes, Cellules chromées, Cosmos, Champ d’herbe, Tornade.

Déjà réglé sur place, à ne pas casser :

- Cellules chromées : interrupteur **Curseur**, activé par défaut. Le curseur Survol reste.
- Champ d’herbe : interrupteur **Repousser**, activé par défaut, et **Distance caméra** de 40 à 240, valeur d’origine 160. 100 retrouve l’ancien gros plan.
- Tornade : **Repousser** activé par défaut. Les valeurs de l’écran (sommet 900, taille 103, position 41, base 585, torsion 5, zoom 20, vitesse 10, direction Haut, lignes 240 · #FF9E7A · halo 8, points 8000 · 20 · #FFFFFF, comètes 12 · 4 · #FF6500).

Les versions enregistrées sous un nouveau nom restent dans le navigateur de la personne (`localStorage`). Les fonds de base, eux, sont dans le code : tout le monde les a, pas seulement l’admin.

## Règles communes aux onze

- Même atelier que les fonds déjà réglables : aperçu en direct à gauche, paramètres à droite, plein écran, pause, recommencer, état d’origine.
- Enregistrer crée toujours un nouvel identifiant `variant-…`. Ne jamais écraser le fond d’origine. Ouvrir une version déjà enregistrée et sauver crée encore un nouvel identifiant.
- Le composant React Originkit ne se monte pas dans la page. L’animation tourne dans un worker (`new Worker(new URL('…worker.js', import.meta.url), { type: 'module' })` avec une URL en littéral). Canvas dans la page, `pointer-events: none`, sans `z-index` négatif.
- Valeurs d’origine = celles des écrans ci-dessous, pas les `DEFAULTS` du fichier source s’ils diffèrent.
- Libellés en français, dans le style déjà en place (Fond, Vitesse, Densité, Survol, Oui / Non).
- Les puces à deux ou trois nombres (Caméra, Bundle, Flow, Bloom, Cursor, Flaques, Gouttes) : lire le source avant de décider quels champs elles représentent. Ne pas deviner.
- Les listes déroulantes (Direction, Humeur) passent par un champ `select`, comme la direction de la tornade.
- Miniature statique, sans WebGL. Entrée dans `backgroundRegistry.js`. Schéma dans `backgroundStudio.js`.
- Pas de saccade : plafond de pixels du même ordre que les autres fonds, pas de reconstruction de géométrie à chaque image.
- Ne pas modifier `AnimatedBackground.jsx` ni le worker vert.
- Après branchement : le test `src/backgrounds/__tests__/appBackgroundPreference.test.js` connaît le nouvel identifiant. Vérifier dans le navigateur que Régler ouvre un canvas vivant, que l’interrupteur curseur coupe bien l’effet, et qu’un essai d’enregistrement ne laisse pas de variante de test.

### Interrupteur curseur

Pour chaque fond marqué « oui » plus bas :

- Ajouter un interrupteur, activé par défaut, pour que l’écran d’origine ne change pas.
- S’il existe déjà un curseur nommé autrement (Survol, Saisie, Boost de survol, Curseur, Portée), le garder. L’interrupteur coupe l’effet sans remettre ces curseurs à zéro.
- Éteint : le pointeur ne fait plus rien. Les valeurs des curseurs restent. La personne peut enregistrer cette version sous un nouveau nom.
- N’écouter la souris que lorsque l’interrupteur est allumé.

Pour la boule de feu : ne pas ajouter cet interrupteur.

---

## 1. Lattice Flight

Commande : `npx originkit@latest add lattice-flight --prompt`

Écran : toile cyan dans le noir, vue en perspective.

| Réglage | Valeur |
| --- | --- |
| Fond | `#000000` |
| Couleur de base | `#00FFFF` |
| Densité | 307 % |
| Vitesse | 27 |
| Épaisseur | 4 % |
| Brouillard | 100 % |
| Distance | 3 |
| Caméra | −43 · 65 |

Curseur : oui. L’écran ne montre pas de curseur « Hover », mais il a été demandé explicitement de pouvoir couper la réaction à la souris, comme sur les autres fonds qui suivent le pointeur. Interrupteur activé par défaut. S’il n’y a aucune réaction dans le source, ne pas en inventer une : le noter et laisser l’interrupteur sans effet visible plutôt que de fabriquer un comportement.

## 2. Light Cables

Commande : `npx originkit@latest add light-cables --prompt`

Écran : faisceau de câbles jaunes qui part du haut et s’étale vers le bas.

| Réglage | Valeur |
| --- | --- |
| Fond | `#000000` |
| Couleur de base | `#000000` |
| Accent | `#FFB000` |
| Surbrillance | `#FFD900` |
| Vitesse | 34 |
| Survol | 114 % |
| Saisie (Grab) | 100 % |
| Direction | Haut vers bas |
| Position X | −13 % |
| Faisceau (Bundle) | 48 · 0 · 89 |
| Flux (Flow) | 300 · 1 |

Curseur : oui. Garder Survol et Saisie. L’interrupteur les laisse en place et, éteint, ignore le pointeur.

## 3. Liquid Vortex

Commande : `npx originkit@latest add liquid-vortex --prompt`

Écran : spirale jaune sur noir, aspect fumée / braise.

| Réglage | Valeur |
| --- | --- |
| Fumée | `#FFF700` |
| Ombre | `#FFF700` |
| Braise | `#FFF700` |
| Tourbillon | 10 |
| Turbulence | 20 |
| Détail | 20 |
| Densité | 4 |
| Contraste | 20 |
| Braises | 0 |
| Vitesse | 5 |
| Boost de survol | 20 |
| Taille | 100 % |

Curseur : oui. Garder le boost de survol. L’interrupteur, éteint, ignore le pointeur.

## 4. Mood Field

Commande : `npx originkit@latest add mood-field --prompt`

Écran : nappes magenta sur fond presque noir. Humeur Intense.

| Réglage | Valeur |
| --- | --- |
| Fond | `#05060A` |
| Couleur intense | `#FF00B3` |
| Couleur calme | `#2F6BFF` |
| Humeur | Intense |
| Vitesse | 50 |
| Densité | 100 % |
| Amortissement | 50 % |
| Flux | 100 · 100 · 100 |
| Curseur | 260 · 100 · 80 |

Curseur : oui. Garder la puce Curseur. L’interrupteur, éteint, ignore le pointeur. Humeur est une liste (au moins Intense ; lire le source pour les autres valeurs).

## 5. Rain Puddle

Commande : `npx originkit@latest add rain-puddle --prompt`

Écran : pluie verte, flaques et ronds dans l’eau, vue légèrement inclinée.

| Réglage | Valeur |
| --- | --- |
| Fond | `#000000` |
| Couleur de base | `#03661A` |
| Accent | `#FFFFFF` |
| Pluie | 100 % |
| Vitesse | 100 |
| Inclinaison | 25° |
| Flaques | 62 · 170 · 150 |
| Gouttes | 100 · 70 |
| Curseur | 54 · 100 · 60 |

Curseur : oui. Garder la puce Curseur. L’interrupteur, éteint, ignore le pointeur.

## 6. Snow Fall

Commande : `npx originkit@latest add snowfall --prompt`

Écran : flocons blancs sur fond noir, qui descendent.

| Réglage | Valeur |
| --- | --- |
| Nombre | 632 |
| Vent | −1 |
| Variation du vent | 0 |
| Taille min | 0,5 px |
| Taille max | 1,5 px |
| Vitesse min | 0,8 |
| Vitesse max | 2,7 |
| Opacité min | 30 % |
| Opacité max | 90 % |
| Direction | Bas |
| Couleur | `#FFFFFF` |
| Fond | `#00000000` |

Le fond est noté sur huit caractères (`#00000000`), donc avec une couche de transparence. Le sélecteur de couleur de l’atelier n’accepte aujourd’hui que six caractères. Lire le source : si le fond est vraiment transparent, le poser sur le noir de la page sans casser les autres fonds.

Curseur : oui. Demandé explicitement, même si l’écran ne montre pas de réglage Survol. Même règle que Lattice Flight : interrupteur activé par défaut, et pas d’effet inventé si le source n’écoute pas la souris.

Direction est une liste. L’écran montre Bas. Lire le source pour les autres sens.

## 7. Toon Fireball 3

Commande : `npx originkit@latest add toonfireball-03 --prompt`

Écran : boules de feu rouges, traînées, fond noir. Pas de réaction au curseur à prévoir.

| Réglage | Valeur |
| --- | --- |
| Fond | `#000000` |
| Couleur de base | `#ED7363` |
| Accent | `#FFFFFF` |
| Densité | 18 |
| Taille | 182 % |
| Vitesse | 21 |
| Angle | −45° |
| Inclinaison | 45° |
| Feu | 3 couleurs |
| Éclat (Bloom) | 172 · 39 |

Curseur : non. Ne pas ajouter l’interrupteur.

La puce Feu (« 3 Colors ») et la puce Éclat sont à mapper depuis le source, pas à deviner.

## 8. Wire Terrain

Commande : `npx originkit@latest add wire-terrain --prompt`

Écran : grille orange, soleil orange bandé, relief, style fil de fer. Pas d’étoiles sur cet écran.

| Réglage | Valeur |
| --- | --- |
| Fond | `#000000` |
| Couleur des lignes | `#B12B00` |
| Accent | `#FF3C00` |
| Densité | 120 |
| Vitesse | 100 |
| Relief | 100 % |
| Taille du soleil | 100 % |
| Hauteur de caméra | 94 % |
| Survol | 200 % |

Curseur : oui. Garder Survol. L’interrupteur, éteint, ignore le pointeur.

Le libellé à l’écran est tronqué (« Camera Hei… »). C’est la hauteur de caméra, à confirmer dans le source.

## 9. Wire Terrain 2

Commande : `npx originkit@latest add wire-terrain-02 --prompt`

Écran : même genre de terrain, lignes magenta, soleil jaune, ciel violet étoilé.

| Réglage | Valeur |
| --- | --- |
| Fond | `#0B0420` |
| Couleur des lignes | `#FF2BD6` |
| Accent | `#FFB23F` |
| Densité | 80 |
| Vitesse | 50 |
| Relief | 100 % |
| Taille du soleil | 100 % |
| Hauteur de caméra | 100 % |
| Survol | 100 % |
| Étoiles | 50 % |

Curseur : oui. Garder Survol. L’interrupteur, éteint, ignore le pointeur.

C’est un composant distinct de Wire Terrain, pas une variante enregistrée du premier. Les étoiles n’existent que sur celui-ci.

## 10. Particle Drift

Commande : `npx originkit@latest add particle-drift --prompt`

Écran : réseau de points blancs reliés par des traits fins, sur fond très sombre. La couleur de survol est jaune.

| Réglage | Valeur |
| --- | --- |
| Fond | `#030509` |
| Couleur de base | `#FFFFFF` |
| Couleur de survol | `#FDFD00` |
| Densité | 400 |
| Taille des points | 6 px |
| Vitesse | 50 |
| Direction | 0° |
| Intensité du survol | 200 % |
| Densité des liens | 230 |
| Épaisseur des liens | 1 px |

Curseur : oui. Garder la couleur de survol et l’intensité. L’interrupteur, éteint, ignore le pointeur : les points ne passent plus au jaune sous la souris, l’intensité reste à 200 pour quand on le rallume.

Le libellé à l’écran est tronqué (« Hover Inten… »). C’est l’intensité du survol, à confirmer dans le source.

## 11. Formula Stream

Commande : `npx originkit@latest add formula-stream --prompt`

Écran : formules mathématiques qui défilent, texte clair, accent orange, fond presque noir.

| Réglage | Valeur |
| --- | --- |
| Fond | `#0A0A0C` |
| Couleur du texte | `#E8E4DC8C` |
| Accent | `#FF4900` |
| Police | Georgia, Regular, 26 |
| Densité | 18 |
| Vitesse | 69 |
| Courbe | 50 |
| Écart | 81 px |
| Survol | 139 % |
| Portée | 240 px |

Curseur : oui. Garder Survol et Portée. L’interrupteur, éteint, ignore le pointeur.

La couleur du texte est sur huit caractères (`#E8E4DC8C`) : elle a une transparence. Le sélecteur actuel n’accepte que six caractères. La conserver, sinon le texte ne correspond plus à l’écran.

La police est un choix de famille, de graisse et de taille, pas un simple curseur. L’atelier n’a pas encore ce type de champ.
