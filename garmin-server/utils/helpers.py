"""
Fonctions utilitaires pour le parsing Garmin
"""
from datetime import date, timedelta, datetime, timezone
from typing import Any, Generator, Optional


def safe_int(value: Any, default: int = 0, warn_on_fail: bool = True, min_value: int = None, max_value: int = None, context: str = "") -> int:
    """
    🔴 FIX #9: Convertit une valeur en int de manière sûre avec validation de plage et logs.
    
    Args:
        value: Valeur à convertir
        default: Valeur par défaut si conversion impossible
        warn_on_fail: Si True, log un avertissement en cas d'échec
        min_value: Valeur minimale acceptée (None = pas de limite)
        max_value: Valeur maximale acceptée (None = pas de limite)
        context: Contexte pour les logs (ex: "heartRate.resting")
        
    Returns:
        int: Valeur convertie (clampée si hors plage) ou default
    """
    if value is None:
        if warn_on_fail and context:
            print_debug(f"⚠️ safe_int: valeur None pour '{context}', utilisation default: {default}")
        return default
    
    try:
        result = int(value)
        
        # 🔴 FIX #9: Validation de plage
        if min_value is not None and result < min_value:
            if warn_on_fail:
                print_debug(f"⚠️ safe_int: '{context}' = {result} < min ({min_value}), clamp à {min_value}")
            return min_value
        
        if max_value is not None and result > max_value:
            if warn_on_fail:
                print_debug(f"⚠️ safe_int: '{context}' = {result} > max ({max_value}), clamp à {max_value}")
            return max_value
        
        return result
    except (ValueError, TypeError) as e:
        if warn_on_fail:
            print_debug(f"⚠️ safe_int failed pour '{context}': {value} (type: {type(value).__name__}), erreur: {e}, utilisation default: {default}")
        return default


def safe_float(value: Any, default: float = 0.0, warn_on_fail: bool = True, min_value: float = None, max_value: float = None, context: str = "") -> float:
    """
    🔴 FIX #9: Convertit une valeur en float de manière sûre avec validation de plage et logs.
    
    Args:
        value: Valeur à convertir
        default: Valeur par défaut si conversion impossible
        warn_on_fail: Si True, log un avertissement en cas d'échec
        min_value: Valeur minimale acceptée (None = pas de limite)
        max_value: Valeur maximale acceptée (None = pas de limite)
        context: Contexte pour les logs (ex: "distance")
        
    Returns:
        float: Valeur convertie (clampée si hors plage) ou default
    """
    if value is None:
        if warn_on_fail and context:
            print_debug(f"⚠️ safe_float: valeur None pour '{context}', utilisation default: {default}")
        return default
    
    try:
        result = float(value)
        
        # Vérifier NaN ou Inf
        import math
        if math.isnan(result) or math.isinf(result):
            if warn_on_fail:
                print_debug(f"⚠️ safe_float: '{context}' = {result} (NaN/Inf), utilisation default: {default}")
            return default
        
        # 🔴 FIX #9: Validation de plage
        if min_value is not None and result < min_value:
            if warn_on_fail:
                print_debug(f"⚠️ safe_float: '{context}' = {result} < min ({min_value}), clamp à {min_value}")
            return min_value
        
        if max_value is not None and result > max_value:
            if warn_on_fail:
                print_debug(f"⚠️ safe_float: '{context}' = {result} > max ({max_value}), clamp à {max_value}")
            return max_value
        
        return result
    except (ValueError, TypeError) as e:
        if warn_on_fail:
            print_debug(f"⚠️ safe_float failed pour '{context}': {value} (type: {type(value).__name__}), erreur: {e}, utilisation default: {default}")
        return default


def daterange(start_dt: date, end_dt: date) -> Generator[date, None, None]:
    """
    Génère une plage de dates entre start_dt et end_dt (inclus).
    
    Args:
        start_dt: Date de début
        end_dt: Date de fin
        
    Yields:
        date: Date dans la plage
    """
    cur = start_dt
    while cur <= end_dt:
        yield cur
        cur += timedelta(days=1)


