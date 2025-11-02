# 🔥 LES 10 DERNIERS PROBLÈMES CRITIQUES/MAJEURS À CORRIGER

**Date :** 2025-11-01  
**Basé sur :** `BILAN_COMPLET_ONGLET_GARMIN.md` et état actuel

---

## 📋 LISTE PRIORITAIRE

### **1. 🔴 #6 - Gestion d'erreur serveur Python insuffisante** (CRITIQUE)

**Localisation :** `src/components/tabs/GarminTab/hooks/useGarminSync.js`

**État actuel :** 🟡 Partiellement fait
- `tryFetch` essaie plusieurs bases
- ❌ Pas de exponential backoff complet
- ❌ Pas de timeout configuré (30s)
- ❌ Retry limité, pas de gestion avancée des erreurs réseau

**Impact :** Sync échoue sans explication claire, pas de retry intelligent

**Solution :**
```javascript
const tryFetch = useCallback(async (path, options, retries = 3) => {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    for (const b of BASES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const res = await fetch(`${b}${path}`, { 
          ...options, 
          signal: controller.signal 
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setBaseUrl(b);
        return await res.json();
      } catch (e) {
        lastErr = e;
        if (attempt < retries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
        continue;
      }
    }
  }
  throw new Error(`Échec après ${retries} tentatives: ${lastErr?.message}`);
}, []);
```

---

### **2. 🔴 #38 - Retry côté Python** (CRITIQUE)

**Localisation :** `garmin-server/fetch_garmin_data.py` et `garmin-server/utils/api_client.py`

**État actuel :** ❌ Non fait
- ❌ Pas de retry automatique avec exponential backoff
- ❌ Pas de gestion des timeouts
- ❌ Pas de retry sur rate limiting (429)
- ❌ Échecs silencieux sur erreurs réseau

**Impact :** Syncs échouent souvent à cause de rate limiting ou erreurs réseau temporaires

**Solution :**
```python
# Créer garmin-server/utils/retry.py
from time import sleep
import random

def retry_with_backoff(func, max_retries=3, base_delay=1.0):
    """Retry avec exponential backoff"""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            # Exponential backoff avec jitter
            delay = base_delay * (2 ** attempt) + random.uniform(0, 0.1)
            sleep(delay)
    return None
```

---

### **3. 🟡 #37 - Validation distance/steps ratio pas toujours appelée** (MAJEUR)

**Localisation :** `garmin-server/parsers/daily_metrics_parser.py`

**État actuel :** 🟡 Partiellement fait
- ✅ `validate_distance_steps_consistency` existe
- ❌ Appelée seulement si `steps > 0`
- ❌ Pas de validation si distance > seuil (100km/jour = suspect)
- ❌ Pas de correction automatique si ratio suspect

**Impact :** Données incorrectes affichées (ex: distance 100km pour 5000 pas)

**Solution :**
```python
# Appeler validation même si steps = 0
distance_km = safe_float(stats.get('totalDistanceMeters', 0) / 1000.0, 0)
steps = safe_int(stats.get('totalSteps', 0), 0)

# Validation même si steps = 0 (pour détecter erreurs)
if distance_km > 100:  # Seuil suspect
    print_debug(f"⚠️ Distance suspecte: {distance_km}km pour {steps} pas")
    
is_valid, error_msg = validate_distance_steps_consistency(
    distance_km, steps, date_str
)
if not is_valid and error_msg:
    # Tenter correction si possible
    if distance_km > 0 and steps == 0 and distance_km < 50:
        # Probablement juste pas de pas enregistrés, OK
        pass
    else:
        print_debug(f"⚠️ Validation échouée: {error_msg}")
```

---

### **4. 🟡 #21 - Import automatique vers Endurance non robuste** (MAJEUR)

**Localisation :** `src/components/tabs/GarminTab/hooks/useGarminImport.js`

**État actuel :** 🟡 Partiellement fait
- ✅ Import automatique existe
- ❌ Pas de vérification doublons AVANT import
- ❌ Pas de retry si import échoue
- ❌ Pas de gestion d'erreur si Endurance API down

