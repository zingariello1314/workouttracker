## Analyse du problème – Calendrier d’activité de lecture

### 1. Constat visuel (d’après les screenshots)

- **Référence GitHub (screen 1)**  
  - 1 colonne = 1 semaine.  
  - Les jours (lignes) sont organisés par weekday (Mon, Wed, Fri…).  
  - Le label de mois apparaît **au‑dessus de la première colonne** de la première semaine où ce mois commence (jour du mois dans les 7 premiers jours).
  - Même si un mois est vide, on voit quand même une grille de cases « vides » sous le label.

- **Calendrier actuel (screen 2 + screen 3)**  
  - Les mois sont affichés sur une ligne, mais **l’alignement perçu est faux** :
    - On a l’impression que la première colonne de jours commence sous « Mar » (rien d’apparent sous Jan / Fév).  
    - L’espace entre « Oct » et « Nov » ne correspond pas clairement à un changement de mois.  
  - Les cases de la heatmap sont bien visibles sur toute la largeur (après le changement de couleur pour l’intensité 0), mais la **structure colonnes/lignes ne correspond pas à celle de GitHub**.

### 2. Analyse du code actuel (`HeatmapCalendar.jsx`)

Points clés du composant :

- **Génération des dates**  
  - `generateYearDates(year)` crée un tableau de 365/366 dates au format `YYYY-MM-DD`.

- **Construction de `activityData`**  
  - On remplit un objet `activity[date]` pour chaque jour de l’année, en fusionnant les données `statisticsData.chartData.heatmap` avec des valeurs par défaut `{ pages: 0, minutes: 0, sessions: 0, books: [] }`.

- **Découpage par semaines – `weeklyData`**  
  ```js
  const weeklyData = useMemo(() => {
    const yearDates = generateYearDates(selectedYear);
    const weeks = [];
    let currentWeek = [];

    const firstDate = new Date(selectedYear, 0, 1);
    const firstDayOfWeek = firstDate.getDay(); // 0 = dimanche

    // Padding de la première semaine
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    yearDates.forEach(date => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      const data = activityData[date];
      const intensity = getIntensityLevel(data?.pages || 0, maxPages);
      currentWeek.push({ date, data, intensity });
    });

    // Compléter la dernière semaine
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);

    return weeks; // weeklyData = [ semaine0(7 jours), semaine1(7 jours), ... ]
  }, [selectedYear, activityData, maxPages]);
  ```

- **Affichage de la grille**
  ```jsx
  <div
    className="grid gap-1 mb-4"
    style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}
  >
    {weeklyData.map((week, weekIndex) => 
      week.map((day, dayIndex) => (
        <div key={`${weekIndex}-${dayIndex}`}>
          {day ? (
            <CalendarDay ... />
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>
      ))
    )}
  </div>
  ```

#### Observation importante

- Le container a bien `weekCount` **colonnes** (nombre de semaines).  
- **Mais les enfants ne positionnent pas explicitement leurs colonnes / lignes** :
  - On génère simplement `weekCount * 7` `<div>` les uns à la suite des autres.
  - Le CSS Grid les place **en flux de lecture (row-major)** : on remplit la première ligne de gauche à droite, puis la suivante, etc.
  - Résultat : la structure réelle est :
    - **Colonnes ≈ jours consécutifs**,  
    - et **lignes ≈ « rangées de 53 cases »**,  
    - alors que conceptuellement on croit avoir 1 colonne = 1 semaine.

Conséquence :

- Quand on calcule les labels de mois par **indice de semaine (`weekIndex`)**, on suppose que `weekIndex` correspond à une colonne spécifique.  
- En réalité, les cases ne sont pas groupées par colonnes de semaines, donc les labels de mois **ne tombent pas au‑dessus de la bonne « colonne visuelle »**.

### 3. Pourquoi Jan / Fév semblent vides et le décalage Oct / Nov

