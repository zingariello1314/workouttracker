"""
Parser Activités Garmin
Parse les activités (swimming, jump rope, cardio) depuis les données Garmin
"""
import sys
import os
import json
from typing import Any, Dict, Optional, Tuple, List

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug, normalize_datetime_to_utc
from utils.validators import validate_swimming_consistency
from parsers.validation_ranges import (
    HR_MIN, HR_MAX, HR_RESTING_MIN, HR_RESTING_MAX,
    CALORIES_MIN, CALORIES_MAX,
    DISTANCE_MIN, DISTANCE_MAX,
    DURATION_MIN, DURATION_MAX,
    JUMPS_MIN, JUMPS_MAX,
    SPEED_MIN, SPEED_MAX,
    ELEVATION_MIN, ELEVATION_MAX,
    SWIM_DISTANCE_MIN, SWIM_DISTANCE_MAX,
    PACE_MIN, PACE_MAX
)


def classify_activity(act_summary: Dict[str, Any], act_details: Optional[Dict[str, Any]] = None) -> Tuple[bool, bool, bool]:
    """
    Classifie une activité comme swimming, jump_rope, ou cardio.
    
    Returns:
        Tuple[is_swimming, is_jump_rope, is_cardio]
    """
    # Extraire typeKey et typeId depuis summary
    act_type_dto = act_summary.get('activityTypeDTO', {}) or {}
    if not isinstance(act_type_dto, dict):
        act_type_dto = {}
    
    act_type_key = act_type_dto.get('typeKey') or act_type_dto.get('type') or ''
    act_type = act_type_key.lower() if act_type_key else ''
    act_type_id = act_type_dto.get('typeId')
    
    act_name = (act_summary.get('activityName') or '').lower()
    
    # Mettre à jour depuis act_details si disponible
    if act_details:
        act_type_dto_detailed = act_details.get('activityTypeDTO', {}) or {}
        if isinstance(act_type_dto_detailed, dict):
            act_type_key_detailed = act_type_dto_detailed.get('typeKey') or act_type_dto_detailed.get('type') or ''
            act_type_detailed = act_type_key_detailed.lower() if act_type_key_detailed else ''
            act_type_id_detailed = act_type_dto_detailed.get('typeId')
            
            if act_type_detailed:
                act_type = act_type_detailed
            if act_type_id_detailed is not None:
                act_type_id = act_type_id_detailed
                print_debug(f"Activity {act_summary.get('activityId')} - Updated typeId from details: {act_type_id}, typeKey: {act_type}")
            
            if act_details.get('activityName'):
                act_name = act_details.get('activityName', '').lower()
    
    # NATATION - typeId 27 = lap_swimming, 26 = swimming (PRIORITÉ ABSOLUE)
    is_swimming = (
        act_type_id in (26, 27) or  # Type IDs pour natation (vérifier en premier)
        act_type in ('swimming', 'lap_swimming', 'pool_swimming', 'open_water', 'swim') or 
        'swim' in act_type or 
        'natation' in act_name or 
        'pool' in act_name
    )
    
    # Corde à sauter (seulement si pas natation)
    is_jump_rope = (not is_swimming and (
        act_type in ('jump_rope', 'jumprope', 'skipping') or 
        'jump' in act_name or 
        'saut' in act_name or 
        'jumprope' in act_name or 
        'jumpro' in act_name
    ))
    
    # Cardio général (seulement si pas natation ni corde) — inclut course / trail / tapis + marche/rando
    # pour le même traitement « cardio » côté app et déclencher get_activity + métriques étendues.
    is_cardio = (not is_swimming and not is_jump_rope and (
        act_type in ('cardio', 'cardio_general', 'indoor_cardio') or
        'cardio' in act_type or
        'cardio' in act_name or
        is_running_like_activity(act_summary) or
        is_walking_like_activity(act_summary)
    ))
    
    # Re-vérifier depuis act_details si disponible
    if act_details:
        if act_type_id in (26, 27):
            is_swimming = True
            is_jump_rope = False
            is_cardio = False
            print_debug(f"Activity {act_summary.get('activityId')} FORCED to swimming based on typeId {act_type_id}")
        elif (act_type in ('swimming', 'lap_swimming', 'pool_swimming', 'open_water', 'swim') or
              'swim' in act_type or
              'swim' in act_name or 'natation' in act_name or 'pool' in act_name):
            is_swimming = True
            is_jump_rope = False
            is_cardio = False
            print_debug(f"Activity {act_summary.get('activityId')} FORCED to swimming based on type/name")
        elif ('jump' in act_name or 'saut' in act_name or 'jumprope' in act_name or 'jumpro' in act_name):
            is_jump_rope = True
            is_swimming = False
            is_cardio = False
    
    return is_swimming, is_jump_rope, is_cardio


def is_running_like_activity(act_summary: Dict[str, Any]) -> bool:
    """
    Indique si l'activité est une course à pied (tapis, piste, trail, etc.).
    Utilisé pour déclencher get_activity() : sans détail, pas d'allure/tours/cadence/intervalles.
    """
    if not isinstance(act_summary, dict):
        return False
    dto = act_summary.get('activityTypeDTO') or {}
    if not isinstance(dto, dict):
        dto = {}
    tk = (dto.get('typeKey') or dto.get('type') or '').lower()
    name = (act_summary.get('activityName') or '').lower()

    running_type_keys = (
        'running', 'treadmill', 'indoor_running', 'track_running', 'street_running',
        'trail_running', 'virtual_run', 'ultra_run', 'race', 'track_run',
        'treadmill_running', 'indoor_track',
    )
    if any(x in tk for x in ('running', 'treadmill', 'trail', 'virtual_run', 'race', 'jog')):
        return True
    if tk in running_type_keys:
        return True

    name_keywords = (
        'course', ' run', 'running', 'footing', 'interval', 'fractionné', 'fractionne',
        'tapis', 'jogging', '5k', '10k', 'semi', 'marathon', 'fartlek', 'tempo',
        ' vma', 'seuil', 'repetition', 'répétition', 'fraction', 'foot',
    )
    if any(k in name for k in name_keywords):
        return True
    # Garmin envoie souvent typeKey=indoor_cardio pour du « cardio » générique, y compris des courses
    # extérieures mal étiquetées — ce n’est pas équivalent au profil « tapis » sur la montre.
    if tk == 'indoor_cardio':
        return True
    return False


def is_walking_like_activity(act_summary: Dict[str, Any]) -> bool:
    """
    Indique si l'activité est une marche/randonnée (walking/hiking).
    Utilisé pour inclure ces activités dans le pipeline cardio global.
    """
    if not isinstance(act_summary, dict):
        return False
    dto = act_summary.get('activityTypeDTO') or {}
    if not isinstance(dto, dict):
        dto = {}
    tk = (dto.get('typeKey') or dto.get('type') or '').lower()
    name = (act_summary.get('activityName') or '').lower()

    walking_type_keys = (
        'walking', 'indoor_walking', 'speed_walking',
        'hiking', 'hike', 'trail_hiking', 'ultra_hike', 'snow_shoeing'
    )
    if tk in walking_type_keys:
        return True
    if 'walk' in tk and 'running' not in tk:
        return True
    if 'hike' in tk:
        return True

    name_keywords = (
        'marche', 'walking', 'walk', 'randonnée', 'randonnee', 'hike', 'hiking'
    )
    return any(k in name for k in name_keywords)


