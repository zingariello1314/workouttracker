# Spécification — Sous-onglet **Récap** (Sport)

Document unique : synthèse des échanges + décisions actées + plan d’implémentation.  
Objectif : ne rien oublier avant le code.

---

## 1. Position produit

- **Nom** : Récap (version « coach » : lecture + prescriptif).
- **Place dans l’UI** : **premier** sous-onglet de l’onglet **Sport**, **juste avant** « Aujourd’hui ».
- **Promesse** : vue synthétique du **volume / fatigue / équilibre** par groupe musculaire, avec **mémoire temporelle** (decay) et **intégration force + cardio** sans surestimer ni effacer le cardio.

---

## 2. Réponse à : « Le sous-onglet Exercices devrait faire le taf ? »

**Tranché : partiellement.**

| Rôle | Où ça vit |
|------|-----------|
| **Donnée source** : quel exercice sollicite quel(s) muscle(s), pondération | Idéalement **catalogue / fiches exercice** (aujourd’hui souvent l’onglet **Exercices** ou les métadonnées d’exo dans le programme). C’est là qu’on **édite** les tags (`primaryMuscles`, `secondaryMuscles`, fractions). |
| **Agrégation + affichage** : périodes, decay, couleurs, suggestions, score d’équilibre | **Récap** uniquement — composant « body map » + moteur de stats. |

**Conclusion** : l’onglet **Exercices** (ou l’éditeur d’exo) doit **fournir ou compléter** le mapping muscle → exo si ce n’est pas déjà exploitable partout. Le **Récap** ne « devine » pas l’anatomie à partir du nom ; il **consomme** un référentiel stable. Si le mapping est incomplet, le Récap affiche des zones « grises » ou un bandeau « données muscle manquantes pour N exos ».

---

## 3. Périodes & persistance UX

**Vues** (toutes obligatoires dans le périmètre cible) :

1. **Aujourd’hui**
2. **7 jours**
3. **30 jours**
4. **Toujours** — **décision** : **cumul depuis la première donnée enregistrée** pour cet utilisateur (pas de date arbitraire « 1970 » ; libellé clair du type : *« depuis le … »* si on connaît la première activité).

**Persistance** : mémoriser la **dernière vue** sélectionnée (localStorage ou préférences utilisateur déjà existantes dans l’app) pour rouvrir directement dessus → réduit la friction.

---

## 4. Corps humain interactif — approche visuelle (validée)

**Approche retenue (pro)** :

- **2 PNG** de fond (face + dos), qualité soignée : `public/assets/muscle/vuedeface.png`, `public/assets/muscle/vuededos.png` (sources dans `garmin-server/imagemuscle/`).
- **Par-dessus** : **zones cliquables** — **SVG ou `div` en `position: absolute`** — **positionnées manuellement** (pourcentages `top/left/width/height` recommandés pour le responsive, plutôt que pixels fixes seuls).
- **Couche « teinte »** : overlay par zone avec `background` / `fill` dynamique (opacité ~0.25–0.5) + transitions CSS.
- **Interdit comme stratégie principale** : « découper le PNG automatiquement » ou compter sur une IA pour les contours anatomiques — **non fiable**.

**Fichiers logiques** (à créer au moment de l’implémentation) :

```
public/assets/muscle/vuedeface.png
public/assets/muscle/vuededos.png
src/components/sport/recap/BodyMap.jsx
src/components/sport/recap/muscleZones.js   // ou .json — géométrie + id muscle
```

**Switch face / dos** : état React `view: 'front' | 'back'` ; même jeu de **ids logiques** (`pecs`, `upper_back`, …) pour les deux vues (deux jeux de coordonnées dans `muscleZones` si besoin).

---

## 5. Légende latérale & contenu par muscle

Pour chaque groupe (ou au clic) :

- **Nom** du muscle / zone.
- **Charge totale pondérée** (voir §7–8).
- **Nombre total de reps** (force) et/ou **équivalent volume cardio** traduit (voir §8) — libellés distincts pour ne pas mélanger brut et « équivalent ».
- **Top 3 exercices** (nom + reps ou métrique affichée).

