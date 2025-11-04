"""
Parser Sleep Garmin - Sommeil, phases, heures coucher/lever
"""
import sys
import os
from datetime import datetime
from typing import Any, Dict, Optional

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug
from utils.error_tracker import track_parsing_error, ErrorSeverity


def parse_sleep_data(sleep: Any, date_str: str) -> Dict:
    """
    Parse les données de sommeil depuis Garmin.
    
    Args:
        sleep: Données de sommeil brutes
        date_str: Date pour les logs
        
    Returns:
        dict: Données de sommeil parsées avec duration, quality, phases, bedTime, wakeTime
    """
    if not isinstance(sleep, dict):
        return {
            "duration": 0,
            "quality": 0,
            "deepSleep": None,
            "lightSleep": None,
            "remSleep": None,
            "bedTime": None,
            "wakeTime": None
        }
    
    # Chercher dans dailySleepDTO si présent
    sleep_dto = sleep.get('dailySleepDTO', {}) or {}
    if not isinstance(sleep_dto, dict):
        sleep_dto = {}
    
    print_debug(f"Sleep data for {date_str} - Respiration epoch data: {len(sleep.get('wellnessEpochRespirationDataDTOList', []) or [])} items, averages: {len(sleep.get('wellnessEpochRespirationAveragesList', []) or [])} items")
    
    # Durée du sommeil (peut être en secondes ou heures)
    sleep_time_raw = (
        sleep_dto.get('sleepTimeSeconds') or
        sleep_dto.get('sleepTime') or
        sleep.get('sleepTime') or
        sleep.get('sleepTimeSeconds') or
        sleep.get('duration') or
        0
    )
    sleep_time = safe_int(sleep_time_raw, 0)
    
    # Si > 86400, probablement en secondes, convertir en heures
    if sleep_time > 86400:
        sleep_duration = sleep_time / 3600.0
    elif sleep_time > 24:
        sleep_duration = sleep_time / 60.0 / 60.0  # En minutes, convertir en heures
    else:
        sleep_duration = sleep_time  # Déjà en heures
    
    # 🔴 FIX #35: Parser phases de sommeil de manière complète depuis sleepLevelsMap
    # Chercher dans sleepLevelsMap d'abord (source principale selon le bilan)
    sleep_levels_map = sleep.get('sleepLevelsMap') or sleep_dto.get('sleepLevelsMap') or {}
    
    deep_sleep_seconds = 0
    light_sleep_seconds = 0
    rem_sleep_seconds = 0
    
    # Si sleepLevelsMap existe, extraire les phases
    if isinstance(sleep_levels_map, dict) and len(sleep_levels_map) > 0:
        print_debug(f"Parsing sleep phases from sleepLevelsMap for {date_str}: {list(sleep_levels_map.keys())}")
        for level, duration in sleep_levels_map.items():
            if isinstance(duration, (int, float)):
                level_lower = str(level).lower()
                if 'deep' in level_lower or level_lower == '3' or level_lower == '4':
                    deep_sleep_seconds += duration
                elif 'rem' in level_lower or 'dream' in level_lower or level_lower == '5':
                    rem_sleep_seconds += duration
                elif 'light' in level_lower or level_lower == '1' or level_lower == '2' or ('awake' not in level_lower and 'wake' not in level_lower):
                    light_sleep_seconds += duration
        print_debug(f"Phases extraites depuis sleepLevelsMap: deep={deep_sleep_seconds}s, light={light_sleep_seconds}s, rem={rem_sleep_seconds}s")
    
    # Si phases pas trouvées dans sleepLevelsMap, utiliser les champs directs
    if deep_sleep_seconds == 0 and light_sleep_seconds == 0 and rem_sleep_seconds == 0:
        deep_sleep_seconds = safe_int(
            sleep_dto.get('deepSleepSeconds') or
            sleep.get('deepSleepSeconds') or
            sleep.get('deepSleep') or
            sleep.get('deepSleepDuration') or
            0,
            0
        )
        
        light_sleep_seconds = safe_int(
            sleep_dto.get('lightSleepSeconds') or
            sleep.get('lightSleepSeconds') or
            sleep.get('lightSleep') or
            sleep.get('lightSleepDuration') or
            0,
            0
        )
        
        rem_sleep_seconds = safe_int(
            sleep_dto.get('remSleepSeconds') or
            sleep.get('remSleepSeconds') or
            sleep.get('rem') or
            sleep.get('remSleepDuration') or
            0,
            0
        )
    
    # Convertir en heures
    deep_sleep = deep_sleep_seconds / 3600.0 if deep_sleep_seconds > 0 else None
    light_sleep = light_sleep_seconds / 3600.0 if light_sleep_seconds > 0 else None
    rem_sleep = rem_sleep_seconds / 3600.0 if rem_sleep_seconds > 0 else None
    
    # 🔴 FIX #35: Parser heures coucher/lever de manière complète
    # Chercher dans plusieurs champs possibles
    bed_time_ts = (
        sleep_dto.get('sleepStartTimestampGMT') or
        sleep_dto.get('sleepStartTimestampLocal') or
        sleep_dto.get('sleepStartTimestamp') or
        sleep.get('sleepStartTimestampGMT') or
        sleep.get('sleepStartTimestampLocal') or
        sleep.get('sleepStartTimestamp') or
        sleep.get('bedTime') or
        sleep.get('sleepStart') or
        None
    )
    
    wake_time_ts = (
        sleep_dto.get('sleepEndTimestampGMT') or
        sleep_dto.get('sleepEndTimestampLocal') or
        sleep_dto.get('sleepEndTimestamp') or
        sleep.get('sleepEndTimestampGMT') or
        sleep.get('sleepEndTimestampLocal') or
        sleep.get('sleepEndTimestamp') or
        sleep.get('wakeTime') or
        sleep.get('sleepEnd') or
        None
    )
    
    # Convertir timestamps si nécessaire
    bed_time = None
    wake_time = None
    
    if bed_time_ts:
        try:
            if isinstance(bed_time_ts, (int, float)) and bed_time_ts > 1000000000000:  # Timestamp en millisecondes
                bed_time = datetime.fromtimestamp(bed_time_ts / 1000.0).strftime('%H:%M')
            elif isinstance(bed_time_ts, str):
                bed_time = bed_time_ts.split('T')[1][:5] if 'T' in bed_time_ts else bed_time_ts
        except:
            bed_time = str(bed_time_ts)
    
    if wake_time_ts:
        try:
            if isinstance(wake_time_ts, (int, float)) and wake_time_ts > 1000000000000:  # Timestamp en millisecondes
                wake_time = datetime.fromtimestamp(wake_time_ts / 1000.0).strftime('%H:%M')
            elif isinstance(wake_time_ts, str):
                wake_time = wake_time_ts.split('T')[1][:5] if 'T' in wake_time_ts else wake_time_ts
        except:
            wake_time = str(wake_time_ts)
    
    # 🟢 PRIORITÉ 6 : Extraire éveils, mouvements et détails supplémentaires
    awakenings_data = parse_sleep_awakenings(sleep, sleep_dto, date_str)
    movements_data = parse_sleep_movements(sleep, sleep_dto, date_str)
    phases_details = parse_sleep_phases_detailed(sleep, sleep_dto, date_str)
    
    return {
        "duration": round(sleep_duration, 2) if sleep_duration > 0 else 0,
        "quality": safe_int(
            sleep_dto.get('sleepScore') or
            sleep.get('sleepScore') or
            sleep.get('sleepQuality') or
            sleep.get('overallSleepScore'),
            0
        ),
        "deepSleep": round(deep_sleep, 2) if deep_sleep and deep_sleep > 0 else None,
        "lightSleep": round(light_sleep, 2) if light_sleep and light_sleep > 0 else None,
        "remSleep": round(rem_sleep, 2) if rem_sleep and rem_sleep > 0 else None,
        "bedTime": bed_time,
        "wakeTime": wake_time,
        # 🟢 PRIORITÉ 6 : Données détaillées supplémentaires
        "awakenings": awakenings_data if awakenings_data else None,
        "movements": movements_data if movements_data else None,
        "phasesDetails": phases_details if phases_details else None
    }