def _collect_garmin_split_lap_rows(act_details: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Priorité : GET .../activity/{id}/splits (lapDTOs), puis typedsplits."""
    if not isinstance(act_details, dict):
        return []
    splits = act_details.get("_garminActivitySplits") or {}
    if isinstance(splits, dict):
        lap_dtos = splits.get("lapDTOs") or splits.get("laps") or splits.get("splitDTOs")
        if isinstance(lap_dtos, list) and lap_dtos:
            return [x for x in lap_dtos if isinstance(x, dict)]
    typed = act_details.get("_garminTypedSplits") or {}
    if isinstance(typed, dict):
        lap_dtos = typed.get("lapDTOs") or typed.get("typedLapDTOs") or typed.get("laps")
        if isinstance(lap_dtos, list) and lap_dtos:
            return [x for x in lap_dtos if isinstance(x, dict)]
    return []


def _typed_split_rows_for_merge(act_details: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not isinstance(act_details, dict):
        return []
    typed = act_details.get("_garminTypedSplits") or {}
    if not isinstance(typed, dict):
        return []
    lap_dtos = typed.get("lapDTOs") or typed.get("typedLapDTOs") or typed.get("laps")
    if isinstance(lap_dtos, list):
        return [x for x in lap_dtos if isinstance(x, dict)]
    return []


def parse_run_cardio_metrics(
    entry_base: Dict[str, Any],
    summary_dto: Dict[str, Any],
    act: Dict[str, Any],
    act_details: Optional[Dict[str, Any]],
    act_summary: Dict[str, Any],
    distance_m: float,
    duration: int,
) -> Dict[str, Any]:
    """
    Enrichit une activité cardio/course avec tours, allures, cadence, etc. (nécessite act_details).
    """
    act_id = act_summary.get('activityId')
    detail_dto = {}
    if isinstance(act, dict):
        detail_dto = act.get('activityDetailDTO', {}) or act.get('detailDTO', {}) or {}
    if isinstance(act_details, dict) and not detail_dto:
        detail_dto = act_details.get('activityDetailDTO', {}) or act_details.get('detailDTO', {}) or {}

    def _to_kmh(val: Any) -> Optional[float]:
        if val is None:
            return None
        v = safe_float(val, 0.0)
        if v <= 0:
            return None
        if v < 30:
            return round(v * 3.6, 2)
        return round(v, 2)

    def _one_lap_to_row(lap: Dict[str, Any], i: int, typed_lap: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        lap_dist = safe_float(
            lap.get('distance') or lap.get('distanceMeters') or lap.get('totalDistance') or
            lap.get('sumDistance') or 0.0, 0.0
        )
        lap_dur = safe_int(
            lap.get('duration') or lap.get('elapsedDuration') or lap.get('movingDuration') or
            lap.get('timerDuration') or 0, 0
        )
        lap_pace = safe_int(
            lap.get('averagePace') or lap.get('pace') or lap.get('avgPace') or
            lap.get('averageRunningPace') or 0, 0
        )
        if lap_pace > 200000:
            lap_pace = lap_pace // 1000
        hr = safe_int(
            lap.get('averageHR') or lap.get('avgHR') or lap.get('heartRate') or
            lap.get('averageHeartRate') or lap.get('avgHeartRate'), 0
        )
        if hr <= 0:
            hr = None
        tkey = (
            lap.get('lapTypeKey') or lap.get('splitTypeKey') or lap.get('subActivityType') or
            lap.get('intensityType') or lap.get('durationType')
        )
        if typed_lap:
            tkey = tkey or typed_lap.get('lapTypeKey') or typed_lap.get('splitTypeKey') or typed_lap.get('subActivityType')
        phase = lap.get('lapType') or (typed_lap or {}).get('lapType')
        cad = safe_int(
            lap.get('averageRunningCadenceInStepsPerMinute') or lap.get('averageRunCadence') or
            lap.get('avgRunCadence') or 0, 0
        )
        str_l = safe_float(
            lap.get('averageStrideLength') or lap.get('avgStrideLength') or
            lap.get('strideLength') or 0, 0.0
        )
        if str_l > 0 and str_l > 10:
            str_l = str_l / 100.0
        st = lap.get('startTimeGMT') or lap.get('startTimeLocal') or lap.get('startTime')
        row: Dict[str, Any] = {
            "index": i + 1,
            "distanceMeters": round(lap_dist, 2) if lap_dist > 0 else None,
            "distanceKm": round(lap_dist / 1000.0, 4) if lap_dist > 1 else None,
            "durationSeconds": lap_dur if lap_dur > 0 else None,
            "avgPaceSecondsPerKm": lap_pace if lap_pace > 0 else None,
            "avgSpeedKmh": _to_kmh(lap.get('averageSpeed') or lap.get('speed')),
            "avgHR": hr,
            "calories": safe_int(lap.get('calories') or lap.get('totalCalories'), 0) or None,
            "elevationGain": safe_int(lap.get('elevationGain') or lap.get('totalElevationGain'), 0) or None,
            "averageCadenceSpm": cad if cad > 0 else None,
            "averageStrideLengthMeters": round(str_l, 3) if str_l > 0 else None,
            "startTime": st,
        }
        if tkey:
            row["intervalTypeKey"] = str(tkey)
        if phase:
            row["intervalPhase"] = str(phase)
        return {k: v for k, v in row.items() if v is not None}

    # --- Tours : API /splits (lapDTOs) prioritaire ; sinon detailDTO.laps ---
    laps_out: List[Dict[str, Any]] = []
    api_laps = _collect_garmin_split_lap_rows(act_details)
    typed_all = _typed_split_rows_for_merge(act_details)
    if api_laps:
        for i, lap in enumerate(api_laps):
            tl = typed_all[i] if i < len(typed_all) else None
            laps_out.append(_one_lap_to_row(lap, i, tl))
        print_debug(f"✅ Running: {len(laps_out)} segments (endpoint /splits) activité {act_id}")
    else:
        laps_raw = (
            detail_dto.get('laps') or detail_dto.get('lapList') or
            (act_details.get('laps', []) if isinstance(act_details, dict) else []) or
            act.get('laps') or []
        )
        if isinstance(laps_raw, list):
            for i, lap in enumerate(laps_raw):
                if not isinstance(lap, dict):
                    continue
                laps_out.append(_one_lap_to_row(lap, i, None))
            if laps_out:
                print_debug(f"✅ Running: {len(laps_out)} tours (activityDetailDTO) activité {act_id}")

    # Distance totale : si résumé Garmin = 0 (souvent tapis) mais somme des tours > 0
    sum_lap_m = 0.0
    for row in laps_out:
        dm = row.get("distanceMeters")
        if dm is not None and dm > 0:
            sum_lap_m += float(dm)
    if sum_lap_m > 0 and (not distance_m or distance_m <= 0):
        distance_m = sum_lap_m
        print_debug(f"✅ Distance totale recalculée depuis tours: {distance_m}m activité {act_id}")

    # --- Cadence, foulées (résumé) : résumé fusionné + endpoint /details ---
    summary_for_run = summary_dto if isinstance(summary_dto, dict) else {}
    if isinstance(act_details, dict):
        s2 = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {}) or {}
        if isinstance(s2, dict) and s2:
            summary_for_run = {**summary_for_run, **s2}
        det = act_details.get("_garminActivityDetails") or {}
        if isinstance(det, dict):
            s3 = det.get("activitySummaryDTO") or det.get("summaryDTO") or {}
            if isinstance(s3, dict) and s3:
                summary_for_run = {**summary_for_run, **s3}

    avg_cadence = safe_int(
        summary_for_run.get('averageRunningCadenceInStepsPerMinute') or
        summary_for_run.get('averageRunCadence') or
        summary_for_run.get('avgRunCadence') or
        detail_dto.get('averageRunningCadenceInStepsPerMinute') or
        act.get('averageRunningCadenceInStepsPerMinute'),
        0,
    )
    max_cadence = safe_int(
        summary_for_run.get('maxRunningCadenceInStepsPerMinute') or
        summary_for_run.get('maxRunCadence') or
        act.get('maxRunningCadenceInStepsPerMinute'),
        0,
    )
    stride = safe_float(
        summary_for_run.get('averageStrideLength') or
        summary_for_run.get('avgStrideLength') or
        detail_dto.get('averageStrideLength'),
        0.0,
    )

    # Allure moyenne / max (sec/km)
    avg_pace = safe_int(
        summary_for_run.get('averagePace') or summary_for_run.get('avgPace') or
        act.get('averagePace') or act.get('avgPace'), 0
    )
    if avg_pace > 200000:
        avg_pace = avg_pace // 1000
    best_pace = safe_int(
        summary_for_run.get('bestPace') or summary_for_run.get('minPace') or act.get('bestPace'), 0
    )
    if best_pace > 200000:
        best_pace = best_pace // 1000

    # Calories actives détail
    training_cal = safe_int(summary_for_run.get('activeKilocalories') or summary_for_run.get('calories'), 0) or None

    running_block: Dict[str, Any] = {}
    lap_count_meta = safe_int(detail_dto.get('lapCount') or act.get('lapCount'), 0)
    if laps_out:
        running_block["lapCount"] = len(laps_out)
        running_block["laps"] = laps_out
    elif lap_count_meta > 0:
        running_block["lapCount"] = lap_count_meta
    if avg_cadence > 0:
        running_block["averageCadenceSpm"] = avg_cadence
    if max_cadence > 0:
        running_block["maxCadenceSpm"] = max_cadence
    if stride > 0:
        running_block["averageStrideLengthMeters"] = round(stride, 3)
    if avg_pace > 0:
        running_block["averagePaceSecondsPerKm"] = avg_pace
    if best_pace > 0:
        running_block["bestPaceSecondsPerKm"] = best_pace
    if distance_m and distance_m > 0:
        running_block["distanceMeters"] = round(distance_m, 2)
    if duration > 0:
        running_block["durationSeconds"] = duration
    if training_cal:
        running_block["activeCaloriesDetail"] = training_cal

    if running_block:
        entry_base["running"] = running_block

    # Complète les champs racine si encore absents
    if not entry_base.get("distance") and distance_m and distance_m > 0.5:
        entry_base["distance"] = round(distance_m / 1000.0, 4)
    if not entry_base.get("speed"):
        sp = _to_kmh(summary_for_run.get('averageSpeed') or act.get('averageSpeed'))
        if sp:
            entry_base["speed"] = sp
    if not entry_base.get("maxSpeed"):
        mx = _to_kmh(summary_for_run.get('maxSpeed') or act.get('maxSpeed'))
        if mx:
            entry_base["maxSpeed"] = mx
    if avg_pace > 0 and not entry_base.get("avgPaceSecondsPerKm"):
        entry_base["avgPaceSecondsPerKm"] = avg_pace

    return entry_base


def parse_common_metrics(act: Dict[str, Any], act_details: Optional[Dict[str, Any]], act_summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse les métriques communes à toutes les activités.
    
    Returns:
        Dict avec toutes les métriques communes (duration, calories, HR, distance, sweat loss, intensity minutes, timestamps, location, elevation, device info)
    """
    act_id = act_summary.get('activityId')
    act_date = act_summary.get('startTimeLocal', '').split('T')[0] if act_summary.get('startTimeLocal') else ''
    start = act_summary.get('startTimeLocal') or ''
    
    # Utiliser détails si disponibles, sinon summary
    act = act_details if act_details else act_summary
    
    # Déterminer le type d'activité pour les messages de contexte
    activity_type = (act_summary.get('activityTypeDTO', {}).get('typeKey') or 
                    act_summary.get('activityType') or 
                    act.get('activityType') or 
                    'unknown')
    
    # 🔴 FIX #9: Validation de plage pour durée
    duration = safe_int(
        act.get('duration') or act.get('elapsedDuration') or act_summary.get('duration'),
        0,
        warn_on_fail=True,
        min_value=DURATION_MIN,
        max_value=DURATION_MAX,
        context=f"activity.{activity_type}.duration"
    )
    
    # Calories - Chercher dans plusieurs structures possibles
    # 🔴 FIX #9: Validation de plage pour calories
    calories_total = safe_int(
        act.get('calories') or act.get('totalCalories') or act.get('caloriesBurned') or act_summary.get('calories') or (act.get('summaryDTO', {}).get('calories') if isinstance(act.get('summaryDTO'), dict) else None),
        0,
        warn_on_fail=True,
        min_value=CALORIES_MIN,
        max_value=CALORIES_MAX,
        context=f"activity.{activity_type}.calories_total"
    )
    
    # Calories actives/repos - Chercher dans activitySummaryDTO ou autres structures - EXHAUSTIF
    summary_dto = act.get('activitySummaryDTO', {}) or act.get('summaryDTO', {}) or {}
    if isinstance(act_details, dict):
        # Chercher aussi dans act_details pour les calories
        summary_dto_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {}) or {}
        if summary_dto_details:
            summary_dto = { **summary_dto, **summary_dto_details }  # Fusionner
    
    if isinstance(summary_dto, dict):
        calories_resting = safe_int(
            summary_dto.get('caloriesResting') or 
            summary_dto.get('restingCalories') or 
            summary_dto.get('bmrCalories') or 
            summary_dto.get('bmrKilocalories') or
            act.get('caloriesResting') or 
            act.get('restingCalories') or
            act.get('bmrCalories') or
            0,
            warn_on_fail=True,
            min_value=CALORIES_MIN,
            max_value=CALORIES_MAX,
            context=f"activity.{activity_type}.calories_resting"
        )
        calc_active = summary_dto.get('calories') - summary_dto.get('caloriesResting', 0) if (summary_dto.get('calories') and summary_dto.get('caloriesResting')) else None
        calories_active = safe_int(
            summary_dto.get('caloriesActive') or 
            summary_dto.get('activeCalories') or 
            summary_dto.get('caloriesBurned') or 
            summary_dto.get('activeKilocalories') or
            calc_active or 
            act.get('caloriesActive') or 
            act.get('activeCalories') or 
            act.get('caloriesBurned') or
            0,
            warn_on_fail=True,
            min_value=CALORIES_MIN,
            max_value=CALORIES_MAX,
            context=f"activity.{activity_type}.calories_active"
        )
    else:
        calories_resting = safe_int(
            act.get('caloriesResting') or 
            act.get('restingCalories') or
            act.get('bmrCalories') or
            0
        )
        calories_active = safe_int(
            act.get('caloriesActive') or 
            act.get('activeCalories') or 
            act.get('caloriesBurned') or
            0
        )
    
    # CORRECTION CRITIQUE : Calculer calories actives si null/0 en dernier recours
    if calories_active == 0 and calories_total > 0 and calories_resting > 0:
        calories_active = calories_total - calories_resting
        print_debug(f"Calculated calories_active = {calories_total} - {calories_resting} = {calories_active} for activity {act_id}")
    
    # 🔴 FIX #9: Validation de plage pour FC
    avg_hr = safe_int(
        act.get('averageHR') or act.get('averageHeartRate') or (summary_dto.get('averageHR') if isinstance(summary_dto, dict) else None) or act_summary.get('averageHR'),
        0,
        warn_on_fail=True,
        min_value=HR_MIN,
        max_value=HR_MAX,
        context=f"activity.{activity_type}.avgHR"
    )
    max_hr = safe_int(
        act.get('maxHR') or act.get('maxHeartRate') or (summary_dto.get('maxHR') if isinstance(summary_dto, dict) else None) or act_summary.get('maxHR'),
        0,
        warn_on_fail=True,
        min_value=HR_MIN,
        max_value=HR_MAX,
        context=f"activity.{activity_type}.maxHR"
    )
    # CORRECTION : Ajouter minHR (FC minimum) pour toutes activités
    min_hr = safe_int(
        (summary_dto.get('minHR') if isinstance(summary_dto, dict) else None) or
        (summary_dto.get('minHeartRate') if isinstance(summary_dto, dict) else None) or
        act.get('minHR') or
        act.get('minHeartRate') or
        act_summary.get('minHR'),
        0,
        warn_on_fail=True,
        min_value=HR_MIN,
        max_value=HR_MAX,
        context=f"activity.{activity_type}.minHR"
    )
    
    # Distance - Chercher dans plusieurs structures et champs
    # 🔴 FIX #9: Validation de plage pour distance
    distance_m_raw = (
        act.get('distance') or 
        act.get('distanceMeters') or 
        act.get('totalDistance') or
        act.get('totalDistanceMeters') or
        (summary_dto.get('distance') if isinstance(summary_dto, dict) else None) or
        (summary_dto.get('distanceMeters') if isinstance(summary_dto, dict) else None) or
        (summary_dto.get('totalDistance') if isinstance(summary_dto, dict) else None) or
        act_summary.get('distance') or 
        act_summary.get('distanceMeters') or
        0
    )
    # Si distance est None, chercher dans d'autres structures
    if not distance_m_raw:
        if isinstance(act_details, dict):
            distance_m_raw = (
                act_details.get('distance') or
                act_details.get('distanceMeters') or
                act_details.get('totalDistance') or
                act_details.get('totalDistanceMeters') or
                0
            )
    if not distance_m_raw and isinstance(act, dict):
        adld = act.get('activityDetailDTO') or {}
        if isinstance(adld, dict):
            distance_m_raw = (
                adld.get('distance') or
                adld.get('distanceMeters') or
                adld.get('totalDistance') or
                adld.get('totalDistanceMeters') or
                0
            )
    
    # Valider et convertir distance (peut être en m ou km selon le contexte)
    distance_m = safe_float(
        distance_m_raw,
        0.0,
        warn_on_fail=True,
        min_value=DISTANCE_MIN * 1000,  # En mètres pour validation
        max_value=DISTANCE_MAX * 1000,
        context=f"activity.{activity_type}.distance_m"
    )
    
    # Transpiration - CORRECTION CRITIQUE : Parser waterEstimated (champ principal Garmin pour transpiration)
    sweat_loss = safe_int(
        # summaryDTO - PRIORITÉ : waterEstimated (champ principal Garmin)
        (summary_dto.get('waterEstimated') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('sweatLoss') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('estimatedSweatLoss') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('sweatLossMl') if isinstance(summary_dto, dict) else None) or
        (summary_dto.get('sweatLossMilliliters') if isinstance(summary_dto, dict) else None) or
        # act (top-level)
        act.get('sweatLoss') or 
        act.get('estimatedSweatLoss') or 
        act.get('totalSweatLoss') or
        act.get('sweatLossMl') or
        act.get('sweatLossMilliliters') or
        # act_details
        (act_details.get('sweatLoss') if isinstance(act_details, dict) else None) or
        (act_details.get('estimatedSweatLoss') if isinstance(act_details, dict) else None) or
        (act_details.get('sweatLossMl') if isinstance(act_details, dict) else None) or
        (act_details.get('sweatLossMilliliters') if isinstance(act_details, dict) else None) or
        # activityDetailDTO
        (act.get('activityDetailDTO', {}).get('sweatLoss') if isinstance(act.get('activityDetailDTO'), dict) else None) or
        (act.get('activityDetailDTO', {}).get('sweatLossMl') if isinstance(act.get('activityDetailDTO'), dict) else None) or
        0
    )
    
    # Si toujours pas trouvé, chercher récursivement dans act_details pour "sweat", "transpiration", etc.
    if sweat_loss == 0 and isinstance(act_details, dict):
        def search_sweat_recursive(data, depth=0, max_depth=10):
            """Recherche récursive pour sweat loss"""
            if depth > max_depth or not isinstance(data, dict):
                return None
            for key, value in data.items():
                key_lower = str(key).lower()
                if ('sweat' in key_lower or 'transpiration' in key_lower) and isinstance(value, (int, float)) and value > 0:
                    return safe_int(value, 0)
                elif isinstance(value, dict):
                    result = search_sweat_recursive(value, depth + 1, max_depth)
                    if result:
                        return result
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            result = search_sweat_recursive(item, depth + 1, max_depth)
                            if result:
                                return result
            return None
        
        found_sweat = search_sweat_recursive(act_details)
        if found_sweat:
            sweat_loss = found_sweat
            print_debug(f"✅ Found sweatLoss recursively in act_details: {sweat_loss} ml")
        
        # Log final pour debug
        if sweat_loss > 0:
            print_debug(f"✅ Final sweatLoss for activity {act_id}: {sweat_loss} ml")
        else:
            print_debug(f"❌ No sweatLoss found for activity {act_id} (checked waterEstimated, sweatLoss, recursive search)")
    
    # Intensité minutes - Chercher dans activitySummaryDTO et autres structures - EXHAUSTIF
    # 🔴 FIX #9: Validation de plage pour minutes intensives
    intensity_moderate = safe_int(
        (summary_dto.get('moderateIntensityMinutes') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('intensityMinutesModerate') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('moderateMinutes') if isinstance(summary_dto, dict) else None) or
        act.get('moderateIntensityMinutes') or 
        act.get('intensityMinutesModerate') or
        act.get('moderateMinutes') or
        (act_details.get('moderateIntensityMinutes') if isinstance(act_details, dict) else None) or
        0
    )
    intensity_vigorous = safe_int(
        (summary_dto.get('vigorousIntensityMinutes') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('intensityMinutesVigorous') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('vigorousMinutes') if isinstance(summary_dto, dict) else None) or
        act.get('vigorousIntensityMinutes') or 
        act.get('intensityMinutesVigorous') or
        act.get('vigorousMinutes') or
        (act_details.get('vigorousIntensityMinutes') if isinstance(act_details, dict) else None) or
        0
    )
    intensity_total = safe_int(
        (summary_dto.get('totalIntensityMinutes') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('intensityMinutesTotal') if isinstance(summary_dto, dict) else None) or 
        (summary_dto.get('totalMinutes') if isinstance(summary_dto, dict) else None) or
        act.get('totalIntensityMinutes') or 
        act.get('intensityMinutesTotal') or
        act.get('totalMinutes') or
        (act_details.get('totalIntensityMinutes') if isinstance(act_details, dict) else None) or
        intensity_moderate + intensity_vigorous if (intensity_moderate > 0 or intensity_vigorous > 0) else 0
    )
    
    # 🔴 FIX #11: Normaliser les timestamps en UTC ISO format
    start_time_local_raw = (summary_dto.get('startTimeLocal') if isinstance(summary_dto, dict) else None) or act.get('startTimeLocal') or act_summary.get('startTimeLocal')
    start_time_gmt_raw = (summary_dto.get('startTimeGMT') if isinstance(summary_dto, dict) else None) or act.get('startTimeGMT') or act_summary.get('startTimeGMT')
    
    # Normaliser en UTC ISO format
    start_time_local = normalize_datetime_to_utc(start_time_local_raw) if start_time_local_raw else None
    start_time_gmt = normalize_datetime_to_utc(start_time_gmt_raw) if start_time_gmt_raw else start_time_local
    
    # 🔴 FIX #11: Normaliser les timestamps d'arrivée si disponibles
    end_time_local_raw = (summary_dto.get('endTimeLocal') if isinstance(summary_dto, dict) else None) or act.get('endTimeLocal') or act_summary.get('endTimeLocal')
    end_time_gmt_raw = (summary_dto.get('endTimeGMT') if isinstance(summary_dto, dict) else None) or act.get('endTimeGMT') or act_summary.get('endTimeGMT')
    end_time_local = normalize_datetime_to_utc(end_time_local_raw) if end_time_local_raw else None
    end_time_gmt = normalize_datetime_to_utc(end_time_gmt_raw) if end_time_gmt_raw else end_time_local
    
    # Localisation (latitude/longitude départ et arrivée)
    start_lat = (summary_dto.get('startLatitude') if isinstance(summary_dto, dict) else None) or act.get('startLatitude')
    start_lng = (summary_dto.get('startLongitude') if isinstance(summary_dto, dict) else None) or act.get('startLongitude')
    end_lat = (summary_dto.get('endLatitude') if isinstance(summary_dto, dict) else None) or act.get('endLatitude')
    end_lng = (summary_dto.get('endLongitude') if isinstance(summary_dto, dict) else None) or act.get('endLongitude')
    if isinstance(act, dict):
        adld_loc = act.get('activityDetailDTO') or {}
        if isinstance(adld_loc, dict):
            if start_lat is None:
                start_lat = adld_loc.get('startLatitude')
            if start_lng is None:
                start_lng = adld_loc.get('startLongitude')
            if end_lat is None:
                end_lat = adld_loc.get('endLatitude')
            if end_lng is None:
                end_lng = adld_loc.get('endLongitude')
    
    # Élévation
    # 🔴 FIX #9: Validation de plage pour élévation
    elevation_gain = safe_int(
        (summary_dto.get('elevationGain') if isinstance(summary_dto, dict) else None) or act.get('elevationGain'), 
        0,
        warn_on_fail=True,
        min_value=ELEVATION_MIN,
        max_value=ELEVATION_MAX,
        context=f"activity.{activity_type}.elevationGain"
    )
    elevation_loss = safe_int(
        (summary_dto.get('elevationLoss') if isinstance(summary_dto, dict) else None) or act.get('elevationLoss'), 
        0,
        warn_on_fail=True,
        min_value=ELEVATION_MIN,
        max_value=ELEVATION_MAX,
        context=f"activity.{activity_type}.elevationLoss"
    )
    max_elevation = safe_float(
        (summary_dto.get('maxElevation') if isinstance(summary_dto, dict) else None) or act.get('maxElevation'), 
        None,
        warn_on_fail=True,
        min_value=ELEVATION_MIN,
        max_value=ELEVATION_MAX,
        context=f"activity.{activity_type}.maxElevation"
    )
    min_elevation = safe_float(
        (summary_dto.get('minElevation') if isinstance(summary_dto, dict) else None) or act.get('minElevation'), 
        None,
        warn_on_fail=True,
        min_value=ELEVATION_MIN,
        max_value=ELEVATION_MAX,
        context=f"activity.{activity_type}.minElevation"
    )
    
    # Device info depuis metadataDTO
    device_info = {}
    metadata = act.get('metadataDTO') or (act_details.get('metadataDTO') if isinstance(act_details, dict) else {})
    if isinstance(metadata, dict):
        device_meta = metadata.get('deviceMetaDataDTO', {})
        if isinstance(device_meta, dict):
            device_info = {
                "deviceId": device_meta.get('deviceId'),
                "deviceTypePk": device_meta.get('deviceTypePk'),
                "deviceVersionPk": device_meta.get('deviceVersionPk')
            }
    
    # 🟢 PRIORITÉ 5 : Utiliser le parser dédié pour toutes les métriques de performance
    # Ce parser est plus robuste et cherche dans tous les champs possibles
    from parsers.performance_parser import parse_all_performance_metrics
    
    performance_metrics = parse_all_performance_metrics(
        summary_dto=summary_dto,
        act=act,
        act_details=act_details,
        act_id=act_id,
        date_str=act_date
    )
    
    # Extraire Training Effect et Recovery Time pour compatibilité avec code existant
    training_effect = performance_metrics.get("trainingEffect", {})
    recovery_time = performance_metrics.get("recoveryTime")
    
    # 🟢 PRIORITÉ 5 : Ajouter toutes les autres métriques de performance trouvées
    # Ces métriques seront ajoutées à entry_base plus tard
    
    # Construire entry_base
    entry_base = {
        "id": act_id,
        "date": act_date,
        "time": (start or '').split('T')[1][:5] if 'T' in (start or '') else "",
        "duration": duration,
        "calories": {
            "total": calories_total,
            "resting": calories_resting if calories_resting > 0 else None,
            "active": calories_active if calories_active > 0 else None
        },
        "avgHR": avg_hr,
        "maxHR": max_hr,
        "minHR": min_hr if min_hr > 0 else None,
        "sweatLoss": sweat_loss if sweat_loss > 0 else None,
        "intensityMinutes": {
            "moderate": intensity_moderate if intensity_moderate > 0 else None,
            "vigorous": intensity_vigorous if intensity_vigorous > 0 else None,
            "total": intensity_total if intensity_total > 0 else None
        },
        # 🔴 FIX #11: Normaliser timestamps en UTC ISO
        "startTimeLocal": start_time_local,  # Déjà normalisé en UTC ISO format
        "startTimeGMT": start_time_gmt,  # Déjà normalisé en UTC ISO format
        "location": {
            "start": {"lat": start_lat, "lng": start_lng} if (start_lat and start_lng) else None,
            "end": {"lat": end_lat, "lng": end_lng} if (end_lat and end_lng) else None
        } if (start_lat or start_lng or end_lat or end_lng) else None,
        "elevation": {
            "gain": elevation_gain if elevation_gain > 0 else None,
            "loss": elevation_loss if elevation_loss > 0 else None,
            "max": max_elevation if max_elevation else None,
            "min": min_elevation if min_elevation else None
        } if (elevation_gain > 0 or elevation_loss > 0 or max_elevation or min_elevation) else None,
        "deviceInfo": device_info if device_info else None,
        # 🟢 PRIORITÉ 5 : Training Effect et Recovery Time (pour compatibilité)
        "trainingEffect": training_effect if training_effect else None,
        "recoveryTime": recovery_time,  # en heures
        # 🟢 PRIORITÉ 5 : Autres métriques de performance (VO2 max, Training Status, etc.)
        "vo2Max": performance_metrics.get("vo2Max"),
        "trainingStatus": performance_metrics.get("trainingStatus"),
        "trainingLoad": performance_metrics.get("trainingLoad"),
        "performanceCondition": performance_metrics.get("performanceCondition"),
        "source": "garmin"
    }

    # Distance (km), vitesses (km/h), allure (s/km) pour l'UI — toujours remplir si le résumé les contient
    def _speed_to_kmh(val: Any) -> Optional[float]:
        if val is None:
            return None
        v = safe_float(val, 0.0)
        if v <= 0:
            return None
        if v < 30:
            return round(v * 3.6, 2)
        return round(v, 2)

    if distance_m and distance_m > 0:
        entry_base["distance"] = round(distance_m / 1000.0, 4)
    avg_sr = (
        (summary_dto.get('averageSpeed') if isinstance(summary_dto, dict) else None) or
        act.get('averageSpeed')
    )
    max_sr = (
        (summary_dto.get('maxSpeed') if isinstance(summary_dto, dict) else None) or
        act.get('maxSpeed')
    )
    if avg_sr:
        sk = _speed_to_kmh(avg_sr)
        if sk:
            entry_base["speed"] = sk
    if max_sr:
        mk = _speed_to_kmh(max_sr)
        if mk:
            entry_base["maxSpeed"] = mk
    ap = safe_int(
        (summary_dto.get('averagePace') if isinstance(summary_dto, dict) else None) or
        act.get('averagePace') or act.get('avgPace'), 0
    )
    if ap > 200000:
        ap = ap // 1000
    if ap > 0:
        entry_base["avgPaceSecondsPerKm"] = ap

    return entry_base, summary_dto, distance_m