**Traits** reliant le muscle à la légende : **phase 2** (joli mais fragile responsive) ; **MVP** : liste alignée / tooltip / panneau latéral sans fils.

---

## 6. Échelle de couleur « dégradé intelligent »

**Principe** : une **valeur scalaire continue** par muscle (`stressIndex` ou `loadRatio` normalisé), puis :

- **Mapping** vers couleur (interpolation HSL ou gradient CSS) pour granularité fine.
- **Légende texte** avec les **seuils nommés** (gris → bleu froid → … → violet / zone critique) — les libellés servent à l’**interprétation**, le moteur reste continu.

**Garde-fous UX** : éviter les formulations médicales absolues (« risque blessure ») ; préférer « charge très élevée », « signal de fatigue », etc.

---

## 7. Mémoire musculaire (decay)

**Objectif** : un muscle travaillé récemment reste « chargé » puis **redescend** dans le temps.

**Forme de référence** (à calibrer avec des constantes) :

- Contribution d’une session à la date \(t_i\) avec charge brute \(L_i\) :  
  `effective += L_i * exp(-λ * (t_now - t_i))`  
  avec \(t\) en **jours** (ou heures si besoin de finesse intrajournalière).
- **λ** : global au MVP ; **par groupe** en v2 si on veut coller plus à la « réalité ».

**Une seule grandeur de base** pour dériver : couleur du corps **et** statut récupération (§9) — évite les incohérences rouge/violet vs 🟢 récup.

---

## 8. Force vs cardio — intégration cohérente (décision de direction)

**Problème** : mélanger reps × coeff **brut** avec du cardio sans règles → soit le cardio **disparaît**, soit il **explose** visuellement.

**Direction tranchée** :

1. **Deux canaux internes** (toujours calculés) :
   - **Force** : agrégation existante (reps, séries, coefficients difficulté, `computeStrength…` / équivalent déjà dans l’app).
   - **Cardio** : sessions **endurance** + **Garmin** (si présentes) : durée, distance, D+, FC moyenne / TRIMP simplifié — réutiliser les briques déjà présentes (`trainingLoadUtils`, endurance, etc.) plutôt que réinventer.

2. **Traduction cardio → impact « muscle / global »** (MVP raisonnable) :
   - **Impact global système** (fatigue générale, récupération) : une **charge cardio normalisée** sur la fenêtre (ex. 0–100) qui **modifie un plafond** ou un **facteur multiplicateur doux** sur l’affichage « stress global », **sans** peindre les pecs en rouge uniquement parce qu’on a couru 10 km (sauf si on a un modèle « running → jambes + core » explicite).
   - **Impact par muscle** (v1.5 / v2) : table **optionnelle** `activityType → [(muscleId, weight)]` (ex. course → `quads`, `calves`, `cardio_system`). Poids **faibles** par défaut pour ne pas **surestimer** ; ajustables.

3. **Affichage** : où c’est pertinent, **décomposer** (« Force : … · Cardio : … ») pour transparence ; la **couleur** du muscle peut combiner `f(forceMuscle) + g(cardioMuscle)` avec **g** borné (ex. max 30 % de la contribution couleur).

4. **Calibration** : tests sur utilisateur réel ; comparer « sensation » vs graph ; ajuster λ et les poids cardio **par type d’activité**.

---

## 9. Score d’équilibre musculaire (Balance)

- Comparer au minimum **push / pull** et **haut / bas** (tags sur les groupes).
- Score type : \(100 \times (1 - \text{déséquilibre normalisé})\) avec **alertes textuelles** (« jambes sous-représentées sur 30 j », « push > pull »).
- **Gauche / droite** : seulement si données **unilatérales** ou exos tagués — sinon **hors MVP**.

---

## 10. Indicateur récupération par muscle (🟢🟡🔴)

Basé sur la **même** charge effective + decay + **fréquence** (nombre de hits dans la fenêtre) + **temps depuis dernière sollicitation**.

- 🟢 prêt / 🟡 récupération / 🔴 fatigué — seuils configurables ; libellés prudents.

---

## 11. Suggestions intelligentes

Sous le visuel (ou panneau dédié) :

