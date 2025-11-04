"""
Parser Respiration Garmin - Respiration éveillée et sommeil
"""
import sys
import os
from typing import Any, Dict, Optional

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug, normalize_datetime_to_utc


def parse_respiration_data(respiration_data: Any, sleep: Optional[Dict], date_str: str) -> Optional[Dict]:
    """
    Parse les données de respiration depuis Garmin.
    
    🟢 PRIORITÉ 2 : Retourne maintenant aussi les time series si disponibles.
    
    CORRECTION CRITIQUE : Fusionne données depuis plusieurs sources:
    - respiration_data (client.get_respiration_data())
    - sleep.dailySleepDTO (avgWakingRespirationValue, avgSleepRespirationValue, etc.)
    - sleep.wellnessEpochRespirationDataDTOList (epoch data pour time series)
    
    Args:
        respiration_data: Données de respiration brutes depuis client.get_respiration_data()
        sleep: Données de sommeil (pour fallback et time series epoch)
        date_str: Date pour les logs
        
    Returns:
        dict: Données de respiration avec awake/sleep min/max/avg et timeSeries si disponible
    """
    # CORRECTION : Si respiration_data est None, utiliser avgWakingRespirationValue depuis sleep.dailySleepDTO
    if respiration_data is None:
        # Fallback : Utiliser respiration depuis sleep.dailySleepDTO si disponible
        if isinstance(sleep, dict):
            sleep_dto = sleep.get('dailySleepDTO', {}) or {}
            if sleep_dto:
                avg_waking_from_sleep = safe_float(sleep_dto.get('avgWakingRespirationValue'), None)
                avg_sleep_from_sleep = safe_float(sleep_dto.get('avgSleepRespirationValue'), None)
                lowest_from_sleep = safe_int(sleep_dto.get('lowestRespirationValue'), None)
                highest_from_sleep = safe_int(sleep_dto.get('highestRespirationValue'), None)
                
                if avg_waking_from_sleep is not None or avg_sleep_from_sleep is not None:
                    print_debug(f"respiration_data is None for {date_str}, using avgWakingRespirationValue from sleep.dailySleepDTO")
                    return {
                        "awake": {
                            "min": lowest_from_sleep,
                            "max": highest_from_sleep,
                            "avg": avg_waking_from_sleep
                        },
                        "sleep": {
                            "min": lowest_from_sleep,
                            "max": highest_from_sleep,
                            "avg": avg_sleep_from_sleep
                        } if avg_sleep_from_sleep is not None else None
                    }
        return None
    
    if not isinstance(respiration_data, dict):
        # Si c'est une liste, parser différemment
        if isinstance(respiration_data, list) and len(respiration_data) > 0:
            return parse_respiration_list(respiration_data)
        return None
    
    print_debug(f"Respiration data structure for {date_str}: {list(respiration_data.keys())[:20]}")
    
    # Logger les valeurs importantes avec leurs valeurs réelles
    avg_waking = respiration_data.get('avgWakingRespirationValue')
    avg_sleep = respiration_data.get('avgSleepRespirationValue')
    lowest = respiration_data.get('lowestRespirationValue')
    highest = respiration_data.get('highestRespirationValue')
    
    if avg_waking is not None:
        print_debug(f"avgWakingRespirationValue found: {avg_waking} (type: {type(avg_waking).__name__})")
    if avg_sleep is not None:
        print_debug(f"avgSleepRespirationValue found: {avg_sleep} (type: {type(avg_sleep).__name__})")
    if lowest is not None:
        print_debug(f"lowestRespirationValue found: {lowest} (type: {type(lowest).__name__})")
    if highest is not None:
        print_debug(f"highestRespirationValue found: {highest} (type: {type(highest).__name__})")
    
    # Respirations éveillé - Chercher dans plusieurs champs possibles (Garmin utilise avgWakingRespirationValue)
    # PRIORITÉ: avgWakingRespirationValue (champ principal Garmin)
    resp_awake_avg_raw = respiration_data.get('avgWakingRespirationValue')
    if not resp_awake_avg_raw:
        resp_awake_avg_raw = (
            respiration_data.get('avgWakingRespiration') or
            respiration_data.get('wakingRespirationAvg') or
            respiration_data.get('respirationAwakeAvg') or
            respiration_data.get('awakeAvg') or
            respiration_data.get('avgRespirationAwake') or
            respiration_data.get('respirationAvgAwake') or
            respiration_data.get('awakeRespirationAvg')
        )
    
    resp_awake_min = safe_int(
        respiration_data.get('minWakingRespirationValue') or
        respiration_data.get('minWakingRespiration') or
        respiration_data.get('wakingRespirationMin') or
        respiration_data.get('respirationAwakeMin') or
        respiration_data.get('awakeMin') or
        respiration_data.get('minRespirationAwake') or
        respiration_data.get('respirationMinAwake') or
        respiration_data.get('awakeRespirationMin'),
        0
    )
    
    resp_awake_max = safe_int(
        respiration_data.get('maxWakingRespirationValue') or
        respiration_data.get('maxWakingRespiration') or
        respiration_data.get('wakingRespirationMax') or
        respiration_data.get('respirationAwakeMax') or
        respiration_data.get('awakeMax') or
        respiration_data.get('maxRespirationAwake') or
        respiration_data.get('respirationMaxAwake') or
        respiration_data.get('awakeRespirationMax'),
        0
    )
    
    # Utiliser safe_float pour avg (peut être décimal), safe_int pour min/max
    resp_awake_avg = safe_float(resp_awake_avg_raw, 0) if resp_awake_avg_raw is not None else 0
    if resp_awake_avg_raw is not None:
        print_debug(f"resp_awake_avg_raw = {resp_awake_avg_raw} (type: {type(resp_awake_avg_raw).__name__}), parsed = {resp_awake_avg}")
    
    # Respirations sommeil - Chercher avgSleepRespirationValue
    # PRIORITÉ: avgSleepRespirationValue (champ principal Garmin)
    resp_sleep_avg_raw = respiration_data.get('avgSleepRespirationValue')
    if not resp_sleep_avg_raw:
        resp_sleep_avg_raw = (
            respiration_data.get('avgSleepRespiration') or
            respiration_data.get('sleepRespirationAvg') or
            respiration_data.get('respirationSleepAvg') or
            respiration_data.get('sleepAvg') or
            respiration_data.get('avgRespirationSleep') or
            respiration_data.get('respirationAvgSleep') or
            respiration_data.get('sleepRespirationAvg')
        )
    
    resp_sleep_min = safe_int(
        respiration_data.get('minSleepRespirationValue') or
        respiration_data.get('minSleepRespiration') or
        respiration_data.get('sleepRespirationMin') or
        respiration_data.get('respirationSleepMin') or
        respiration_data.get('sleepMin') or
        respiration_data.get('minRespirationSleep') or
        respiration_data.get('respirationMinSleep') or
        respiration_data.get('sleepRespirationMin'),
        0
    )
    
    resp_sleep_max = safe_int(
        respiration_data.get('maxSleepRespirationValue') or
        respiration_data.get('maxSleepRespiration') or
        respiration_data.get('sleepRespirationMax') or
        respiration_data.get('respirationSleepMax') or
        respiration_data.get('sleepMax') or
        respiration_data.get('maxRespirationSleep') or
        respiration_data.get('respirationMaxSleep') or
        respiration_data.get('sleepRespirationMax'),
        0
    )
    
    # Utiliser safe_float pour avg (peut être décimal), safe_int pour min/max
    resp_sleep_avg = safe_float(resp_sleep_avg_raw, 0) if resp_sleep_avg_raw is not None else 0
    if resp_sleep_avg_raw is not None:
        print_debug(f"resp_sleep_avg_raw = {resp_sleep_avg_raw} (type: {type(resp_sleep_avg_raw).__name__}), parsed = {resp_sleep_avg}")
    
    print_debug(f"Parsed respiration - Awake: min={resp_awake_min}, max={resp_awake_max}, avg={resp_awake_avg} | Sleep: min={resp_sleep_min}, max={resp_sleep_max}, avg={resp_sleep_avg}")
    
    # CORRECTION CRITIQUE : Sauvegarder respiration même si seulement avgWakingRespirationValue trouvé
    # Si avgWakingRespirationValue ou avgSleepRespirationValue existe, sauvegarder même si min/max sont 0
    has_resp_data = (
        (resp_awake_min > 0 or resp_awake_max > 0 or resp_awake_avg > 0) or
        (resp_sleep_min > 0 or resp_sleep_max > 0 or resp_sleep_avg > 0) or
        (resp_awake_avg_raw is not None) or  # avgWakingRespirationValue existe - PRIORITÉ ABSOLUE
        (resp_sleep_avg_raw is not None)  # avgSleepRespirationValue existe - PRIORITÉ ABSOLUE
    )
    
    if not has_resp_data:
        return None
    
    print_debug(f"has_resp_data=True for {date_str}: resp_awake_avg={resp_awake_avg}, resp_awake_avg_raw={resp_awake_avg_raw}, resp_awake_min={resp_awake_min}, resp_awake_max={resp_awake_max}")
    
    # Fusionner avec respiration existante (depuis sommeil)
    existing_resp = {}
    if isinstance(sleep, dict):
        sleep_dto = sleep.get('dailySleepDTO', {}) or {}
        if sleep_dto:
            # Extraire respiration depuis sleep si disponible
            existing_resp = {
                "awake": {
                    "min": safe_int(sleep_dto.get('lowestRespirationValue'), None),
                    "max": safe_int(sleep_dto.get('highestRespirationValue'), None),
                    "avg": safe_float(sleep_dto.get('avgWakingRespirationValue'), None)
                } if sleep_dto.get('avgWakingRespirationValue') else None,
                "sleep": {
                    "min": safe_int(sleep_dto.get('lowestRespirationValue'), None),
                    "max": safe_int(sleep_dto.get('highestRespirationValue'), None),
                    "avg": safe_float(sleep_dto.get('avgSleepRespirationValue'), None)
                } if sleep_dto.get('avgSleepRespirationValue') else None
            }
    
    # CORRECTION CRITIQUE : Utiliser lowestRespirationValue et highestRespirationValue si min/max sont 0
    # Ces valeurs globales s'appliquent à la fois awake et sleep
    global_lowest = safe_int(respiration_data.get('lowestRespirationValue'), None) if isinstance(respiration_data, dict) else None
    global_highest = safe_int(respiration_data.get('highestRespirationValue'), None) if isinstance(respiration_data, dict) else None
    
    # CORRECTION CRITIQUE : Construire respiration avec fusion intelligente
    # PRIORITÉ ABSOLUE : Si resp_awake_avg_raw is not None, utiliser resp_awake_avg même si == 0 (valeur réelle)
    if resp_awake_avg_raw is not None:
        resp_awake_avg_final = resp_awake_avg  # Utiliser même si == 0 (valeur réelle de l'API)
    else:
        resp_awake_avg_final = existing_resp.get("awake", {}).get("avg") if existing_resp.get("awake") else None
    
    # CORRECTION : Utiliser global_lowest/highest si resp_awake_min/max sont 0
    if resp_awake_min > 0:
        resp_awake_min_final = resp_awake_min
    elif global_lowest is not None:
        resp_awake_min_final = global_lowest
    else:
        resp_awake_min_final = existing_resp.get("awake", {}).get("min") if existing_resp.get("awake") else None
    
    if resp_awake_max > 0:
        resp_awake_max_final = resp_awake_max
    elif global_highest is not None:
        resp_awake_max_final = global_highest
    else:
        resp_awake_max_final = existing_resp.get("awake", {}).get("max") if existing_resp.get("awake") else None
    
    # PRIORITÉ ABSOLUE : Si resp_sleep_avg_raw is not None, utiliser resp_sleep_avg même si == 0 (valeur réelle)
    if resp_sleep_avg_raw is not None:
        resp_sleep_avg_final = resp_sleep_avg  # Utiliser même si == 0 (valeur réelle de l'API)
    else:
        resp_sleep_avg_final = (
            existing_resp.get("sleep", {}).get("avg") if existing_resp.get("sleep") else
            (safe_float(sleep_dto.get('averageRespirationValue'), None) if isinstance(sleep, dict) and isinstance(sleep.get('dailySleepDTO', {}), dict) and sleep.get('dailySleepDTO', {}).get('averageRespirationValue') is not None else None)
        )
    
    # CORRECTION : Utiliser global_lowest/highest si resp_sleep_min/max sont 0
    if resp_sleep_min > 0:
        resp_sleep_min_final = resp_sleep_min
    elif global_lowest is not None:
        resp_sleep_min_final = global_lowest
    else:
        resp_sleep_min_final = (
            existing_resp.get("sleep", {}).get("min") if existing_resp.get("sleep") else
            (safe_int(sleep_dto.get('lowestRespirationValue'), None) if isinstance(sleep, dict) and isinstance(sleep.get('dailySleepDTO', {}), dict) and sleep.get('dailySleepDTO', {}).get('lowestRespirationValue') is not None else None)
        )
    
    if resp_sleep_max > 0:
        resp_sleep_max_final = resp_sleep_max
    elif global_highest is not None:
        resp_sleep_max_final = global_highest
    else:
        resp_sleep_max_final = (
            existing_resp.get("sleep", {}).get("max") if existing_resp.get("sleep") else
            (safe_int(sleep_dto.get('highestRespirationValue'), None) if isinstance(sleep, dict) and isinstance(sleep.get('dailySleepDTO', {}), dict) and sleep.get('dailySleepDTO', {}).get('highestRespirationValue') is not None else None)
        )
    
    # CORRECTION CRITIQUE : Sauvegarder respiration UNIQUEMENT si on a au moins une valeur (avg, min, ou max)
    if not (resp_awake_avg_final is not None or resp_awake_min_final is not None or resp_awake_max_final is not None or
            resp_sleep_avg_final is not None or resp_sleep_min_final is not None or resp_sleep_max_final is not None):
        print_debug(f"WARNING: has_resp_data=True but all final values are None for {date_str}!")
        return None
    
    # 🟢 PRIORITÉ 2 : Extraire time series depuis epoch data si disponible
    time_series = []
    if isinstance(sleep, dict):
        resp_epoch_data = sleep.get('wellnessEpochRespirationDataDTOList', []) or []
        if resp_epoch_data:
            print_debug(f"Extracting respiration time series from {len(resp_epoch_data)} epochs for {date_str}")
            for epoch in resp_epoch_data:
                if isinstance(epoch, dict):
                    value = (
                        epoch.get('value') or
                        epoch.get('respiration') or
                        epoch.get('respirationValue') or
                        epoch.get('respirationRate')
                    )
                    timestamp = epoch.get('timestamp') or epoch.get('time') or epoch.get('ts')
                    
                    if value and isinstance(value, (int, float)) and value > 0:
                        # Normaliser timestamp en UTC
                        ts_str = normalize_datetime_to_utc(timestamp) if timestamp else None
                        
                        time_series.append({
                            "timestamp": ts_str,
                            "value": safe_float(value, 0)
                        })
            
            # Downsampling : 1 point par heure (max 24 points/jour) si trop de points
            if len(time_series) > 24:
                from datetime import datetime
                downsampled = []
                last_hour = None
                for ts_item in time_series:
                    if ts_item.get('timestamp'):
                        try:
                            ts_str = ts_item['timestamp'].replace('Z', '+00:00')
                            ts_dt = datetime.fromisoformat(ts_str) if '+' in ts_str else datetime.fromisoformat(ts_str + '+00:00')
                            hour = ts_dt.hour
                            if hour != last_hour:
                                downsampled.append(ts_item)
                                last_hour = hour
                        except:
                            if len(downsampled) < 24:
                                downsampled.append(ts_item)
                    else:
                        if len(downsampled) < 24:
                            downsampled.append(ts_item)
                time_series = downsampled
                print_debug(f"Downsampled respiration time series to {len(time_series)} points for {date_str}")
    
    result = {
        "awake": {
            "min": resp_awake_min_final,
            "max": resp_awake_max_final,
            "avg": resp_awake_avg_final
        },
        "sleep": {
            "min": resp_sleep_min_final,
            "max": resp_sleep_max_final,
            "avg": resp_sleep_avg_final
        } if (resp_sleep_avg_final is not None or resp_sleep_min_final is not None or resp_sleep_max_final is not None) else None
    }
    
    # 🟢 PRIORITÉ 2 : Ajouter time series si disponible
    if time_series:
        result["timeSeries"] = time_series
        print_debug(f"Added {len(time_series)} respiration time series points for {date_str}")
    
    print_debug(f"Final respiration for {date_str} - Awake: min={resp_awake_min_final}, max={resp_awake_max_final}, avg={resp_awake_avg_final} | Sleep: min={resp_sleep_min_final}, max={resp_sleep_max_final}, avg={resp_sleep_avg_final} | TimeSeries: {len(time_series) if time_series else 0} points")
    
    return result