def parse_swimming_metrics(entry_base: Dict[str, Any], summary_dto: Dict[str, Any], distance_m: float, 
                          act: Dict[str, Any], act_details: Optional[Dict[str, Any]], 
                          act_summary: Dict[str, Any], duration: int) -> Dict[str, Any]:
    """
    Parse les métriques spécifiques à la natation.
    
    Returns:
        entry_base mis à jour avec toutes les métriques natation
    """
    act_id = act_summary.get('activityId')
    print_debug(f"Swimming activity detected: {act_id} ({act_summary.get('activityName')})")
    
    # CORRECTION CRITIQUE : Chercher D'ABORD dans summaryDTO, puis detailDTO, puis act
    # DÉFINIR summary_dto pour natation (s'assurer qu'il inclut act_details si disponible)
    summary_dto_swim = summary_dto.copy() if isinstance(summary_dto, dict) else {}
    if isinstance(act_details, dict):
        # Fusionner summaryDTO depuis act_details si disponible
        summary_dto_from_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {}) or {}
        if summary_dto_from_details:
            summary_dto_swim = { **summary_dto_swim, **summary_dto_from_details }
    
    # DÉFINIR detail_dto
    detail_dto = act.get('activityDetailDTO', {}) or act.get('detailDTO', {}) or {}
    if not isinstance(detail_dto, dict):
        detail_dto = {}
    
    # Distance natation - Chercher dans summaryDTO EN PREMIER, puis activityDetailDTO
    swim_distance_m = (
        (summary_dto_swim.get('distance') if isinstance(summary_dto_swim, dict) else None) or
        (summary_dto_swim.get('distanceMeters') if isinstance(summary_dto_swim, dict) else None) or
        (summary_dto_swim.get('totalDistance') if isinstance(summary_dto_swim, dict) else None) or
        (summary_dto_swim.get('totalDistanceMeters') if isinstance(summary_dto_swim, dict) else None) or
        distance_m or
        detail_dto.get('distance') or
        detail_dto.get('distanceMeters') or
        detail_dto.get('totalDistance') or
        detail_dto.get('totalDistanceMeters') or
        act.get('swimDistance') or
        act.get('poolDistance') or
        0
    )
    
    # Conversion intelligente : natation est généralement en MÈTRES dans l'API Garmin
    if swim_distance_m > 100000:  # Si > 100km, erreur de conversion
        distance_swim = round(swim_distance_m / 1000, 3)
        print_debug(f"Swimming distance ERROR: {swim_distance_m} seems incorrect. Assuming meters -> {distance_swim}km for activity {act_id}")
    elif swim_distance_m > 1:  # Si > 1m, probablement en mètres, convertir en km
        distance_swim = round(swim_distance_m / 1000, 3)
        print_debug(f"Swimming distance converted: {swim_distance_m}m -> {distance_swim}km for activity {act_id}")
    elif swim_distance_m > 0:  # Si entre 0m et 1m, peut-être déjà en km (rare)
        distance_swim = round(swim_distance_m, 3)
        print_debug(f"Swimming distance already in km: {swim_distance_m}km for activity {act_id}")
    else:
        distance_swim = 0
    
    # Laps - Chercher dans TOUS les champs possibles
    laps_count = safe_int(
        detail_dto.get('lapCount') or
        detail_dto.get('laps') or
        detail_dto.get('numberOfLaps') or
        detail_dto.get('poolLapCount') or
        detail_dto.get('totalLaps') or
        detail_dto.get('swimLapCount') or
        act.get('lapCount') or
        act.get('laps') or
        act.get('numberOfLaps') or
        act.get('poolLapCount') or
        act.get('totalLaps') or
        act.get('swimLapCount') or
        (act.get('metadataDTO', {}).get('lapCount') if isinstance(act.get('metadataDTO'), dict) else None) or
        (act_details.get('lapCount') if isinstance(act_details, dict) else None) or
        (act_details.get('metadataDTO', {}).get('lapCount') if isinstance(act_details, dict) and isinstance(act_details.get('metadataDTO'), dict) else None) or
        act_summary.get('lapCount') or
        act_summary.get('laps') or
        act_summary.get('numberOfLaps') or
        0
    )
    
    # Log pour debug
    if laps_count == 0:
        print_debug(f"Swimming activity {act_id} - NO LAPS FOUND. Distance: {distance_swim}km. Checking for pool length...")
    else:
        print_debug(f"Swimming activity {act_id} - Found {laps_count} laps, distance: {distance_swim}km")
    
    # Si pas de laps mais distance, essayer de calculer (distance / longueur piscine standard 25m ou 50m)
    if laps_count == 0 and swim_distance_m > 0:
        pool_length = safe_float(
            detail_dto.get('poolLength') or 
            detail_dto.get('poolLengthMeters') or
            act.get('poolLength') or 
            act.get('poolLengthMeters') or
            25  # 25m par défaut (longueur standard piscine)
        )
        # swim_distance_m est déjà en mètres, pas besoin de convertir
        if pool_length > 0:
            calculated_laps = round(swim_distance_m / pool_length)
            if calculated_laps > 0:
                laps_count = calculated_laps
                print_debug(f"Calculated laps for activity {act_id}: {laps_count} laps from distance {swim_distance_m}m / pool length {pool_length}m")
    elif laps_count == 0 and distance_swim > 0:
        # Si on n'a que distance_swim (en km), utiliser ça
        pool_length = safe_float(
            detail_dto.get('poolLength') or 
            detail_dto.get('poolLengthMeters') or
            act.get('poolLength') or 
            act.get('poolLengthMeters') or
            25  # 25m par défaut
        )
        # distance_swim est en km, convertir en mètres pour calcul
        distance_meters = distance_swim * 1000
        if pool_length > 0:
            calculated_laps = round(distance_meters / pool_length)
            if calculated_laps > 0:
                laps_count = calculated_laps
                print_debug(f"Calculated laps for activity {act_id}: {laps_count} laps from distance {distance_swim}km ({distance_meters}m) / pool length {pool_length}m")
    
    # CORRECTION CRITIQUE : Explorer activityDetailDTO.laps[] pour métriques natation
    # Les métriques détaillées de natation sont souvent dans laps[] (chaque longueur)
    laps_data = []
    if isinstance(act_details, dict):
        # Chercher laps dans activityDetailDTO
        laps_from_details = (
            act_details.get('activityDetailDTO', {}).get('laps', []) or
            act_details.get('laps', []) or
            detail_dto.get('laps', []) or
            detail_dto.get('lapList', []) or
            act.get('laps', []) or
            []
        )
        if isinstance(laps_from_details, list) and len(laps_from_details) > 0:
            laps_data = laps_from_details
            print_debug(f"✅ Found {len(laps_data)} laps in activityDetailDTO for swimming activity {act_id}")
            # Logger structure première lap pour debug
            if len(laps_data) > 0 and isinstance(laps_data[0], dict):
                first_lap_keys = list(laps_data[0].keys())[:15]
                print_debug(f"First lap keys (sample): {first_lap_keys}")
    
    # Agréger métriques depuis laps si disponibles
    stroke_count_from_laps = []
    stroke_rate_from_laps = []
    swolf_from_laps = []
    pace_from_laps = []
    speed_from_laps = []
    
    if len(laps_data) > 0:
        for lap in laps_data:
            if isinstance(lap, dict):
                # Stroke count
                lap_strokes = safe_int(lap.get('strokeCount') or lap.get('strokes') or lap.get('totalStrokes'), 0)
                if lap_strokes > 0:
                    stroke_count_from_laps.append(lap_strokes)
                
                # Stroke rate
                lap_rate = safe_float(lap.get('strokeRate') or lap.get('avgStrokeRate') or lap.get('averageStrokeRate'), 0)
                if lap_rate > 0:
                    stroke_rate_from_laps.append(lap_rate)
                
                # SWOLF
                lap_swolf = safe_float(lap.get('swolf') or lap.get('avgSwolf') or lap.get('averageSwolf'), 0)
                if lap_swolf > 0:
                    swolf_from_laps.append(lap_swolf)
                
                # Pace
                lap_pace = safe_int(lap.get('pace') or lap.get('avgPace') or lap.get('averagePace'), 0)
                if lap_pace > 0:
                    pace_from_laps.append(lap_pace)
                
                # Speed
                lap_speed = safe_float(lap.get('speed') or lap.get('avgSpeed') or lap.get('averageSpeed'), 0)
                if lap_speed > 0:
                    speed_from_laps.append(lap_speed)
    
    # Stroke count et métriques de nage - PRIORITÉ : Agréger depuis laps, puis chercher dans summaryDTO/detailDTO
    stroke_count = 0
    if len(stroke_count_from_laps) > 0:
        stroke_count = sum(stroke_count_from_laps)
        print_debug(f"✅ Calculated strokeCount from {len(stroke_count_from_laps)} laps: {stroke_count}")
    else:
        # Fallback : chercher dans summaryDTO/detailDTO/act
        stroke_count = safe_int(
            (summary_dto_swim.get('strokeCount') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('totalStrokes') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('strokes') if isinstance(summary_dto_swim, dict) else None) or
            detail_dto.get('strokeCount') or 
            detail_dto.get('totalStrokes') or 
            detail_dto.get('strokes') or 
            act.get('strokeCount') or 
            act.get('totalStrokes') or 
            act.get('strokes'),
            0
        )
    
    # Avg stroke rate - PRIORITÉ : Agréger depuis laps, puis fallback
    avg_stroke_rate = 0
    if len(stroke_rate_from_laps) > 0:
        avg_stroke_rate = round(sum(stroke_rate_from_laps) / len(stroke_rate_from_laps), 2)
        print_debug(f"✅ Calculated avgStrokeRate from {len(stroke_rate_from_laps)} laps: {avg_stroke_rate}")
    else:
        # Fallback
        avg_stroke_rate = safe_float(
            (summary_dto_swim.get('averageStrokeRate') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('avgStrokeRate') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('strokeRate') if isinstance(summary_dto_swim, dict) else None) or
            detail_dto.get('averageStrokeRate') or 
            detail_dto.get('avgStrokeRate') or 
            detail_dto.get('strokeRate') or 
            act.get('averageStrokeRate') or 
            act.get('avgStrokeRate') or 
            act.get('strokeRate'),
            0
        )
    
    # Avg SWOLF - PRIORITÉ : Agréger depuis laps, puis fallback
    avg_swolf = 0
    if len(swolf_from_laps) > 0:
        avg_swolf = round(sum(swolf_from_laps) / len(swolf_from_laps), 2)
        print_debug(f"✅ Calculated avgSwolf from {len(swolf_from_laps)} laps: {avg_swolf}")
    else:
        # Fallback
        avg_swolf = safe_float(
            (summary_dto_swim.get('averageSwolf') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('avgSwolf') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('swolf') if isinstance(summary_dto_swim, dict) else None) or
            detail_dto.get('averageSwolf') or 
            detail_dto.get('avgSwolf') or 
            detail_dto.get('swolf') or 
            act.get('averageSwolf') or 
            act.get('avgSwolf') or 
            act.get('swolf'),
            0
        )
    
    # Pool length - Chercher dans toutes les structures
    pool_length_final = safe_float(
        (summary_dto_swim.get('poolLength') if isinstance(summary_dto_swim, dict) else None) or
        (summary_dto_swim.get('poolLengthMeters') if isinstance(summary_dto_swim, dict) else None) or
        detail_dto.get('poolLength') or 
        detail_dto.get('poolLengthMeters') or
        act.get('poolLength') or 
        act.get('poolLengthMeters') or
        25  # 25m par défaut (longueur standard piscine)
    )
    avg_movements_per_lap = (stroke_count / laps_count) if (laps_count > 0 and stroke_count > 0) else None
    
    # Avg pace - PRIORITÉ : Agréger depuis laps, puis fallback
    avg_pace = 0
    if len(pace_from_laps) > 0:
        avg_pace = round(sum(pace_from_laps) / len(pace_from_laps))
        print_debug(f"✅ Calculated avgPace from {len(pace_from_laps)} laps: {avg_pace} seconds")
    else:
        # Fallback
        avg_pace = safe_int(
            (summary_dto_swim.get('avgPace') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('averagePace') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('pace') if isinstance(summary_dto_swim, dict) else None) or
            detail_dto.get('avgPace') or 
            detail_dto.get('averagePace') or 
            detail_dto.get('pace') or 
            act.get('avgPace') or 
            act.get('averagePace') or 
            act.get('pace'),
            0
        )
        # Si pace semble être en millisecondes ou très grand, diviser par 1000
        if avg_pace > 10000:
            avg_pace = avg_pace / 1000
    
    # Best pace - PRIORITÉ : Min depuis laps, puis fallback
    best_pace = 0
    if len(pace_from_laps) > 0:
        best_pace = min(pace_from_laps)  # Meilleure allure = minimum temps
        print_debug(f"✅ Calculated bestPace from {len(pace_from_laps)} laps: {best_pace} seconds")
    
    avg_pace_movement = safe_int(
        (summary_dto_swim.get('avgPaceMovement') if isinstance(summary_dto_swim, dict) else None) or
        (summary_dto_swim.get('averagePaceMovement') if isinstance(summary_dto_swim, dict) else None) or
        detail_dto.get('avgPaceMovement') or 
        detail_dto.get('averagePaceMovement') or 
        act.get('avgPaceMovement') or 
        act.get('averagePaceMovement'),
        0
    )
    if avg_pace_movement > 10000:
        avg_pace_movement = avg_pace_movement / 1000
    
    if best_pace == 0:  # Si pas trouvé depuis laps, fallback
        best_pace = safe_int(
            (summary_dto_swim.get('bestPace') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('fastestPace') if isinstance(summary_dto_swim, dict) else None) or
            detail_dto.get('bestPace') or 
            detail_dto.get('fastestPace') or 
            act.get('bestPace') or 
            act.get('fastestPace'),
            0
        )
        if best_pace > 10000:
            best_pace = best_pace / 1000
    
    # Avg speed - PRIORITÉ : Agréger depuis laps, puis fallback vers summaryDTO
    avg_speed = 0
    if len(speed_from_laps) > 0:
        avg_speed_from_laps = round(sum(speed_from_laps) / len(speed_from_laps), 2)
        # Utiliser vitesse depuis laps si trouvée
        if avg_speed_from_laps > 0:
            # Convertir si nécessaire (m/s en km/h)
            if avg_speed_from_laps < 10:
                avg_speed_from_laps = avg_speed_from_laps * 3.6
            avg_speed = avg_speed_from_laps
            print_debug(f"✅ Calculated avgSpeed from {len(speed_from_laps)} laps: {avg_speed} km/h")
    else:
        # Fallback : Chercher dans summaryDTO (averageSpeed, maxSpeed)
        avg_speed = safe_float(
            (summary_dto_swim.get('averageSpeed') if isinstance(summary_dto_swim, dict) else None) or
            (summary_dto_swim.get('avgSpeed') if isinstance(summary_dto_swim, dict) else None) or
            detail_dto.get('avgSpeed') or 
            detail_dto.get('averageSpeed') or 
            act.get('avgSpeed') or 
            act.get('averageSpeed'),
            0
        )
    # Si vitesse en m/s (0 < speed < 10), convertir en km/h
    if avg_speed > 0 and avg_speed < 10:
        avg_speed = avg_speed * 3.6  # Convertir m/s en km/h
    
    avg_speed_movement = safe_float(
        (summary_dto_swim.get('averageSpeedMovement') if isinstance(summary_dto_swim, dict) else None) or
        (summary_dto_swim.get('avgSpeedMovement') if isinstance(summary_dto_swim, dict) else None) or
        detail_dto.get('avgSpeedMovement') or 
        detail_dto.get('averageSpeedMovement') or 
        act.get('avgSpeedMovement') or 
        act.get('averageSpeedMovement'),
        0
    )
    if avg_speed_movement > 0 and avg_speed_movement < 10:
        avg_speed_movement = avg_speed_movement * 3.6
    
    max_speed = safe_float(
        (summary_dto_swim.get('maxSpeed') if isinstance(summary_dto_swim, dict) else None) or
        (summary_dto_swim.get('maximumSpeed') if isinstance(summary_dto_swim, dict) else None) or
        detail_dto.get('maxSpeed') or 
        detail_dto.get('maximumSpeed') or 
        act.get('maxSpeed') or 
        act.get('maximumSpeed'),
        0
    )
    # Si vitesse en m/s (0 < speed < 10), convertir en km/h
    if max_speed > 0 and max_speed < 10:
        max_speed = max_speed * 3.6
    
    # Temps - Chercher dans summaryDTO EN PREMIER (elapsedDuration, movingDuration), puis TOUTES les structures
    total_time = safe_int(
        (summary_dto_swim.get('elapsedDuration') if isinstance(summary_dto_swim, dict) else None) or
        (summary_dto_swim.get('duration') if isinstance(summary_dto_swim, dict) else None) or
        detail_dto.get('elapsedTime') or
        detail_dto.get('elapsedDuration') or
        detail_dto.get('totalTime') or
        detail_dto.get('duration') or
        act.get('elapsedTime') or 
        act.get('elapsedDuration') or 
        act.get('totalTime') or 
        act.get('duration') or
        duration,
        0
    )
    # CORRECTION CRITIQUE : Utiliser summaryDTO.movingDuration pour activeTime natation
    active_time = safe_int(
        (summary_dto_swim.get('movingDuration') if isinstance(summary_dto_swim, dict) else None) or
        detail_dto.get('activeTime') or 
        detail_dto.get('movingTime') or 
        detail_dto.get('activeDuration') or
        act.get('activeTime') or 
        act.get('movingTime') or 
        act.get('activeDuration') or
        total_time,
        total_time  # Fallback vers total_time si non trouvé
    )
    elapsed_time = safe_int(
        detail_dto.get('elapsedTime') or
        detail_dto.get('elapsedDuration') or
        act.get('elapsedTime') or
        act.get('elapsedDuration') or
        total_time,
        total_time
    )
    
    # CORRECTION : Stocker poolLength et laps détaillés dans entry_base
    # Parser laps détaillés pour stockage et affichage
    laps_detailed = None
    if len(laps_data) > 0:
        laps_detailed = []
        for idx, lap in enumerate(laps_data):
            if isinstance(lap, dict):
                lap_detail = {
                    "lapNumber": idx + 1,
                    "distance": safe_float(lap.get('distance') or lap.get('distanceMeters'), 0),
                    "time": safe_int(lap.get('time') or lap.get('duration') or lap.get('timeSeconds'), 0),
                    "strokeCount": safe_int(lap.get('strokeCount') or lap.get('strokes'), 0),
                    "pace": safe_int(lap.get('pace') or lap.get('avgPace'), 0),
                    "speed": safe_float(lap.get('speed') or lap.get('avgSpeed'), 0)
                }
                # Ne garder que les laps avec données valides
                if lap_detail["distance"] > 0 or lap_detail["time"] > 0:
                    laps_detailed.append(lap_detail)
    
    # Mettre à jour entry_base avec toutes les métriques natation
    entry_base.update({
        "distance": distance_swim,
        "laps": laps_count,
        "swimmingMetrics": {
            "strokeCount": stroke_count if stroke_count > 0 else None,
            "avgStrokeRate": round(avg_stroke_rate, 2) if avg_stroke_rate > 0 else None,
            "avgSwolf": round(avg_swolf, 2) if avg_swolf > 0 else None,
            "avgMovementsPerLap": round(avg_movements_per_lap, 2) if avg_movements_per_lap else None,
            "avgPace": avg_pace if avg_pace > 0 else None,
            "avgPaceMovement": avg_pace_movement if avg_pace_movement > 0 else None,
            "bestPace": best_pace if best_pace > 0 else None,
            "avgSpeed": round(avg_speed, 2) if avg_speed > 0 else None,
            "avgSpeedMovement": round(avg_speed_movement, 2) if avg_speed_movement > 0 else None,
            "maxSpeed": round(max_speed, 2) if max_speed > 0 else None,
            # CORRECTION : Ajouter poolLength et laps détaillés
            "poolLength": pool_length_final if pool_length_final != 25 else None,
            "laps": laps_detailed if laps_detailed and len(laps_detailed) > 0 else None
        },
        "timeMetrics": {
            "totalTime": total_time,
            "activeTime": active_time if active_time != total_time else None,
            "elapsedTime": elapsed_time if elapsed_time != total_time else total_time
        }
    })
    
    # 🔴 FIX #10: Validation de cohérence des métriques de natation
    act_id = act_summary.get('activityId')
    if distance_swim > 0 and total_time > 0 and avg_pace > 0:
        is_valid, error_msg = validate_swimming_consistency(
            distance_swim,  # distance en mètres
            total_time,     # durée en secondes
            avg_pace,       # allure en secondes par 100m
            f"activity.{act_id}"
        )
        if not is_valid and error_msg:
            print_debug(f"⚠️ Validation natation échouée pour activité {act_id}: {error_msg}")
            # Ne pas bloquer, juste avertir
    
    print_debug(f"Added swimming activity {act_id} to swim_list. Total swimming metrics parsed.")
    
    return entry_base