- **À entraîner aujourd’hui** : groupes à faible charge effective + pas en 🔴.
- **À éviter / léger** : 🔴 ou surcharge.
- **En retard** : écart au profil push/pull/haut/bas.

**Priorité utilisateur** (focus pecs, etc.) : **v2** — repriorise les suggestions et peut ajuster les cibles relatives.

---

## 12. Interaction clic muscle

- Panneau ou modal : évolution (mini graph), exos, volume, fréquence, intensité moyenne.
- **« Ajouter séance ciblée »** : lien vers flux existant (programme / exceptionnel) avec **pré-filtre** ou brouillon — à brancher sur ce que l’app supporte déjà.

---

## 13. Plan d’implémentation (phases — rien oublier)

### Phase A — Fondations (sans SVG parfait)

- [ ] Ajouter l’onglet **Récap** en **premier** dans la liste des sous-onglets Sport + route / lazy load si pattern existant.
- [ ] Persistance **dernière vue** (Aujourd’hui / 7j / 30j / Toujours).
- [ ] Module **`muscleRegistry`** : liste des `muscleId`, labels FR, tags (`push`, `pull`, `upper`, `lower`).
- [ ] Module **`exerciseMuscleMapping`** : lecture depuis données exo existantes ; fallback « inconnu ».
- [ ] Moteur **`computeMuscleLoads`window)** : force uniquement d’abord + decay ; sortie par `muscleId`.
- [ ] **Toujours** : même moteur avec fenêtre max (date min → aujourd’hui) + affichage **totaux** + date de début des données.
- [ ] UI liste / barres par muscle (fallback si PNG pas encore posés).

### Phase B — Body map (PNG + zones)

- [ ] Intégrer PNG face/dos + composant **`BodyMap`** (responsive, `object-fit`).
- [ ] Fichier **`muscleZones`** : coordonnées **%** par vue + `muscleId`.
- [ ] Overlays colorés branchés sur `stressIndex` + transitions.
- [ ] Clic zone → ouverture fiche (données Phase A).
- [ ] Légende latérale : nom, charge, reps, top 3.

### Phase C — Cardio

- [ ] Ingestion des sessions cardio / Garmin dans le moteur (canal séparé).
- [ ] Normalisation + **plafonds** + répartition optionnelle par muscle.
- [ ] Libellés UI « Force / Cardio » pour honnêteté du rendu.

### Phase D — Prescriptif

- [ ] Score d’équilibre + alertes.
- [ ] Statuts récupération 🟢🟡🔴 alignés sur le même indice que la couleur.
- [ ] Bloc suggestions (règles simples puis affinage).

### Phase E — Polish

- [ ] Traits légende ↔ muscle (si toujours pertinents).
- [ ] Priorités utilisateur.
- [ ] i18n (clés FR/EN), accessibilité (focus clavier, `aria-label` zones).

---

## 14. Checklist « qualité pro » (rappel)

- [ ] PNG de base **nettement** lisible (contraste, proportions).
- [ ] Zones **alignées** au pixel près sur plusieurs largeurs (test mobile).
- [ ] Pas de promesse médicale ; vocabulaire **coach / fitness**.
- [ ] Performances : **mémoïsation** du calcul lourd ; recalcul si `data` / fenêtre change.
- [ ] Tests manuels : 7j vs 30j vs Toujours + bascule face/dos + exo sans muscle tagué.

---

## 15. Fichiers / emplacements (indicatifs)

| Élément | Emplacement suggéré |
|--------|----------------------|
| Modèle 3D (app) | `public/models/anatomy_study_basemesh_human_male_body.glb` (copie depuis `garmin-server/imagemuscle/`) — rendu **Three.js** (`@react-three/fiber` + `@react-three/drei`) |
| Body map | `src/components/sport/recap/BodyMap.jsx` |
| Zones | `src/components/sport/recap/muscleZones.js` |
| Moteur agrégation | `src/utils/sport/muscleLoadEngine.js` (ou proche `trainingLoadUtils`) |
| Spec (ce doc) | `docs/sport/SPEC_SOUS_ONGLET_RECAP.md` |

---

*Dernière mise à jour : consolidation utilisateur (PNG+SVG, cardio+force, Toujours depuis toujours, rôle Exercices vs Récap).*
