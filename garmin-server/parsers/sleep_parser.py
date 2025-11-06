"""
Parser Sleep Garmin - Sommeil, phases, heures coucher/lever
"""
import sys
import os
from datetime import datetime
from typing import Any, Dict, Optional, List

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug, normalize_datetime_to_utc
from utils.error_tracker import track_parsing_error, ErrorSeverity


def extract_heart_rate_from_sleep(sleep: Any, date_str: str) -> List[Dict[str, Any]]:
    """
    🟢 PHASE 4 : Extrait les données de fréquence cardiaque depuis les données de sommeil.
    
    Les données FC peuvent être dans :
    - sleepLevelsList (avec heartRate dans chaque niveau)
    - wellnessEpochHeartRateDataDTOList (données FC minute par minute pendant le sommeil)
    - dailySleepDTO.heartRateValues ou heartRateTimeSeries
    - sleepMovementList (avec heartRate dans chaque mouvement)
    
    Args:
        sleep: Données de sommeil brutes depuis Garmin API
        date_str: Date pour les logs
        
    Returns:
        list: Liste de points FC au format [{timestamp, bpm}, ...] ou liste vide
    """
    if not isinstance(sleep, dict):
        return []
    
    sleep_dto = sleep.get('dailySleepDTO', {}) or {}
    if not isinstance(sleep_dto, dict):
        sleep_dto = {}
    
    hr_time_series = []
    
    # 1. Chercher dans wellnessEpochHeartRateDataDTOList (données FC minute par minute pendant le sommeil)
    epoch_hr_list = (
        sleep.get('wellnessEpochHeartRateDataDTOList') or
        sleep.get('heartRateEpochData') or
        sleep.get('epochHeartRateData') or
        []
    )
    
    if isinstance(epoch_hr_list, list) and len(epoch_hr_list) > 0:
        print_debug(f"🔍 Found {len(epoch_hr_list)} HR epoch data points in sleep data for {date_str}")
        for epoch in epoch_hr_list:
            if isinstance(epoch, dict):
                # Les epochs peuvent avoir différents formats
                bpm = (
                    epoch.get('bpm') or
                    epoch.get('value') or
                    epoch.get('heartRate') or
                    epoch.get('hr') or
                    None
                )
                timestamp_raw = (
                    epoch.get('timestamp') or
                    epoch.get('time') or
                    epoch.get('startTimeGMT') or
                    epoch.get('startTimeLocal') or
                    None
                )
                
                if bpm and timestamp_raw:
                    bpm_val = safe_int(bpm, 0)
                    if bpm_val > 0:
                        timestamp = normalize_datetime_to_utc(timestamp_raw)
                        if timestamp:
                            hr_time_series.append({
                                "timestamp": timestamp,
                                "bpm": bpm_val,
                                "source": "sleep_epoch"
                            })
        
        if hr_time_series:
            print_debug(f"✅ Extracted {len(hr_time_series)} HR points from wellnessEpochHeartRateDataDTOList for {date_str}")
    
    # 2. Chercher dans sleepLevelsList (liste chronologique des phases avec FC)
    sleep_levels_list = (
        sleep.get('sleepLevelsList') or
        sleep_dto.get('sleepLevelsList') or
        []
    )
    
    if isinstance(sleep_levels_list, list) and len(sleep_levels_list) > 0:
        print_debug(f"🔍 Found {len(sleep_levels_list)} sleep levels for {date_str}, checking for HR data...")
        for level_item in sleep_levels_list:
            if isinstance(level_item, dict):
                # Chercher FC dans chaque niveau de sommeil
                bpm = (
                    level_item.get('heartRate') or
                    level_item.get('hr') or
                    level_item.get('bpm') or
                    level_item.get('value') or
                    None
                )
                timestamp_raw = (
                    level_item.get('startTime') or
                    level_item.get('timestamp') or
                    level_item.get('time') or
                    level_item.get('startTimeGMT') or
                    level_item.get('startTimeLocal') or
                    None
                )
                
                if bpm and timestamp_raw:
                    bpm_val = safe_int(bpm, 0)
                    if bpm_val > 0:
                        timestamp = normalize_datetime_to_utc(timestamp_raw)
                        if timestamp:
                            # Vérifier si ce point n'existe pas déjà (éviter doublons)
                            existing = next((p for p in hr_time_series if p.get('timestamp') == timestamp), None)
                            if not existing:
                                hr_time_series.append({
                                    "timestamp": timestamp,
                                    "bpm": bpm_val,
                                    "source": "sleep_level"
                                })
        
        if hr_time_series:
            print_debug(f"✅ Extracted {len(hr_time_series)} HR points from sleepLevelsList for {date_str}")
    
    # 3. Chercher dans dailySleepDTO.heartRateValues ou heartRateTimeSeries
    hr_values_from_dto = (
        sleep_dto.get('heartRateValues') or
        sleep_dto.get('heartRateTimeSeries') or
        sleep_dto.get('hrValues') or
        sleep.get('heartRateValues') or
        sleep.get('heartRateTimeSeries') or
        []
    )
    
    if isinstance(hr_values_from_dto, list) and len(hr_values_from_dto) > 0:
        print_debug(f"🔍 Found {len(hr_values_from_dto)} HR values in dailySleepDTO for {date_str}")
        for point in hr_values_from_dto:
            try:
                if isinstance(point, list) and len(point) >= 2:
                    timestamp_raw = point[0]
                    bpm_raw = point[1]
                    if bpm_raw is not None:
                        bpm_val = safe_int(bpm_raw, 0)
                        if bpm_val > 0:
                            timestamp = normalize_datetime_to_utc(timestamp_raw)
                            if timestamp:
                                existing = next((p for p in hr_time_series if p.get('timestamp') == timestamp), None)
                                if not existing:
                                    hr_time_series.append({
                                        "timestamp": timestamp,
                                        "bpm": bpm_val,
                                        "source": "sleep_dto"
                                    })
                elif isinstance(point, dict):
                    bpm = (
                        point.get('bpm') or
                        point.get('value') or
                        point.get('heartRate') or
                        point.get('hr') or
                        None
                    )
                    timestamp_raw = (
                        point.get('timestamp') or
                        point.get('time') or
                        point.get('startTimeGMT') or
                        point.get('startTimeLocal') or
                        None
                    )
                    if bpm and timestamp_raw:
                        bpm_val = safe_int(bpm, 0)
                        if bpm_val > 0:
                            timestamp = normalize_datetime_to_utc(timestamp_raw)
                            if timestamp:
                                existing = next((p for p in hr_time_series if p.get('timestamp') == timestamp), None)
                                if not existing:
                                    hr_time_series.append({
                                        "timestamp": timestamp,
                                        "bpm": bpm_val,
                                        "source": "sleep_dto"
                                    })
            except Exception as e:
                print_debug(f"⚠️ Error parsing HR point from sleep DTO: {e}")
                continue
        
        if hr_time_series:
            print_debug(f"✅ Extracted {len(hr_time_series)} HR points from dailySleepDTO for {date_str}")
    
    # 4. Chercher dans sleepMovementList (mouvements avec FC)
    sleep_movements = (
        sleep.get('sleepMovementList') or
        sleep_dto.get('sleepMovementList') or
        []
    )
    
    if isinstance(sleep_movements, list) and len(sleep_movements) > 0:
        print_debug(f"🔍 Found {len(sleep_movements)} sleep movements for {date_str}, checking for HR data...")
        for movement in sleep_movements:
            if isinstance(movement, dict):
                bpm = (
                    movement.get('heartRate') or
                    movement.get('hr') or
                    movement.get('bpm') or
                    None
                )
                timestamp_raw = (
                    movement.get('timestamp') or
                    movement.get('time') or
                    movement.get('startTime') or
                    None
                )
                
                if bpm and timestamp_raw:
                    bpm_val = safe_int(bpm, 0)
                    if bpm_val > 0:
                        timestamp = normalize_datetime_to_utc(timestamp_raw)
                        if timestamp:
                            existing = next((p for p in hr_time_series if p.get('timestamp') == timestamp), None)
                            if not existing:
                                hr_time_series.append({
                                    "timestamp": timestamp,
                                    "bpm": bpm_val,
                                    "source": "sleep_movement"
                                })
        
        if hr_time_series:
            print_debug(f"✅ Extracted {len(hr_time_series)} HR points from sleepMovementList for {date_str}")
    
    # Trier par timestamp et retourner
    if hr_time_series:
        hr_time_series.sort(key=lambda x: x.get('timestamp', ''))
        print_debug(f"✅ Total extracted {len(hr_time_series)} HR points from sleep data for {date_str}")
    
    return hr_time_series


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
    (Implémentation complète déjà présente dans le fichier original)
    """
    # Cette fonction est appelée mais l'implémentation complète est dans le fichier original
    # Pour l'instant, retourner un dict vide pour éviter les erreurs d'import
    # TODO: Restaurer l'implémentation complète depuis le fichier original
    return {}


def parse_sleep_awakenings(sleep: Dict[str, Any], sleep_dto: Dict[str, Any], date_str: str) -> Optional[Dict[str, Any]]:
    """
    Parse les éveils pendant le sommeil.
    (Implémentation complète déjà présente dans le fichier original)
    """
    # Cette fonction est appelée mais l'implémentation complète est dans le fichier original
    # Pour l'instant, retourner None pour éviter les erreurs d'import
    # TODO: Restaurer l'implémentation complète depuis le fichier original
    return None


def parse_sleep_movements(sleep: Dict[str, Any], sleep_dto: Dict[str, Any], date_str: str) -> Optional[Dict[str, Any]]:
    """
    Parse les mouvements pendant le sommeil.
    (Implémentation complète déjà présente dans le fichier original)
    """
    # Cette fonction est appelée mais l'implémentation complète est dans le fichier original
    # Pour l'instant, retourner None pour éviter les erreurs d'import
    # TODO: Restaurer l'implémentation complète depuis le fichier original
    return None


def parse_sleep_phases_detailed(sleep: Dict[str, Any], sleep_dto: Dict[str, Any], date_str: str) -> Optional[Dict[str, Any]]:
    """
    Parse les détails des phases de sommeil.
    (Implémentation complète déjà présente dans le fichier original)
    """
    # Cette fonction est appelée mais l'implémentation complète est dans le fichier original
    # Pour l'instant, retourner None pour éviter les erreurs d'import
    # TODO: Restaurer l'implémentation complète depuis le fichier original
    return None
