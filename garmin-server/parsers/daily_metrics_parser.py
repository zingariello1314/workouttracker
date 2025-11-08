"""
Parser Daily Metrics Garmin - Pas, distance, calories, FC, minutes intensives
"""
import sys
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug, normalize_datetime_to_utc, recursive_find_value
from utils.time_series_compression import optimize_time_series, decompress_time_series_delta
# 🔴 DÉSACTIVÉ : Interpolation désactivée pour garder uniquement les données réelles de Garmin
# from utils.heart_rate_interpolation import interpolate_heart_rate_time_series
from parsers.validation_ranges import (
    HR_MIN, HR_MAX, HR_RESTING_MIN, HR_RESTING_MAX,
    CALORIES_MIN, CALORIES_MAX,
    STEPS_MIN, STEPS_MAX,
    DISTANCE_MIN, DISTANCE_MAX,
    BODY_BATTERY_MIN, BODY_BATTERY_MAX,
    STRESS_MIN, STRESS_MAX,
    SPO2_MIN, SPO2_MAX
)
from utils.validators import validate_distance_steps_ratio, validate_distance_steps_consistency, validate_heart_rate


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
        # 🔴 FIX : Chercher les pas dans plusieurs champs possibles, avec priorité
        # Garmin API peut avoir les pas dans différents champs selon le contexte
        steps_value = (
            steps_data.get('totalSteps') or
            steps_data.get('steps') or
            steps_data.get('value') or
            steps_data.get('totalStepsValue') or
            steps_data.get('stepsValue') or
            0
        )
        # 🔴 FIX #9: Validation de plage pour steps
        parsed = safe_int(steps_value, 0, warn_on_fail=True, min_value=STEPS_MIN, max_value=STEPS_MAX, context=f"dailyMetrics.steps.{date_str}")
        if parsed > 0:
            print_debug(f"✅ Parsed steps for {date_str}: {parsed} (from {steps_value})")
        return parsed
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
        return safe_int(
            steps_data, 
            0,
            warn_on_fail=True,
            min_value=STEPS_MIN,
            max_value=STEPS_MAX,
            context=f"dailyMetrics.steps.{date_str}"
        )
    
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
    
    # 🔴 FIX #37: Valider le ratio distance/steps même si steps=0 et seuil max
    steps = parse_daily_steps(steps_data, date_str)
    is_valid, error_msg = validate_distance_steps_consistency(distance_km, steps, date_str)
    if not is_valid and error_msg:
        print_debug(f"⚠️ {date_str}: {error_msg}")
        # Si ratio suspect, recalcul depuis steps comme source principale
        if steps and steps > 0:
            estimated_distance = round((steps * 0.75) / 1000.0, 3)  # 0.75 m par pas moyen
            print_debug(f"⚠️  Correcting distance for {date_str} from {distance_km} km to {estimated_distance} km (based on steps)")
            distance_km = estimated_distance
        # Si distance > 100km sans steps, c'est suspect mais on garde la valeur (peut être vélo/natation longue distance)
        elif distance_km > 100:
            print_debug(f"⚠️ {date_str}: Distance très élevée ({distance_km}km) sans steps - possiblement vélo/natation longue distance")
    
    return distance_km


