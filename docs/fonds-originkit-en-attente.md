# Fonds Originkit encore à ajouter

Écrit le 29 septembre 2026. Mis à jour le 6 octobre 2026.

## État au 6 octobre 2026

### Téléchargés aujourd’hui (sources dans `src/components/originkit/ui/`)

| Composant | Source | Porté dans Paramètres > Apparence |
| --- | --- | --- |
| Lattice Flight | `lattice-flight.tsx` | **Oui** — id `lattice-flight` (« Vol de lattice ») |
| Light Cables | `light-cables.tsx` | Non — source prêt, port worker à finir |
| Liquid Vortex | `liquid-vortex.tsx` | Non — source prêt (Three/WebGL), port à finir |
| Mood Field | `mood-field.tsx` | Non — source prêt, port à finir |
| Rain Puddle | `rain-puddle.tsx` | Non — source prêt, port à finir |

Quota Originkit : **épuisé** après ces 5 (`resets in ~22h`). Ne pas inventer de shader pour les 6 restants.

### Encore à télécharger (après reset du quota)

Snow Fall, Toon Fireball 3, Wire Terrain, Wire Terrain 2, Particle Drift, Formula Stream — commandes plus bas.

Ne pas inventer un shader de remplacement. Lancer la commande indiquée, puis porter le vrai source dans un worker, comme les fonds déjà en place.

Ne pas écrire la clé API dans un fichier. L’exporter seulement dans le shell (`ORIGINKIT_API_KEY`), lancer la commande, puis la retirer. Ne pas la committer.

## Déjà dans l’application — ne pas les refaire

Momentum (vert, ne pas y toucher), Saturne, Disque d’accrétion, Vortex de chaînes, Cellules chromées, Cosmos, Champ d’herbe, Tornade, **Vol de lattice**.

Déjà réglé sur place, à ne pas casser :

- Cellules chromées : interrupteur **Curseur**, activé par défaut. Le curseur Survol reste.
- Champ d’herbe : interrupteur **Repousser**, activé par défaut, et **Distance caméra** de 40 à 240, valeur d’origine 160.
- Tornade : **Repousser** activé par défaut (valeurs d’écran déjà documentées).
- Vol de lattice : interrupteur **Curseur** (drag caméra), valeurs d’écran (fond `#000`, base `#00FFFF`, densité 307, vitesse 27, épaisseur 4, brouillard 100, distance 3, caméra −43 · 65).

Les versions enregistrées sous un nouveau nom restent dans `localStorage`. Les fonds de base sont dans le code.

## Règles communes

- Atelier : aperçu live, paramètres, plein écran, pause, recommencer, état d’origine.
- Enregistrer → nouvel id `variant-…`, jamais écraser l’original.
- Pas de montage React Originkit dans la page : worker + canvas.
- Valeurs d’origine = écrans ci-dessous. Libellés FR. Interrupteur curseur sauf Toon Fireball.
- Miniature statique. Registry + studio. Ne pas toucher `AnimatedBackground.jsx`.
- Test : `src/backgrounds/__tests__/appBackgroundPreference.test.js`.

---

## À porter (sources déjà téléchargés)

### Light Cables

Fond `#000000`, base `#000000`, accent `#FFB000`, surbrillance `#FFD900`, vitesse 34, survol 114 %, saisie 100 %, direction Haut→bas, position X −13 %, faisceau 48 · 0 · 89, flux 300 · 1. Curseur : oui.

### Liquid Vortex

Fumée/ombre/braise `#FFF700`, tourbillon 10, turbulence 20, détail 20, densité 4, contraste 20, braises 0, vitesse 5, boost survol 20, taille 100 %. Curseur : oui.

### Mood Field

Fond `#05060A`, intense `#FF00B3`, calme `#2F6BFF`, humeur Intense, vitesse 50, densité 100 %, amortissement 50 %, flux 100 · 100 · 100, curseur 260 · 100 · 80. Curseur : oui.

### Rain Puddle

Fond `#000000`, base `#03661A`, accent `#FFFFFF`, pluie 100 %, vitesse 100, inclinaison 25°, flaques 62 · 170 · 150, gouttes 100 · 70, curseur 54 · 100 · 60. Curseur : oui.

---

## Encore à télécharger (quota)

## Snow Fall — `npx originkit@latest add snowfall --prompt`

Nombre 632, vent −1, tailles 0,5–1,5 px, vitesses 0,8–2,7, opacités 30–90 %, direction Bas, couleur `#FFFFFF`, fond `#00000000`. Curseur : oui.

## Toon Fireball 3 — `npx originkit@latest add toonfireball-03 --prompt`

Fond `#000000`, base `#ED7363`, accent `#FFFFFF`, densité 18, taille 182 %, vitesse 21, angle −45°, inclinaison 45°, feu 3 couleurs, éclat 172 · 39. Curseur : **non**.

## Wire Terrain — `npx originkit@latest add wire-terrain --prompt`

Fond `#000000`, lignes `#B12B00`, accent `#FF3C00`, densité 120, vitesse 100, relief 100 %, soleil 100 %, hauteur caméra 94 %, survol 200 %. Curseur : oui.

## Wire Terrain 2 — `npx originkit@latest add wire-terrain-02 --prompt`

Fond `#0B0420`, lignes `#FF2BD6`, accent `#FFB23F`, densité 80, vitesse 50, relief/soleil/hauteur 100 %, survol 100 %, étoiles 50 %. Curseur : oui. Composant distinct.

## Particle Drift — `npx originkit@latest add particle-drift --prompt`

Fond `#030509`, base `#FFFFFF`, survol `#FDFD00`, densité 400, points 6 px, vitesse 50, direction 0°, intensité survol 200 %, liens 230 / 1 px. Curseur : oui.

## Formula Stream — `npx originkit@latest add formula-stream --prompt`

Fond `#0A0A0C`, texte `#E8E4DC8C`, accent `#FF4900`, police Georgia Regular 26, densité 18, vitesse 69, courbe 50, écart 81 px, survol 139 %, portée 240 px. Curseur : oui.
