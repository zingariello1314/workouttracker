"""
Système de cache pour les données parsées Garmin
Évite le re-parsing des activités déjà traitées
🔴 FIX : Amélioration cache avec invalidation intelligente selon classification
"""
import hashlib
import json
import os
import time
from typing import Any, Dict, Optional, Tuple
from pathlib import Path

from utils.validators import validate_distance_steps_consistency
from utils.logger import print_debug

# Répertoire de cache (dans le dossier garmin-server)
CACHE_DIR = Path(__file__).parent.parent / '.cache'
CACHE_DIR.mkdir(exist_ok=True)

# Durée de vie du cache (30 jours)
CACHE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

# Version du cache (incrémenter si format change)
CACHE_VERSION = 7


def get_classification_hash(activity_summary: Dict) -> str:
    """
    🔴 FIX : Génère un hash de la classification pour invalidation intelligente du cache.
    
    Args:
        activity_summary: Summary de l'activité contenant typeId, typeKey, etc.
        
    Returns:
        str: Hash de classification (8 caractères)
    """
    try:
        act_type_dto = activity_summary.get('activityTypeDTO', {}) or {}
        if not isinstance(act_type_dto, dict):
            act_type_dto = {}
        
        # Extraire informations de classification
        type_id = act_type_dto.get('typeId')
        type_key = act_type_dto.get('typeKey') or act_type_dto.get('type') or ''
        activity_name = (activity_summary.get('activityName') or '').lower()
        
        # Créer hash de classification (typeId + typeKey + nom)
        classification_str = f"{type_id}_{type_key}_{activity_name[:20]}"
        return hashlib.md5(classification_str.encode()).hexdigest()[:8]
    except Exception:
        return "default"


def get_cache_key(activity_id: int, raw_data: Any, classification_hash: Optional[str] = None) -> str:
    """
    Génère une clé de cache basée sur l'ID de l'activité, hash des données et classification.
    
    Args:
        activity_id: ID de l'activité Garmin
        raw_data: Données brutes de l'activité (summary ou details)
        classification_hash: Hash de classification (optionnel, calculé si absent)
        
    Returns:
        str: Clé de cache (nom de fichier)
    """
    try:
        # Créer hash des données brutes (ordre stable avec sort_keys)
        data_str = json.dumps(raw_data, sort_keys=True, default=str)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()[:8]
        
        # Inclure hash de classification si fourni
        if classification_hash:
            return f"{activity_id}_{data_hash}_{classification_hash}_v{CACHE_VERSION}.json"
        else:
            return f"{activity_id}_{data_hash}_v{CACHE_VERSION}.json"
    except Exception:
        # Fallback simple si JSON serialization échoue
        return f"{activity_id}_cache_v{CACHE_VERSION}.json"


def get_cached_parsed(activity_id: int, raw_data: Any, current_classification_hash: Optional[str] = None) -> Optional[Dict]:
    """
    🔴 FIX : Récupère les données parsées depuis le cache avec vérification de classification.
    
    Args:
        activity_id: ID de l'activité Garmin
        raw_data: Données brutes de l'activité (summary ou details)
        current_classification_hash: Hash de classification actuel (pour invalidation)
        
    Returns:
        dict: Données parsées en cache, ou None si non trouvé/invalide
    """
    try:
        # Calculer hash de classification si fourni
        if current_classification_hash is None and isinstance(raw_data, dict):
            current_classification_hash = get_classification_hash(raw_data)
        
        # Essayer plusieurs clés possibles (avec et sans classification_hash pour compatibilité)
        possible_keys = []
        
        # Clé avec classification (prioritaire)
        if current_classification_hash:
            possible_keys.append(get_cache_key(activity_id, raw_data, current_classification_hash))
        
        # Clés sans classification (pour compatibilité avec ancien cache)
        possible_keys.append(get_cache_key(activity_id, raw_data, None))
        
        # Ancienne clé (sans version)
        try:
            data_str = json.dumps(raw_data, sort_keys=True, default=str)
            data_hash = hashlib.md5(data_str.encode()).hexdigest()[:8]
            possible_keys.append(f"{activity_id}_{data_hash}.json")
        except Exception:
            pass
        
        for cache_key in possible_keys:
            cache_file = CACHE_DIR / cache_key
            if cache_file.exists():
                # 🔴 FIX : Vérifier l'âge du cache
                file_age = time.time() - cache_file.stat().st_mtime
                if file_age > CACHE_MAX_AGE_SECONDS:
                    # Cache trop vieux, le supprimer
                    try:
                        cache_file.unlink()
                    except Exception:
                        pass
                    continue
                
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cached = json.load(f)
                    
                    # Vérifier que le cache est valide (contient les champs essentiels)
                    if not isinstance(cached, dict) or 'id' not in cached:
                        continue
                    
                    # 🔴 FIX : Vérifier que la classification du cache correspond toujours
                    cached_type = cached.get('type') or cached.get('activityType') or ''
                    
                    # Si classification_hash fourni et différent du cache, invalider
                    if current_classification_hash:
                        cached_classification_hash = cached.get('_classification_hash')
                        if cached_classification_hash and cached_classification_hash != current_classification_hash:
                            # Classification a changé, invalider le cache
                            try:
                                cache_file.unlink()
                            except Exception:
                                pass
                            continue
                    
                    return cached
        
        return None
    except Exception as e:
        # En cas d'erreur (fichier corrompu, etc.), ignorer le cache
        pass
    return None


