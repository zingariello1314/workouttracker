"""
Validations métriques Garmin
"""
import sys
import os
from typing import Dict, Optional, Tuple

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import print_debug


def validate_distance_steps_ratio(distance_km: float, steps: int, date_str: str) -> bool:
    """
    Valide le ratio distance/pas (environ 0.7-0.8 m par pas).
    Affiche un warning si ratio suspect.
    
    Args:
        distance_km: Distance en km
        steps: Nombre de pas
        date_str: Date pour les logs
        
    Returns:
        bool: True si ratio valide, False si suspect
    """
    if steps <= 0 or distance_km <= 0:
        return True  # Pas de validation si données manquantes
    
    meters_per_step = (distance_km * 1000) / steps
    
    if meters_per_step > 2.0:  # Plus de 2m par pas = suspect
        print_debug(f"⚠️  WARNING: Distance/steps ratio suspicious for {date_str}: {meters_per_step:.2f} m/step (distance={distance_km} km, steps={steps})")
        return False
    elif meters_per_step < 0.3:  # Moins de 0.3m par pas = suspect
        print_debug(f"⚠️  WARNING: Distance/steps ratio suspicious for {date_str}: {meters_per_step:.2f} m/step (distance={distance_km} km, steps={steps})")
        return False
    
    return True


def validate_jump_rope_metrics(jumps: int, speed: float, duration: int, activity_id: int) -> Tuple[bool, Optional[str]]:
    """
    Valide les métriques de corde à sauter.
    
    Args:
        jumps: Nombre de sauts
        speed: Vitesse en sauts/min
        duration: Durée en secondes
        activity_id: ID de l'activité pour les logs
        
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, warning_message)
    """
    warnings = []
    
    # Validation sauts (10-10000)
    if jumps > 0 and (jumps < 10 or jumps > 10000):
        warnings.append(f"Jumps out of range (10-10000): {jumps}")
    
    # Validation vitesse (10-300 sauts/min)
    if speed > 0 and (speed < 10 or speed > 300):
        warnings.append(f"Speed out of range (10-300): {speed}")
    
    # Validation cohérence jumps/speed/duration
    if jumps > 0 and duration > 0:
        calculated_speed = (jumps / (duration / 60.0))  # sauts/min
        if calculated_speed < 5 or calculated_speed > 500:
            warnings.append(f"Calculated speed from jumps/duration seems unreasonable: {calculated_speed:.2f} sauts/min (jumps={jumps}, duration={duration}s)")
    
    if warnings:
        warning_msg = f"⚠️  WARNING for activity {activity_id}: {'; '.join(warnings)}"
        print_debug(warning_msg)
        return False, warning_msg
    
    return True, None


def validate_swimming_distance(distance_m: float, duration_s: int, activity_id: int) -> bool:
    """
    Valide la distance de natation (cohérence distance/durée).
    
    Args:
        distance_m: Distance en mètres
        duration_s: Durée en secondes
        activity_id: ID de l'activité pour les logs
        
    Returns:
        bool: True si cohérent, False si suspect
    """
    if distance_m <= 0 or duration_s <= 0:
        return True  # Pas de validation si données manquantes
    
    # Vitesse moyenne typique natation : 1-3 km/h (0.28-0.83 m/s)
    avg_speed_ms = distance_m / duration_s if duration_s > 0 else 0
    
    if avg_speed_ms > 3.0:  # Plus de 3 m/s = très rapide (> 10.8 km/h)
        print_debug(f"⚠️  WARNING: Swimming speed seems very high for activity {activity_id}: {avg_speed_ms:.2f} m/s ({avg_speed_ms * 3.6:.2f} km/h) (distance={distance_m}m, duration={duration_s}s)")
        return False
    elif avg_speed_ms < 0.1:  # Moins de 0.1 m/s = très lent (< 0.36 km/h)
        print_debug(f"⚠️  WARNING: Swimming speed seems very low for activity {activity_id}: {avg_speed_ms:.2f} m/s ({avg_speed_ms * 3.6:.2f} km/h) (distance={distance_m}m, duration={duration_s}s)")
        return False
    
    return True

