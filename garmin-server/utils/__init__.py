"""
Utilitaires Garmin - Fonctions helper et validations
"""
from .helpers import safe_int, safe_float, daterange, format_duration
from .validators import (
    validate_distance_steps_ratio,
    validate_distance_steps_consistency,
    validate_heart_rate,
    validate_swimming_consistency,
    validate_calories_consistency
)
# 🔴 FIX : Exporter logger pour utilisation dans fetch_garmin_data.py
from .logger import print_debug, debug, info, warn, error

__all__ = [
    'safe_int',
    'safe_float',
    'daterange',
    'format_duration',
    'validate_distance_steps_ratio',
    'validate_distance_steps_consistency',
    'validate_heart_rate',
    'validate_swimming_consistency',
    'validate_calories_consistency',
    'print_debug',
    'debug',
    'info',
    'warn',
    'error'
]

