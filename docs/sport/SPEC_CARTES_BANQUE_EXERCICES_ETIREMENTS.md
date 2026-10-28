# Spec — structure des cartes banque (exercices & étirements)

Référence pour **recréer exactement** les futures cartes. Sources UI :
`SportBankExerciseCard.jsx`, `StretchBankCarouselCard.jsx`, `PathologyStretchCard.jsx`.

## 1. Carte exercice (banque commune)

### Données (`exerciseDatabase[key]`)

| Champ | Type | Obligatoire | Affiché sur la carte |
| --- | --- | --- | --- |
| `name` | string | oui | Titre |
| `category` | string (zone FR) | oui | Tag muscle / sous-titre |
| `primaryMuscles` | string[] | oui | Ligne « Primaires » |
| `secondaryMuscles` | string[] | non | Ligne « Secondaires » |
| `equipment` | string | oui | Bloc équipement |
| `description` | string | oui | Extrait notes (3 lignes) |
| `variations` | string[] | recommandé | Recherche / alias (pas UI carte) |
| `difficulty` | 1–4 | recommandé | « Niv. X/4 » |
| `isNew` | boolean | non | Badge New |
| `instructions` | string | non | Fiche détail |
| `contraindications` | string[] | non | Fiche détail |

Clé DB = identifiant stable FR minuscule (`"développé couché"`, `"pompes archer"`).

Zones `category` connues : Abdominaux, Activités Complémentaires, Avant-bras, Biceps, Dorsaux, Épaules, Fessiers, Ischio-jambiers, Mollets, Pectoraux, Quadriceps, Triceps.

### Présentation UI (grille)

1. Titre + étoiles difficulté référentiel + coeff intensité  
2. Bouton « Ajouter au programme » (si auth)  
3. Tags : New · type d’exercice · discipline · zone · niveau  
4. Média **300px** : GIF carte (`bankMediaManifest.exercises['db:'+key].card`) sinon stand-in vidéo GIF, sinon preview anatomie  
5. Muscles primaires / secondaires  
6. Équipement (+ max enregistré)  
7. Description courte  
8. Hint ouverture fiche  

Média lié via `src/data/bankMediaManifest.json` → clé `db:<databaseKey>`.

### Entrée manifest type

```json
{
  "card": { "mediaId": "...", "sourcePath": "troisieme dossier gif/pectorals/….gif", "sourceCollection": "troisieme dossier gif", "sha256": "…" },
  "gif": { …même objet… },
  "videos": [ { "mediaId": "...", "sourcePath": "videos muscles/….mp4", … } ]
}
```

Priorité carte : `troisieme dossier gif` > `quatrieme` > `gifs` > `lesderniersgifs`.

---

## 2. Carte étirement

### Données (`stretchDatabase[key]`)

| Champ | Type | Obligatoire | Affiché carte |
| --- | --- | --- | --- |
| `name` | string | oui | Titre |
| `category` | string | oui | Tag catégorie |
| `bodyZone` | string | oui | Tag zone (Target) |
| `primaryMuscles` | string[] | oui | Preview anatomie |
| `secondaryMuscles` | string[] | non | Preview |
| `equipment` | string | oui | Filtres |
| `defaultDuration` | number (s) | oui | Durée |
| `position` | string | recommandé | Fiche |
| `difficulty` | 1–4 | oui | Niv. |
| `description` | string | oui | Fiche / contexte |
| `instructions` | string | oui | Fiche |
| `contraindications` | string[] | recommandé | Fiche |
| `variations` | string[] | recommandé | Recherche |

Clé = snake_case ASCII (`respiration_nasale_lente`).

### Présentation UI

Titre + XP · Ajouter · tags zone/catégorie/durée/niveau · média ~220px (anatomie + GIF si lié) · note ressenti.

Manifest : `bankMediaManifest.stretches['stretch:'+key]` (même forme card/gif/videos).

---

## 3. Carte pathologie / étirement patho

Même socle étirement + dosage éventuel, sélection multi, bordure teal. Données via catalogue pathologie (`pathologyHelpers` / utils banque patho) — ne pas dupliquer un stretch déjà en banque générale.

---

## 4. Règles anti-doublons (GIF → carte)

1. Si le GIF matche une fiche existante (nom / variations / match EXACT|HIGH) → **lier le média**, ne pas créer de carte.  
2. `quatrieme dossier gif` = ids opaques, souvent **doublons binaires** de `troisieme` → ne pas créer de 2ᵉ fiche.  
3. Stretch dans le nom / dossier → banque **étirements**, pas exercices.  
4. Pathologie / rehab explicite → banque patho si pertinent.  
5. Création zone par zone (Pectoraux → Épaules → Dos → …).

## 5. Vérification séparation + conformité batches GIF (2026-10-28)

Script : `node scripts/apply-zone-bank-cards.mjs --enrich-all`

- **0** étirement dans les batches exercices ; **0** exercice de force dans les batches étirements  
- Champs exercices batch = `name, category, primaryMuscles, secondaryMuscles, equipment, difficulty, isNew, description, variations` (identique aux fiches `isNew` manuelles)  
- Champs étirements batch = schéma complet stretch (durée, position, instructions, contre-indications, …)  
- Chevauchements de **noms** préexistants (hors batches GIF) : mobilité catalog ↔ exercices (`wall sit`, `dead bug`, `bird dog`, `bear crawl`, `step-down contrôlé`) — déjà là avant l’import GIF  

## 6. Chiffres audit

Voir `AUDIT_BANQUE_GIF_PAR_ZONE.md` + `AUDIT_GIF_INUTILISES.md`.

Batches : pectoraux · épaules-dos-bras · abs-jambes-fessiers-cardio.  
