"""
Parser Daily Metrics Garmin - Pas, distance, calories, FC, minutes intensives
"""
import sys
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug
from utils.validators import validate_distance_steps_ratio


def parse_daily_steps(steps_data: Any, date_str: str) -> int:
    """
    Parse les pas quotidiens depuis Garmin.
    
    Args:
        steps_data: Données de pas brutes
        date_str: Date pour les logs
        
    Returns:
        int: Nombre de pas
    """
    if isinstance(steps_data, dict):
        return safe_int(
            steps_data.get('totalSteps') or
            steps_data.get('steps') or
            steps_data.get('value'),
            0
        )
    elif isinstance(steps_data, list) and len(steps_data) > 0:
        # Parfois c'est une liste d'objets
        total_steps = 0
        for item in steps_data:
            if isinstance(item, dict):
                total_steps += safe_int(
                    item.get('steps') or
                    item.get('value') or
                    item.get('totalSteps'),
                    0
                )
            elif isinstance(item, (int, float)):
                total_steps += safe_int(item, 0)
        return total_steps
    elif isinstance(steps_data, (int, float)):
        return safe_int(steps_data, 0)
    
    return 0


def parse_daily_distance(stats: Dict, steps_data: Any, date_str: str, swim_list: List, jump_list: List, cardio_list: List) -> float:
    """
    Parse la distance quotidienne depuis Garmin.
    
    CORRECTION CRITIQUE : totalDistanceMeters est TOUJOURS en mètres, même si valeur < 1000.
    Convertir TOUJOURS en km (même pour 18 m -> 0.018 km).
    
    Args:
        stats: Stats quotidiennes depuis client.get_stats()
        steps_data: Données de pas (pour fallback)
        date_str: Date pour les logs
        swim_list: Liste activités natation (pour fallback)
        jump_list: Liste activités corde à sauter (pour fallback)
        cardio_list: Liste activités cardio (pour fallback)
        
    Returns:
        float: Distance en km
    """
    distance_km = 0
    
    if isinstance(stats, dict):
        # Distance - CORRECTION CRITIQUE : totalDistanceMeters est TOUJOURS en mètres, même si valeur < 1000
        distance_raw = stats.get('totalDistanceMeters') or stats.get('wellnessDistanceMeters') or 0
        if isinstance(distance_raw, (int, float)) and distance_raw > 0:
            # totalDistanceMeters est TOUJOURS en mètres, convertir TOUJOURS en km (même pour 18 m -> 0.018 km)
            distance_km = round(distance_raw / 1000.0, 3)  # Conversion mètres -> km avec 3 décimales
            print_debug(f"Distance daily {date_str}: {distance_raw} m = {distance_km} km")
        else:
            # Fallback : chercher dans autres champs (peut être déjà en km ou en mètres)
            distance_raw_fallback = (
                stats.get('totalDistance') or
                stats.get('distance') or
                stats.get('distanceInMeters') or
                stats.get('distanceInKm') or
                0
            )
            if isinstance(distance_raw_fallback, (int, float)) and distance_raw_fallback > 0:
                # Si > 1000, probablement en mètres, convertir en km
                if distance_raw_fallback > 1000:
                    distance_km = round(distance_raw_fallback / 1000.0, 3)
                elif distance_raw_fallback > 1:
                    # Entre 1 et 1000, probablement en mètres aussi (conversion prudente)
                    distance_km = round(distance_raw_fallback / 1000.0, 3)
                else:
                    # Si < 1, probablement déjà en km
                    distance_km = round(distance_raw_fallback, 3)
        
        # Si distance toujours 0, essayer de calculer depuis steps_data
        if distance_km == 0 and isinstance(steps_data, dict):
            distance_from_steps = safe_float(
                steps_data.get('distanceInMeters') or
                steps_data.get('distance') or
                steps_data.get('totalDistance'),
                0
            )
            if distance_from_steps > 0:
                # Si > 1000, probablement en mètres, convertir en km
                if distance_from_steps > 1000:
                    distance_km = round(distance_from_steps / 1000.0, 3)
                else:
                    distance_km = round(distance_from_steps, 3)
    
    # CORRECTION CRITIQUE : Si distance quotidienne toujours 0, essayer d'agréger depuis activités
    # Mais NE JAMAIS remplacer une distance quotidienne valide par la somme des activités
    # La distance quotidienne de Garmin inclut TOUS les pas, pas seulement les activités sportives
    if distance_km == 0:
        total_distance_from_activities = 0
        # Agrégation depuis activités du jour (distances déjà en km)
        for swim_act in swim_list:
            if swim_act.get('date') == date_str and swim_act.get('distance'):
                dist = swim_act.get('distance', 0)
                if dist and dist > 0:
                    total_distance_from_activities += dist  # Déjà en km
        for jump_act in jump_list:
            if jump_act.get('date') == date_str and jump_act.get('distance'):
                dist = jump_act.get('distance', 0)
                if dist and dist > 0:
                    total_distance_from_activities += dist  # Déjà en km
        for cardio_act in cardio_list:
            if cardio_act.get('date') == date_str and cardio_act.get('distance'):
                dist = cardio_act.get('distance', 0)
                if dist and dist > 0:
                    total_distance_from_activities += dist  # Déjà en km
        if total_distance_from_activities > 0:
            distance_km = round(total_distance_from_activities, 3)
            print_debug(f"Distance daily {date_str} from activities aggregation (fallback): {distance_km} km")
    
    return distance_km