def parse_sleep_phases(sleep_dto: Dict) -> Dict:
    """
    Parse les phases de sommeil depuis dailySleepDTO.
    
    Args:
        sleep_dto: dailySleepDTO dictionary
        
    Returns:
        dict: Phases de sommeil (deepSleep, lightSleep, remSleep) en heures
    """
    if not isinstance(sleep_dto, dict):
        return {"deepSleep": None, "lightSleep": None, "remSleep": None}
    
    deep_sleep = safe_int(
        sleep_dto.get('deepSleepSeconds') or
        sleep_dto.get('deepSleep'),
        0
    ) / 3600.0
    
    light_sleep = safe_int(
        sleep_dto.get('lightSleepSeconds') or
        sleep_dto.get('lightSleep'),
        0
    ) / 3600.0
    
    rem_sleep = safe_int(
        sleep_dto.get('remSleepSeconds') or
        sleep_dto.get('remSleep'),
        0
    ) / 3600.0
    
    return {
        "deepSleep": round(deep_sleep, 2) if deep_sleep > 0 else None,
        "lightSleep": round(light_sleep, 2) if light_sleep > 0 else None,
        "remSleep": round(rem_sleep, 2) if rem_sleep > 0 else None
    }


def parse_sleep_times(sleep_dto: Dict) -> Dict:
    """
    Parse les heures de coucher/lever depuis dailySleepDTO.
    
    Args:
        sleep_dto: dailySleepDTO dictionary
        
    Returns:
        dict: Heures coucher/lever (bedTime, wakeTime) au format HH:MM
    """
    if not isinstance(sleep_dto, dict):
        return {"bedTime": None, "wakeTime": None}
    
    bed_time_ts = (
        sleep_dto.get('sleepStartTimestampLocal') or
        sleep_dto.get('sleepStartTimestampGMT')
    )
    
    wake_time_ts = (
        sleep_dto.get('sleepEndTimestampLocal') or
        sleep_dto.get('sleepEndTimestampGMT')
    )
    
    bed_time = None
    wake_time = None
    
    if bed_time_ts:
        try:
            if isinstance(bed_time_ts, (int, float)) and bed_time_ts > 1000000000000:  # Timestamp en millisecondes
                bed_time = datetime.fromtimestamp(bed_time_ts / 1000.0).strftime('%H:%M')
            elif isinstance(bed_time_ts, str):
                bed_time = bed_time_ts.split('T')[1][:5] if 'T' in bed_time_ts else bed_time_ts
        except:
            bed_time = str(bed_time_ts)
    
    if wake_time_ts:
        try:
            if isinstance(wake_time_ts, (int, float)) and wake_time_ts > 1000000000000:  # Timestamp en millisecondes
                wake_time = datetime.fromtimestamp(wake_time_ts / 1000.0).strftime('%H:%M')
            elif isinstance(wake_time_ts, str):
                wake_time = wake_time_ts.split('T')[1][:5] if 'T' in wake_time_ts else wake_time_ts
        except:
            wake_time = str(wake_time_ts)
    
    return {"bedTime": bed_time, "wakeTime": wake_time}