def parse_respiration_epochs(epoch_data: list) -> Dict:
    """
    Parse les données de respiration depuis epoch data.
    
    Args:
        epoch_data: Liste d'epochs de respiration
        
    Returns:
        dict: Données de respiration avec awake/sleep values
    """
    resp_awake_values = []
    resp_sleep_values = []
    
    for epoch in epoch_data:
        if isinstance(epoch, dict):
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
                if (is_sleeping is False or
                    state in ('awake', 'eveille', 'wake', 'waking', 'awakening') or
                    (state is None and is_sleeping is None)):
                    resp_awake_values.append(float(value))
                elif (is_sleeping is True or
                      state in ('sleep', 'sommeil', 'asleep', 'sleeping')):
                    resp_sleep_values.append(float(value))
    
    result = {}
    if resp_awake_values:
        result["awake"] = {
            "min": min(resp_awake_values),
            "max": max(resp_awake_values),
            "avg": round(sum(resp_awake_values) / len(resp_awake_values), 1)
        }
    if resp_sleep_values:
        result["sleep"] = {
            "min": min(resp_sleep_values),
            "max": max(resp_sleep_values),
            "avg": round(sum(resp_sleep_values) / len(resp_sleep_values), 1)
        }
    
    return result


def merge_respiration_sources(resp_data: Optional[Dict], sleep_dto: Optional[Dict], existing_resp: Optional[Dict] = None) -> Optional[Dict]:
    """
    Fusionne les données de respiration depuis plusieurs sources.
    
    Args:
        resp_data: Données de respiration depuis client.get_respiration_data()
        sleep_dto: dailySleepDTO depuis sleep data
        existing_resp: Respiration existante (depuis sleep parser)
        
    Returns:
        dict: Données de respiration fusionnées ou None
    """
    if existing_resp and isinstance(existing_resp, dict) and (existing_resp.get("awake") or existing_resp.get("sleep")):
        # Si respiration existe déjà (depuis sleep), la retourner
        return existing_resp
    
    if not resp_data and sleep_dto:
        # Fallback : Utiliser respiration depuis sleep.dailySleepDTO
        avg_waking_from_sleep = safe_float(sleep_dto.get('avgWakingRespirationValue'), None)
        avg_sleep_from_sleep = safe_float(sleep_dto.get('avgSleepRespirationValue'), None)
        lowest_from_sleep = safe_int(sleep_dto.get('lowestRespirationValue'), None)
        highest_from_sleep = safe_int(sleep_dto.get('highestRespirationValue'), None)
        
        if avg_waking_from_sleep is not None or avg_sleep_from_sleep is not None:
            return {
                "awake": {
                    "min": lowest_from_sleep,
                    "max": highest_from_sleep,
                    "avg": avg_waking_from_sleep
                },
                "sleep": {
                    "min": lowest_from_sleep,
                    "max": highest_from_sleep,
                    "avg": avg_sleep_from_sleep
                } if avg_sleep_from_sleep is not None else None
            }
    
    if isinstance(resp_data, dict):
        return resp_data
    
    return None