def cache_parsed(activity_id: int, raw_data: Any, parsed_data: Dict, classification_hash: Optional[str] = None) -> None:
    """
    🔴 FIX : Sauvegarde les données parsées dans le cache avec hash de classification.
    
    Args:
        activity_id: ID de l'activité Garmin
        raw_data: Données brutes de l'activité (summary ou details)
        parsed_data: Données parsées à sauvegarder
        classification_hash: Hash de classification (optionnel, calculé si absent)
    """
    try:
        # Calculer hash de classification si fourni
        if classification_hash is None and isinstance(raw_data, dict):
            classification_hash = get_classification_hash(raw_data)
        
        # Ajouter hash de classification aux données parsées pour vérification future
        if classification_hash:
            parsed_data['_classification_hash'] = classification_hash
        
        # Ajouter timestamp pour purge automatique
        parsed_data['_cached_at'] = time.time()
        parsed_data['_cache_version'] = CACHE_VERSION
        
        cache_file = CACHE_DIR / get_cache_key(activity_id, raw_data, classification_hash)
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, indent=2, default=str)
        
        # Purge automatique des anciens fichiers de cache (> 30 jours)
        purge_old_cache()
    except Exception as e:
        # En cas d'erreur, ignorer (cache n'est pas critique)
        pass


def purge_old_cache() -> None:
    """
    🔴 FIX : Purge automatique des fichiers de cache > 30 jours.
    Appelé automatiquement lors de la sauvegarde.
    """
    try:
        current_time = time.time()
        purged_count = 0
        
        for cache_file in CACHE_DIR.glob('*.json'):
            try:
                file_age = current_time - cache_file.stat().st_mtime
                if file_age > CACHE_MAX_AGE_SECONDS:
                    cache_file.unlink()
                    purged_count += 1
            except Exception:
                continue
        
        if purged_count > 0:
            # Log seulement si beaucoup de fichiers purgés (éviter logs verbeux)
            if purged_count > 10:
                pass  # Optionnel : logger ici si nécessaire
    except Exception:
        pass


def clear_cache() -> None:
    """
    Vide le cache (utile pour tests ou reset complet).
    """
    try:
        for cache_file in CACHE_DIR.glob('*.json'):
            cache_file.unlink()
    except Exception:
        pass


def get_cache_size() -> int:
    """
    Retourne la taille totale du cache en bytes.
    
    Returns:
        int: Taille du cache en bytes
    """
    total_size = 0
    try:
        for cache_file in CACHE_DIR.glob('*.json'):
            total_size += cache_file.stat().st_size
    except Exception:
        pass
    return total_size


# 🟢 NOUVEAU : Cache pour métriques quotidiennes parsées
# Durée de vie différente selon si c'est aujourd'hui ou une date passée
DAILY_METRICS_CACHE_TTL_TODAY = 300  # ✅ FIX A.3 : 5 minutes au lieu de 1h pour données dynamiques (évite cache obsolète)
DAILY_METRICS_CACHE_TTL_PAST = 7 * 24 * 60 * 60  # 7 jours pour dates passées (données statiques)