def extract_respiration_from_sleep(sleep: Dict, date_str: str) -> Dict:
    """
    Extrait les données de respiration depuis les données de sommeil.
    Les données de respiration peuvent être dans wellnessEpochRespirationDataDTOList
    et wellnessEpochRespirationAveragesList, ainsi que dans dailySleepDTO.
    
    Args:
        sleep: Données de sommeil brutes
        date_str: Date pour les logs
        
    Returns:
        dict: Données de respiration extraites avec awake/sleep min/max/avg
    """
    if not isinstance(sleep, dict):
        return {}
    
    sleep_dto = sleep.get('dailySleepDTO', {}) or {}
    if not isinstance(sleep_dto, dict):
        sleep_dto = {}
    
    # Chercher respiration éveillée dans wellnessEpochRespirationDataDTOList et wellnessEpochRespirationAveragesList
    resp_epoch_data = sleep.get('wellnessEpochRespirationDataDTOList', []) or []
    resp_avg_data = sleep.get('wellnessEpochRespirationAveragesList', []) or []
    
    print_debug(f"Sleep data for {date_str} - Respiration epoch data: {len(resp_epoch_data)} items, averages: {len(resp_avg_data)} items")
    
    # Parser respiration éveillée depuis epoch data si disponible
    resp_awake_values = []
    resp_sleep_values = []
    
    if resp_epoch_data:
        print_debug(f"Parsing {len(resp_epoch_data)} respiration epochs for {date_str}")
        for epoch in resp_epoch_data:
            if isinstance(epoch, dict):
                # Chercher état (awake/sleep) et valeur
                # Les epochs peuvent avoir 'sleeping' (bool), 'state' (string), ou des champs spécifiques
                is_sleeping = epoch.get('sleeping')
                state = epoch.get('state', '').lower() if isinstance(epoch.get('state'), str) else None
                if is_sleeping is None and isinstance(epoch.get('sleep'), str):
                    state = epoch.get('sleep').lower()
                
                value = (
                    epoch.get('value') or
                    epoch.get('respiration') or
                    epoch.get('respirationValue') or
                    epoch.get('respirationRate')
                )
                if value and isinstance(value, (int, float)) and value > 0:
                    # Si sleep est False, True, ou state indique awake/wake, classer comme éveillé
                    if (is_sleeping is False or
                        state in ('awake', 'eveille', 'wake', 'waking', 'awakening') or
                        (state is None and is_sleeping is None)):  # Si pas de state, considérer éveillé par défaut
                        resp_awake_values.append(float(value))
                    elif (is_sleeping is True or
                          state in ('sleep', 'sommeil', 'asleep', 'sleeping')):
                        resp_sleep_values.append(float(value))
        
        if resp_awake_values:
            print_debug(f"Found {len(resp_awake_values)} awake respiration values, range: {min(resp_awake_values):.1f}-{max(resp_awake_values):.1f}, avg: {sum(resp_awake_values)/len(resp_awake_values):.1f}")
        if resp_sleep_values:
            print_debug(f"Found {len(resp_sleep_values)} sleep respiration values, range: {min(resp_sleep_values):.1f}-{max(resp_sleep_values):.1f}, avg: {sum(resp_sleep_values)/len(resp_sleep_values):.1f}")
    
    # Parser respiration depuis averages si disponible
    resp_awake_from_avg = {}
    resp_sleep_from_avg = {}
    
    if resp_avg_data:
        for avg_item in resp_avg_data:
            if isinstance(avg_item, dict):
                state = avg_item.get('sleep') or avg_item.get('state', '').lower()
                if state in ('awake', 'eveille', 'wake', 'waking') or avg_item.get('sleep') == False:
                    resp_awake_from_avg = {
                        'min': avg_item.get('min') or avg_item.get('minRespiration'),
                        'max': avg_item.get('max') or avg_item.get('maxRespiration'),
                        'avg': avg_item.get('avg') or avg_item.get('averageRespiration') or avg_item.get('meanRespiration')
                    }
                elif state in ('sleep', 'sommeil', 'asleep') or avg_item.get('sleep') == True:
                    resp_sleep_from_avg = {
                        'min': avg_item.get('min') or avg_item.get('minRespiration'),
                        'max': avg_item.get('max') or avg_item.get('maxRespiration'),
                        'avg': avg_item.get('avg') or avg_item.get('averageRespiration') or avg_item.get('meanRespiration')
                    }
    
    # Utiliser aussi avgWakingRespirationValue et avgSleepRespirationValue depuis dailySleepDTO
    # même si epoch data est vide (cas de 2025-10-27)
    avg_waking_from_sleep = safe_float(sleep_dto.get('avgWakingRespirationValue'), None) if sleep_dto else None
    avg_sleep_from_sleep = safe_float(sleep_dto.get('avgSleepRespirationValue'), None) if sleep_dto else None
    lowest_from_sleep = safe_int(sleep_dto.get('lowestRespirationValue'), None) if sleep_dto else None
    highest_from_sleep = safe_int(sleep_dto.get('highestRespirationValue'), None) if sleep_dto else None
    
    # Construire réponse finale
    resp_from_sleep = {}
    
    # Utiliser respiration depuis epoch/averages si disponibles, sinon depuis dailySleepDTO
    if resp_awake_values or resp_awake_from_avg or avg_waking_from_sleep is not None:
        resp_from_sleep["awake"] = {
            "min": (
                resp_awake_from_avg.get('min') if resp_awake_from_avg.get('min')
                else (min(resp_awake_values) if resp_awake_values else lowest_from_sleep)
            ),
            "max": (
                resp_awake_from_avg.get('max') if resp_awake_from_avg.get('max')
                else (max(resp_awake_values) if resp_awake_values else highest_from_sleep)
            ),
            "avg": (
                resp_awake_from_avg.get('avg') if resp_awake_from_avg.get('avg')
                else (round(sum(resp_awake_values) / len(resp_awake_values), 1) if resp_awake_values else avg_waking_from_sleep)
            )
        }
    
    if (sleep_dto.get('averageRespirationValue') or
        avg_sleep_from_sleep is not None or
        sleep_dto.get('lowestRespirationValue') or
        sleep_dto.get('highestRespirationValue') or
        resp_sleep_values or
        resp_sleep_from_avg):
        resp_from_sleep["sleep"] = {
            "min": safe_int(
                resp_sleep_from_avg.get('min') if resp_sleep_from_avg.get('min')
                else (min(resp_sleep_values) if resp_sleep_values
                      else (lowest_from_sleep if lowest_from_sleep is not None
                            else (sleep_dto.get('lowestRespirationValue') if sleep_dto.get('lowestRespirationValue') else None)))
            ),
            "max": safe_int(
                resp_sleep_from_avg.get('max') if resp_sleep_from_avg.get('max')
                else (max(resp_sleep_values) if resp_sleep_values
                      else (highest_from_sleep if highest_from_sleep is not None
                            else (sleep_dto.get('highestRespirationValue') if sleep_dto.get('highestRespirationValue') else None)))
            ),
            "avg": safe_float(
                resp_sleep_from_avg.get('avg') if resp_sleep_from_avg.get('avg')
                else (round(sum(resp_sleep_values) / len(resp_sleep_values), 1) if resp_sleep_values
                      else (avg_sleep_from_sleep if avg_sleep_from_sleep is not None
                            else (sleep_dto.get('averageRespirationValue') if sleep_dto.get('averageRespirationValue') else None)))
            )
        }
    
    return resp_from_sleep