def parse_jump_rope_metrics(entry_base: Dict[str, Any], summary_dto: Dict[str, Any], 
                            act: Dict[str, Any], act_details: Optional[Dict[str, Any]], 
                            act_summary: Dict[str, Any], duration: int) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Parse les métriques spécifiques à la corde à sauter (avec logique Connect IQ complète).
    
    Returns:
        Tuple[entry_base mis à jour, connect_iq dict]
    """
    act_id = act_summary.get('activityId')
    
    # Chercher jumps dans les champs de base d'abord
    jumps = safe_int(
        act.get('steps') or 
        act.get('sumSteps') or 
        act.get('jumps') or 
        act.get('totalJumps') or
        act_summary.get('steps') or
        act_summary.get('jumps') or
        0
    )
    
    # Chercher données Connect IQ dans les détails (PRIORITÉ ABSOLUE)
    # IMPORTANT: Les données Connect IQ peuvent être dans plusieurs structures
    connect_iq = {}
    
    # CORRECTION CRITIQUE : Parser connectIQMeasurements EN PREMIER (source principale)
    # PROTÉGER ces valeurs pour qu'elles ne soient PAS écrasées par des valeurs suspectes
    speed_from_measurements = None  # Pour protéger la vitesse depuis connectIQMeasurements
    
    connect_iq_measurements = (
        (act_details.get('connectIQMeasurements', []) if isinstance(act_details, dict) else []) or
        (act.get('connectIQMeasurements', []) if isinstance(act, dict) else []) or
        []
    )
    
    if connect_iq_measurements and len(connect_iq_measurements) > 0:
        print_debug(f"✅ Found {len(connect_iq_measurements)} connectIQMeasurements for activity {act_id}")
        
        # Parser chaque measurement selon developerFieldNumber
        # Format typique JumpJump Pro:
        # - developerFieldNumber: 1 = duration (format "00:10:49")
        # - developerFieldNumber: 2 = jumps (1034.0)
        # - developerFieldNumber: 3 = speed/jumps per min (95.59)
        # - developerFieldNumber: 4 = interruptions (14.0)
        # - developerFieldNumber: 8 = max continuous jumps (144.0)
        for measurement in connect_iq_measurements:
            if isinstance(measurement, dict):
                field_num = safe_int(measurement.get('developerFieldNumber'), 0)
                value = measurement.get('value')
                app_id = measurement.get('appID', '')
                
                if value is None:
                    continue
                
                # Parser selon developerFieldNumber
                if field_num == 1:
                    # Durée (format "00:10:49" ou nombre en secondes)
                    if isinstance(value, str) and ':' in value:
                        connect_iq['duration'] = value
                        print_debug(f"✅ Found duration in connectIQMeasurements[fieldNumber=1]: {value}")
                    elif isinstance(value, (int, float)) and value > 0:
                        mins = int(value // 60)
                        secs = int(value % 60)
                        connect_iq['duration'] = f"{str(mins).zfill(2)}:{str(secs).zfill(2)}"
                        print_debug(f"✅ Found duration in connectIQMeasurements[fieldNumber=1]: {value}s = {connect_iq['duration']}")
                elif field_num == 2:
                    # SAUTS ! (valeur la plus importante)
                    val = safe_float(value, 0)
                    if val > 0:
                        jumps_val = safe_int(val, 0)
                        # VALIDATION : Vérifier que les sauts sont raisonnables (10-10000)
                        if 10 <= jumps_val <= 10000:
                            connect_iq['jumps'] = jumps_val
                            jumps = jumps_val
                            print_debug(f"✅✅✅ FOUND JUMPS in connectIQMeasurements[fieldNumber=2]: {jumps}")
                        else:
                            print_debug(f"⚠️  JUMPS out of range (10-10000): {jumps_val}, accepting anyway")
                            connect_iq['jumps'] = jumps_val
                            jumps = jumps_val
                elif field_num == 3:
                    # Vitesse (sauts/min) - PRIORITÉ ABSOLUE
                    val = safe_float(value, 0)
                    if val > 0:
                        speed_val = round(val, 2)
                        # VALIDATION : Vitesse raisonnable (10-300 sauts/min)
                        if 10 <= speed_val <= 300:
                            connect_iq['speed'] = speed_val
                            speed_from_measurements = speed_val  # PROTÉGER cette valeur
                            print_debug(f"✅ Found speed in connectIQMeasurements[fieldNumber=3]: {connect_iq['speed']} jumps/min (PROTECTED)")
                        else:
                            print_debug(f"⚠️  SPEED out of range (10-300): {speed_val}, accepting anyway")
                            connect_iq['speed'] = speed_val
                            speed_from_measurements = speed_val  # PROTÉGER cette valeur
                elif field_num == 4:
                    # Interruptions
                    val = safe_float(value, 0)
                    if val >= 0:  # Accepter 0 aussi
                        interruptions_val = safe_int(val, 0)
                        # VALIDATION : Interruptions raisonnables (0-1000)
                        if 0 <= interruptions_val <= 1000:
                            connect_iq['interruptions'] = interruptions_val
                            print_debug(f"✅ Found interruptions in connectIQMeasurements[fieldNumber=4]: {connect_iq['interruptions']}")
                        else:
                            print_debug(f"⚠️  INTERRUPTIONS out of range (0-1000): {interruptions_val}, accepting anyway")
                            connect_iq['interruptions'] = interruptions_val
                elif field_num == 8:
                    # Max continuous jumps
                    val = safe_float(value, 0)
                    if val > 0:
                        max_cont_val = safe_int(val, 0)
                        # VALIDATION : Max continu doit être > 0 et < jumps si jumps existe
                        if max_cont_val > 0 and max_cont_val <= 10000:
                            connect_iq['maxContinuousJumps'] = max_cont_val
                            print_debug(f"✅ Found maxContinuousJumps in connectIQMeasurements[fieldNumber=8]: {connect_iq['maxContinuousJumps']}")
                        else:
                            print_debug(f"⚠️  MAX_CONTINUOUS_JUMPS out of range: {max_cont_val}, accepting anyway")
                            connect_iq['maxContinuousJumps'] = max_cont_val
    else:
        print_debug(f"No connectIQMeasurements found for activity {act_id}")
    
    # 1. Chercher directement dans les champs Connect IQ connus
    if act_details:
        # Chercher dans connectIQData, connectIqData, connectIqFields, etc.
        connect_iq_data = (
            act_details.get('connectIQData') or
            act_details.get('connectIqData') or
            act_details.get('connectIqFields') or
            act_details.get('connectIq') or
            act_details.get('connectIQ') or
            {}
        )
        if isinstance(connect_iq_data, dict):
            # Si c'est un dict, chercher les champs de sauts
            for key, value in connect_iq_data.items():
                if value is None:
                    continue
                key_lower = str(key).lower()
                if 'jump' in key_lower or 'saut' in key_lower:
                    if isinstance(value, (int, float)) and value > 0:
                        if 'max' in key_lower or 'continuous' in key_lower or 'count' in key_lower:
                            connect_iq['maxContinuousJumps'] = safe_int(value, 0)
                        else:
                            connect_iq['jumps'] = safe_int(value, 0)
                            jumps = safe_int(value, 0)
                elif 'speed' in key_lower or 'vitesse' in key_lower:
                    # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements
                    if speed_from_measurements is not None:
                        print_debug(f"⚠️  Ignoring speed from connect_iq_data['{key}']={value} (already have {speed_from_measurements} from connectIQMeasurements)")
                    elif isinstance(value, (int, float)) and value > 0:
                        connect_iq['speed'] = safe_float(value, 0)
                elif 'interruption' in key_lower or 'stop' in key_lower:
                    val = safe_int(value, 0)
                    if val >= 0:
                        connect_iq['interruptions'] = val
        
        # 2. Chercher dans les structures DTO standard
        detail_dto_conn = act_details.get('activityDetailDTO', {}) or act_details.get('detailDTO', {}) or {}
        measurements = detail_dto_conn.get('measurements', []) or act_details.get('measurements', []) or []
        
        # DEBUG: Logger les measurements trouvés
        if measurements:
            print_debug(f"Found {len(measurements)} measurements for activity {act_id}. Sample (first 5): {measurements[:5]}")
        
        # Chercher aussi dans activitySummaryDTO (TOUS les champs) - CRITIQUE pour Connect IQ
        summary_dto_conn = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {}) or act.get('activitySummaryDTO', {}) or act.get('summaryDTO', {}) or {}
        if summary_dto_conn:
            print_debug(f"summaryDTO keys for activity {act_id}: {list(summary_dto_conn.keys())[:20]}")
            
            # Chercher champs custom dans summary - EXHAUSTIF
            for key, value in summary_dto_conn.items():
                if value is None:
                    continue
                key_lower = str(key).lower()
                # Jumps/Sauts - PRIORITÉ ABSOLUE
                if 'jump' in key_lower or 'saut' in key_lower:
                    if 'max' in key_lower or 'continuous' in key_lower or 'series' in key_lower or 'best' in key_lower:
                        val = safe_int(value, 0)
                        if val > 0:
                            connect_iq['maxContinuousJumps'] = val
                            print_debug(f"✅ Found maxContinuousJumps in summaryDTO['{key}']: {val}")
                    else:
                        val = safe_int(value, 0)
                        if val > 0:
                            connect_iq['jumps'] = val
                            jumps = val  # Mettre à jour jumps immédiatement
                            print_debug(f"✅ Found jumps in summaryDTO['{key}']: {val}")
                # Vitesse - Vérifier l'unité (peut être en m/s ou sauts/min)
                elif 'speed' in key_lower or 'vitesse' in key_lower or 'jumpspermin' in key_lower or 'rate' in key_lower:
                    # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements si déjà défini
                    if speed_from_measurements is not None:
                        print_debug(f"⚠️  Ignoring speed from summaryDTO['{key}']={value} (already have {speed_from_measurements} from connectIQMeasurements)")
                    else:
                        val = safe_float(value, 0)
                        # Si vitesse < 1, peut-être en m/s, convertir en sauts/min
                        if val > 0:
                            if val < 1 and val > 0:  # Probablement en m/s ou fraction, chercher la vraie vitesse ailleurs
                                print_debug(f"Found suspicious speed value in summaryDTO['{key}']: {val} (too low, may be wrong unit)")
                            else:
                                connect_iq['speed'] = val
                                print_debug(f"✅ Found speed in summaryDTO['{key}']: {val}")
                # Interruptions
                elif 'interruption' in key_lower or 'stop' in key_lower or 'pause' in key_lower:
                    val = safe_int(value, 0)
                    if val >= 0:  # Accepter 0 aussi
                        connect_iq['interruptions'] = val
                        print_debug(f"✅ Found interruptions in summaryDTO['{key}']: {val}")
                # Durée Connect IQ
                elif 'duration' in key_lower and ('connect' in key_lower or 'iq' in key_lower):
                    if isinstance(value, str):
                        connect_iq['duration'] = value
                    else:
                        secs = safe_int(value, 0)
                        if secs > 0:
                            mins = secs // 60
                            secs_remain = secs % 60
                            connect_iq['duration'] = f"{str(mins).zfill(2)}:{str(secs_remain).zfill(2)}"
            
            # Chercher aussi dans les valeurs numériques directes
            numeric_values_in_summary = [(k, v) for k, v in summary_dto_conn.items() if isinstance(v, (int, float)) and 500 <= v <= 5000]
            if numeric_values_in_summary:
                print_debug(f"Found numeric values 500-5000 in summaryDTO: {numeric_values_in_summary}")
                # Si on n'a pas encore trouvé les sauts et qu'il y a une valeur dans cette plage
                if jumps == 0:
                    for k, v in numeric_values_in_summary:
                        k_lower = str(k).lower()
                        # Exclure les champs connus
                        if not any(excl in k_lower for excl in ['lap', 'stroke', 'step', 'distance', 'duration', 'time', 'calorie', 'hr', 'heart', 'id', 'pk']):
                            connect_iq['jumps'] = safe_int(v, 0)
                            jumps = safe_int(v, 0)
                            print_debug(f"✅ Found jumps in summaryDTO['{k}'] (by value range): {jumps}")
                            break
        
        # Chercher aussi dans les champs top-level de act_details (CRITIQUE pour Connect IQ)
        for key, value in act_details.items():
            if value is None:
                continue
            key_lower = str(key).lower()
            # Si c'est un nombre (int/float), chercher jumps/sauts
            if isinstance(value, (int, float)) and value > 0:
                if ('jump' in key_lower or 'saut' in key_lower) and ('max' in key_lower or 'continuous' in key_lower):
                    # 🔴 FIX #9: Validation de plage pour maxContinuousJumps
                    connect_iq['maxContinuousJumps'] = safe_int(
                        value, 
                        connect_iq.get('maxContinuousJumps', 0),
                        warn_on_fail=True,
                        min_value=JUMPS_MIN,
                        max_value=JUMPS_MAX,
                        context="activity.jumpRope.maxContinuousJumps"
                    )
                elif 'jump' in key_lower or 'saut' in key_lower:
                    val = safe_int(value, 0)
                    if val > 0:
                        connect_iq['jumps'] = val
                        jumps = val  # Mettre à jour jumps
                elif 'jumpspermin' in key_lower or ('speed' in key_lower and 'jump' in key_lower):
                    # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements si déjà défini
                    if speed_from_measurements is not None:
                        print_debug(f"⚠️  Ignoring speed from act_details['{key}']={value} (already have {speed_from_measurements} from connectIQMeasurements)")
                    else:
                        connect_iq['speed'] = safe_float(value, connect_iq.get('speed', 0))
            # Si c'est un string, peut contenir "1034 sauts"
            elif isinstance(value, str):
                import re
                if 'jump' in key_lower or 'saut' in key_lower:
                    # Extraire le nombre du string
                    numbers = re.findall(r'\d+', value)
                    if numbers:
                        val = safe_int(numbers[0], 0)
                        if val > 0:
                            if 'max' in key_lower or 'continuous' in key_lower:
                                connect_iq['maxContinuousJumps'] = val
                            else:
                                connect_iq['jumps'] = val
                                jumps = val
            # Si c'est un dict, chercher récursivement
            elif isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    sub_key_lower = str(sub_key).lower()
                    if 'jump' in sub_key_lower or 'saut' in sub_key_lower:
                        if isinstance(sub_value, (int, float)) and sub_value > 0:
                            if 'max' in sub_key_lower or 'continuous' in sub_key_lower:
                                # 🔴 FIX #9: Validation de plage pour maxContinuousJumps
                                connect_iq['maxContinuousJumps'] = safe_int(
                                    sub_value, 
                                    connect_iq.get('maxContinuousJumps', 0),
                                    warn_on_fail=True,
                                    min_value=JUMPS_MIN,
                                    max_value=JUMPS_MAX,
                                    context="activity.jumpRope.maxContinuousJumps"
                                )
                            else:
                                connect_iq['jumps'] = safe_int(sub_value, 0)
                                # 🔴 FIX #9: Validation de plage pour jumps
                                jumps = safe_int(
                                    sub_value, 
                                    jumps,
                                    warn_on_fail=True,
                                    min_value=JUMPS_MIN,
                                    max_value=JUMPS_MAX,
                                    context="activity.jumpRope.jumps"
                                )
        
        # Chercher dans measurements - EXHAUSTIF
        if measurements:
            print_debug(f"Parsing {len(measurements)} measurements for activity {act_id}...")
        for idx, m in enumerate(measurements):
            if isinstance(m, dict):
                # Chercher dans TOUS les champs possibles de la measurement
                field_name = str(m.get('field') or m.get('name') or m.get('key') or m.get('label') or m.get('metricKey') or '').lower()
                field_value = m.get('value') or m.get('displayValue') or m.get('metric') or m.get('metricValue') or m.get('valueWithUnit')
                
                # DEBUG: Logger les measurements pertinents
                if field_value and isinstance(field_value, (int, float)) and 500 <= field_value <= 5000:
                    print_debug(f"Measurement[{idx}] '{field_name}' has value {field_value} (potential jumps)")
                
                # Jumps/Sauts - TOUTES les variantes
                if 'jump' in field_name or 'saut' in field_name:
                    if 'max' in field_name or 'continuous' in field_name or 'series' in field_name or 'best' in field_name:
                        val = safe_int(field_value, 0)
                        if val > 0:
                            connect_iq['maxContinuousJumps'] = val
                            print_debug(f"✅ Found maxContinuousJumps in measurement[{idx}]['{field_name}']: {val}")
                    else:
                        val = safe_int(field_value, 0)
                        if val > 0:
                            connect_iq['jumps'] = val
                            jumps = val
                            print_debug(f"✅ Found jumps in measurement[{idx}]['{field_name}']: {val}")
                # Vitesse - Vérifier l'unité
                elif 'speed' in field_name or 'vitesse' in field_name or 'rate' in field_name or 'jumpspermin' in field_name or 'jpm' in field_name:
                    # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements si déjà défini
                    if speed_from_measurements is not None:
                        print_debug(f"⚠️  Ignoring speed from measurement[{idx}]['{field_name}']={field_value} (already have {speed_from_measurements} from connectIQMeasurements)")
                    else:
                        val = safe_float(field_value, 0)
                        if val > 0:
                            # Si vitesse < 1, probablement incorrecte (devrait être ~95 sauts/min)
                            if val < 1:
                                print_debug(f"Found suspicious speed in measurement[{idx}]: {val} (too low, ignoring)")
                            else:
                                connect_iq['speed'] = val
                                print_debug(f"✅ Found speed in measurement[{idx}]['{field_name}']: {val}")
                # Durée Connect IQ (format mm:ss)
                elif 'duration' in field_name and ('connect' in field_name.lower() or 'iq' in field_name.lower()):
                    # Peut être en secondes ou en format mm:ss
                    if isinstance(field_value, str):
                        connect_iq['duration'] = field_value
                    else:
                        # Convertir secondes en mm:ss
                        secs = safe_int(field_value, 0)
                        if secs > 0:
                            mins = secs // 60
                            secs_remain = secs % 60
                            connect_iq['duration'] = f"{str(mins).zfill(2)}:{str(secs_remain).zfill(2)}"
                # Interruptions
                elif 'interruption' in field_name or 'stop' in field_name or 'pause' in field_name:
                    val = safe_int(field_value, 0)
                    if val >= 0:  # Accepter 0 aussi
                        connect_iq['interruptions'] = val
                
                # Si le nom du champ est vide ou générique, mais que la valeur est dans la plage des sauts
                if not field_name or field_name in ['value', 'metric', 'data']:
                    val = safe_int(field_value, 0)
                    if 500 <= val <= 5000:
                        # Vérifier les autres champs de la measurement pour identifier le type
                        m_type = str(m.get('type') or m.get('unit') or '').lower()
                        if 'jump' in m_type or 'saut' in m_type or ('count' in m_type and 'lap' not in m_type):
                            connect_iq['jumps'] = val
                            jumps = val
                            print_debug(f"✅ Found jumps in measurement[{idx}] (by type '{m_type}'): {val}")
        
        # Chercher dans les laps/splits pour données Connect IQ (parfois les données sont dans les laps)
        laps_data = detail_dto_conn.get('laps', []) or act_details.get('laps', []) or act_details.get('splits', []) or []
        
        # Pour corde à sauter, s'il y a une lap, parser complètement
        if len(laps_data) > 0:
            print_debug(f"Found {len(laps_data)} lap(s) for jump rope activity {act_id}. Parsing lap[0] completely...")
            first_lap = laps_data[0]
            if isinstance(first_lap, dict):
                # Chercher récursivement dans TOUS les champs de la lap
                def search_in_dict(obj, path=""):
                    """Recherche récursive pour trouver jumps/sauts dans la lap"""
                    found = []
                    if isinstance(obj, dict):
                        for key, value in obj.items():
                            current_path = f"{path}.{key}" if path else key
                            key_lower = str(key).lower()
                            # Si le champ contient "jump" ou "saut" et la valeur est un nombre 500-5000
                            if ('jump' in key_lower or 'saut' in key_lower) and isinstance(value, (int, float)):
                                if 500 <= value <= 5000:
                                    found.append((current_path, value))
                            # Si c'est un dict ou list, chercher récursivement
                            elif isinstance(value, (dict, list)):
                                found.extend(search_in_dict(value, current_path))
                    elif isinstance(obj, list):
                        for idx, item in enumerate(obj):
                            found.extend(search_in_dict(item, f"{path}[{idx}]"))
                    return found
                
                # Chercher sauts dans la première lap
                jumps_in_lap = search_in_dict(first_lap)
                if jumps_in_lap:
                    print_debug(f"✅ Found potential jumps in lap[0]: {jumps_in_lap}")
                    # Prendre le premier résultat trouvé
                    _, jumps_value = jumps_in_lap[0]
                    if jumps_value > 0:
                        # 🔴 FIX #9: Validation de plage pour jumps
                        connect_iq['jumps'] = safe_int(
                            jumps_value, 
                            0,
                            warn_on_fail=True,
                            min_value=JUMPS_MIN,
                            max_value=JUMPS_MAX,
                            context="activity.jumpRope.jumps"
                        )
                        jumps = safe_int(
                            jumps_value, 
                            0,
                            warn_on_fail=True,
                            min_value=JUMPS_MIN,
                            max_value=JUMPS_MAX,
                            context="activity.jumpRope.jumps"
                        )
                        print_debug(f"✅ Set jumps from lap[0] to {jumps}")
                
                # Chercher aussi interruptions, max continuous, etc. dans la lap
                if isinstance(first_lap, dict):
                    for key, value in first_lap.items():
                        key_lower = str(key).lower()
                        if 'interruption' in key_lower or 'stop' in key_lower or 'pause' in key_lower:
                            if isinstance(value, (int, float)) and value >= 0:
                                connect_iq['interruptions'] = safe_int(value, 0)
                                print_debug(f"✅ Found interruptions in lap[0]['{key}']: {value}")
                        elif ('max' in key_lower or 'continuous' in key_lower) and ('jump' in key_lower or 'saut' in key_lower or 'count' in key_lower):
                            if isinstance(value, (int, float)) and value > 0:
                                connect_iq['maxContinuousJumps'] = safe_int(value, 0)
                                print_debug(f"✅ Found maxContinuousJumps in lap[0]['{key}']: {value}")
        
        # Chercher dans TOUTES les laps pour données Connect IQ
        for lap in laps_data:
            if isinstance(lap, dict):
                for key, value in lap.items():
                    if value is None:
                        continue
                    key_lower = str(key).lower()
                    if ('jump' in key_lower or 'saut' in key_lower):
                        val = safe_int(value, 0)
                        if val > 0:
                            if 'max' in key_lower or 'continuous' in key_lower:
                                connect_iq['maxContinuousJumps'] = val
                            else:
                                connect_iq['jumps'] = val
                                jumps = val  # Mettre à jour jumps
                    elif 'speed' in key_lower or 'vitesse' in key_lower or 'jumpspermin' in key_lower:
                        # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements si déjà défini
                        if speed_from_measurements is not None:
                            print_debug(f"⚠️  Ignoring speed from lap['{key}']={value} (already have {speed_from_measurements} from connectIQMeasurements)")
                        else:
                            val = safe_float(value, 0)
                            if val > 0:
                                connect_iq['speed'] = val
                    elif 'duration' in key_lower and ('connect' in key_lower or 'iq' in key_lower):
                        # Durée Connect IQ
                        if isinstance(value, str):
                            connect_iq['duration'] = value
                        else:
                            secs = safe_int(value, 0)
                            if secs > 0:
                                mins = secs // 60
                                secs_remain = secs % 60
                                connect_iq['duration'] = f"{str(mins).zfill(2)}:{str(secs_remain).zfill(2)}"
                    elif 'interruption' in key_lower or 'stop' in key_lower:
                        val = safe_int(value, 0)
                        if val >= 0:  # Accepter 0 aussi
                            connect_iq['interruptions'] = val
        
        # CRITIQUE: Chercher dans tous les champs possibles de act_details (parfois les données sont au niveau root)
        # OPTIMISATION : Réduire profondeur max de 15 à 5 pour améliorer performance (gain 80-90%)
        def search_recursive(data, target_keys=['jump', 'saut', 'speed', 'interruption'], depth=0, max_depth=5):
            """Recherche récursive exhaustive dans un dict (éviter récursion infinie)"""
            results = {}
            if depth > max_depth:
                return results
            if not isinstance(data, dict):
                return results
            for key, value in data.items():
                if value is None:
                    continue
                key_lower = str(key).lower()
                # Vérifier si la clé correspond directement à ce qu'on cherche
                for target in target_keys:
                    if target in key_lower:
                        if isinstance(value, (int, float)) and value > 0:
                            if target in ['jump', 'saut']:
                                if 'max' in key_lower or 'continuous' in key_lower or 'count' in key_lower:
                                    val = safe_int(value, 0)
                                    if val > 0:
                                        results['maxContinuousJumps'] = val
                                else:
                                    val = safe_int(value, 0)
                                    if val > 0:
                                        results['jumps'] = val
                            elif target == 'speed':
                                val = safe_float(value, 0)
                                if val > 0:
                                    results['speed'] = val
                            elif target == 'interruption':
                                val = safe_int(value, 0)
                                if val >= 0:  # Accepter 0 aussi
                                    results['interruptions'] = val
                        elif isinstance(value, dict):
                            # Chercher récursivement dans le sous-dict
                            sub_results = search_recursive(value, target_keys, depth + 1, max_depth)
                            for k, v in sub_results.items():
                                if v and v > 0:
                                    results[k] = v
                                elif k == 'interruptions' and v == 0:  # Accepter 0 pour interruptions
                                    results[k] = v
                # Chercher récursivement dans TOUS les sous-dicts et listes
                if isinstance(value, (dict, list)):
                    if isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict):
                                sub_results = search_recursive(item, target_keys, depth + 1, max_depth)
                                for k, v in sub_results.items():
                                    if v and v > 0:
                                        results[k] = v
                                    elif k == 'interruptions' and v == 0:
                                        results[k] = v
                    elif isinstance(value, dict):
                        sub_results = search_recursive(value, target_keys, depth + 1, max_depth)
                        for k, v in sub_results.items():
                            if v and v > 0:
                                results[k] = v
                            elif k == 'interruptions' and v == 0:
                                results[k] = v
            return results
        
        # Recherche récursive OPTIMISÉE dans act_details pour trouver TOUTES les données Connect IQ
        # OPTIMISATION : Profondeur limitée à 5 (au lieu de 15) pour performance
        recursive_results = search_recursive(act_details, max_depth=5)
        for k, v in recursive_results.items():
            if k == 'speed' and speed_from_measurements is not None:
                # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements
                print_debug(f"⚠️  Ignoring speed from recursive search={v} (already have {speed_from_measurements} from connectIQMeasurements)")
            elif v and v > 0:
                connect_iq[k] = v
                if k == 'jumps':
                    jumps = v  # Mettre à jour jumps depuis recherche récursive
            elif k == 'interruptions' and v == 0:
                connect_iq[k] = v  # Accepter 0 pour interruptions
        
        # 3. Si toujours pas de jumps trouvés, chercher dans TOUS les champs numériques
        if jumps == 0:
            print_debug(f"Still no jumps found for activity {act_id}. Searching ALL numeric fields in act_details...")
            
            # Fonction pour extraire tous les nombres d'un dict
            def extract_all_numbers(data, path=""):
                """Extrait tous les nombres d'un dict avec leur chemin"""
                numbers = []
                if isinstance(data, dict):
                    for key, value in data.items():
                        current_path = f"{path}.{key}" if path else key
                        if isinstance(value, (int, float)):
                            if value > 0:  # Ignorer 0
                                numbers.append((current_path, value))
                        elif isinstance(value, (dict, list)):
                            if isinstance(value, list):
                                for i, item in enumerate(value):
                                    if isinstance(item, dict):
                                        numbers.extend(extract_all_numbers(item, f"{current_path}[{i}]"))
                                    elif isinstance(item, (int, float)) and item > 0:
                                        numbers.append((f"{current_path}[{i}]", item))
                            else:
                                numbers.extend(extract_all_numbers(value, current_path))
                elif isinstance(data, list):
                    for i, item in enumerate(data):
                        if isinstance(item, dict):
                            numbers.extend(extract_all_numbers(item, f"{path}[{i}]"))
                        elif isinstance(item, (int, float)) and item > 0:
                            numbers.append((f"{path}[{i}]", item))
                return numbers
            
            # Extraire tous les nombres
            all_numbers = extract_all_numbers(act_details)
            print_debug(f"Found {len(all_numbers)} numeric fields. Sample (first 20): {all_numbers[:20]}")
            
            # Afficher TOUS les nombres entre 100 et 10000 pour identifier les sauts
            candidate_jumps = [(path, val) for path, val in all_numbers if 100 <= val <= 10000]
            if candidate_jumps:
                print_debug(f"Candidate jumps (100-10000): {candidate_jumps[:10]}")
            
            # Chercher les sauts parmi tous les nombres
            # CRITIQUE: Afficher TOUS les candidats possibles pour debug
            all_candidates = [(path, val) for path, val in all_numbers if 500 <= val <= 5000]
            if all_candidates:
                print_debug(f"All candidates (500-5000): {all_candidates}")
            
            # Critères: valeur entre 500 et 5000 (plage typique pour sauts corde à sauter)
            # Priorité 1: Chemin contient "jump", "saut", "count" (mais pas "lap", "stroke", "step")
            for path, value in all_numbers:
                if 500 <= value <= 5000:  # Plage pour sauts typiques
                    path_lower = path.lower()
                    # Si le chemin contient jump/saut directement
                    if 'jump' in path_lower or 'saut' in path_lower:
                        connect_iq['jumps'] = safe_int(value, 0)
                        jumps = safe_int(value, 0)
                        print_debug(f"✅ Found jumps in field '{path}': {jumps} (direct match)")
                        break
                    # Si le chemin contient "count" mais pas dans un contexte qui exclut les sauts
                    elif 'count' in path_lower:
                        # Exclure seulement les champs connus qui ne sont PAS des sauts
                        if 'lap' not in path_lower and 'stroke' not in path_lower and \
                           'step' not in path_lower and 'repetition' not in path_lower and \
                           'series' not in path_lower and 'set' not in path_lower:
                            connect_iq['jumps'] = safe_int(value, 0)
                            jumps = safe_int(value, 0)
                            print_debug(f"✅ Found jumps in field '{path}': {jumps} (count match)")
                            break
            
            # Si toujours pas trouvé, chercher par exclusion (valeur entre 500-5000 qui n'est pas dans un champ connu)
            if jumps == 0:
                print_debug(f"Trying exclusion method: searching for values 500-5000 not in known fields...")
                for path, value in all_numbers:
                    if 500 <= value <= 5000:  # Plage pour sauts typiques (1034 est dans cette plage)
                        path_lower = path.lower()
                        # Exclure les champs connus qui ne sont PAS des sauts
                        excluded_keywords = [
                            'lap', 'stroke', 'step', 'distance', 'duration', 'time',
                            'calorie', 'hr', 'heart', 'speed', 'pace', 'rate',
                            'repetition', 'series', 'set', 'workout', 'exercise',
                            'id', 'pk', 'timestamp', 'zone', 'minute', 'second',
                            'elevation', 'power', 'temperature', 'pressure'
                        ]
                        is_excluded = any(excl in path_lower for excl in excluded_keywords)
                        if not is_excluded:
                            # Probablement des sauts - cette valeur n'est dans aucun champ connu
                            connect_iq['jumps'] = safe_int(value, 0)
                            jumps = safe_int(value, 0)
                            print_debug(f"✅ Found likely jumps in field '{path}': {jumps} (by exclusion - value {value} not in excluded fields)")
                            break
        
        # Log pour debug si on trouve des données Connect IQ ou si on ne les trouve pas
        if connect_iq:
            print_debug(f"Connect IQ data found for activity {act_id}: {connect_iq}")
        else:
            # Si pas de données Connect IQ, logger les clés disponibles pour debug
            all_keys = []
            if isinstance(summary_dto_conn, dict):
                all_keys.extend(summary_dto_conn.keys())
            if isinstance(detail_dto_conn, dict):
                all_keys.extend(detail_dto_conn.keys())
            if measurements:
                for m in measurements[:3]:  # Limiter à 3 pour ne pas polluer
                    if isinstance(m, dict):
                        all_keys.extend(m.keys())
            print_debug(f"No Connect IQ data for activity {act_id}. Available keys (sample): {list(set(all_keys))[:20]}")
    
    # IMPORTANT: Déterminer les jumps finaux (priorité ABSOLUE à connectIQ depuis connectIQMeasurements)
    # CORRECTION CRITIQUE : Prioriser connect_iq['jumps'] depuis connectIQMeasurements
    final_jumps = 0
    if 'jumps' in connect_iq and connect_iq['jumps'] > 0:
        # PRIORITÉ 1 : connect_iq['jumps'] depuis connectIQMeasurements[fieldNumber=2]
        final_jumps = connect_iq['jumps']
        print_debug(f"✅✅✅ Using connect_iq['jumps'] from connectIQMeasurements: {final_jumps}")
    elif jumps > 0:
        # PRIORITÉ 2 : jumps depuis autres sources
        final_jumps = jumps
        print_debug(f"Using jumps from other sources: {final_jumps}")
    else:
        print_debug(f"❌ NO JUMPS FOUND: connect_iq['jumps']={connect_iq.get('jumps')}, jumps={jumps}")
    
    # VALIDATION : Vérifier que les sauts sont cohérents avec la durée
    if final_jumps > 0 and duration > 0:
        calculated_speed_check = (final_jumps / (duration / 60.0))  # sauts/min
        if calculated_speed_check < 5 or calculated_speed_check > 500:
            print_debug(f"⚠️  WARNING: Calculated speed from jumps/duration seems unreasonable: {calculated_speed_check} sauts/min (jumps={final_jumps}, duration={duration}s)")
    
    # CORRECTION CRITIQUE : Prioriser vitesse depuis connectIQMeasurements[fieldNumber=3]
    # PRIORITÉ 1 : speed_from_measurements (source principale, PROTÉGÉE)
    # PRIORITÉ 2 : connect_iq['speed'] (peut avoir été écrasée)
    # PRIORITÉ 3 : vitesse calculée depuis jumps/duration
    speed = 0
    if speed_from_measurements is not None:
        # PRIORITÉ ABSOLUE : vitesse depuis connectIQMeasurements
        speed = speed_from_measurements
        connect_iq['speed'] = speed_from_measurements  # S'assurer qu'elle est bien dans connect_iq
        print_debug(f"✅✅✅ Using PROTECTED speed from connectIQMeasurements[fieldNumber=3]: {speed} sauts/min")
    else:
        # Fallback : utiliser connect_iq['speed'] si disponible
        speed = connect_iq.get('speed', 0)
        if speed > 0:
            print_debug(f"✅ Using connect_iq['speed'] from other sources: {speed} sauts/min")
    
    # Si vitesse < 1 sauts/min, c'est ABSOLUMENT incorrect (devrait être ~50-150 sauts/min)
    # Si vitesse non trouvée ou incorrecte, recalculer depuis sauts/durée
    if final_jumps > 0 and duration > 0:
        calculated_speed = round((final_jumps / (duration / 60.0)), 2)  # sauts/min
        # Utiliser la vitesse calculée si vitesse non trouvée, absurde (< 1), ou si calculée est plus raisonnable
        if speed == 0 or speed < 1:
            # Si speed_from_measurements existe mais est < 1, c'est suspect, utiliser calculée
            if speed_from_measurements is not None and speed_from_measurements < 1:
                print_debug(f"⚠️  PROTECTED speed {speed_from_measurements} is suspicious (< 1), using calculated instead")
            connect_iq['speed'] = calculated_speed
            speed = calculated_speed
            print_debug(f"✅ Calculated speed (no valid found): {calculated_speed} sauts/min from {final_jumps} jumps / {duration}s")
        elif speed_from_measurements is None and calculated_speed > speed and calculated_speed > 1:
            # Si vitesse calculée est plus élevée et raisonnable, l'utiliser (probablement plus précise)
            # MAIS seulement si speed_from_measurements n'existe pas (on ne veut pas écraser une vitesse protégée)
            connect_iq['speed'] = calculated_speed
            speed = calculated_speed
            print_debug(f"✅ Using calculated speed (more accurate): {calculated_speed} sauts/min instead of {connect_iq.get('speed', 0)}")
        elif speed_from_measurements is not None:
            print_debug(f"✅ Using PROTECTED speed from connectIQMeasurements: {speed} sauts/min (calculated would be {calculated_speed})")
        else:
            print_debug(f"Using found speed: {speed} sauts/min (calculated would be {calculated_speed})")
    
    # Log détaillé pour debug
    if final_jumps > 0 or connect_iq:
        print_debug(f"Jump rope activity {act_id} - jumps: {final_jumps}, connectIQ: {connect_iq}")
    else:
        print_debug(f"Jump rope activity {act_id} - NO JUMPS FOUND. Checking act_details keys...")
        # Logger les clés disponibles pour debug
        if isinstance(act_details, dict):
            all_keys = list(act_details.keys())[:30]
            print_debug(f"Available keys in act_details: {all_keys}")
    
    # CORRECTION : Ajouter distance pour corde à sauter (en mètres, convertir en km si > 1000m)
    # Distance depuis summaryDTO (dans les logs : distance = 34.07 mètres)
    jump_distance_m = safe_float(
        (summary_dto.get('distance') if isinstance(summary_dto, dict) else None) or
        (summary_dto.get('distanceMeters') if isinstance(summary_dto, dict) else None) or
        act.get('distance') or
        act.get('distanceMeters'),
        0
    )
    # Convertir en km si > 1000m, sinon garder en mètres
    jump_distance = None
    if jump_distance_m > 1000:
        jump_distance = round(jump_distance_m / 1000, 3)  # km
    elif jump_distance_m > 0:
        jump_distance = round(jump_distance_m / 1000, 3)  # Toujours convertir en km pour cohérence
    
    # VALIDATION FINALE : Vérifier que maxContinuousJumps <= jumps si tous deux existent
    if 'maxContinuousJumps' in connect_iq and 'jumps' in connect_iq:
        if connect_iq['maxContinuousJumps'] > connect_iq['jumps']:
            print_debug(f"⚠️  WARNING: maxContinuousJumps ({connect_iq['maxContinuousJumps']}) > jumps ({connect_iq['jumps']}), adjusting")
            connect_iq['maxContinuousJumps'] = min(connect_iq['maxContinuousJumps'], connect_iq['jumps'])
    
    # Mettre à jour entry_base avec toutes les métriques corde à sauter
    entry_base.update({
        "jumps": final_jumps if final_jumps > 0 else None,
        "distance": jump_distance,  # CORRECTION : Ajouter distance
        "connectIQ": connect_iq if connect_iq else None
    })
    
    # Log final pour vérification
    if final_jumps > 0:
        print_debug(f"✅ Final jump rope activity {act_id} - jumps: {final_jumps}, connectIQ keys: {list(connect_iq.keys())}")
    else:
        print_debug(f"❌ Final jump rope activity {act_id} - NO JUMPS FOUND after all searches")
    
    # Toujours retourner un tuple (entry_base, connect_iq) pour le pipeline en amont
    # Utiliser un dict vide plutôt que None pour simplifier l'exploitation côté appelant
    return entry_base, (connect_iq if connect_iq else {})