def parse_daily_calories(stats: Dict, date_str: str = "") -> Dict:
    """
    Parse les calories quotidiennes depuis stats.
    
    OPTIMISATION: Chercher dans tous les champs possibles de l'API Garmin.
    
    Args:
        stats: Stats quotidiennes depuis client.get_stats()
        
    Returns:
        dict: Calories avec total, active, resting
    """
    if not isinstance(stats, dict):
        print_debug("parse_daily_calories: stats is not a dict")
        return {"total": 0, "active": 0, "resting": 0}
    
    # Chercher calories totales dans TOUS les champs possibles
    # CORRECTION CRITIQUE : Gérer None vs 0 explicitement
    total_cal_raw = (
        stats.get('totalKilocalories') if stats.get('totalKilocalories') is not None else
        stats.get('totalCalories') if stats.get('totalCalories') is not None else
        stats.get('calories') if stats.get('calories') is not None else
        stats.get('caloriesTotal') if stats.get('caloriesTotal') is not None else
        stats.get('kilocalories') if stats.get('kilocalories') is not None else
        stats.get('kcal') if stats.get('kcal') is not None else
        stats.get('dailyCalories') if stats.get('dailyCalories') is not None else
        None
    )
    total_cal = safe_int(total_cal_raw, 0)
    
    # Chercher calories actives dans TOUS les champs possibles
    active_cal_raw = (
        stats.get('activeKilocalories') if stats.get('activeKilocalories') is not None else
        stats.get('activeCalories') if stats.get('activeCalories') is not None else
        stats.get('caloriesBurned') if stats.get('caloriesBurned') is not None else
        stats.get('burnedCalories') if stats.get('burnedCalories') is not None else
        stats.get('activeKcal') if stats.get('activeKcal') is not None else
        stats.get('dailyActiveCalories') if stats.get('dailyActiveCalories') is not None else
        None
    )
    active_cal = safe_int(active_cal_raw, 0)
    
    # Chercher calories repos dans TOUS les champs possibles
    resting_cal_raw = (
        stats.get('bmrKilocalories') if stats.get('bmrKilocalories') is not None else
        stats.get('restingCalories') if stats.get('restingCalories') is not None else
        stats.get('restingMetabolicRate') if stats.get('restingMetabolicRate') is not None else
        stats.get('bmr') if stats.get('bmr') is not None else
        stats.get('basalMetabolicRate') if stats.get('basalMetabolicRate') is not None else
        stats.get('restingKcal') if stats.get('restingKcal') is not None else
        None
    )
    resting_cal = safe_int(resting_cal_raw, 0)
    
    # Si total est 0 mais active + resting > 0, calculer total
    if total_cal == 0 and (active_cal > 0 or resting_cal > 0):
        total_cal = active_cal + resting_cal
    
    date_info = f" for {date_str}" if date_str else ""
    print_debug(f"Parsed calories{date_info} - total_raw: {total_cal_raw} -> {total_cal}, active_raw: {active_cal_raw} -> {active_cal}, resting_raw: {resting_cal_raw} -> {resting_cal}")
    
    result = {
        "total": total_cal,
        "active": active_cal,
        "resting": resting_cal
    }
    print_debug(f"Returning calories dict: {result}")
    return result