def parse_sleep_awakenings(
    sleep: Dict[str, Any],
    sleep_dto: Dict[str, Any],
    date_str: str
) -> Optional[Dict[str, Any]]:
    """
    Parse les éveils pendant le sommeil.
    
    🟢 PRIORITÉ 6 : Extraction des éveils pendant le sommeil.
    
    Les éveils peuvent être dans :
    - sleepMovementList (avec type 'AWAKE')
    - sleepLevelsMap (compte des périodes 'awake')
    - awakeCount ou awakeDurationSeconds
    
    Args:
        sleep: Données de sommeil brutes
        sleep_dto: dailySleepDTO
        date_str: Date pour les logs
        
    Returns:
        dict: Données sur les éveils (count, totalDuration, events) ou None
    """
    if not isinstance(sleep, dict):
        return None
    
    awakenings_data = {}
    
    # Chercher dans sleepMovementList (liste des mouvements/éveils)
    sleep_movements = sleep.get('sleepMovementList', []) or sleep_dto.get('sleepMovementList', []) or []
    if isinstance(sleep_movements, list) and len(sleep_movements) > 0:
        awake_events = []
        awake_duration_total = 0
        
        for movement in sleep_movements:
            if isinstance(movement, dict):
                movement_type = movement.get('type') or movement.get('level') or movement.get('state')
                if movement_type and ('awake' in str(movement_type).lower() or 'wake' in str(movement_type).lower()):
                    duration = safe_int(
                        movement.get('duration') or
                        movement.get('durationSeconds') or
                        movement.get('length'),
                        0
                    )
                    
                    timestamp = movement.get('timestamp') or movement.get('time') or movement.get('startTime')
                    
                    if duration > 0 or timestamp:
                        awake_events.append({
                            "timestamp": timestamp,
                            "duration": duration,  # en secondes
                            "durationMinutes": round(duration / 60.0, 1) if duration > 0 else None
                        })
                        awake_duration_total += duration
        
        if awake_events:
            awakenings_data["count"] = len(awake_events)
            awakenings_data["totalDuration"] = awake_duration_total  # en secondes
            awakenings_data["totalDurationMinutes"] = round(awake_duration_total / 60.0, 1)
            awakenings_data["events"] = awake_events[:20]  # Limiter à 20 éveils pour éviter trop de données
            print_debug(f"✅ Parsed {len(awake_events)} awakenings for {date_str} (total duration: {awake_duration_total}s)")
    
    # Si pas trouvé dans sleepMovementList, chercher dans les champs directs
    if not awakenings_data:
        awake_count = safe_int(
            sleep_dto.get('awakeCount') or
            sleep.get('awakeCount') or
            sleep.get('awakeningsCount') or
            sleep.get('wakeCount'),
            0
        )
        
        awake_duration_seconds = safe_int(
            sleep_dto.get('awakeDurationSeconds') or
            sleep_dto.get('awakeDuration') or
            sleep.get('awakeDurationSeconds') or
            sleep.get('awakeDuration'),
            0
        )
        
        # Chercher aussi dans sleepLevelsMap pour compter les périodes awake
        sleep_levels_map = sleep.get('sleepLevelsMap') or sleep_dto.get('sleepLevelsMap') or {}
        if isinstance(sleep_levels_map, dict):
            for level, duration in sleep_levels_map.items():
                if isinstance(duration, (int, float)) and duration > 0:
                    level_lower = str(level).lower()
                    if 'awake' in level_lower or 'wake' in level_lower:
                        if awake_count == 0:
                            awake_count = 1  # Au moins une période awake trouvée
                        awake_duration_seconds += int(duration)
        
        if awake_count > 0 or awake_duration_seconds > 0:
            awakenings_data["count"] = awake_count if awake_count > 0 else 1
            awakenings_data["totalDuration"] = awake_duration_seconds
            awakenings_data["totalDurationMinutes"] = round(awake_duration_seconds / 60.0, 1) if awake_duration_seconds > 0 else None
            print_debug(f"✅ Parsed awakenings from direct fields for {date_str}: count={awake_count}, duration={awake_duration_seconds}s")
    
    return awakenings_data if awakenings_data else None