def get_daily_metrics_cache_key(date_str: str, raw_data_hash: str) -> str:
    """
    Génère une clé de cache pour les métriques quotidiennes parsées.
    
    Args:
        date_str: Date au format YYYY-MM-DD
        raw_data_hash: Hash des données brutes (stats, steps_data, etc.)
        
    Returns:
        str: Clé de cache (nom de fichier)
    """
    return f"daily_metrics_{date_str}_{raw_data_hash}_v{CACHE_VERSION}.json"


def get_raw_data_hash(stats: Any, steps_data: Any, hr_day: Any, sleep: Any, 
                      body_battery_data: Any, stress_data: Any, spo2_data: Any,
                      respiration_data: Any, intensity_data: Any, date_str: str = "") -> str:
    """
    Génère un hash des données brutes pour détecter les changements.
    Optimisé : ne hash que les champs essentiels pour performance.
    
    Args:
        stats, steps_data, hr_day, sleep, etc.: Données brutes de l'API
        
    Returns:
        str: Hash MD5 des données brutes (16 caractères)
    """
    try:
        # Extraire seulement les champs essentiels pour le hash (éviter hash trop lourd)
        essential_data = {}
        
        # Stats : champs clés pour calories, FC, etc.
        if isinstance(stats, dict):
            essential_data['stats'] = {
                k: v for k, v in stats.items() 
                if k in ['totalKilocalories', 'activeKilocalories', 'bmrKilocalories',
                         'restingHeartRate', 'maxHeartRate', 'averageHeartRate',
                         'totalDistanceMeters', 'totalSteps', 'totalFloors',
                         'moderateIntensityMinutes', 'vigorousIntensityMinutes']
            }
        
        # Steps data : champs clés
        if isinstance(steps_data, dict):
            essential_data['steps'] = {
                k: v for k, v in steps_data.items()
                if k in ['totalSteps', 'totalKilocalories', 'distanceInMeters']
            }
        
        # HR day : seulement quelques points pour détecter changements
        if isinstance(hr_day, dict):
            hr_values = hr_day.get('heartRateValues', []) or hr_day.get('values', [])
            if hr_values:
                # Prendre seulement les 10 premiers points (suffisant pour détecter changements)
                essential_data['hr'] = hr_values[:10]
        
        # Sleep : timestamp et durée principales
        if isinstance(sleep, dict):
            essential_data['sleep'] = {
                k: v for k, v in sleep.items()
                if k in ['sleepStartTimestampGMT', 'sleepEndTimestampGMT', 'sleepTimeSeconds']
            }
        
        # Body Battery, Stress, SpO2 : valeurs principales
        if isinstance(body_battery_data, dict):
            essential_data['bodyBattery'] = body_battery_data.get('bodyBatteryValuesArray', [])[:5]
        if isinstance(stress_data, dict):
            essential_data['stress'] = stress_data.get('stressValuesArray', [])[:5]
        if isinstance(spo2_data, dict):
            essential_data['spo2'] = spo2_data.get('spo2ValuesArray', [])[:5]
        
        # ✅ FIX C.1 : Pour aujourd'hui, inclure une granularité de 5 minutes dans le hash
        # Cela évite les collisions de cache quand les données sont identiques mais à des moments différents
        if date_str:
            from datetime import datetime
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                today = datetime.now().date()
                if date_obj == today:
                    # Pour aujourd'hui, inclure un bucket de 5 minutes dans le hash
                    now = datetime.now()
                    time_bucket = (now.hour * 60 + now.minute) // 5  # Bucket de 5 minutes (0-287 par jour)
                    essential_data['_time_bucket'] = time_bucket
                    # Log uniquement si nécessaire (éviter trop de logs)
                    # print_debug(f"🕐 Hash incluant time bucket {time_bucket} pour {date_str}")
            except Exception:
                # En cas d'erreur de parsing date, continuer sans time bucket
                pass
        
        # Hash des données essentielles
        data_str = json.dumps(essential_data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()
    except Exception:
        # Fallback : hash simple avec date (si fournie) ou timestamp
        import time
        if date_str:
            return hashlib.md5(date_str.encode()).hexdigest()
        return hashlib.md5(str(time.time()).encode()).hexdigest()


def get_latest_cached_daily_metrics(date_str: str) -> Optional[Dict]:
    """
    ✅ PHASE 3.1 : Récupère le cache parsé le plus récent pour une date donnée (indépendamment du hash).
    Utilisé pour Phase 3.1 : éviter les appels API si sync récente.
    
    Args:
        date_str: Date au format YYYY-MM-DD
        
    Returns:
        dict: Métriques parsées en cache le plus récent, ou None si non trouvé/invalide
    """
    try:
        from datetime import datetime, date
        import time
        import json
        
        # Chercher tous les fichiers de cache pour cette date
        cache_pattern = f"daily_metrics_{date_str}_*_v{CACHE_VERSION}.json"
        cache_files = list(CACHE_DIR.glob(cache_pattern))
        
        if not cache_files:
            return None
        
        # Trouver le fichier le plus récent
        latest_cache_file = max(cache_files, key=lambda f: f.stat().st_mtime)
        
        # Déterminer TTL selon si c'est aujourd'hui ou une date passée
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = date.today()
        is_today = date_obj == today
        
        cache_ttl = DAILY_METRICS_CACHE_TTL_TODAY if is_today else DAILY_METRICS_CACHE_TTL_PAST
        
        # Vérifier l'âge du cache
        file_age = time.time() - latest_cache_file.stat().st_mtime
        if file_age > cache_ttl:
            # Cache expiré
            return None
        
        # Charger le cache
        with open(latest_cache_file, 'r', encoding='utf-8') as f:
            cached = json.load(f)
            
            # Vérifier que le cache est valide
            if not isinstance(cached, dict) or 'date' not in cached:
                return None
            
            # Vérifier que la date correspond
            if cached.get('date') != date_str:
                return None
            
            # Vérifier la version du cache
            if cached.get('_cache_version') != CACHE_VERSION:
                return None
            
            # ✅ PHASE 3.1 : Validation du cache avant utilisation pour aujourd'hui
            if is_today:
                has_data = (
                    cached.get('steps', 0) > 0 or
                    cached.get('calories', {}).get('total', 0) > 0 or
                    len(cached.get('heartRate', {}).get('timeSeries', [])) > 0
                )
                if not has_data:
                    # Vérifier l'heure de création du cache
                    cache_age_minutes = file_age / 60
                    if cache_age_minutes > 15:  # Si cache créé il y a plus de 15 minutes et vide, invalider
                        print_debug(f"⚠️ Cache invalidé: données vides pour {date_str} créé il y a {cache_age_minutes:.1f} minutes")
                        return None
            
            return cached
    except Exception as e:
        print_debug(f"⚠️ Error in get_latest_cached_daily_metrics({date_str}): {e}")
        # En cas d'erreur, ignorer le cache
        pass
    return None


def get_cached_daily_metrics(date_str: str, raw_data_hash: str) -> Optional[Dict]:
    """
    Récupère les métriques quotidiennes parsées depuis le cache.
    
    Args:
        date_str: Date au format YYYY-MM-DD
        raw_data_hash: Hash des données brutes
        
    Returns:
        dict: Métriques parsées en cache, ou None si non trouvé/invalide
    """
    try:
        from datetime import datetime, date
        cache_key = get_daily_metrics_cache_key(date_str, raw_data_hash)
        cache_file = CACHE_DIR / cache_key
        
        if not cache_file.exists():
            return None
        
        # Déterminer TTL selon si c'est aujourd'hui ou une date passée
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = date.today()
        is_today = date_obj == today
        
        cache_ttl = DAILY_METRICS_CACHE_TTL_TODAY if is_today else DAILY_METRICS_CACHE_TTL_PAST
        
        # Vérifier l'âge du cache
        file_age = time.time() - cache_file.stat().st_mtime
        if file_age > cache_ttl:
            # Cache expiré, le supprimer
            try:
                cache_file.unlink()
            except Exception:
                pass
            return None
        
        # Charger le cache
        with open(cache_file, 'r', encoding='utf-8') as f:
            cached = json.load(f)
            
            # Vérifier que le cache est valide
            if not isinstance(cached, dict) or 'date' not in cached:
                return None
            
            # Vérifier que la date correspond
            if cached.get('date') != date_str:
                return None
            
            # Vérifier la version du cache
            if cached.get('_cache_version') != CACHE_VERSION:
                return None
            
            # ✅ FIX C.2 : Validation du cache avant utilisation pour aujourd'hui
            if is_today:
                has_data = (
                    cached.get('steps', 0) > 0 or
                    cached.get('calories', {}).get('total', 0) > 0 or
                    len(cached.get('heartRate', {}).get('timeSeries', [])) > 0
                )
                if not has_data:
                    # Vérifier l'heure de création du cache
                    cache_age_minutes = file_age / 60
                    if cache_age_minutes > 15:  # Si cache créé il y a plus de 15 minutes et vide, invalider
                        print_debug(f"⚠️ Cache invalidé: données vides pour {date_str} créé il y a {cache_age_minutes:.1f} minutes")
                        try:
                            cache_file.unlink()
                        except Exception:
                            pass
                        return None

            # ✅ Nouvelle validation : ratio distance/pas cohérent (même pour dates passées)
            distance_cached = cached.get('distance')
            steps_cached = cached.get('steps')
            is_valid_ratio, ratio_error_msg = validate_distance_steps_consistency(distance_cached, steps_cached, date_str)
            if not is_valid_ratio:
                print_debug(f"⚠️ Cache invalidé: incohérence distance/steps pour {date_str} ({ratio_error_msg})")
                try:
                    cache_file.unlink()
                except Exception:
                    pass
                return None

            # 🔒 Contrôle strict additionnel pour éviter ratios aberrants conservés en cache
            try:
                distance_num = float(distance_cached) if distance_cached is not None else 0.0
                steps_num = int(steps_cached) if steps_cached is not None else 0
                if distance_num > 0 and steps_num > 0:
                    expected_distance = steps_num * 0.75 / 1000.0
                    if expected_distance > 0:
                        ratio = distance_num / expected_distance
                        if ratio > 1.6 or ratio < 0.4:
                            print_debug(
                                f"⚠️ Cache invalidé: ratio distance/steps {ratio:.2f} (distance={distance_num} km, steps={steps_num}) pour {date_str}"
                            )
                            try:
                                cache_file.unlink()
                            except Exception:
                                pass
                            return None
            except Exception as ratio_exc:
                print_debug(f"⚠️ Cache: échec validation ratio distance/steps pour {date_str}: {ratio_exc}")
                try:
                    cache_file.unlink()
                except Exception:
                    pass
                return None
            
            return cached
    except Exception:
        # En cas d'erreur, ignorer le cache
        pass
    return None


def cache_daily_metrics(date_str: str, raw_data_hash: str, parsed_metrics: Dict) -> None:
    """
    Sauvegarde les métriques quotidiennes parsées dans le cache.
    
    Args:
        date_str: Date au format YYYY-MM-DD
        raw_data_hash: Hash des données brutes
        parsed_metrics: Métriques parsées à sauvegarder
    """
    try:
        from datetime import datetime, date
        
        # Ajouter métadonnées au cache
        parsed_metrics['_cached_at'] = time.time()
        parsed_metrics['_cache_version'] = CACHE_VERSION
        parsed_metrics['_raw_data_hash'] = raw_data_hash
        
        cache_key = get_daily_metrics_cache_key(date_str, raw_data_hash)
        cache_file = CACHE_DIR / cache_key
        
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(parsed_metrics, f, indent=2, default=str)
        
        # Purge automatique des anciens caches (une fois par jour max)
        if int(time.time()) % 86400 < 3600:  # Une fois par jour (dans la première heure)
            purge_old_daily_metrics_cache()
    except Exception:
        # En cas d'erreur, ignorer (cache n'est pas critique)
        pass


def purge_old_daily_metrics_cache() -> None:
    """
    Purge automatique des caches de métriques quotidiennes expirés.
    """
    try:
        from datetime import datetime, date
        current_time = time.time()
        today = date.today()
        purged_count = 0
        
        for cache_file in CACHE_DIR.glob('daily_metrics_*.json'):
            try:
                # Extraire la date du nom de fichier
                parts = cache_file.stem.split('_')
                if len(parts) >= 3:
                    date_str = parts[2]  # Format: daily_metrics_YYYY-MM-DD_hash_v2
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                    is_today = date_obj == today
                    
                    cache_ttl = DAILY_METRICS_CACHE_TTL_TODAY if is_today else DAILY_METRICS_CACHE_TTL_PAST
                    file_age = current_time - cache_file.stat().st_mtime
                    
                    if file_age > cache_ttl:
                        cache_file.unlink()
                        purged_count += 1
            except Exception:
                continue
        
        if purged_count > 0:
            pass  # Optionnel : logger si nécessaire
    except Exception:
        pass