**Impact :** Doublons créés, imports échouent silencieusement

**Solution :**
```javascript
const importToEndurance = useCallback(async (activities) => {
  // Vérifier doublons AVANT import
  const existing = await checkExistingActivities(activities.map(a => a.id));
  const toImport = activities.filter(a => !existing.includes(a.id));
  
  if (toImport.length === 0) {
    return { success: true, skipped: activities.length };
  }
  
  // Retry avec backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await fetch('/api/endurance/import', {
        method: 'POST',
        body: JSON.stringify(toImport)
      });
      if (result.ok) return await result.json();
    } catch (e) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
}, []);
```

---

### **5. 🟡 #22 - Calculs de métriques quotidiennes non optimisés** (MAJEUR)

**Localisation :** `src/components/tabs/GarminTab/components/GarminDailyMetrics.jsx`

**État actuel :** ❌ Non fait
- ❌ `sleepStr`, `intensityStr` recalculés à chaque render
- ❌ Pas de memoization pour calculs coûteux
- ❌ Re-renders répétés même si données identiques

**Impact :** Lag lors de navigation entre dates

**Solution :**
```javascript
const sleepStr = React.useMemo(() => {
  if (!sleep || sleep.duration === 0) return "—";
  const hours = Math.floor(sleep.duration);
  const minutes = Math.round((sleep.duration - hours) * 60);
  return `${hours}h${minutes > 0 ? `${minutes}min` : ''}`;
}, [sleep?.duration]);

const intensityStr = React.useMemo(() => {
  if (!intensityMinutes) return "—";
  const total = intensityMinutes.total || 0;
  const moderate = intensityMinutes.moderate || 0;
  const vigorous = intensityMinutes.vigorous || 0;
  return `${total}min (Mod: ${moderate}, Vig: ${vigorous})`;
}, [intensityMinutes?.total, intensityMinutes?.moderate, intensityMinutes?.vigorous]);
```

---

### **6. 🟡 #23 - Parsing Python avec exceptions silencieuses** (MAJEUR)

**Localisation :** `garmin-server/parsers/*.py` et `garmin-server/fetch_garmin_data.py`

**État actuel :** 🟡 Partiellement fait
- ✅ `safe_int`/`safe_float` ont `warn_on_fail` (FAIT)
- ❌ Mais pas assez utilisé avec contexte partout
- ❌ Exceptions capturées mais pas toujours loggées
- ❌ Pas de remontée des erreurs au frontend

**Impact :** Activités manquantes sans explication

**Solution :**
```python
# Dans fetch_garmin_data.py
parsing_errors = []

try:
    parsed = parse_activity(act)
except Exception as e:
    error_obj = {
        "activity_id": act.get('activityId'),
        "error": str(e),
        "type": type(e).__name__,
        "context": f"Parsing activity {act.get('activityId')}"
    }
    parsing_errors.append(error_obj)
    print_debug(f"⚠️ Erreur parsing activité {act.get('activityId')}: {e}")
    continue

# Retourner les erreurs dans le JSON
return {
    "ok": True,
    "data": { ... },
    "parsing_errors": parsing_errors  # NOUVEAU
}
```

---

### **7. 🟡 #18 - Données manquantes non expliquées** (MAJEUR)

**Localisation :** Tous les composants qui affichent "—"

**État actuel :** ❌ Non fait
- ❌ Affiche "—" sans explication pourquoi
- ❌ Pas de tooltip explicatif
- ❌ Pas de message contextuel

**Impact :** Utilisateur confus, ne comprend pas pourquoi données absentes

**Solution :**
```javascript
// Composant réutilisable
const MetricDisplay = ({ value, label, tooltip, missingReason }) => {
  if (!value || value === 0) {
    return (
      <div className="relative group">
        <span className="text-slate-500">—</span>
        {missingReason && (
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-slate-900 text-white text-xs p-2 rounded z-50">
            {missingReason}
          </div>
        )}
      </div>
    );
  }
  return <span>{value}</span>;
};
```