def parse_sleep_movements(
    sleep: Dict[str, Any],
    sleep_dto: Dict[str, Any],
    date_str: str
) -> Optional[Dict[str, Any]]:
    """
    Parse les mouvements pendant le sommeil.
    
    🟢 PRIORITÉ 6 : Extraction des mouvements pendant le sommeil.
    
    Les mouvements peuvent être dans :
    - sleepMovementList (avec types de mouvement)
    - movementCount ou restlessCount
    
    Args:
        sleep: Données de sommeil brutes
        sleep_dto: dailySleepDTO
        date_str: Date pour les logs
        
    Returns:
        dict: Données sur les mouvements (count, restlessCount, events) ou None
    """
    if not isinstance(sleep, dict):
        return None
    
    movements_data = {}
    
    # Chercher dans sleepMovementList
    sleep_movements = sleep.get('sleepMovementList', []) or sleep_dto.get('sleepMovementList', []) or []
    if isinstance(sleep_movements, list) and len(sleep_movements) > 0:
        movement_events = []
        restless_count = 0
        
        for movement in sleep_movements:
            if isinstance(movement, dict):
                movement_type = movement.get('type') or movement.get('level') or movement.get('state')
                if movement_type and ('awake' not in str(movement_type).lower() and 'wake' not in str(movement_type).lower()):
                    # C'est un mouvement (pas un éveil)
                    duration = safe_int(
                        movement.get('duration') or
                        movement.get('durationSeconds'),
                        0
                    )
                    
                    timestamp = movement.get('timestamp') or movement.get('time') or movement.get('startTime')
                    
                    # Si le mouvement est court (< 30 secondes), c'est probablement un mouvement agité
                    if duration > 0 and duration < 30:
                        restless_count += 1
                    
                    if timestamp or duration > 0:
                        movement_events.append({
                            "timestamp": timestamp,
                            "duration": duration,
                            "type": str(movement_type)
                        })
        
        if movement_events:
            movements_data["count"] = len(movement_events)
            movements_data["restlessCount"] = restless_count
            movements_data["events"] = movement_events[:50]  # Limiter à 50 mouvements
            print_debug(f"✅ Parsed {len(movement_events)} movements for {date_str} ({restless_count} restless)")
    
    # Si pas trouvé dans sleepMovementList, chercher dans les champs directs
    if not movements_data:
        movement_count = safe_int(
            sleep_dto.get('movementCount') or
            sleep.get('movementCount') or
            sleep.get('movementsCount'),
            0
        )
        
        restless_count = safe_int(
            sleep_dto.get('restlessCount') or
            sleep.get('restlessCount') or
            sleep.get('restlessMovementsCount'),
            0
        )
        
        if movement_count > 0 or restless_count > 0:
            movements_data["count"] = movement_count
            movements_data["restlessCount"] = restless_count
            print_debug(f"✅ Parsed movements from direct fields for {date_str}: count={movement_count}, restless={restless_count}")
    
    return movements_data if movements_data else None