- Janvier et Février 2026 n’ont actuellement **aucune activité** dans `statisticsData.chartData.heatmap` → toutes les cases de ces dates sont en intensité 0 (gris très sombre).  
- À cause de la structure de grid (remplissage par lignes complètes), ces cases « vides » ne sont pas clairement perçues comme appartenant aux colonnes de Jan/Fév :  
  - Les carrés commencent là où l’œil repère les premières activités, autour de Mars.  
  - Le label « Nov » se place sur une colonne calculée par `weekIndex`, mais la répartition réelle des cases ne correspond pas visuellement à « 1 colonne = 1 semaine ».

En résumé : **le bug n’est pas dans les données ni dans les intensités de couleurs, mais dans la façon dont on mappe `weeklyData` sur la grille CSS**.

### 4. Plan de correction (approche robuste, type GitHub)

Objectif : Faire en sorte que :

- **1 colonne de la grille = 1 semaine**.  
- **7 lignes = 7 jours de la semaine** (par exemple Dim → Sam).  
- Les labels de mois s’alignent sur les colonnes de semaines, comme sur le heatmap GitHub.

#### Étape 1 – Changer le mapping sur la grille

Au lieu de :

- `gridTemplateColumns: repeat(weekCount, ...)`,  
- puis `weeklyData.map(week => week.map(day => <div>…</div>))` sans coordonnées explicites,

on fera :

- Toujours `gridTemplateColumns: repeat(weekCount, ...)`.  
- Toujours `gridTemplateRows: 'repeat(7, minmax(0, 1fr))'` (pour les 7 jours).
- Pour chaque semaine `weekIndex` et chaque jour `dayIndex` (0–6), **on placera le carré explicitement** :

```jsx
{weeklyData.map((week, weekIndex) =>
  week.map((day, dayIndex) => {
    const gridColumn = weekIndex + 1;
    const gridRow = dayIndex + 1; // 1 à 7
    return (
      <div
        key={`${weekIndex}-${dayIndex}`}
        style={{ gridColumn, gridRow }}
      >
        {day ? (
          <CalendarDay ... />
        ) : (
          <div className="w-3 h-3" />
        )}
      </div>
    );
  })
)}
```

Ainsi :

- La colonne 1 contiendra **tous les jours de la semaine 1**,  
- la colonne 2 tous les jours de la semaine 2, etc.,  
- exactement comme GitHub.

#### Étape 2 – Labels de mois calés sur les semaines

- Garder la logique `monthLabelsByWeek` mais maintenant **les indices de colonnes et la structure visuelle sont cohérents** :
  - `weekIndex` correspond vraiment à la colonne où se trouvent les cases de cette semaine.
- On garde la règle GitHub : label du mois sur la **première semaine où le mois commence et où le jour du mois ≤ 7**.

#### Étape 3 – Améliorer la lisibilité des jours sans activité

- Garder une couleur de base visible (`bg-slate-700/40`) pour l’intensité 0, de façon à :
  - voir visuellement que la grille commence bien dès Janvier, même si tu n’as pas encore lu,
  - vérifier plus facilement l’alignement des mois / colonnes sans se laisser tromper par les seules cases colorées.

#### Étape 4 – Tests visuels

1. **Cas sans activité** : année sans aucune lecture →  
   - Tous les carrés en gris clair,  
   - les mois alignés façon GitHub (Jan, Fév, Mar… espacés correctement).

2. **Cas avec activité sur quelques jours précis** (par ex. une session le 4 janvier, une le 15 mars) →  
   - Vérifier que les cases colorées se trouvent bien dans les colonnes attendues par rapport aux labels de mois.

3. **Année bissextile** → s’assurer que le nombre de semaines (`weekCount`) reste cohérent et que les labels ne “débordent” pas.

---

**Prochaine étape** : appliquer ce plan dans `HeatmapCalendar.jsx` en modifiant uniquement :

- le container grid (ajout de `gridTemplateRows`),  
- le mapping `weeklyData → cellules` (ajout de `gridColumn` / `gridRow`),  
- les couleurs d’intensité 0 (déjà ajustées),  
sans toucher à la structure des données (`statisticsData.chartData.heatmap`), afin de ne pas casser le reste des statistiques de lecture.