---

### **8. 🟡 #11 - Timezone non gérée correctement** (MAJEUR)

**Localisation :** `garmin-server/fetch_garmin_data.py`, tous les parsers

**État actuel :** 🟡 Partiellement fait
- ✅ `normalize_datetime_to_utc` existe dans `helpers.py`
- ❌ Pas utilisé partout
- ❌ Conversion UTC inconsistante selon les parsers
- ❌ JavaScript affiche parfois en local, parfois UTC

**Impact :** Activités affichées avec mauvaise date/heure

**Solution :**
```python
# Standardiser sur UTC partout
from utils.helpers import normalize_datetime_to_utc

# Dans tous les parsers
start_time = normalize_datetime_to_utc(
    act.get('startTimeGMT') or act.get('startTimeLocal')
)
```

---

### **9. 🟡 #7 - Déduplication IndexedDB incomplète** (MAJEUR)

**Localisation :** `src/hooks/useGarminData.js` lignes 219-262

**État actuel :** 🟡 Partiellement fait
- ✅ Vérification par `item.id` (unique Garmin)
- ❌ Pas de comparaison de `lastSynced` pour garder version la plus récente
- ❌ Si activité change de type (swimming → cardio), crée doublon
- ❌ Pas de déduplication par `date + type + id`

**Impact :** Doublons ou données écrasées incorrectement

**Solution :**
```javascript
// Déduplication robuste avec comparaison timestamp
const existing = await getByCompositeKey(item.id, item.date, type);
if (existing) {
  const existingSync = new Date(existing.lastSynced || 0);
  const newSync = new Date(item.lastSynced || new Date());
  if (newSync > existingSync) {
    // Nouvelle version plus récente, fusionner intelligemment
    const merged = mergeDeep(existing, item, { preferNewer: true });
    await store.put(merged);
  }
}
```

---

### **10. 🟡 #17 - Navigation temporelle pas optimisée** (MAJEUR)

**Localisation :** `src/components/tabs/GarminTab/components/TimeNavigation.jsx`

**État actuel :** ✅ Amélioré récemment (debounce réduit à 100ms)
- ✅ Debounce et useTransition implémentés
- ❌ Peut-être encore des re-renders inutiles
- ❌ Navigation avec beaucoup de dates peut laguer
- ❌ Pas de virtualisation pour longues listes de dates

**Impact :** Lag lors de navigation rapide entre beaucoup de dates

**Solution :**
```javascript
// Virtualisation pour dates (si > 100 dates)
const VirtualizedDateSelect = ({ dates, selected, onChange }) => {
  if (dates.length < 100) {
    // Liste normale si peu de dates
    return <select>{dates.map(...)}</select>;
  }
  // Utiliser react-window ou react-virtualized pour grandes listes
  return <VirtualizedList items={dates} ... />;
};
```

---

## 📊 RÉSUMÉ PAR PRIORITÉ

### **🔥 CRITIQUE (À faire en premier)**
1. #6 - Retry serveur Python (frontend)
2. #38 - Retry côté Python

### **⚡ MAJEUR (Important)**
3. #37 - Validation distance/steps améliorée
4. #21 - Import Endurance robuste
5. #22 - Calculs métriques optimisés
6. #23 - Parsing exceptions amélioré
7. #18 - Données manquantes expliquées
8. #11 - Timezone standardisée
9. #7 - Déduplication améliorée
10. #17 - Navigation temporelle optimisée

---

**Impact total :** Ces 10 corrections amélioreront significativement :
- ✅ **Stabilité** : Retry robuste = moins d'échecs de sync
- ✅ **Qualité données** : Validation = données plus fiables
- ✅ **Performance** : Optimisations = app plus rapide
- ✅ **UX** : Explications = utilisateur moins confus

**Temps estimé :** 2-3 jours pour les critiques, 1 semaine pour tous

---

**Dernière mise à jour :** 2025-11-01