def parse_daily_heart_rate(stats: Dict, hr_day: Any, date_str: str) -> Dict:
    """
    Parse la fréquence cardiaque quotidienne depuis stats et time series.
    
    Args:
        stats: Stats quotidiennes depuis client.get_stats()
        hr_day: Données HR time series depuis client.get_heart_rates()
        date_str: Date pour les logs
        
    Returns:
        dict: FC avec resting, max, avg, timeSeries
    """
    heart_rate = {
        "resting": 0,
        "max": 0,
        "avg": 0,
        "timeSeries": []
    }
    
    if isinstance(stats, dict):
        # FC repos - Chercher dans TOUS les champs possibles
        # CORRECTION CRITIQUE : Gérer None vs 0 explicitement
        resting_hr_raw = (
            stats.get('restingHeartRate') if stats.get('restingHeartRate') is not None else
            stats.get('restingHR') if stats.get('restingHR') is not None else
            stats.get('avgRestingHeartRate') if stats.get('avgRestingHeartRate') is not None else
            stats.get('averageRestingHeartRate') if stats.get('averageRestingHeartRate') is not None else
            stats.get('restingBpm') if stats.get('restingBpm') is not None else
            stats.get('rhr') if stats.get('rhr') is not None else
            None
        )
        heart_rate["resting"] = safe_int(resting_hr_raw, 0)
        
        # FC max - Chercher dans TOUS les champs possibles
        max_hr_raw = (
            stats.get('maxHeartRate') if stats.get('maxHeartRate') is not None else
            stats.get('maxHR') if stats.get('maxHR') is not None else
            stats.get('peakHeartRate') if stats.get('peakHeartRate') is not None else
            stats.get('maximumHeartRate') if stats.get('maximumHeartRate') is not None else
            stats.get('maxBpm') if stats.get('maxBpm') is not None else
            stats.get('peakBpm') if stats.get('peakBpm') is not None else
            None
        )
        heart_rate["max"] = safe_int(max_hr_raw, 0)
        
        # FC moyenne - Chercher dans TOUS les champs possibles
        avg_hr_raw = (
            stats.get('averageHeartRate') if stats.get('averageHeartRate') is not None else
            stats.get('avgHR') if stats.get('avgHR') is not None else
            stats.get('meanHeartRate') if stats.get('meanHeartRate') is not None else
            stats.get('avgBpm') if stats.get('avgBpm') is not None else
            stats.get('averageBpm') if stats.get('averageBpm') is not None else
            None
        )
        heart_rate["avg"] = safe_int(avg_hr_raw, 0)
        
        print_debug(f"Parsed HR from stats for {date_str} - resting_raw: {resting_hr_raw} -> {heart_rate['resting']}, max_raw: {max_hr_raw} -> {heart_rate['max']}, avg_raw: {avg_hr_raw} -> {heart_rate['avg']}")
    
    # HR time series + calculer max/avg si non dans stats
    ts = []
    max_hr_from_series = 0
    sum_hr = 0
    count_hr = 0
    
    if isinstance(hr_day, dict):
        hr_vals = hr_day.get('heartRateValues', []) or hr_day.get('values', []) or []
        for p in hr_vals:
            if isinstance(p, list) and len(p) >= 2 and p[1] is not None:
                try:
                    bpm_val = safe_int(p[1])
                    if bpm_val > 0:
                        max_hr_from_series = max(max_hr_from_series, bpm_val)
                        sum_hr += bpm_val
                        count_hr += 1
                        ts.append({
                            "timestamp": datetime.fromtimestamp(safe_int(p[0]), timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                            "bpm": bpm_val
                        })
                except Exception:
                    continue
    
    # Si FC max non dans stats mais dans time series
    if heart_rate["max"] == 0 and max_hr_from_series > 0:
        heart_rate["max"] = max_hr_from_series
    
    # Si FC avg non dans stats mais dans time series
    if heart_rate["avg"] == 0 and count_hr > 0:
        heart_rate["avg"] = round(sum_hr / count_hr)
    
    # Downsampling 5min
    if len(ts) > 0:
        ts = ts[::5]
    heart_rate["timeSeries"] = ts
    
    return heart_rate


def parse_daily_intensity_minutes(intensity_data: Any, stats: Dict, date_str: str, swim_list: List, jump_list: List, cardio_list: List) -> Optional[Dict]:
    """
    Parse les minutes intensives quotidiennes depuis intensity_data, stats, et activités.
    
    CORRECTION CRITIQUE : Agréger minutes intensives de toutes les activités de la journée.
    Les activités sont dans swim_list, jump_list, cardio_list.
    Sommer leurs intensityMinutes et ajouter à daily["intensityMinutes"].
    
    Args:
        intensity_data: Données intensité depuis client.get_intensity_minutes()
        stats: Stats quotidiennes depuis client.get_stats()
        date_str: Date pour les logs et agrégation
        swim_list: Liste activités natation
        jump_list: Liste activités corde à sauter
        cardio_list: Liste activités cardio
        
    Returns:
        dict: Minutes intensives avec moderate, vigorous, total ou None
    """
    intensity_minutes = {"moderate": 0, "vigorous": 0, "total": 0}
    
    # Parser depuis intensity_data si disponible
    if isinstance(intensity_data, dict):
        intensity_moderate = safe_int(
            intensity_data.get('moderateMinutes') or
            intensity_data.get('moderate') or
            intensity_data.get('intensityMinutesModerate'),
            0
        )
        intensity_vigorous = safe_int(
            intensity_data.get('vigorousMinutes') or
            intensity_data.get('vigorous') or
            intensity_data.get('intensityMinutesVigorous'),
            0
        )
        intensity_total = safe_int(
            intensity_data.get('totalMinutes') or
            intensity_data.get('total') or
            intensity_data.get('totalIntensityMinutes'),
            intensity_moderate + intensity_vigorous
        )
        
        if intensity_moderate > 0 or intensity_vigorous > 0:
            intensity_minutes = {
                "moderate": intensity_moderate if intensity_moderate > 0 else None,
                "vigorous": intensity_vigorous if intensity_vigorous > 0 else None,
                "total": intensity_total if intensity_total > 0 else None
            }
    
    # Chercher intensité minutes dans stats si méthode directe n'existe pas
    # CORRECTION CRITIQUE : Toujours chercher dans stats même si intensity_data existe (stats contient les vraies valeurs)
    if isinstance(stats, dict):
        # CORRECTION CRITIQUE : Gérer None vs 0 explicitement
        moderate_raw = (
            stats.get('moderateIntensityMinutes') if stats.get('moderateIntensityMinutes') is not None else
            stats.get('intensityMinutesModerate') if stats.get('intensityMinutesModerate') is not None else
            None
        )
        intensity_moderate = safe_int(moderate_raw, 0)
        
        vigorous_raw = (
            stats.get('vigorousIntensityMinutes') if stats.get('vigorousIntensityMinutes') is not None else
            stats.get('intensityMinutesVigorous') if stats.get('intensityMinutesVigorous') is not None else
            None
        )
        intensity_vigorous = safe_int(vigorous_raw, 0)
        
        # Calculer total si non présent
        total_raw = (
            stats.get('totalIntensityMinutes') if stats.get('totalIntensityMinutes') is not None else
            stats.get('intensityMinutesTotal') if stats.get('intensityMinutesTotal') is not None else
            None
        )
        intensity_total = safe_int(total_raw, intensity_moderate + (intensity_vigorous * 2))  # Vigorous compte double
        
        # Si on a trouvé des valeurs dans stats, les utiliser (remplacer celles de intensity_data si existantes)
        if intensity_moderate > 0 or intensity_vigorous > 0:
            intensity_minutes = {
                "moderate": intensity_moderate if intensity_moderate > 0 else None,
                "vigorous": intensity_vigorous if intensity_vigorous > 0 else None,
                "total": intensity_total if intensity_total > 0 else None
            }
            print_debug(f"Parsed intensityMinutes from stats - moderate: {intensity_moderate}, vigorous: {intensity_vigorous}, total: {intensity_total}")
    
    # CORRECTION CRITIQUE : Agréger minutes intensives de toutes les activités de la journée
    # Initialiser depuis valeurs déjà parsées
    daily_moderate = safe_int(intensity_minutes.get("moderate"), 0)
    daily_vigorous = safe_int(intensity_minutes.get("vigorous"), 0)
    daily_total = safe_int(intensity_minutes.get("total"), 0)
    
    # Agréger depuis toutes les activités de cette date
    for swim_act in swim_list:
        if swim_act.get('date') and swim_act.get('date').startswith(date_str):
            intensity = swim_act.get('intensityMinutes', {})
            if intensity:
                daily_moderate += safe_int(intensity.get("moderate"), 0)
                daily_vigorous += safe_int(intensity.get("vigorous"), 0)
                daily_total += safe_int(intensity.get("total"), 0)
    
    for jump_act in jump_list:
        if jump_act.get('date') and jump_act.get('date').startswith(date_str):
            intensity = jump_act.get('intensityMinutes', {})
            if intensity:
                daily_moderate += safe_int(intensity.get("moderate"), 0)
                daily_vigorous += safe_int(intensity.get("vigorous"), 0)
                daily_total += safe_int(intensity.get("total"), 0)
    
    for cardio_act in cardio_list:
        if cardio_act.get('date') and cardio_act.get('date').startswith(date_str):
            intensity = cardio_act.get('intensityMinutes', {})
            if intensity:
                daily_moderate += safe_int(intensity.get("moderate"), 0)
                daily_vigorous += safe_int(intensity.get("vigorous"), 0)
                daily_total += safe_int(intensity.get("total"), 0)
    
    # Mettre à jour avec les valeurs agrégées
    if daily_moderate > 0 or daily_vigorous > 0 or daily_total > 0:
        intensity_minutes = {
            "moderate": daily_moderate if daily_moderate > 0 else None,
            "vigorous": daily_vigorous if daily_vigorous > 0 else None,
            "total": daily_total if daily_total > 0 else None
        }
        print_debug(f"Aggregated intensityMinutes for {date_str}: moderate={daily_moderate}, vigorous={daily_vigorous}, total={daily_total}")
        return intensity_minutes
    
    # Retourner None si aucune donnée
    return None if (intensity_minutes["moderate"] == 0 and intensity_minutes["vigorous"] == 0 and intensity_minutes["total"] == 0) else intensity_minutes


def parse_daily_floors(stats: Dict) -> int:
    """
    Parse les étages quotidiens depuis stats.
    
    Args:
        stats: Stats quotidiennes depuis client.get_stats()
        
    Returns:
        int: Nombre d'étages
    """
    if not isinstance(stats, dict):
        return 0
    
    return safe_int(
        stats.get('totalFloors') or
        stats.get('floorsAscended') or
        stats.get('elevationGain'),
        0
    )

