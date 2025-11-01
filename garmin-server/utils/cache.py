"""
Système de cache pour les données parsées Garmin
Évite le re-parsing des activités déjà traitées
"""
import hashlib
import json
import os
from typing import Any, Dict, Optional
from pathlib import Path

# Répertoire de cache (dans le dossier garmin-server)
CACHE_DIR = Path(__file__).parent.parent / '.cache'
CACHE_DIR.mkdir(exist_ok=True)


def get_cache_key(activity_id: int, raw_data: Any) -> str:
    """
    Génère une clé de cache basée sur l'ID de l'activité et un hash des données brutes.
    
    Args:
        activity_id: ID de l'activité Garmin
        raw_data: Données brutes de l'activité (summary ou details)
        
    Returns:
        str: Clé de cache (nom de fichier)
    """
    try:
        # Créer hash des données brutes (ordre stable avec sort_keys)
        data_str = json.dumps(raw_data, sort_keys=True, default=str)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()[:8]
        return f"{activity_id}_{data_hash}.json"
    except Exception:
        # Fallback simple si JSON serialization échoue
        return f"{activity_id}_cache.json"


def get_cached_parsed(activity_id: int, raw_data: Any) -> Optional[Dict]:
    """
    Récupère les données parsées depuis le cache si disponibles.
    
    Args:
        activity_id: ID de l'activité Garmin
        raw_data: Données brutes de l'activité
        
    Returns:
        dict: Données parsées en cache, ou None si non trouvé
    """
    try:
        cache_file = CACHE_DIR / get_cache_key(activity_id, raw_data)
        if cache_file.exists():
            with open(cache_file, 'r', encoding='utf-8') as f:
                cached = json.load(f)
                # Vérifier que le cache est valide (contient les champs essentiels)
                if isinstance(cached, dict) and 'id' in cached:
                    return cached
    except Exception as e:
        # En cas d'erreur (fichier corrompu, etc.), ignorer le cache
        pass
    return None


def cache_parsed(activity_id: int, raw_data: Any, parsed_data: Dict) -> None:
    """
    Sauvegarde les données parsées dans le cache.
    
    Args:
        activity_id: ID de l'activité Garmin
        raw_data: Données brutes de l'activité
        parsed_data: Données parsées à sauvegarder
    """
    try:
        cache_file = CACHE_DIR / get_cache_key(activity_id, raw_data)
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, indent=2, default=str)
    except Exception as e:
        # En cas d'erreur, ignorer (cache n'est pas critique)
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