def parse_daily_calories(stats: Dict, date_str: str = "", steps_data: Any = None) -> Dict:
    """
    Parse les calories quotidiennes depuis stats.
    
    OPTIMISATION: Chercher dans tous les champs possibles de l'API Garmin.
    
    Args:
        stats: Stats quotidiennes depuis client.get_stats()
        
    Returns:
        dict: Calories avec total, active, resting
    """
    if not isinstance(stats, dict):
        print_debug(f"parse_daily_calories({date_str}): stats is not a dict, type={type(stats)}")
        return {"total": 0, "active": 0, "resting": 0}
    
    # 🟡 FIX : Debug pour comprendre ce qui est disponible dans stats
    if date_str and date_str.endswith(datetime.now().strftime('%Y-%m-%d')):
        print_debug(f"parse_daily_calories({date_str}): stats keys = {list(stats.keys())[:20] if isinstance(stats, dict) else 'N/A'}")
        if 'totalKilocalories' in stats:
            print_debug(f"parse_daily_calories({date_str}): totalKilocalories = {stats.get('totalKilocalories')}")
        if 'totalCalories' in stats:
            print_debug(f"parse_daily_calories({date_str}): totalCalories = {stats.get('totalCalories')}")
        if 'activeKilocalories' in stats:
            print_debug(f"parse_daily_calories({date_str}): activeKilocalories = {stats.get('activeKilocalories')}")
    
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
    
    # 🟡 FIX : Si total est 0 pour aujourd'hui, debug plus approfondi
    if total_cal == 0 and date_str and date_str.endswith(datetime.now().strftime('%Y-%m-%d')):
        print_debug(f"⚠️ parse_daily_calories({date_str}): total_cal_raw={total_cal_raw}, total_cal={total_cal}")
        print_debug(f"   Searching all keys for 'calorie' or 'kcal': {[k for k in stats.keys() if 'calorie' in str(k).lower() or 'kcal' in str(k).lower()]}")
    
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
    # 🔴 FIX #9: Validation de plage pour calories repos
    resting_cal = safe_int(
        resting_cal_raw, 
        0,
        warn_on_fail=True,
        min_value=CALORIES_MIN,
        max_value=CALORIES_MAX,
        context=f"dailyMetrics.{date_str}.calories.resting"
    )
    
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
    
    # 🟡 FIX : Si toujours à 0 et steps_data fourni, essayer de chercher dedans
    if (total_cal == 0 and active_cal == 0 and resting_cal == 0) and steps_data and isinstance(steps_data, dict):
        print_debug(f"⚠️ parse_daily_calories({date_str}): All 0, trying steps_data as fallback...")
        # Chercher calories dans steps_data
        steps_total = steps_data.get('totalKilocalories') or steps_data.get('totalCalories') or steps_data.get('calories')
        steps_active = steps_data.get('activeKilocalories') or steps_data.get('activeCalories')
        steps_resting = steps_data.get('bmrKilocalories') or steps_data.get('restingCalories') or steps_data.get('bmr')
        
        if steps_total is not None and steps_total > 0:
            result["total"] = safe_int(steps_total, 0)
            print_debug(f"✅ Found total calories in steps_data: {result['total']}")
        if steps_active is not None and steps_active > 0:
            result["active"] = safe_int(steps_active, 0)
            print_debug(f"✅ Found active calories in steps_data: {result['active']}")
        if steps_resting is not None and steps_resting > 0:
            result["resting"] = safe_int(steps_resting, 0)
            print_debug(f"✅ Found resting calories in steps_data: {result['resting']}")
        
        # Si total toujours 0 mais active+resting > 0, calculer
        if result["total"] == 0 and (result["active"] > 0 or result["resting"] > 0):
            result["total"] = result["active"] + result["resting"]
            print_debug(f"✅ Calculated total from steps_data: {result['total']}")
    
    print_debug(f"Returning calories dict: {result}")
    return result