def extract_activity_heart_rate_time_series(act_details: Optional[Dict[str, Any]], act_summary: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Extrait la time series de fréquence cardiaque depuis les détails d'activité.
    
    Args:
        act_details: Détails complets de l'activité (depuis get_activity)
        act_summary: Résumé de l'activité (depuis get_activities_by_date)
        
    Returns:
        List[Dict]: Time series formatée [{timestamp, bpm}], liste vide si pas de données
    """
    time_series = []
    
    if not act_details or not isinstance(act_details, dict):
        return time_series
    
    # Chercher dans plusieurs structures possibles
    hr_dto = (
        act_details.get('heartRateDTO') or
        act_details.get('heartRate') or
        act_details.get('hr') or
        {}
    )
    
    if not isinstance(hr_dto, dict):
        hr_dto = {}
    
    # Extraire les valeurs depuis plusieurs champs possibles
    hr_values = (
        hr_dto.get('heartRateValues') or
        hr_dto.get('values') or
        hr_dto.get('data') or
        hr_dto.get('timeSeries') or
        []
    )
    
    # Si pas dans hr_dto, chercher directement dans act_details
    if not hr_values or len(hr_values) == 0:
        hr_values = (
            act_details.get('heartRateValues') or
            act_details.get('hrValues') or
            act_details.get('heartRateTimeSeries') or
            []
        )
    
    if not hr_values or not isinstance(hr_values, list):
        return time_series
    
    # Convertir au format standard [{timestamp, bpm}]
    for point in hr_values:
        try:
            # Format 1: [timestamp, bpm] (array)
            if isinstance(point, list) and len(point) >= 2:
                timestamp_raw = point[0]
                bpm_raw = point[1]
                
                if bpm_raw is not None and safe_int(bpm_raw, 0) > 0:
                    timestamp = normalize_datetime_to_utc(timestamp_raw)
                    bpm = safe_int(bpm_raw, 0)
                    
                    if timestamp and bpm > 0:
                        time_series.append({
                            "timestamp": timestamp,
                            "bpm": bpm
                        })
            
            # Format 2: {timestamp, bpm} ou {time, value} ou {timestamp, heartRate} (dict)
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
                
                if bpm is not None and timestamp_raw:
                    bpm_val = safe_int(bpm, 0)
                    if bpm_val > 0:
                        timestamp = normalize_datetime_to_utc(timestamp_raw)
                        if timestamp:
                            time_series.append({
                                "timestamp": timestamp,
                                "bpm": bpm_val
                            })
        except Exception as e:
            print_debug(f"⚠️ Error parsing HR time series point: {e}")
            continue
    
    if len(time_series) > 0:
        # Trier par timestamp
        time_series.sort(key=lambda x: x.get('timestamp', ''))
        print_debug(f"✅ Extracted {len(time_series)} HR time series points from activity")
    
    return time_series
