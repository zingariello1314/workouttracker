"""
🔴 FIX : Logger centralisé pour le backend Python
Remplace tous les print_debug par un système de logging structuré avec niveaux
"""
import os
import sys
from enum import IntEnum
from typing import Any, Optional


class LogLevel(IntEnum):
    """Niveaux de log"""
    DEBUG = 0
    INFO = 1
    WARNING = 2
    ERROR = 3
    NONE = 4


# Niveau de log selon variable d'environnement (défaut: DEBUG en dev, WARNING en prod)
def get_log_level() -> LogLevel:
    """Détermine le niveau de log depuis l'environnement"""
    env_level = os.getenv('GARMIN_LOG_LEVEL', '').upper()
    
    if env_level == 'DEBUG':
        return LogLevel.DEBUG
    elif env_level == 'INFO':
        return LogLevel.INFO
    elif env_level == 'WARNING' or env_level == 'WARN':
        return LogLevel.WARNING
    elif env_level == 'ERROR':
        return LogLevel.ERROR
    elif env_level == 'NONE' or env_level == 'OFF':
        return LogLevel.NONE
    else:
        # Par défaut : DEBUG (mode développement)
        # En production, utiliser GARMIN_LOG_LEVEL=WARNING
        return LogLevel.DEBUG


_current_log_level = get_log_level()


def should_log(level: LogLevel) -> bool:
    """Vérifie si un niveau de log doit être affiché"""
    return level >= _current_log_level


def format_message(level: str, message: str, *args, **kwargs) -> str:
    """Formate un message de log"""
    # Format simple pour compatibilité avec print_debug existant
    if args or kwargs:
        # Si des arguments supplémentaires sont fournis, les inclure
        extra = ' '.join(str(arg) for arg in args)
        if kwargs:
            extra += ' ' + ' '.join(f"{k}={v}" for k, v in kwargs.items())
        return f"[{level}] {message} {extra}".strip()
    return f"[{level}] {message}"


def debug(message: str, *args, **kwargs) -> None:
    """Log niveau DEBUG (seulement si niveau DEBUG activé)"""
    if should_log(LogLevel.DEBUG):
        formatted = format_message("DEBUG", message, *args, **kwargs)
        print(formatted, file=sys.stderr)


def info(message: str, *args, **kwargs) -> None:
    """Log niveau INFO"""
    if should_log(LogLevel.INFO):
        formatted = format_message("INFO", message, *args, **kwargs)
        print(formatted, file=sys.stderr)


def warn(message: str, *args, **kwargs) -> None:
    """Log niveau WARNING"""
    if should_log(LogLevel.WARNING):
        formatted = format_message("WARN", message, *args, **kwargs)
        print(formatted, file=sys.stderr)


def error(message: str, *args, error: Optional[Exception] = None, **kwargs) -> None:
    """Log niveau ERROR"""
    if should_log(LogLevel.ERROR):
        formatted = format_message("ERROR", message, *args, **kwargs)
        if error:
            formatted += f"\nException: {type(error).__name__}: {error}"
            import traceback
            formatted += f"\n{traceback.format_exc()}"
        print(formatted, file=sys.stderr)


# Alias pour compatibilité avec print_debug existant
def print_debug(message: str, *args, **kwargs) -> None:
    """
    Alias pour debug() - maintient compatibilité avec code existant
    Utilise le niveau DEBUG
    """
    debug(message, *args, **kwargs)

