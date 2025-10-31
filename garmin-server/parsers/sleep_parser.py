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
    
    # Phases de sommeil (peut être en secondes)
    deep_sleep = safe_int(
        sleep_dto.get('deepSleepSeconds') or
        sleep.get('deepSleepSeconds') or
        sleep.get('deepSleep') or
        sleep.get('deepSleepDuration'),
        0
    ) / 3600.0
    
    light_sleep = safe_int(
        sleep_dto.get('lightSleepSeconds') or
        sleep.get('lightSleepSeconds') or
        sleep.get('lightSleep') or
        sleep.get('lightSleepDuration'),
        0
    ) / 3600.0
    
    rem_sleep = safe_int(
        sleep_dto.get('remSleepSeconds') or
        sleep.get('remSleepSeconds') or
        sleep.get('remSleep') or
        sleep.get('remSleepDuration'),
        0
    ) / 3600.0
    
    # Heures coucher/lever (timestamps en millisecondes)
    bed_time_ts = (
        sleep_dto.get('sleepStartTimestampLocal') or
        sleep_dto.get('sleepStartTimestampGMT') or
        sleep.get('bedTime') or
        sleep.get('sleepStart')
    )
    
    wake_time_ts = (
        sleep_dto.get('sleepEndTimestampLocal') or
        sleep_dto.get('sleepEndTimestampGMT') or
        sleep.get('wakeTime') or
        sleep.get('sleepEnd')
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
    
    return {
        "duration": round(sleep_duration, 2) if sleep_duration > 0 else 0,
        "quality": safe_int(
            sleep_dto.get('sleepScore') or
            sleep.get('sleepScore') or
            sleep.get('sleepQuality') or
            sleep.get('overallSleepScore'),
            0
        ),
        "deepSleep": round(deep_sleep, 2) if deep_sleep > 0 else None,
        "lightSleep": round(light_sleep, 2) if light_sleep > 0 else None,
        "remSleep": round(rem_sleep, 2) if rem_sleep > 0 else None,
        "bedTime": bed_time,
        "wakeTime": wake_time
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