def format_duration(seconds: int) -> str:
    """
    Formate une durée en secondes au format mm:ss.
    
    Args:
        seconds: Durée en secondes
        
    Returns:
        str: Durée formatée "mm:ss"
    """
    if seconds <= 0:
        return "00:00"
    mins = seconds // 60
    secs_remain = seconds % 60
    return f"{str(mins).zfill(2)}:{str(secs_remain).zfill(2)}"


def print_debug(message: str) -> None:
    """
    Imprime un message de debug vers stderr.
    
    Args:
        message: Message à imprimer
    """
    import sys
    print(f"[DEBUG] {message}", file=sys.stderr)


def recursive_find_value(data: Any, key_patterns: list, visited: set = None) -> list:
    """
    🔴 FIX : Recherche récursive d'une valeur dans une structure de données.
    
    Args:
        data: Structure de données (dict, list, etc.)
        key_patterns: Liste de patterns de clés à chercher (ex: ['calorie', 'kcal'])
        visited: Set pour éviter les cycles (usage interne)
        
    Returns:
        list: Liste de tuples (chemin, valeur) où la clé correspond
    """
    if visited is None:
        visited = set()
    
    results = []
    
    if isinstance(data, dict):
        # Éviter les cycles
        data_id = id(data)
        if data_id in visited:
            return results
        visited.add(data_id)
        
        for key, value in data.items():
            # Vérifier si la clé correspond à un pattern
            key_lower = str(key).lower()
            for pattern in key_patterns:
                if pattern.lower() in key_lower:
                    results.append((key, value))
            
            # Recherche récursive dans la valeur
            if isinstance(value, (dict, list)):
                sub_results = recursive_find_value(value, key_patterns, visited)
                for sub_key, sub_value in sub_results:
                    results.append((f"{key}.{sub_key}", sub_value))
        
        visited.remove(data_id)
    elif isinstance(data, list):
        for i, item in enumerate(data):
            if isinstance(item, (dict, list)):
                sub_results = recursive_find_value(item, key_patterns, visited)
                for sub_key, sub_value in sub_results:
                    results.append((f"[{i}].{sub_key}", sub_value))
    
    return results


def normalize_datetime_to_utc(dt_str: Any) -> Optional[str]:
    """
    🔴 FIX #11: Normalise un datetime string en UTC ISO format.
    
    Gère plusieurs formats d'entrée :
    - ISO string avec timezone (Z ou +HH:MM)
    - ISO string sans timezone (assume UTC)
    - Timestamp Unix (int/float)
    
    Args:
        dt_str: DateTime string ou timestamp
        
    Returns:
        str: ISO format en UTC (YYYY-MM-DDTHH:MM:SSZ) ou None si invalide
    """
    if dt_str is None:
        return None
    
    try:
        # Si c'est un timestamp Unix
        if isinstance(dt_str, (int, float)):
            # Si > 1e10, c'est en millisecondes, sinon en secondes
            ts = dt_str / 1000 if dt_str > 1e10 else dt_str
            dt = datetime.fromtimestamp(ts, timezone.utc)
            return dt.isoformat().replace('+00:00', 'Z')
        
        # Si c'est une string
        if isinstance(dt_str, str):
            # Remplacer Z par +00:00 pour fromisoformat
            normalized = dt_str.replace('Z', '+00:00')
            # Parser
            dt = datetime.fromisoformat(normalized)
            
            # Si pas de timezone, assume UTC
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            
            # Convertir en UTC
            dt_utc = dt.astimezone(timezone.utc)
            return dt_utc.isoformat().replace('+00:00', 'Z')
        
        return None
    except (ValueError, TypeError, AttributeError) as e:
        print_debug(f"⚠️ normalize_datetime_to_utc failed: {dt_str} (type: {type(dt_str).__name__}), error: {e}")
        return None

