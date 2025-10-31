"""
Fonctions utilitaires pour le parsing Garmin
"""
from datetime import date, timedelta
from typing import Any, Generator


def safe_int(value: Any, default: int = 0) -> int:
    """
    Convertit une valeur en int de manière sûre.
    
    Args:
        value: Valeur à convertir
        default: Valeur par défaut si conversion impossible
        
    Returns:
        int: Valeur convertie ou default
    """
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    """
    Convertit une valeur en float de manière sûre.
    
    Args:
        value: Valeur à convertir
        default: Valeur par défaut si conversion impossible
        
    Returns:
        float: Valeur convertie ou default
    """
    try:
        return float(value) if value is not None else default
    except (ValueError, TypeError):
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

