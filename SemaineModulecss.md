# Module « Semaine » (page Séance du jour)

Fichiers : `SemaineModule.jsx` + `SemaineModule.css` (React 18, aucune dépendance, classes préfixées `wk-`).

## À quoi ça sert

Les 52 semaines ont le même contenu de programme. Le module sert à **choisir la semaine** dont on consulte ou corrige les séances (jusqu'à 52 semaines en arrière), à **voir le bilan** de cette semaine et à **repérer les changements de programme**. Chaque séance saisie ou corrigée garde sa vraie date : les analyses (Récap, XP, charge) regroupent par date, jamais par « semaine en cours ».

Placement : entre le bloc « Séance du jour » (titre + « Utiliser l'entraînement de ») et la rangée date / charge / activité.

## Données attendues (props)

| Prop | Forme | Rôle |
|---|---|---|
| `today` | `Date` | jour actuel (défaut : maintenant) |
| `selectedDate` / `onSelectDate` | `Date` / `(Date) => void` | jour sélectionné, pour synchroniser le reste de la page |
| `sessions` | `{ 'YYYY-MM-DD': { status: 'done'\|'part'\|'miss'\|'rest', load?: 0-100 } }` | état de la séance de chaque jour |
| `weighIns` | `{ 'YYYY-MM-DD': truthy }` | jours avec une pesée (compteur x/7) |
| `programNotes` / `onSaveProgramNote` | `{ 'YYYY-MM-DD du lundi': 'texte' }` / `(mondayKey, note\|null) => void` | changements de programme |
| `plannedPerWeek` | nombre, défaut 6 | séances prévues par semaine |
| `restDays` | `number[]`, défaut `[6]` | 0 = lundi … 6 = dimanche |
| `weeksBack` | nombre, défaut 52 | profondeur de l'historique |

Un jour sans entrée dans `sessions` est déduit : jour de repos → « repos », futur → vide, aujourd'hui → vide, passé → « non fait ».

## Les écrans (captures dans le même dossier)

### 1. Semaine en cours (`1-semaine-en-cours.png`)
Vue d'ouverture : jeudi 29 octobre 2026, semaine 44.
- **Ligne du haut** : titre « — SEMAINE », flèches ‹ › (semaine précédente / suivante), défilement des pastilles de semaines, bouton « Cette semaine » (grisé car on y est déjà).
- **Pastille de semaine** : `S44` = numéro de semaine ISO, puis ses dates. Fond vert = semaine choisie. Point vert = semaine en cours. Point bleu = programme modifié cette semaine-là. Le **trait fin sous la pastille** donne l'avancement : (séances complètes + 0,5 × partielles) ÷ séances prévues. Vert ≥ 90 %, ambre de 40 à 89 %, gris en dessous.
- **Bilan** : « 2 / 6 séances faites · 1 partielle », « Charge moyenne 85 % (+15 pts vs S43) » = moyenne de la charge réalisée sur les jours déjà passés et prévus (un jour non fait compte 0). Le delta compare à la semaine précédente. « 3 / 7 pesées » compte les jours avec une pesée.
- **Les 7 jours** : chacun affiche son état. Vert = séance complète (charge en %), ambre = partielle, « – » = non fait, « repos », vide = à venir. Le jour d'aujourd'hui a son nom en ambre. Le jour sélectionné a un fond vert. Les jours futurs ne se cliquent pas.
- **Bas** : « Aller à une date » et « Noter un changement de programme », plus la légende des deux points.

### 2. Semaine passée avec programme modifié (`2-semaine-passee-programme-modifie.png`)
S41 (5–11 octobre) sélectionnée.
- Le titre perd « · en cours » et le bilan parle de séances « complètes ».
- **Ligne bleue « Programme modifié : … »** : la note associée à cette semaine (point bleu sur la pastille).
- **Bandeau ambre** : rappel qu'on est sur une semaine passée. Tout ajout ou correction garde sa vraie date et met à jour les analyses de cette semaine.
- Les jours montrent la réalité de la semaine. Cliquer un jour sélectionne cette date pour le reste de la page (séance du jour, charge, pesée, exercices).

### 3. Note de programme (`3-note-de-programme.png`)
Après « Noter / Modifier la note de programme » : un champ texte, un bouton « Enregistrer » et « Retirer » si une note existe. Entrée valide. La note est liée au **lundi** de la semaine. Elle fait apparaître le point bleu et la ligne bleue du bilan. Elle sert de repère pour interpréter les analyses avant / après un changement de programme.

### 4. Semaine ancienne + « Aller à une date » (`4-semaine-ancienne-aller-a-une-date.png`)
Une semaine éloignée (ex. S20) et le champ date ouvert. Choisir une date place directement sur la bonne semaine et le bon jour (limité à `weeksBack` semaines en arrière et à aujourd'hui).

### 5. Mobile (`5-mobile.png`)
Sous 720 px : le bouton « Cette semaine » passe à droite du titre, le défilement des semaines prend toute la largeur, le bilan s'empile, les 7 jours restent sur une ligne.

## Règles à respecter dans le code

- Le défilement des semaines est un conteneur `overflow-x: auto` avec une grille parente en `minmax(0, 1fr)` : c'est ce qui empêche la longue liste de semaines d'élargir la carte (le bug de la première maquette).
- La semaine commence le lundi, numérotation ISO.
- On ne peut pas sélectionner une date future : le jour est ramené à aujourd'hui.
- Changer de semaine garde le même jour de la semaine (jeudi reste jeudi).
- Persister les notes côté app (le composant n'écrit rien lui-même quand `programNotes` est fourni).
