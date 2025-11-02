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

# Répertoire de cache (dans le dossier garmin-server)
CACHE_DIR = Path(__file__).parent.parent / '.cache'
CACHE_DIR.mkdir(exist_ok=True)

# Durée de vie du cache (30 jours)
CACHE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

# Version du cache (incrémenter si format change)
CACHE_VERSION = 2


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