def parse_sleep_phases_detailed(
    sleep: Dict[str, Any],
    sleep_dto: Dict[str, Any],
    date_str: str
) -> Optional[Dict[str, Any]]:
    """
    Parse les détails des phases de sommeil (timestamps, transitions, etc.).
    
    🟢 PRIORITÉ 6 : Extraction des détails des phases de sommeil.
    
    Les détails peuvent inclure :
    - Timestamps de début/fin pour chaque phase
    - Nombre de transitions entre phases
    - Durée de chaque période de phase
    
    Args:
        sleep: Données de sommeil brutes
        sleep_dto: dailySleepDTO
        date_str: Date pour les logs
        
    Returns:
        dict: Détails des phases (transitions, periods) ou None
    """
    if not isinstance(sleep, dict):
        return None
    
    phases_details = {}
    
    # Chercher dans sleepLevelsList (liste chronologique des phases)
    sleep_levels_list = sleep.get('sleepLevelsList', []) or sleep_dto.get('sleepLevelsList', []) or []
    if isinstance(sleep_levels_list, list) and len(sleep_levels_list) > 0:
        periods = []
        transitions = 0
        previous_level = None
        
        for level_item in sleep_levels_list:
            if isinstance(level_item, dict):
                level = level_item.get('level') or level_item.get('type') or level_item.get('state')
                start_time = level_item.get('startTime') or level_item.get('timestamp') or level_item.get('time')
                duration = safe_int(
                    level_item.get('duration') or
                    level_item.get('durationSeconds'),
                    0
                )
                
                if level and start_time:
                    periods.append({
                        "level": str(level),
                        "startTime": start_time,
                        "duration": duration,
                        "durationMinutes": round(duration / 60.0, 1) if duration > 0 else None
                    })
                    
                    # Compter les transitions
                    if previous_level and previous_level != level:
                        transitions += 1
                    
                    previous_level = level
        
        if periods:
            phases_details["transitions"] = transitions
            phases_details["periods"] = periods[:100]  # Limiter à 100 périodes
            phases_details["periodsCount"] = len(periods)
            print_debug(f"✅ Parsed {len(periods)} sleep phases periods for {date_str} ({transitions} transitions)")
    
    # Chercher aussi dans sleepMovementList pour transitions (si disponible)
    if not phases_details.get("transitions"):
        sleep_movements = sleep.get('sleepMovementList', []) or sleep_dto.get('sleepMovementList', []) or []
        if isinstance(sleep_movements, list) and len(sleep_movements) > 1:
            # Compter les transitions comme changements de type
            transitions = 0
            previous_type = None
            for movement in sleep_movements:
                if isinstance(movement, dict):
                    movement_type = movement.get('type') or movement.get('level')
                    if movement_type and previous_type and movement_type != previous_type:
                        transitions += 1
                    previous_type = movement_type
            
            if transitions > 0:
                phases_details["transitions"] = transitions
                print_debug(f"✅ Parsed {transitions} transitions from sleepMovementList for {date_str}")
    
    return phases_details if phases_details else None
