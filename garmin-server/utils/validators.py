"""
🔴 FIX #10: Validations complètes des données Garmin
Détecte les valeurs aberrantes et incohérences
"""
from typing import Tuple, Optional
from utils.helpers import print_debug


def validate_heart_rate(resting: Optional[int], max_hr: Optional[int], avg_hr: Optional[int], date_str: str = "") -> Tuple[bool, Optional[str]]:
    """
    🔴 FIX #10: Valide la cohérence des valeurs de fréquence cardiaque
    
    Args:
        resting: FC repos
        max_hr: FC max
        avg_hr: FC moyenne
        date_str: Date pour les logs
    
    Returns:
        Tuple (is_valid, error_message)
    """
    if resting is None or max_hr is None or avg_hr is None:
        return (True, None)  # Pas de validation si valeurs manquantes
    
    # FC repos doit être < FC max
    if resting > max_hr:
        error_msg = f"FC repos ({resting} bpm) > FC max ({max_hr} bpm)"
        print_debug(f"⚠️ {date_str}: {error_msg}")
        return (False, error_msg)
    
    # FC moyenne doit être < FC max
    if avg_hr > max_hr:
        error_msg = f"FC moyenne ({avg_hr} bpm) > FC max ({max_hr} bpm)"
        print_debug(f"⚠️ {date_str}: {error_msg}")
        return (False, error_msg)
    
    # FC moyenne doit être > FC repos (généralement)
    if avg_hr < resting * 0.8:  # Tolérance de 20% pour cas spéciaux
        error_msg = f"FC moyenne ({avg_hr} bpm) suspectement basse par rapport à FC repos ({resting} bpm)"
        print_debug(f"⚠️ {date_str}: {error_msg}")
        # Ne pas bloquer, juste avertir
    
    return (True, None)


def validate_swimming_consistency(distance_m: Optional[float], duration_s: Optional[int], avg_pace_s_per_100m: Optional[int], date_str: str = "") -> Tuple[bool, Optional[str]]:
    """
    🔴 FIX #10: Valide la cohérence des métriques de natation
    
    Args:
        distance_m: Distance en mètres
        duration_s: Durée en secondes
        avg_pace_s_per_100m: Allure moyenne en secondes par 100m
        date_str: Date pour les logs
    
    Returns:
        Tuple (is_valid, error_message)
    """
    if not distance_m or not duration_s or not avg_pace_s_per_100m:
        return (True, None)  # Pas de validation si valeurs manquantes
    
    if distance_m <= 0 or duration_s <= 0:
        return (True, None)
    
    # Calculer l'allure théorique depuis distance et durée
    theoretical_pace = (duration_s / (distance_m / 100)) if distance_m > 0 else 0
    
    # Vérifier si l'allure déclarée est cohérente (tolérance de 50%)
    if theoretical_pace > 0:
        pace_diff = abs(theoretical_pace - avg_pace_s_per_100m) / theoretical_pace
        if pace_diff > 0.5:  # Plus de 50% de différence
            error_msg = f"Incohérence natation: allure théorique ({theoretical_pace:.1f}s/100m) vs déclarée ({avg_pace_s_per_100m}s/100m) - diff: {pace_diff*100:.1f}%"
            print_debug(f"⚠️ {date_str}: {error_msg}")
            return (False, error_msg)
    
    # Vérifier la vitesse raisonnable (entre 20s/100m et 300s/100m = entre 0.3m/s et 5m/s)
    if avg_pace_s_per_100m < 20 or avg_pace_s_per_100m > 300:
        error_msg = f"Allure suspecte: {avg_pace_s_per_100m}s/100m (attendu: 20-300s/100m)"
        print_debug(f"⚠️ {date_str}: {error_msg}")
        return (False, error_msg)
    
    return (True, None)


def validate_distance_steps_ratio(distance_km: Optional[float], steps: Optional[int], date_str: str = "") -> bool:
    """
    🔴 FIX #37: Valide le ratio distance/steps (compatible avec l'ancienne fonction)
    
    Args:
        distance_km: Distance en km
        steps: Nombre de pas
        date_str: Date pour les logs
    
    Returns:
        True si valide, False sinon
    """
    is_valid, _ = validate_distance_steps_consistency(distance_km, steps, date_str)
    return is_valid


def validate_distance_steps_consistency(distance_km: Optional[float], steps: Optional[int], date_str: str = "") -> Tuple[bool, Optional[str]]:
    """
    🔴 FIX #37: Valide la cohérence distance/steps même si steps=0 et seuil max
    
    Args:
        distance_km: Distance en km
        steps: Nombre de pas
        date_str: Date pour les logs
    
    Returns:
        Tuple (is_valid, error_message)
    """
    if distance_km is None or distance_km <= 0:
        return (True, None)
    
    # Vérifier seuil maximum (100km/jour est suspect)
    if distance_km > 100:
        error_msg = f"Distance suspectement élevée: {distance_km:.2f} km/jour"
        print_debug(f"⚠️ {date_str}: {error_msg}")
        return (False, error_msg)
    
    if steps is None or steps == 0:
        # Si pas de steps mais distance > 0, c'est peut-être OK (activité non pédestre)
        # Mais si distance > 20km sans steps, c'est suspect
        if distance_km > 20:
            error_msg = f"Distance élevée ({distance_km:.2f} km) sans pas enregistrés"
            print_debug(f"⚠️ {date_str}: {error_msg}")
            # Ne pas bloquer, juste avertir
        return (True, None)
    
    # Ratio normal: ~0.75m par pas = ~750m par 1000 pas = ~0.75km par 1000 pas
    # Tolérance: 0.5-1.0m par pas
    expected_distance = steps * 0.75 / 1000  # km
    ratio = distance_km / expected_distance if expected_distance > 0 else 0
    
    if ratio < 0.5 or ratio > 1.5:  # Tolérance de 50%
        error_msg = f"Ratio distance/steps suspect: {distance_km:.2f} km pour {steps} pas (attendu ~{expected_distance:.2f} km)"
        print_debug(f"⚠️ {date_str}: {error_msg}")
        # Ne pas bloquer pour activité non pédestre (natation, vélo, etc.)
    
    return (True, None)


def validate_calories_consistency(total: Optional[int], active: Optional[int], resting: Optional[int], date_str: str = "") -> Tuple[bool, Optional[str]]:
    """
    Valide la cohérence des calories
    
    Args:
        total: Calories totales
        active: Calories actives
        resting: Calories au repos
        date_str: Date pour les logs
    
    Returns:
        Tuple (is_valid, error_message)
    """
    if total is None:
        return (True, None)
    
    # Total doit être >= active + resting
    if active is not None and resting is not None:
        expected_total = active + resting
        if total < expected_total * 0.9:  # Tolérance de 10%
            error_msg = f"Calories totales ({total}) < active+resting ({expected_total})"
            print_debug(f"⚠️ {date_str}: {error_msg}")
            return (False, error_msg)
    
    # Vérifier valeurs raisonnables (500-8000 kcal/jour)
    if total < 500 or total > 8000:
        error_msg = f"Calories totales suspectes: {total} kcal (attendu: 500-8000 kcal/jour)"
        print_debug(f"⚠️ {date_str}: {error_msg}")
        # Ne pas bloquer, juste avertir
    
    return (True, None)