def parse_respiration_list(respiration_list: list) -> Optional[Dict]:
    """
    Parse les données de respiration depuis une liste.
    
    Args:
        respiration_list: Liste de données de respiration
        
    Returns:
        dict: Données de respiration avec awake/sleep min/max/avg ou None
    """
    resp_values_awake = []
    resp_values_sleep = []
    
    for item in respiration_list:
        if isinstance(item, dict):
            state = item.get('sleep') or item.get('state', '').lower()
            value = safe_int(item.get('value') or item.get('respiration'), 0)
            if value > 0:
                if state in ('awake', 'eveille', 'wake'):
                    resp_values_awake.append(value)
                elif state in ('sleep', 'sommeil', 'asleep'):
                    resp_values_sleep.append(value)
    
    if len(resp_values_awake) > 0:
        return {
            "awake": {
                "min": min(resp_values_awake),
                "max": max(resp_values_awake),
                "avg": round(sum(resp_values_awake) / len(resp_values_awake), 1)
            },
            "sleep": {
                "min": min(resp_values_sleep) if len(resp_values_sleep) > 0 else None,
                "max": max(resp_values_sleep) if len(resp_values_sleep) > 0 else None,
                "avg": round(sum(resp_values_sleep) / len(resp_values_sleep), 1) if len(resp_values_sleep) > 0 else None
            }
        }
    
    return None