def parse_daily_heart_rate(stats: Dict, hr_day: Any, date_str: str, steps_data: Any = None, activity_hr_time_series: Optional[List[Dict[str, Any]]] = None, activities: Optional[List[Dict[str, Any]]] = None, sleep_hr_time_series: Optional[List[Dict[str, Any]]] = None) -> Dict:
    """
    Parse la fréquence cardiaque quotidienne depuis stats et time series.
    
    Args:
        stats: Stats quotidiennes depuis client.get_stats()
        hr_day: Données HR time series depuis client.get_heart_rates()
        date_str: Date pour les logs
        steps_data: Données de pas (optionnel, pour aujourd'hui)
        activity_hr_time_series: Time series FC depuis activités (optionnel)
        activities: Liste des activités (optionnel, pour interpolation)
        sleep_hr_time_series: Time series FC depuis sommeil (optionnel, 🟢 PHASE 4)
        
    Returns:
        dict: FC avec resting, max, avg, timeSeries
    """
    heart_rate = {
        "resting": 0,
        "max": 0,
        "avg": 0,
        "timeSeries": []
    }
    
    # FC repos - Chercher dans stats d'abord, puis hr_day comme fallback
    resting_hr_raw = None
    max_hr_raw = None
    
    if isinstance(stats, dict):
        resting_hr_raw = (
            stats.get('restingHeartRate') if stats.get('restingHeartRate') is not None else
            stats.get('restingHR') if stats.get('restingHR') is not None else
            stats.get('avgRestingHeartRate') if stats.get('avgRestingHeartRate') is not None else
            stats.get('averageRestingHeartRate') if stats.get('averageRestingHeartRate') is not None else
            stats.get('restingBpm') if stats.get('restingBpm') is not None else
            stats.get('rhr') if stats.get('rhr') is not None else
            None
        )
        
        max_hr_raw = (
            stats.get('maxHeartRate') if stats.get('maxHeartRate') is not None else
            stats.get('maxHR') if stats.get('maxHR') is not None else
            stats.get('peakHeartRate') if stats.get('peakHeartRate') is not None else
            stats.get('maximumHeartRate') if stats.get('maximumHeartRate') is not None else
            stats.get('maxBpm') if stats.get('maxBpm') is not None else
            stats.get('peakBpm') if stats.get('peakBpm') is not None else
            None
        )
    
    # Fallback : chercher dans hr_day si pas trouvé dans stats
    if isinstance(hr_day, dict):
        if resting_hr_raw is None:
            resting_hr_raw = (
                hr_day.get('restingHeartRate') if hr_day.get('restingHeartRate') is not None else
                hr_day.get('restingHR') if hr_day.get('restingHR') is not None else
                hr_day.get('avgRestingHeartRate') if hr_day.get('avgRestingHeartRate') is not None else
                None
            )
        if max_hr_raw is None:
            max_hr_raw = (
                hr_day.get('maxHeartRate') if hr_day.get('maxHeartRate') is not None else
                hr_day.get('maxHR') if hr_day.get('maxHR') is not None else
                hr_day.get('peakHeartRate') if hr_day.get('peakHeartRate') is not None else
                hr_day.get('maximumHeartRate') if hr_day.get('maximumHeartRate') is not None else
                None
            )
    
    # 🟡 FIX : Debug pour aujourd'hui
    if date_str and date_str.endswith(datetime.now().strftime('%Y-%m-%d')):
        print_debug(f"parse_daily_heart_rate({date_str}): resting_hr_raw={resting_hr_raw}, max_hr_raw={max_hr_raw}, hr_day keys={list(hr_day.keys())[:10] if isinstance(hr_day, dict) else 'N/A'}")
    
    # 🔴 FIX #9: Validation de plage pour FC repos
    heart_rate["resting"] = safe_int(
        resting_hr_raw, 
        0,
        warn_on_fail=True,
        min_value=HR_RESTING_MIN,
        max_value=HR_RESTING_MAX,
        context=f"dailyMetrics.{date_str}.heartRate.resting"
    )
    
    # 🔴 FIX #9: Validation de plage pour FC max
    heart_rate["max"] = safe_int(
        max_hr_raw, 
        0,
        warn_on_fail=True,
        min_value=HR_MIN,
        max_value=HR_MAX,
        context=f"dailyMetrics.{date_str}.heartRate.max"
    )
    
    if isinstance(stats, dict):
        
        # FC moyenne - Chercher dans TOUS les champs possibles
        avg_hr_raw = (
            stats.get('averageHeartRate') if stats.get('averageHeartRate') is not None else
            stats.get('avgHR') if stats.get('avgHR') is not None else
            stats.get('meanHeartRate') if stats.get('meanHeartRate') is not None else
            stats.get('avgBpm') if stats.get('avgBpm') is not None else
            stats.get('averageBpm') if stats.get('averageBpm') is not None else
            None
        )
        # 🔴 FIX #9: Validation de plage pour FC moyenne
        heart_rate["avg"] = safe_int(
            avg_hr_raw, 
            0,
            warn_on_fail=True,
            min_value=HR_MIN,
            max_value=HR_MAX,
            context=f"dailyMetrics.{date_str}.heartRate.avg"
        )
        
        print_debug(f"Parsed HR from stats for {date_str} - resting_raw: {resting_hr_raw} -> {heart_rate['resting']}, max_raw: {max_hr_raw} -> {heart_rate['max']}, avg_raw: {avg_hr_raw} -> {heart_rate['avg']}")
    
    # HR time series + calculer max/avg si non dans stats
    ts = []
    max_hr_from_series = 0
    sum_hr = 0
    count_hr = 0
    
    if isinstance(hr_day, dict):
        # 🔴 FIX : Chercher time series dans TOUS les champs possibles de l'API Garmin
        # L'API peut retourner les données dans différents formats selon le contexte
        hr_vals = (
            hr_day.get('heartRateValues') or
            hr_day.get('values') or
            hr_day.get('data') or
            hr_day.get('timeSeries') or
            hr_day.get('heartRateTimeSeries') or
            hr_day.get('hrValues') or
            []
        )
        
        # 🔴 FIX : Si hr_vals est un dict, essayer d'extraire les valeurs
        if isinstance(hr_vals, dict):
            hr_vals = (
                hr_vals.get('heartRateValues') or
                hr_vals.get('values') or
                hr_vals.get('data') or
                hr_vals.get('timeSeries') or
                []
            )
        
        # Si c'est toujours pas une liste, essayer de convertir
        if not isinstance(hr_vals, list):
            hr_vals = []
        
        print_debug(f"🔍 Extracting HR time series from hr_day for {date_str}: found {len(hr_vals)} raw points")
        
        for p in hr_vals:
            try:
                # Format 1: [timestamp, bpm] (liste)
                if isinstance(p, list) and len(p) >= 2:
                    timestamp_raw = p[0]
                    bpm_raw = p[1]
                    if bpm_raw is not None:
                        bpm_val = safe_int(bpm_raw, 0)
                        if bpm_val > 0:
                            max_hr_from_series = max(max_hr_from_series, bpm_val)
                            sum_hr += bpm_val
                            count_hr += 1
                            ts.append({
                                "timestamp": normalize_datetime_to_utc(timestamp_raw),
                                "bpm": bpm_val
                            })
                # Format 2: {"timestamp": ..., "bpm": ...} (dict)
                elif isinstance(p, dict):
                    bpm_raw = p.get('bpm') or p.get('value') or p.get('heartRate') or p.get('hr')
                    timestamp_raw = p.get('timestamp') or p.get('time') or p.get('startTimeGMT') or p.get('startTimeLocal')
                    if bpm_raw is not None and timestamp_raw is not None:
                        bpm_val = safe_int(bpm_raw, 0)
                        if bpm_val > 0:
                            max_hr_from_series = max(max_hr_from_series, bpm_val)
                            sum_hr += bpm_val
                            count_hr += 1
                            ts.append({
                                "timestamp": normalize_datetime_to_utc(timestamp_raw),
                                "bpm": bpm_val
                            })
            except Exception as e:
                print_debug(f"⚠️ Error parsing HR time series point: {e}, point: {p}")
                continue
        
        print_debug(f"✅ Extracted {len(ts)} HR time series points from hr_day for {date_str}")
    
    # Si FC max non dans stats mais dans time series
    if heart_rate["max"] == 0 and max_hr_from_series > 0:
        heart_rate["max"] = max_hr_from_series
    
    # Si FC avg non dans stats mais dans time series
    if heart_rate["avg"] == 0 and count_hr > 0:
        heart_rate["avg"] = round(sum_hr / count_hr)
    
    # 🟢 NOUVEAU : Fusionner time series depuis activités si disponible
    # Créer ts_dict pour déduplication (sera réutilisé pour sommeil si nécessaire)
    ts_dict = {}
    if activity_hr_time_series and isinstance(activity_hr_time_series, list) and len(activity_hr_time_series) > 0:
        print_debug(f"🔄 Merging {len(activity_hr_time_series)} HR time series points from activities for {date_str}")
        
        # Créer un dict pour déduplication par timestamp
        for point in ts:
            timestamp = point.get('timestamp')
            if timestamp:
                ts_dict[timestamp] = point
        
        # Fusionner les points des activités (garder le plus récent en cas de doublon)
        for activity_point in activity_hr_time_series:
            if isinstance(activity_point, dict):
                timestamp = activity_point.get('timestamp')
                bpm = activity_point.get('bpm')
                
                if timestamp and bpm and safe_int(bpm, 0) > 0:
                    # Normaliser le timestamp
                    timestamp_normalized = normalize_datetime_to_utc(timestamp)
                    if timestamp_normalized:
                        # Si déjà présent, garder celui avec la valeur la plus élevée (probablement plus précis depuis activité)
                        existing = ts_dict.get(timestamp_normalized)
                        if existing:
                            existing_bpm = safe_int(existing.get('bpm'), 0)
                            new_bpm = safe_int(bpm, 0)
                            if new_bpm > existing_bpm:
                                ts_dict[timestamp_normalized] = {
                                    "timestamp": timestamp_normalized,
                                    "bpm": new_bpm
                                }
                        else:
                            ts_dict[timestamp_normalized] = {
                                "timestamp": timestamp_normalized,
                                "bpm": safe_int(bpm, 0)
                            }
        
        # Reconvertir en liste et trier
        ts = list(ts_dict.values())
        ts.sort(key=lambda x: x.get('timestamp', ''))
        
        print_debug(f"✅ Merged HR time series: {len(ts)} total points (from daily: {len(ts) - len(activity_hr_time_series)}, from activities: {len(activity_hr_time_series)})")
    
    # 🟢 PHASE 4 : Fusionner time series depuis sommeil si disponible
    if sleep_hr_time_series and isinstance(sleep_hr_time_series, list) and len(sleep_hr_time_series) > 0:
        print_debug(f"🔄 Merging {len(sleep_hr_time_series)} HR time series points from sleep for {date_str}")
        
        # Réutiliser ts_dict si déjà créé pour activités, sinon le créer depuis ts
        if not ts_dict:
            for point in ts:
                timestamp = point.get('timestamp')
                if timestamp:
                    ts_dict[timestamp] = point
        
        # Fusionner les points du sommeil (garder le plus récent en cas de doublon)
        for sleep_point in sleep_hr_time_series:
            if isinstance(sleep_point, dict):
                timestamp = sleep_point.get('timestamp')
                bpm = sleep_point.get('bpm')
                
                if timestamp and bpm and safe_int(bpm, 0) > 0:
                    timestamp_normalized = normalize_datetime_to_utc(timestamp)
                    if timestamp_normalized:
                        existing = ts_dict.get(timestamp_normalized)
                        if existing:
                            # En cas de doublon, garder la valeur la plus élevée (plus précise pour FC)
                            existing_bpm = safe_int(existing.get('bpm'), 0)
                            new_bpm = safe_int(bpm, 0)
                            if new_bpm > existing_bpm:
                                ts_dict[timestamp_normalized] = {"timestamp": timestamp_normalized, "bpm": new_bpm, "source": "sleep"}
                                # Mettre à jour les stats si nécessaire
                                if new_bpm > max_hr_from_series:
                                    max_hr_from_series = new_bpm
                                sum_hr = sum_hr - existing_bpm + new_bpm
                        else:
                            # Nouveau point, l'ajouter
                            ts_dict[timestamp_normalized] = {"timestamp": timestamp_normalized, "bpm": safe_int(bpm, 0), "source": "sleep"}
                            count_hr += 1
                            new_bpm = safe_int(bpm, 0)
                            sum_hr += new_bpm
                            if new_bpm > max_hr_from_series:
                                max_hr_from_series = new_bpm
        
        ts = list(ts_dict.values())
        ts.sort(key=lambda x: x.get('timestamp', ''))
        print_debug(f"✅ Merged HR time series with sleep: {len(ts)} total points (from sleep: {len(sleep_hr_time_series)})")
    
    # 🔴 FIX #24: Downsampling optimal avec compression intelligente
    if len(ts) > 0:
        try:
            # Optimiser la time series (downsampling + compression delta)
            # Cible: 288 points pour 24h (5min d'intervalle)
            ts = optimize_time_series(ts, target_points=288, use_delta=True)
        except Exception as e:
            print_debug(f"⚠️ Error optimizing time series for {date_str}, using raw data: {e}")
            # En cas d'erreur, utiliser les données brutes sans compression
            ts = ts[:288] if len(ts) > 288 else ts  # Limiter à 288 points max
    
    # 🔴 DÉSACTIVÉ : Interpolation désactivée pour garder uniquement les données réelles de Garmin
    # On garde uniquement les données réelles provenant de l'API Garmin
    if len(ts) < 50:
        print_debug(f"ℹ️ Time series FC pour {date_str}: {len(ts)} points réels (données limitées mais authentiques)")
    
    heart_rate["timeSeries"] = ts
    
    # Debug final pour vérifier les valeurs
    if date_str and date_str.endswith(datetime.now().strftime('%Y-%m-%d')):
        print_debug(f"✅ Final heart_rate for {date_str}: resting={heart_rate['resting']}, max={heart_rate['max']}, avg={heart_rate['avg']}, timeSeries_points={len(ts)}")
    
    # 🟡 FIX : Si toujours à 0 et steps_data fourni, essayer de chercher dedans
    if (heart_rate["resting"] == 0 and heart_rate["max"] == 0 and heart_rate["avg"] == 0) and steps_data and isinstance(steps_data, dict):
        print_debug(f"⚠️ parse_daily_heart_rate({date_str}): All 0, trying steps_data as fallback...")
        # Chercher FC repos dans steps_data
        steps_resting = steps_data.get('restingHeartRate') or steps_data.get('restingHR') or steps_data.get('avgRestingHeartRate')
        steps_max = steps_data.get('maxHeartRate') or steps_data.get('maxHR') or steps_data.get('maximumHeartRate')
        steps_avg = steps_data.get('avgHeartRate') or steps_data.get('averageHeartRate') or steps_data.get('avgBpm')
        
        if steps_resting is not None and steps_resting > 0:
            heart_rate["resting"] = safe_int(steps_resting, 0, min_value=HR_RESTING_MIN, max_value=HR_RESTING_MAX)
            print_debug(f"✅ Found resting HR in steps_data: {heart_rate['resting']}")
        if steps_max is not None and steps_max > 0:
            heart_rate["max"] = safe_int(steps_max, 0, min_value=HR_MIN, max_value=HR_MAX)
            print_debug(f"✅ Found max HR in steps_data: {heart_rate['max']}")
        if steps_avg is not None and steps_avg > 0:
            heart_rate["avg"] = safe_int(steps_avg, 0, min_value=HR_MIN, max_value=HR_MAX)
            print_debug(f"✅ Found avg HR in steps_data: {heart_rate['avg']}")
    
    # 🔴 FIX #10: Validation de cohérence des valeurs FC
    is_valid, error_msg = validate_heart_rate(
        heart_rate['resting'],
        heart_rate['max'],
        heart_rate['avg'],
        date_str
    )
    if not is_valid and error_msg:
        print_debug(f"⚠️ Validation FC échouée pour {date_str}: {error_msg}")
        # Corriger si possible
        if heart_rate['resting'] > heart_rate['max']:
            # Échanger si nécessaire
            temp = heart_rate['resting']
            heart_rate['resting'] = heart_rate['max']
            heart_rate['max'] = temp
            print_debug(f"✅ FC corrigée: resting={heart_rate['resting']}, max={heart_rate['max']}")
    
    print_debug(f"Final HR for {date_str} - resting: {heart_rate['resting']}, max: {heart_rate['max']}, avg: {heart_rate['avg']}, timeSeries length: {len(heart_rate['timeSeries'])}")
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

