# État des Lieux - Intégration Garmin

## Date: 2025-01-27

## Analyse des Problèmes Identifiés

D'après les captures d'écran de votre app Garmin et la comparaison avec les données affichées dans l'application, plusieurs problèmes ont été identifiés:

### 1. Données manquantes ou erronées

#### Steps/Pas
- **Problème**: Les données affichées ne correspondent pas aux vraies données Garmin
- **Données réelles Garmin**:
  - 30/10: 1859 pas
  - 29/10: 5306 pas
  - 28/10: 4660 pas
  - 27/10: 5574 pas
- **Cause**: La méthode `get_steps_data()` de l'API peut retourner différents formats (dict, list, int)
- **Correction**: Amélioration de la normalisation pour gérer tous les formats possibles

#### FC Max (Fréquence Cardiaque Maximale)
- **Problème**: La FC max n'était pas récupérée
- **Données réelles Garmin**:
  - 30/10: 105 bpm
  - 29/10: 170 bpm
  - 28/10: 172 bpm
  - 27/10: 140 bpm
- **Cause**: Le script Python ne récupérait que la FC repos
- **Correction**: Ajout de la récupération de la FC max depuis `stats` et calcul depuis la time series HR si nécessaire

#### Distance
- **Problème**: La distance affichée était à 0 km pour toutes les dates
- **Cause**: La distance peut être en mètres ou km selon l'API
- **Correction**: Normalisation pour détecter l'unité et convertir en km si nécessaire

#### Calories Actives/Repos
- **Problème**: Les calories actives et repos n'étaient peut-être pas bien séparées
- **Données réelles Garmin**:
  - Calories totales: 1978-3032 selon la date
  - Calories actives/repos séparées
- **Correction**: Amélioration de la récupération des calories actives et repos avec plusieurs clés possibles

#### Sommeil
- **Problème**: Les données de sommeil étaient incomplètes ou manquantes
- **Données réelles Garmin**:
  - 30/10: 5h54m
  - 29/10: 9h19m
  - 28/10: 7h29m
- **Cause**: La durée peut être en secondes, minutes ou heures selon l'API
- **Correction**: Normalisation pour détecter l'unité et convertir en heures

### 2. Activités Natation

#### Distance et Laps
- **Problème**: Les activités de natation n'étaient pas récupérées correctement
- **Données réelles Garmin**:
  - 28/10: 150m + 50m = 200m total
  - Distance totale: 200m
- **Cause**: La distance peut être en mètres ou km, les laps peuvent être dans plusieurs champs
- **Correction**: Amélioration de la normalisation de la distance et récupération des laps depuis plusieurs sources

### 3. Port du Serveur

- **Problème**: Le serveur Node utilisait le port 3001 par défaut au lieu de 3031
- **Cause**: Le code utilisait `process.env.PORT || 3001` au lieu de `3031`
- **Correction**: Changement du port par défaut à 3031 pour éviter les collisions avec Vite

## Corrections Apportées

### Script Python (`fetch_garmin_data.py`)

1. **Normalisation Steps**:
   - Gestion de plusieurs formats (dict, list, int)
   - Somme des steps si liste d'objets
   - Fallback sur plusieurs clés (`totalSteps`, `steps`, `value`)

2. **Normalisation Stats**:
   - Distance: Détection automatique de l'unité (mètres/km) et conversion
   - Calories: Récupération depuis plusieurs clés possibles
   - FC repos: Récupération depuis plusieurs clés
   - **FC max**: Nouvelle récupération depuis `stats` ou calcul depuis time series
   - **FC moyenne**: Nouveau calcul depuis time series si non dans stats

3. **Normalisation Sleep**:
   - Détection automatique de l'unité (secondes, minutes, heures)
   - Conversion en heures avec formatage correct
   - Récupération du score de qualité depuis plusieurs clés

4. **Normalisation Activités Natation**:
   - Distance: Détection automatique de l'unité et conversion en km
   - Laps: Récupération depuis plusieurs champs possibles
   - Avg Pace: Récupération depuis plusieurs champs

### UI Garmin (`GraminTab.jsx`)

1. **Affichage Métriques**:
   - Ajout de la FC max dans les détails
   - Ajout de la FC moyenne si disponible
   - Ajout du sommeil (durée formatée en heures/minutes + qualité)

2. **Tableau Historique**:
   - Ajout de colonnes FC max et Sommeil
   - Formatage du sommeil en heures/minutes

### Serveur Node (`garmin-server.js`)

1. **Port par défaut**: Changement de 3001 à 3031 pour éviter les collisions

## État Actuel

### ✅ Corrigé

- [x] Normalisation steps avec plusieurs formats
- [x] Récupération FC max quotidienne
- [x] Normalisation distance (mètres → km)
- [x] Normalisation sommeil (secondes/minutes → heures)
- [x] Normalisation calories actives/repos
- [x] Normalisation activités natation (distance, laps)
- [x] Affichage FC max, FC moyenne, sommeil dans UI
- [x] Port serveur corrigé (3031)

### ⚠️ À Tester

- [ ] Synchronisation avec vraies données Garmin
- [ ] Vérification des valeurs steps vs Garmin app
- [ ] Vérification des valeurs FC max vs Garmin app
- [ ] Vérification des valeurs sommeil vs Garmin app
- [ ] Vérification des activités natation vs Garmin app

## Prochaines Étapes

1. **Tester la synchronisation**:
   - Lancer le serveur Garmin (`start-garmin-server.bat`)
   - Synchroniser depuis l'onglet Garmin
   - Comparer les valeurs avec l'app Garmin

2. **Si les données ne correspondent toujours pas**:
   - Vérifier les méthodes API utilisées (`python-garminconnect`)
   - Ajouter des logs de débogage dans le script Python
   - Comparer les structures JSON retournées par l'API vs attendues

3. **Documentation API**:
   - Consulter la documentation `python-garminconnect` pour les vraies méthodes
   - Adapter le script selon la documentation officielle

## Notes Techniques

### Formats API Garmin Possibles

Les méthodes API peuvent retourner des structures différentes selon:
- Le modèle de montre Garmin
- La version de l'API
- Le type de données

C'est pourquoi la normalisation essaie plusieurs formats/clés pour chaque métrique.

### Débogage

Si les données ne correspondent toujours pas, ajouter des logs dans `fetch_garmin_data.py`:
```python
print(f"[DEBUG] steps_data type: {type(steps_data)}, value: {steps_data}", file=sys.stderr)
print(f"[DEBUG] stats type: {type(stats)}, keys: {stats.keys() if isinstance(stats, dict) else 'N/A'}", file=sys.stderr)
```

Ces logs apparaîtront dans la console du serveur Node.

