#!/usr/bin/env python3
"""
Script de collecte Garmin (MVP → réel).
- Lit .env local (GARMIN_EMAIL, GARMIN_PASSWORD)
- Essaie d'utiliser python-garminconnect
- En cas d'absence d'identifiants/module/erreur: fallback mock
- Sort toujours un JSON sur stdout avec la forme { ok, lastSync, data }
"""
import json
import os
from datetime import datetime, date, timedelta
import sys

# Chargement .env (optionnel)
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

EMAIL = os.getenv("GARMIN_EMAIL")
PASSWORD = os.getenv("GARMIN_PASSWORD")

now_iso = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
current_date = date.today().strftime('%Y-%m-%d')

def daterange(start_dt: date, end_dt: date):
    cur = start_dt
    while cur <= end_dt:
        yield cur
        cur += timedelta(days=1)


def build_mock_payload():
    d = current_date
    return {
        "activities": {
            "swimming": [
                {
                    "id": int(datetime.utcnow().timestamp()),
                    "date": d,
                    "time": "14:30",
                    "distance": 1.5,
                    "duration": 3600,
                    "laps": 60,
                    "avgHR": 145,
                    "maxHR": 172,
                    "calories": 450,
                    "avgPace": 100,
                    "source": "garmin"
                }
            ],
            "jumpRope": [
                {
                    "id": int(datetime.utcnow().timestamp()) - 1000,
                    "date": d,
                    "time": "09:00",
                    "duration": 1200,
                    "jumps": 1200,
                    "avgHR": 132,
                    "maxHR": 158,
                    "calories": 180,
                    "source": "garmin"
                }
            ]
        },
        "dailyMetrics": {
            d: {
                "steps": 8543,
                "distance": 6.2,
                "floors": 12,
                "calories": {"total": 2340, "active": 540, "resting": 1800},
                "heartRate": {
                    "resting": 58,
                    "max": 172,
                    "avg": 78,
                    "timeSeries": [
                        {"timestamp": f"{d}T00:00:00Z", "bpm": 55},
                        {"timestamp": f"{d}T00:05:00Z", "bpm": 54}
                    ]
                },
                "sleep": {"duration": 7.5, "quality": 82},
                "stress": {"average": 32, "max": 65, "restTime": 120},
                "bodyBattery": {"current": 67, "max": 95, "min": 12},
                "respiration": {"average": 14, "max": 22, "min": 11},
                "spo2": {"average": 97, "min": 94}
            }
        }
    }


def print_json_ok(payload):
    print(json.dumps({"ok": True, "lastSync": now_iso, "data": payload}))


def print_json_err(message):
    print(json.dumps({"ok": False, "lastSync": now_iso, "error": message}))


# Tentative d'intégration réelle
args = sys.argv[1:]
arg_start = None
arg_end = None
try:
    if '--start' in args:
        arg_start = args[args.index('--start') + 1]
    if '--end' in args:
        arg_end = args[args.index('--end') + 1]
except Exception:
    arg_start = None
    arg_end = None

if EMAIL and PASSWORD:
    try:
        from garminconnect import Garmin  # type: ignore
        client = Garmin(EMAIL, PASSWORD)
        client.login()
        # Détermine la plage
        start_for = current_date
        end_for = current_date
        if arg_start and arg_end:
            start_for = arg_start
            end_for = arg_end

        swim_list = []
        jump_list = []
        cardio_list = []
        daily_dict = {}

        def safe_int(value, default=0):
            try:
                return int(value) if value is not None else default
            except (ValueError, TypeError):
                return default
        
        def safe_float(value, default=0.0):
            try:
                return float(value) if value is not None else default
            except (ValueError, TypeError):
                return default

        # Boucle jour par jour - TOUTES les dates même vides
        start_dt = datetime.strptime(start_for, '%Y-%m-%d').date()
        end_dt = datetime.strptime(end_for, '%Y-%m-%d').date()
        
        for d in daterange(start_dt, end_dt):
            d_str = d.strftime('%Y-%m-%d')
            
            # Initialiser daily pour cette date (sera rempli même si erreur)
            daily = {
                "steps": 0,
                "distance": 0,
                "floors": 0,
                "calories": {"total": 0, "active": 0, "resting": 0},
                "heartRate": {
                    "resting": 0,
                    "max": 0,
                    "avg": 0,
                    "timeSeries": []
                },
                "respiration": None,  # Sera rempli si données disponibles
                "intensityMinutes": None,  # Sera rempli si données disponibles
                # CORRECTION : Ajouter Body Battery, Stress, SpO2
                "bodyBattery": None,
                "stress": None,
                "spo2": None
            }
            
            try:
                # Activités - Récupérer liste de base puis détails complets
                import sys
                print(f"[DEBUG] Fetching activities for {d_str}...", file=sys.stderr)
                activities = client.get_activities_by_date(d_str, d_str)
                print(f"[DEBUG] get_activities_by_date returned: {type(activities)}, length: {len(activities) if isinstance(activities, (list, dict)) else 'N/A'}", file=sys.stderr)
                if activities:
                    print(f"[DEBUG] Found {len(activities) if isinstance(activities, list) else 'unknown'} activities for {d_str}", file=sys.stderr)
                    for act_summary in activities:
                        act_id = act_summary.get('activityId')
                        if not act_id:
                            continue
                        
                        # Extraire le type - chercher dans activityTypeDTO d'abord
                        act_type_dto = act_summary.get('activityTypeDTO')
                        # Vérifier que act_type_dto est bien un dict avant d'accéder à ses clés
                        if not isinstance(act_type_dto, dict):
                            act_type_dto = {}
                        
                        # Extraire typeKey et typeId (CRITIQUE pour natation)
                        act_type_key = act_type_dto.get('typeKey') or act_type_dto.get('type') or ''
                        act_type = act_type_key.lower() if act_type_key else ''
                        act_type_id = act_type_dto.get('typeId')  # Peut être None au début, sera mis à jour avec les détails
                        
                        import sys
                        if act_type_id:
                            print(f"[DEBUG] Activity {act_id} - Initial typeKey: {act_type}, typeId: {act_type_id}", file=sys.stderr)
                        act_name = (act_summary.get('activityName') or '').lower()
                        start = act_summary.get('startTimeGMT') or act_summary.get('startTimeLocal')
                        act_date = (start or d_str).split('T')[0]
                        
                        # Détecter le vrai type d'activité basé sur le nom ET le type ET l'ID
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
                            'jump' in act_name.lower() or 
                            'saut' in act_name.lower() or 
                            'jumprope' in act_name.lower() or 
                            'jumpro' in act_name.lower()
                        ))
                        # Cardio général (seulement si pas natation ni corde)
                        is_cardio = (not is_swimming and not is_jump_rope and (
                            act_type in ('cardio', 'cardio_general', 'indoor_cardio') or 
                            'cardio' in act_type or 
                            'cardio' in act_name
                        ))
                        
                        # Récupérer les détails complets de l'activité
                        act_details = None
                        try:
                            act_details = client.get_activity(act_id)
                            # Si on a les détails, mettre à jour le nom de l'activité si disponible
                            if act_details:
                                # Mettre à jour le type depuis les détails si disponible
                                act_type_dto_detailed = act_details.get('activityTypeDTO')
                                if not isinstance(act_type_dto_detailed, dict):
                                    act_type_dto_detailed = {}
                                
                                # Extraire typeKey et typeId depuis les détails
                                act_type_key_detailed = act_type_dto_detailed.get('typeKey') or act_type_dto_detailed.get('type') or ''
                                act_type_detailed = act_type_key_detailed.lower() if act_type_key_detailed else ''
                                act_type_id_detailed = act_type_dto_detailed.get('typeId')  # Ne pas utiliser .get('type') comme fallback car typeId est un int
                                
                                # Mettre à jour act_type et act_type_id avec les détails
                                if act_type_detailed:
                                    act_type = act_type_detailed
                                if act_type_id_detailed is not None:  # Vérifier explicitement None car 0 est valide
                                    act_type_id = act_type_id_detailed
                                    import sys
                                    print(f"[DEBUG] Activity {act_id} - Updated typeId from details: {act_type_id}, typeKey: {act_type}", file=sys.stderr)
                                
                                if act_details.get('activityName'):
                                    act_name = act_details.get('activityName', '').lower()
                                
                                # Re-détecter avec le nom et type complets (TOUJOURS vérifier même si déjà détecté)
                                # Natation a priorité absolue si typeId/typeKey correspond
                                # Vérifier typeId D'ABORD (le plus fiable)
                                if act_type_id_detailed in (26, 27):
                                    is_swimming = True
                                    is_jump_rope = False
                                    is_cardio = False
                                    import sys
                                    print(f"[DEBUG] Activity {act_id} FORCED to swimming based on typeId {act_type_id_detailed}", file=sys.stderr)
                                elif (act_type_detailed in ('swimming', 'lap_swimming', 'pool_swimming', 'open_water', 'swim') or
                                    'swim' in act_type_detailed or
                                    'swim' in act_name or 'natation' in act_name or 'pool' in act_name):
                                    is_swimming = True
                                    is_jump_rope = False
                                    is_cardio = False
                                    import sys
                                    print(f"[DEBUG] Activity {act_id} FORCED to swimming based on type/name", file=sys.stderr)
                                elif ('jump' in act_name or 'saut' in act_name or 'jumprope' in act_name or 'jumpro' in act_name):
                                    is_jump_rope = True
                                    is_swimming = False
                                    is_cardio = False
                            # DEBUG: Logger la structure complète pour identifier les vrais champs
                            if act_details:
                                import sys
                                # Re-vérifier la détection après mise à jour des détails
                                if act_type_id_detailed in (26, 27):
                                    is_swimming = True
                                    is_jump_rope = False
                                    is_cardio = False
                                elif act_type_detailed in ('swimming', 'lap_swimming', 'pool_swimming', 'open_water', 'swim'):
                                    is_swimming = True
                                    is_jump_rope = False
                                    is_cardio = False
                                
                                # CORRECTION : Dumper act_details COMPLET pour activités corde à sauter (sans troncature pour debug)
                                act_details_str = json.dumps(act_details, indent=2, default=str)
                                if is_jump_rope:
                                    # Pour corde à sauter, dumper COMPLET sans troncature
                                    print(f"[DEBUG] Activity {act_id} (JUMP ROPE - FULL DUMP) - Full structure:", act_details_str, file=sys.stderr)
                                else:
                                    # Pour autres activités, limiter à 2000 caractères pour éviter trop de logs
                                    print(f"[DEBUG] Activity {act_id} (type:{act_type}, typeId:{act_type_id}, name:{act_name}, detected:swim={is_swimming}, jump={is_jump_rope}, cardio={is_cardio}) - Full structure:", act_details_str[:2000], file=sys.stderr)
                        except Exception as e:
                            # Si get_activity() échoue, utiliser les données de base
                            import sys
                            print(f"[DEBUG] Failed to get_activity({act_id}): {e}", file=sys.stderr)
                            pass
                        
                        # Utiliser détails si disponibles, sinon summary
                        act = act_details if act_details else act_summary
                        
                        duration = safe_int(act.get('duration') or act.get('elapsedDuration') or act_summary.get('duration'), 0)
                        
                        # Calories - Chercher dans plusieurs structures possibles
                        calories_total = safe_int(
                            act.get('calories') or act.get('totalCalories') or act.get('caloriesBurned') or act_summary.get('calories') or (act.get('summaryDTO', {}).get('calories') if isinstance(act.get('summaryDTO'), dict) else None),
                            0
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
                                0
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
                                0
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
                        
                        avg_hr = safe_int(
                            act.get('averageHR') or act.get('averageHeartRate') or (summary_dto.get('averageHR') if isinstance(summary_dto, dict) else None) or act_summary.get('averageHR'),
                            0
                        )
                        max_hr = safe_int(
                            act.get('maxHR') or act.get('maxHeartRate') or (summary_dto.get('maxHR') if isinstance(summary_dto, dict) else None) or act_summary.get('maxHR'),
                            0
                        )
                        # CORRECTION : Ajouter minHR (FC minimum) pour toutes activités
                        min_hr = safe_int(
                            (summary_dto.get('minHR') if isinstance(summary_dto, dict) else None) or
                            (summary_dto.get('minHeartRate') if isinstance(summary_dto, dict) else None) or
                            act.get('minHR') or
                            act.get('minHeartRate') or
                            act_summary.get('minHR'),
                            0
                        )
                        # Distance - Chercher dans plusieurs structures et champs
                        distance_m = (
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
                        if not distance_m:
                            if isinstance(act_details, dict):
                                distance_m = (
                                    act_details.get('distance') or
                                    act_details.get('distanceMeters') or
                                    act_details.get('totalDistance') or
                                    act_details.get('totalDistanceMeters') or
                                    0
                                )
                        
                        # Transpiration - CORRECTION CRITIQUE : Parser waterEstimated (champ principal Garmin pour transpiration)
                        # Chercher dans summaryDTO, act, act_details, activityDetailDTO, measurements, laps, etc.
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
                                import sys
                                print(f"[DEBUG] ✅ Found sweatLoss recursively in act_details: {sweat_loss} ml", file=sys.stderr)
                            
                            # Log final pour debug
                            if sweat_loss > 0:
                                import sys
                                print(f"[DEBUG] ✅ Final sweatLoss for activity {act_id}: {sweat_loss} ml", file=sys.stderr)
                            else:
                                import sys
                                print(f"[DEBUG] ❌ No sweatLoss found for activity {act_id} (checked waterEstimated, sweatLoss, recursive search)", file=sys.stderr)
                        
                        # Intensité minutes - Chercher dans activitySummaryDTO et autres structures - EXHAUSTIF
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
                        
                        # CORRECTION CRITIQUE : Calculer calories actives si null/0 en dernier recours
                        # Si calories_active == 0 mais que calories_total > 0 et calories_resting > 0,
                        # calculer : active = total - resting
                        if calories_active == 0 and calories_total > 0 and calories_resting > 0:
                            calories_active = calories_total - calories_resting
                            import sys
                            print(f"[DEBUG] Calculated calories_active = {calories_total} - {calories_resting} = {calories_active} for activity {act_id}", file=sys.stderr)
                        
                        # CORRECTION : Extraire timestamps, localisation, élévation depuis summaryDTO
                        start_time_local = (summary_dto.get('startTimeLocal') if isinstance(summary_dto, dict) else None) or act.get('startTimeLocal') or act_summary.get('startTimeLocal')
                        start_time_gmt = (summary_dto.get('startTimeGMT') if isinstance(summary_dto, dict) else None) or act.get('startTimeGMT') or act_summary.get('startTimeGMT')
                        
                        # Localisation (latitude/longitude départ et arrivée)
                        start_lat = (summary_dto.get('startLatitude') if isinstance(summary_dto, dict) else None) or act.get('startLatitude')
                        start_lng = (summary_dto.get('startLongitude') if isinstance(summary_dto, dict) else None) or act.get('startLongitude')
                        end_lat = (summary_dto.get('endLatitude') if isinstance(summary_dto, dict) else None) or act.get('endLatitude')
                        end_lng = (summary_dto.get('endLongitude') if isinstance(summary_dto, dict) else None) or act.get('endLongitude')
                        
                        # Élévation
                        elevation_gain = safe_int((summary_dto.get('elevationGain') if isinstance(summary_dto, dict) else None) or act.get('elevationGain'), 0)
                        elevation_loss = safe_int((summary_dto.get('elevationLoss') if isinstance(summary_dto, dict) else None) or act.get('elevationLoss'), 0)
                        max_elevation = safe_float((summary_dto.get('maxElevation') if isinstance(summary_dto, dict) else None) or act.get('maxElevation'), None)
                        min_elevation = safe_float((summary_dto.get('minElevation') if isinstance(summary_dto, dict) else None) or act.get('minElevation'), None)
                        
                        # Device info depuis metadataDTO
                        device_info = {}
                        metadata = act.get('metadataDTO') or act_details.get('metadataDTO') if isinstance(act_details, dict) else {}
                        if isinstance(metadata, dict):
                            device_meta = metadata.get('deviceMetaDataDTO', {})
                            if isinstance(device_meta, dict):
                                device_info = {
                                    "deviceId": device_meta.get('deviceId'),
                                    "deviceTypePk": device_meta.get('deviceTypePk'),
                                    "deviceVersionPk": device_meta.get('deviceVersionPk')
                                }
                        
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
                            "minHR": min_hr if min_hr > 0 else None,  # CORRECTION : Ajouter minHR
                            "sweatLoss": sweat_loss if sweat_loss > 0 else None,
                            "intensityMinutes": {
                                "moderate": intensity_moderate if intensity_moderate > 0 else None,
                                "vigorous": intensity_vigorous if intensity_vigorous > 0 else None,
                                "total": intensity_total if intensity_total > 0 else None
                            },
                            # CORRECTION : Ajouter timestamps, localisation, élévation, deviceInfo
                            "startTimeLocal": start_time_local.split('T')[1][:8] if start_time_local and 'T' in str(start_time_local) else None,
                            "startTimeGMT": start_time_gmt.split('T')[1][:8] if start_time_gmt and 'T' in str(start_time_gmt) else None,
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
                            "source": "garmin"
                        }
                        
                        if is_swimming:
                            import sys
                            print(f"[DEBUG] Swimming activity detected: {act_id} ({act_name}), typeId: {act_type_id}, typeKey: {act_type}", file=sys.stderr)
                            
                            # Métriques natation détaillées - Chercher dans activityDetailDTO et autres structures
                            # CORRECTION CRITIQUE : Chercher D'ABORD dans summaryDTO, puis detailDTO, puis act
                            # DÉFINIR summary_dto pour natation (déjà défini ligne 300, mais s'assurer qu'il inclut act_details si disponible)
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
                            # CORRECTION : Chercher D'ABORD dans summaryDTO pour distance
                            # Distance peut être en mètres ou déjà en km
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
                            # CORRECTION CRITIQUE: Si distance > 1m, c'est probablement en mètres, convertir en km
                            # Si distance < 1m, probablement déjà en km (mais peu probable pour natation)
                            # MAIS: Si distance > 100km, c'est probablement déjà en mètres et mal interprété
                            if swim_distance_m > 100000:  # Si > 100km, erreur de conversion, probablement déjà en mètres mais mal lu
                                # Probablement en mètres mais valeur trop grande (erreur API)
                                distance_swim = round(swim_distance_m / 1000, 3)
                                import sys
                                print(f"[DEBUG] Swimming distance ERROR: {swim_distance_m} seems incorrect. Assuming meters -> {distance_swim}km for activity {act_id}", file=sys.stderr)
                            elif swim_distance_m > 1:  # Si > 1m, probablement en mètres, convertir en km
                                distance_swim = round(swim_distance_m / 1000, 3)
                                import sys
                                print(f"[DEBUG] Swimming distance converted: {swim_distance_m}m -> {distance_swim}km for activity {act_id}", file=sys.stderr)
                            elif swim_distance_m > 0:  # Si entre 0m et 1m, peut-être déjà en km (rare)
                                distance_swim = round(swim_distance_m, 3)
                                import sys
                                print(f"[DEBUG] Swimming distance already in km: {swim_distance_m}km for activity {act_id}", file=sys.stderr)
                            else:
                                distance_swim = 0
                            
                            # Laps - Chercher dans TOUS les champs possibles (metadataDTO, activityDetailDTO, etc.)
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
                            import sys
                            if laps_count == 0:
                                print(f"[DEBUG] Swimming activity {act_id} - NO LAPS FOUND. Distance: {distance_swim}km. Checking for pool length...", file=sys.stderr)
                            else:
                                print(f"[DEBUG] Swimming activity {act_id} - Found {laps_count} laps, distance: {distance_swim}km", file=sys.stderr)
                            
                            # Si pas de laps mais distance, essayer de calculer (distance / longueur piscine standard 25m ou 50m)
                            # ATTENTION: swim_distance_m est en mètres, distance_swim est en km
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
                                        import sys
                                        print(f"[DEBUG] Calculated laps for activity {act_id}: {laps_count} laps from distance {swim_distance_m}m / pool length {pool_length}m", file=sys.stderr)
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
                                        import sys
                                        print(f"[DEBUG] Calculated laps for activity {act_id}: {laps_count} laps from distance {distance_swim}km ({distance_meters}m) / pool length {pool_length}m", file=sys.stderr)
                            
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
                                    import sys
                                    print(f"[DEBUG] ✅ Found {len(laps_data)} laps in activityDetailDTO for swimming activity {act_id}", file=sys.stderr)
                                    # Logger structure première lap pour debug
                                    if len(laps_data) > 0 and isinstance(laps_data[0], dict):
                                        first_lap_keys = list(laps_data[0].keys())[:15]
                                        print(f"[DEBUG] First lap keys (sample): {first_lap_keys}", file=sys.stderr)
                            
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
                                import sys
                                print(f"[DEBUG] ✅ Calculated strokeCount from {len(stroke_count_from_laps)} laps: {stroke_count}", file=sys.stderr)
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
                                import sys
                                print(f"[DEBUG] ✅ Calculated avgStrokeRate from {len(stroke_rate_from_laps)} laps: {avg_stroke_rate}", file=sys.stderr)
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
                                import sys
                                print(f"[DEBUG] ✅ Calculated avgSwolf from {len(swolf_from_laps)} laps: {avg_swolf}", file=sys.stderr)
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
                                import sys
                                print(f"[DEBUG] ✅ Calculated avgPace from {len(pace_from_laps)} laps: {avg_pace} seconds", file=sys.stderr)
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
                                import sys
                                print(f"[DEBUG] ✅ Calculated bestPace from {len(pace_from_laps)} laps: {best_pace} seconds", file=sys.stderr)
                            
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
                                    import sys
                                    print(f"[DEBUG] ✅ Calculated avgSpeed from {len(speed_from_laps)} laps: {avg_speed} km/h", file=sys.stderr)
                            else:
                                # Fallback : Chercher dans summaryDTO (averageSpeed, maxSpeed)
                                # Les logs montrent summaryDTO a averageSpeed, averageMovingSpeed, maxSpeed
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
                            # CORRECTION CRITIQUE : summaryDTO a elapsedDuration et movingDuration (confirmé dans les logs)
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
                                    "maxSpeed": round(max_speed, 2) if max_speed > 0 else None
                                },
                                "timeMetrics": {
                                    "totalTime": total_time,
                                    "activeTime": active_time if active_time != total_time else None,
                                    "elapsedTime": elapsed_time if elapsed_time != total_time else total_time
                                }
                            })
                            swim_list.append(entry_base)
                            import sys
                            print(f"[DEBUG] Added swimming activity {act_id} to swim_list. Total swimming: {len(swim_list)}", file=sys.stderr)
                        elif is_jump_rope:
                            # Métriques corde à sauter
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
                            # Les données sont dans act_details.connectIQMeasurements ou act.connectIQMeasurements
                            # PROTÉGER ces valeurs pour qu'elles ne soient PAS écrasées par des valeurs suspectes
                            speed_from_measurements = None  # Pour protéger la vitesse depuis connectIQMeasurements
                            
                            connect_iq_measurements = (
                                (act_details.get('connectIQMeasurements', []) if isinstance(act_details, dict) else []) or
                                (act.get('connectIQMeasurements', []) if isinstance(act, dict) else []) or
                                []
                            )
                            
                            if connect_iq_measurements and len(connect_iq_measurements) > 0:
                                import sys
                                print(f"[DEBUG] ✅ Found {len(connect_iq_measurements)} connectIQMeasurements for activity {act_id}", file=sys.stderr)
                                
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
                                                import sys
                                                print(f"[DEBUG] ✅ Found duration in connectIQMeasurements[fieldNumber=1]: {value}", file=sys.stderr)
                                            elif isinstance(value, (int, float)) and value > 0:
                                                mins = int(value // 60)
                                                secs = int(value % 60)
                                                connect_iq['duration'] = f"{str(mins).zfill(2)}:{str(secs).zfill(2)}"
                                                import sys
                                                print(f"[DEBUG] ✅ Found duration in connectIQMeasurements[fieldNumber=1]: {value}s = {connect_iq['duration']}", file=sys.stderr)
                                        elif field_num == 2:
                                            # SAUTS ! (valeur la plus importante)
                                            val = safe_float(value, 0)
                                            if val > 0:
                                                jumps_val = safe_int(val, 0)
                                                # VALIDATION : Vérifier que les sauts sont raisonnables (10-10000)
                                                if 10 <= jumps_val <= 10000:
                                                    connect_iq['jumps'] = jumps_val
                                                    jumps = jumps_val
                                                    import sys
                                                    print(f"[DEBUG] ✅✅✅ FOUND JUMPS in connectIQMeasurements[fieldNumber=2]: {jumps}", file=sys.stderr)
                                                else:
                                                    import sys
                                                    print(f"[DEBUG] ⚠️  JUMPS out of range (10-10000): {jumps_val}, accepting anyway", file=sys.stderr)
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
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found speed in connectIQMeasurements[fieldNumber=3]: {connect_iq['speed']} jumps/min (PROTECTED)", file=sys.stderr)
                                                else:
                                                    import sys
                                                    print(f"[DEBUG] ⚠️  SPEED out of range (10-300): {speed_val}, accepting anyway", file=sys.stderr)
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
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found interruptions in connectIQMeasurements[fieldNumber=4]: {connect_iq['interruptions']}", file=sys.stderr)
                                                else:
                                                    import sys
                                                    print(f"[DEBUG] ⚠️  INTERRUPTIONS out of range (0-1000): {interruptions_val}, accepting anyway", file=sys.stderr)
                                                    connect_iq['interruptions'] = interruptions_val
                                        elif field_num == 8:
                                            # Max continuous jumps
                                            val = safe_float(value, 0)
                                            if val > 0:
                                                max_cont_val = safe_int(val, 0)
                                                # VALIDATION : Max continu doit être > 0 et < jumps si jumps existe
                                                if max_cont_val > 0 and max_cont_val <= 10000:
                                                    connect_iq['maxContinuousJumps'] = max_cont_val
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found maxContinuousJumps in connectIQMeasurements[fieldNumber=8]: {connect_iq['maxContinuousJumps']}", file=sys.stderr)
                                                else:
                                                    import sys
                                                    print(f"[DEBUG] ⚠️  MAX_CONTINUOUS_JUMPS out of range: {max_cont_val}, accepting anyway", file=sys.stderr)
                                                    connect_iq['maxContinuousJumps'] = max_cont_val
                            else:
                                import sys
                                print(f"[DEBUG] No connectIQMeasurements found for activity {act_id}", file=sys.stderr)
                            
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
                                                import sys
                                                print(f"[DEBUG] ⚠️  Ignoring speed from connect_iq_data['{key}']={value} (already have {speed_from_measurements} from connectIQMeasurements)", file=sys.stderr)
                                            elif isinstance(value, (int, float)) and value > 0:
                                                connect_iq['speed'] = safe_float(value, 0)
                                        elif 'interruption' in key_lower or 'stop' in key_lower:
                                            val = safe_int(value, 0)
                                            if val >= 0:
                                                connect_iq['interruptions'] = val
                                
                                # 2. Chercher dans les structures DTO standard
                                # Chercher dans activityDetailDTO, measurements, ou champs custom
                                detail_dto_conn = act_details.get('activityDetailDTO', {}) or act_details.get('detailDTO', {}) or {}
                                measurements = detail_dto_conn.get('measurements', []) or act_details.get('measurements', []) or []
                                
                                # DEBUG: Logger les measurements trouvés
                                import sys
                                if measurements:
                                    print(f"[DEBUG] Found {len(measurements)} measurements for activity {act_id}. Sample (first 5): {measurements[:5]}", file=sys.stderr)
                                
                                # Chercher aussi dans activitySummaryDTO (TOUS les champs) - CRITIQUE pour Connect IQ
                                summary_dto_conn = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {}) or act.get('activitySummaryDTO', {}) or act.get('summaryDTO', {}) or {}
                                if summary_dto_conn:
                                    import sys
                                    print(f"[DEBUG] summaryDTO keys for activity {act_id}: {list(summary_dto_conn.keys())[:20]}", file=sys.stderr)
                                    
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
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found maxContinuousJumps in summaryDTO['{key}']: {val}", file=sys.stderr)
                                            else:
                                                val = safe_int(value, 0)
                                                if val > 0:
                                                    connect_iq['jumps'] = val
                                                    jumps = val  # Mettre à jour jumps immédiatement
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found jumps in summaryDTO['{key}']: {val}", file=sys.stderr)
                                        # Vitesse - Vérifier l'unité (peut être en m/s ou sauts/min)
                                        elif 'speed' in key_lower or 'vitesse' in key_lower or 'jumpspermin' in key_lower or 'rate' in key_lower:
                                            # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements si déjà défini
                                            if speed_from_measurements is not None:
                                                import sys
                                                print(f"[DEBUG] ⚠️  Ignoring speed from summaryDTO['{key}']={value} (already have {speed_from_measurements} from connectIQMeasurements)", file=sys.stderr)
                                            else:
                                                val = safe_float(value, 0)
                                                # Si vitesse < 1, peut-être en m/s, convertir en sauts/min
                                                # Si vitesse > 1 et < 200, probablement déjà en sauts/min
                                                if val > 0:
                                                    if val < 1 and val > 0:  # Probablement en m/s ou fraction, chercher la vraie vitesse ailleurs
                                                        # Ne pas l'utiliser directement, mais noter
                                                        import sys
                                                        print(f"[DEBUG] Found suspicious speed value in summaryDTO['{key}']: {val} (too low, may be wrong unit)", file=sys.stderr)
                                                    else:
                                                        connect_iq['speed'] = val
                                                        import sys
                                                        print(f"[DEBUG] ✅ Found speed in summaryDTO['{key}']: {val}", file=sys.stderr)
                                        # Interruptions
                                        elif 'interruption' in key_lower or 'stop' in key_lower or 'pause' in key_lower:
                                            val = safe_int(value, 0)
                                            if val >= 0:  # Accepter 0 aussi
                                                connect_iq['interruptions'] = val
                                                import sys
                                                print(f"[DEBUG] ✅ Found interruptions in summaryDTO['{key}']: {val}", file=sys.stderr)
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
                                    
                                    # Chercher aussi dans les valeurs numériques directes (peut-être que les sauts sont juste une valeur sans nom de champ spécifique)
                                    numeric_values_in_summary = [(k, v) for k, v in summary_dto_conn.items() if isinstance(v, (int, float)) and 500 <= v <= 5000]
                                    if numeric_values_in_summary:
                                        import sys
                                        print(f"[DEBUG] Found numeric values 500-5000 in summaryDTO: {numeric_values_in_summary}", file=sys.stderr)
                                        # Si on n'a pas encore trouvé les sauts et qu'il y a une valeur dans cette plage
                                        if jumps == 0:
                                            for k, v in numeric_values_in_summary:
                                                k_lower = str(k).lower()
                                                # Exclure les champs connus
                                                if not any(excl in k_lower for excl in ['lap', 'stroke', 'step', 'distance', 'duration', 'time', 'calorie', 'hr', 'heart', 'id', 'pk']):
                                                    connect_iq['jumps'] = safe_int(v, 0)
                                                    jumps = safe_int(v, 0)
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found jumps in summaryDTO['{k}'] (by value range): {jumps}", file=sys.stderr)
                                                    break
                                
                                # Chercher aussi dans les champs top-level de act_details (CRITIQUE pour Connect IQ)
                                for key, value in act_details.items():
                                    if value is None:
                                        continue
                                    key_lower = str(key).lower()
                                    # Si c'est un nombre (int/float), chercher jumps/sauts
                                    if isinstance(value, (int, float)) and value > 0:
                                        if ('jump' in key_lower or 'saut' in key_lower) and ('max' in key_lower or 'continuous' in key_lower):
                                            connect_iq['maxContinuousJumps'] = safe_int(value, connect_iq.get('maxContinuousJumps', 0))
                                        elif 'jump' in key_lower or 'saut' in key_lower:
                                            val = safe_int(value, 0)
                                            if val > 0:
                                                connect_iq['jumps'] = val
                                                jumps = val  # Mettre à jour jumps
                                        elif 'jumpspermin' in key_lower or ('speed' in key_lower and 'jump' in key_lower):
                                            # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements si déjà défini
                                            if speed_from_measurements is not None:
                                                import sys
                                                print(f"[DEBUG] ⚠️  Ignoring speed from act_details['{key}']={value} (already have {speed_from_measurements} from connectIQMeasurements)", file=sys.stderr)
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
                                                        connect_iq['maxContinuousJumps'] = safe_int(sub_value, connect_iq.get('maxContinuousJumps', 0))
                                                    else:
                                                        connect_iq['jumps'] = safe_int(sub_value, 0)
                                                        jumps = safe_int(sub_value, jumps)
                                
                                # Chercher dans measurements - EXHAUSTIF
                                import sys
                                if measurements:
                                    print(f"[DEBUG] Parsing {len(measurements)} measurements for activity {act_id}...", file=sys.stderr)
                                for idx, m in enumerate(measurements):
                                    if isinstance(m, dict):
                                        # Chercher dans TOUS les champs possibles de la measurement
                                        field_name = str(m.get('field') or m.get('name') or m.get('key') or m.get('label') or m.get('metricKey') or '').lower()
                                        field_value = m.get('value') or m.get('displayValue') or m.get('metric') or m.get('metricValue') or m.get('valueWithUnit')
                                        
                                        # DEBUG: Logger les measurements pertinents
                                        if field_value and isinstance(field_value, (int, float)) and 500 <= field_value <= 5000:
                                            import sys
                                            print(f"[DEBUG] Measurement[{idx}] '{field_name}' has value {field_value} (potential jumps)", file=sys.stderr)
                                        
                                        # Jumps/Sauts - TOUTES les variantes
                                        if 'jump' in field_name or 'saut' in field_name:
                                            if 'max' in field_name or 'continuous' in field_name or 'series' in field_name or 'best' in field_name:
                                                val = safe_int(field_value, 0)
                                                if val > 0:
                                                    connect_iq['maxContinuousJumps'] = val
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found maxContinuousJumps in measurement[{idx}]['{field_name}']: {val}", file=sys.stderr)
                                            else:
                                                val = safe_int(field_value, 0)
                                                if val > 0:
                                                    connect_iq['jumps'] = val
                                                    jumps = val
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found jumps in measurement[{idx}]['{field_name}']: {val}", file=sys.stderr)
                                        # Vitesse - Vérifier l'unité
                                        elif 'speed' in field_name or 'vitesse' in field_name or 'rate' in field_name or 'jumpspermin' in field_name or 'jpm' in field_name:
                                            # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements si déjà défini
                                            if speed_from_measurements is not None:
                                                import sys
                                                print(f"[DEBUG] ⚠️  Ignoring speed from measurement[{idx}]['{field_name}']={field_value} (already have {speed_from_measurements} from connectIQMeasurements)", file=sys.stderr)
                                            else:
                                                val = safe_float(field_value, 0)
                                                if val > 0:
                                                    # Si vitesse < 1, probablement incorrecte (devrait être ~95 sauts/min)
                                                    if val < 1:
                                                        import sys
                                                        print(f"[DEBUG] Found suspicious speed in measurement[{idx}]: {val} (too low, ignoring)", file=sys.stderr)
                                                    else:
                                                        connect_iq['speed'] = val
                                                        import sys
                                                        print(f"[DEBUG] ✅ Found speed in measurement[{idx}]['{field_name}']: {val}", file=sys.stderr)
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
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found jumps in measurement[{idx}] (by type '{m_type}'): {val}", file=sys.stderr)
                                
                                # Chercher dans les laps/splits pour données Connect IQ (parfois les données sont dans les laps)
                                # CORRECTION CRITIQUE : Pour corde à sauter, parser laps[0] complètement pour trouver les sauts
                                laps_data = detail_dto_conn.get('laps', []) or act_details.get('laps', []) or act_details.get('splits', []) or []
                                
                                # Pour corde à sauter, s'il y a une lap, parser complètement
                                if is_jump_rope and len(laps_data) > 0:
                                    import sys
                                    print(f"[DEBUG] Found {len(laps_data)} lap(s) for jump rope activity {act_id}. Parsing lap[0] completely...", file=sys.stderr)
                                    first_lap = laps_data[0]
                                    if isinstance(first_lap, dict):
                                        # Dumper TOUTE la structure de la première lap
                                        lap_str = json.dumps(first_lap, indent=2, default=str)
                                        print(f"[DEBUG] Lap[0] full structure for activity {act_id}:", lap_str, file=sys.stderr)
                                        
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
                                            import sys
                                            print(f"[DEBUG] ✅ Found potential jumps in lap[0]: {jumps_in_lap}", file=sys.stderr)
                                            # Prendre le premier résultat trouvé
                                            _, jumps_value = jumps_in_lap[0]
                                            if jumps_value > 0:
                                                connect_iq['jumps'] = safe_int(jumps_value, 0)
                                                jumps = safe_int(jumps_value, 0)
                                                import sys
                                                print(f"[DEBUG] ✅ Set jumps from lap[0] to {jumps}", file=sys.stderr)
                                        
                                        # Chercher aussi interruptions, max continuous, etc. dans la lap
                                        if isinstance(first_lap, dict):
                                            for key, value in first_lap.items():
                                                key_lower = str(key).lower()
                                                if 'interruption' in key_lower or 'stop' in key_lower or 'pause' in key_lower:
                                                    if isinstance(value, (int, float)) and value >= 0:
                                                        connect_iq['interruptions'] = safe_int(value, 0)
                                                        import sys
                                                        print(f"[DEBUG] ✅ Found interruptions in lap[0]['{key}']: {value}", file=sys.stderr)
                                                elif ('max' in key_lower or 'continuous' in key_lower) and ('jump' in key_lower or 'saut' in key_lower or 'count' in key_lower):
                                                    if isinstance(value, (int, float)) and value > 0:
                                                        connect_iq['maxContinuousJumps'] = safe_int(value, 0)
                                                        import sys
                                                        print(f"[DEBUG] ✅ Found maxContinuousJumps in lap[0]['{key}']: {value}", file=sys.stderr)
                                
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
                                                    import sys
                                                    print(f"[DEBUG] ⚠️  Ignoring speed from lap['{key}']={value} (already have {speed_from_measurements} from connectIQMeasurements)", file=sys.stderr)
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
                                # Parcourir RÉCURSIVEMENT tous les champs (EXHAUSTIF)
                                def search_recursive(data, target_keys=['jump', 'saut', 'speed', 'interruption'], depth=0, max_depth=10):
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
                                
                                # Recherche récursive EXHAUSTIVE dans act_details pour trouver TOUTES les données Connect IQ
                                recursive_results = search_recursive(act_details, max_depth=15)  # Profondeur max augmentée
                                for k, v in recursive_results.items():
                                    if k == 'speed' and speed_from_measurements is not None:
                                        # CORRECTION : Ne pas écraser speed depuis connectIQMeasurements
                                        import sys
                                        print(f"[DEBUG] ⚠️  Ignoring speed from recursive search={v} (already have {speed_from_measurements} from connectIQMeasurements)", file=sys.stderr)
                                    elif v and v > 0:
                                        connect_iq[k] = v
                                        if k == 'jumps':
                                            jumps = v  # Mettre à jour jumps depuis recherche récursive
                                    elif k == 'interruptions' and v == 0:
                                        connect_iq[k] = v  # Accepter 0 pour interruptions
                                
                                # 3. Si toujours pas de jumps trouvés, chercher dans TOUS les champs numériques
                                if jumps == 0:
                                    import sys
                                    print(f"[DEBUG] Still no jumps found for activity {act_id}. Searching ALL numeric fields in act_details...", file=sys.stderr)
                                    
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
                                    import sys
                                    print(f"[DEBUG] Found {len(all_numbers)} numeric fields. Sample (first 20): {all_numbers[:20]}", file=sys.stderr)
                                    
                                    # Afficher TOUS les nombres entre 100 et 10000 pour identifier les sauts
                                    candidate_jumps = [(path, val) for path, val in all_numbers if 100 <= val <= 10000]
                                    if candidate_jumps:
                                        print(f"[DEBUG] Candidate jumps (100-10000): {candidate_jumps[:10]}", file=sys.stderr)
                                    
                                    # Chercher les sauts parmi tous les nombres
                                    # CRITIQUE: Afficher TOUS les candidats possibles pour debug
                                    all_candidates = [(path, val) for path, val in all_numbers if 500 <= val <= 5000]
                                    import sys
                                    if all_candidates:
                                        print(f"[DEBUG] All candidates (500-5000): {all_candidates}", file=sys.stderr)
                                    
                                    # Critères: valeur entre 500 et 5000 (plage typique pour sauts corde à sauter)
                                    # Priorité 1: Chemin contient "jump", "saut", "count" (mais pas "lap", "stroke", "step")
                                    for path, value in all_numbers:
                                        if 500 <= value <= 5000:  # Plage pour sauts typiques
                                            path_lower = path.lower()
                                            # Si le chemin contient jump/saut directement
                                            if 'jump' in path_lower or 'saut' in path_lower:
                                                connect_iq['jumps'] = safe_int(value, 0)
                                                jumps = safe_int(value, 0)
                                                import sys
                                                print(f"[DEBUG] ✅ Found jumps in field '{path}': {jumps} (direct match)", file=sys.stderr)
                                                break
                                            # Si le chemin contient "count" mais pas dans un contexte qui exclut les sauts
                                            elif 'count' in path_lower:
                                                # Exclure seulement les champs connus qui ne sont PAS des sauts
                                                if 'lap' not in path_lower and 'stroke' not in path_lower and \
                                                   'step' not in path_lower and 'repetition' not in path_lower and \
                                                   'series' not in path_lower and 'set' not in path_lower:
                                                    connect_iq['jumps'] = safe_int(value, 0)
                                                    jumps = safe_int(value, 0)
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found jumps in field '{path}': {jumps} (count match)", file=sys.stderr)
                                                    break
                                    
                                    # Si toujours pas trouvé, chercher par exclusion (valeur entre 500-5000 qui n'est pas dans un champ connu)
                                    if jumps == 0:
                                        import sys
                                        print(f"[DEBUG] Trying exclusion method: searching for values 500-5000 not in known fields...", file=sys.stderr)
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
                                                    import sys
                                                    print(f"[DEBUG] ✅ Found likely jumps in field '{path}': {jumps} (by exclusion - value {value} not in excluded fields)", file=sys.stderr)
                                                    break
                                
                                # Log pour debug si on trouve des données Connect IQ ou si on ne les trouve pas
                                import sys
                                if connect_iq:
                                    print(f"[DEBUG] Connect IQ data found for activity {act_id}: {connect_iq}", file=sys.stderr)
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
                                    print(f"[DEBUG] No Connect IQ data for activity {act_id}. Available keys (sample): {list(set(all_keys))[:20]}", file=sys.stderr)
                            
                            # IMPORTANT: Déterminer les jumps finaux (priorité ABSOLUE à connectIQ depuis connectIQMeasurements)
                            # CORRECTION CRITIQUE : Prioriser connect_iq['jumps'] depuis connectIQMeasurements
                            final_jumps = 0
                            if 'jumps' in connect_iq and connect_iq['jumps'] > 0:
                                # PRIORITÉ 1 : connect_iq['jumps'] depuis connectIQMeasurements[fieldNumber=2]
                                final_jumps = connect_iq['jumps']
                                import sys
                                print(f"[DEBUG] ✅✅✅ Using connect_iq['jumps'] from connectIQMeasurements: {final_jumps}", file=sys.stderr)
                            elif jumps > 0:
                                # PRIORITÉ 2 : jumps depuis autres sources
                                final_jumps = jumps
                                import sys
                                print(f"[DEBUG] Using jumps from other sources: {final_jumps}", file=sys.stderr)
                            else:
                                import sys
                                print(f"[DEBUG] ❌ NO JUMPS FOUND: connect_iq['jumps']={connect_iq.get('jumps')}, jumps={jumps}", file=sys.stderr)
                            
                            # VALIDATION : Vérifier que les sauts sont cohérents avec la durée
                            if final_jumps > 0 and duration > 0:
                                calculated_speed_check = (final_jumps / (duration / 60.0))  # sauts/min
                                if calculated_speed_check < 5 or calculated_speed_check > 500:
                                    import sys
                                    print(f"[DEBUG] ⚠️  WARNING: Calculated speed from jumps/duration seems unreasonable: {calculated_speed_check} sauts/min (jumps={final_jumps}, duration={duration}s)", file=sys.stderr)
                            
                            # CORRECTION CRITIQUE : Prioriser vitesse depuis connectIQMeasurements[fieldNumber=3]
                            # PRIORITÉ 1 : speed_from_measurements (source principale, PROTÉGÉE)
                            # PRIORITÉ 2 : connect_iq['speed'] (peut avoir été écrasée)
                            # PRIORITÉ 3 : vitesse calculée depuis jumps/duration
                            speed = 0
                            if speed_from_measurements is not None:
                                # PRIORITÉ ABSOLUE : vitesse depuis connectIQMeasurements
                                speed = speed_from_measurements
                                connect_iq['speed'] = speed_from_measurements  # S'assurer qu'elle est bien dans connect_iq
                                import sys
                                print(f"[DEBUG] ✅✅✅ Using PROTECTED speed from connectIQMeasurements[fieldNumber=3]: {speed} sauts/min", file=sys.stderr)
                            else:
                                # Fallback : utiliser connect_iq['speed'] si disponible
                                speed = connect_iq.get('speed', 0)
                                if speed > 0:
                                    import sys
                                    print(f"[DEBUG] ✅ Using connect_iq['speed'] from other sources: {speed} sauts/min", file=sys.stderr)
                            
                            # Si vitesse < 1 sauts/min, c'est ABSOLUMENT incorrect (devrait être ~50-150 sauts/min)
                            # Si vitesse non trouvée ou incorrecte, recalculer depuis sauts/durée
                            if final_jumps > 0 and duration > 0:
                                calculated_speed = round((final_jumps / (duration / 60.0)), 2)  # sauts/min
                                # Utiliser la vitesse calculée si vitesse non trouvée, absurde (< 1), ou si calculée est plus raisonnable
                                if speed == 0 or speed < 1:
                                    # Si speed_from_measurements existe mais est < 1, c'est suspect, utiliser calculée
                                    if speed_from_measurements is not None and speed_from_measurements < 1:
                                        import sys
                                        print(f"[DEBUG] ⚠️  PROTECTED speed {speed_from_measurements} is suspicious (< 1), using calculated instead", file=sys.stderr)
                                    connect_iq['speed'] = calculated_speed
                                    speed = calculated_speed
                                    import sys
                                    print(f"[DEBUG] ✅ Calculated speed (no valid found): {calculated_speed} sauts/min from {final_jumps} jumps / {duration}s", file=sys.stderr)
                                elif speed_from_measurements is None and calculated_speed > speed and calculated_speed > 1:
                                    # Si vitesse calculée est plus élevée et raisonnable, l'utiliser (probablement plus précise)
                                    # MAIS seulement si speed_from_measurements n'existe pas (on ne veut pas écraser une vitesse protégée)
                                    connect_iq['speed'] = calculated_speed
                                    speed = calculated_speed
                                    import sys
                                    print(f"[DEBUG] ✅ Using calculated speed (more accurate): {calculated_speed} sauts/min instead of {connect_iq.get('speed', 0)}", file=sys.stderr)
                                elif speed_from_measurements is not None:
                                    import sys
                                    print(f"[DEBUG] ✅ Using PROTECTED speed from connectIQMeasurements: {speed} sauts/min (calculated would be {calculated_speed})", file=sys.stderr)
                                else:
                                    import sys
                                    print(f"[DEBUG] Using found speed: {speed} sauts/min (calculated would be {calculated_speed})", file=sys.stderr)
                            
                            # Log détaillé pour debug
                            import sys
                            if final_jumps > 0 or connect_iq:
                                print(f"[DEBUG] Jump rope activity {act_id} - jumps: {final_jumps}, connectIQ: {connect_iq}", file=sys.stderr)
                            else:
                                print(f"[DEBUG] Jump rope activity {act_id} - NO JUMPS FOUND. Checking act_details keys...", file=sys.stderr)
                                # Logger les clés disponibles pour debug
                                if isinstance(act_details, dict):
                                    all_keys = list(act_details.keys())[:30]
                                    print(f"[DEBUG] Available keys in act_details: {all_keys}", file=sys.stderr)
                            
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
                                    import sys
                                    print(f"[DEBUG] ⚠️  WARNING: maxContinuousJumps ({connect_iq['maxContinuousJumps']}) > jumps ({connect_iq['jumps']}), adjusting", file=sys.stderr)
                                    connect_iq['maxContinuousJumps'] = min(connect_iq['maxContinuousJumps'], connect_iq['jumps'])
                            
                            entry_base.update({
                                "jumps": final_jumps if final_jumps > 0 else None,
                                "distance": jump_distance,  # CORRECTION : Ajouter distance
                                "connectIQ": connect_iq if connect_iq else None
                            })
                            
                            # Log final pour vérification
                            import sys
                            if final_jumps > 0:
                                print(f"[DEBUG] ✅ Final jump rope activity {act_id} - jumps: {final_jumps}, connectIQ keys: {list(connect_iq.keys())}", file=sys.stderr)
                            else:
                                print(f"[DEBUG] ❌ Final jump rope activity {act_id} - NO JUMPS FOUND after all searches", file=sys.stderr)
                            
                            jump_list.append(entry_base)
                        elif is_cardio:
                            # Cardio général (sans sauts spécifiques)
                            # Ajouter type d'activité (activityName)
                            activity_name = act.get('activityName') or act_summary.get('activityName') or 'Cardio'
                            activity_type_key = act_type if act_type else 'indoor_cardio'
                            
                            entry_base.update({
                                "jumps": None,
                                "connectIQ": None,
                                "activityName": activity_name,
                                "activityType": activity_type_key
                            })
                            cardio_list.append(entry_base)
                        else:
                            # Autre type d'activité - traiter comme cardio
                            activity_name = act.get('activityName') or act_summary.get('activityName') or 'Cardio'
                            activity_type_key = act_type if act_type else 'indoor_cardio'
                            
                            entry_base.update({
                                "jumps": None,
                                "connectIQ": None,
                                "activityName": activity_name,
                                "activityType": activity_type_key
                            })
                            cardio_list.append(entry_base)
            except Exception as e:
                # Erreur activités: continuer quand même mais logger
                import sys
                print(f"[DEBUG] Erreur activités {d_str}: {e}", file=sys.stderr)
                pass
            
            try:
                # Métriques quotidiennes - essayer plusieurs méthodes
                steps_data = None
                stats = None
                hr_day = None
                sleep = None
                
                try:
                    steps_data = client.get_steps_data(d_str)
                except Exception:
                    pass
                
                try:
                    import sys
                    print(f"[DEBUG] Fetching stats for {d_str}...", file=sys.stderr)
                    stats = client.get_stats(d_str)
                    # DEBUG: Logger la structure de stats pour identifier les vrais champs
                    if stats:
                        print(f"[DEBUG] Stats for {d_str} - Type: {type(stats)}, Keys: {list(stats.keys())[:30] if isinstance(stats, dict) else 'N/A'}", file=sys.stderr)
                        # Logger les valeurs importantes
                        if isinstance(stats, dict):
                            # CORRECTION : Chercher totalDistanceMeters au lieu de totalDistance
                            print(f"[DEBUG] Stats values - distance: {stats.get('totalDistanceMeters') or stats.get('wellnessDistanceMeters') or stats.get('totalDistance')}, calories: {stats.get('totalKilocalories')}, active: {stats.get('activeKilocalories')}, resting: {stats.get('bmrKilocalories')}", file=sys.stderr)
                except Exception as e:
                    import sys
                    print(f"[DEBUG] Failed to get_stats({d_str}): {type(e).__name__}: {e}", file=sys.stderr)
                    pass
                
                try:
                    hr_day = client.get_heart_rates(d_str)
                except Exception:
                    pass
                
                # CORRECTION : Ajouter Body Battery, Stress, SpO2
                body_battery = None
                stress = None
                spo2 = None
                
                try:
                    import sys
                    print(f"[DEBUG] Fetching Body Battery for {d_str}...", file=sys.stderr)
                    # Essayer plusieurs méthodes possibles pour Body Battery
                    try:
                        body_battery = client.get_body_battery(d_str)
                    except AttributeError:
                        try:
                            body_battery = client.get_body_battery_data(d_str)
                        except AttributeError:
                            try:
                                body_battery = client.get_body_battery_values(d_str)
                            except AttributeError:
                                pass
                except Exception as e:
                    import sys
                    print(f"[DEBUG] Failed to get Body Battery for {d_str}: {type(e).__name__}: {e}", file=sys.stderr)
                    pass
                
                try:
                    import sys
                    print(f"[DEBUG] Fetching Stress for {d_str}...", file=sys.stderr)
                    # Essayer plusieurs méthodes possibles pour Stress
                    try:
                        stress = client.get_stress_data(d_str)
                    except AttributeError:
                        try:
                            stress = client.get_stress_values(d_str)
                        except AttributeError:
                            try:
                                stress = client.get_stress(d_str)
                            except AttributeError:
                                pass
                except Exception as e:
                    import sys
                    print(f"[DEBUG] Failed to get Stress for {d_str}: {type(e).__name__}: {e}", file=sys.stderr)
                    pass
                
                try:
                    import sys
                    print(f"[DEBUG] Fetching SpO2 for {d_str}...", file=sys.stderr)
                    # Essayer plusieurs méthodes possibles pour SpO2
                    try:
                        spo2 = client.get_spo2_data(d_str)
                    except AttributeError:
                        try:
                            spo2 = client.get_spo2_values(d_str)
                        except AttributeError:
                            try:
                                spo2 = client.get_spo2(d_str)
                            except AttributeError:
                                pass
                except Exception as e:
                    import sys
                    print(f"[DEBUG] Failed to get SpO2 for {d_str}: {type(e).__name__}: {e}", file=sys.stderr)
                    pass
                
                try:
                    import sys
                    print(f"[DEBUG] Fetching sleep for {d_str}...", file=sys.stderr)
                    sleep = client.get_sleep_data(d_str)
                    # DEBUG: Logger la structure de sleep
                    if sleep:
                        print(f"[DEBUG] Sleep for {d_str} - Type: {type(sleep)}, Keys: {list(sleep.keys())[:30] if isinstance(sleep, dict) else 'N/A'}", file=sys.stderr)
                        print(f"[DEBUG] Sleep data: {json.dumps(sleep, indent=2, default=str)[:1000]}", file=sys.stderr)
                    else:
                        print(f"[DEBUG] Sleep data is None or empty for {d_str}", file=sys.stderr)
                except Exception as e:
                    import sys
                    print(f"[DEBUG] Failed to get_sleep_data({d_str}): {type(e).__name__}: {e}", file=sys.stderr)
                    pass
                
                # Respiration - NOUVEAU
                respiration_data = None
                try:
                    # Essayer plusieurs méthodes possibles
                    respiration_data = client.get_respiration_data(d_str)
                except Exception:
                    try:
                        respiration_data = client.get_respiration_values(d_str)
                    except Exception:
                        pass
                
                # Intensité minutes quotidiennes - NOUVEAU
                intensity_data = None
                try:
                    intensity_data = client.get_intensity_minutes(d_str)
                except Exception:
                    # Chercher dans stats si méthode directe n'existe pas
                    pass
                
                # Normaliser steps - Essayer plusieurs formats
                if isinstance(steps_data, dict):
                    daily["steps"] = safe_int(steps_data.get('totalSteps') or steps_data.get('steps') or steps_data.get('value'), 0)
                elif isinstance(steps_data, list) and len(steps_data) > 0:
                    # Parfois c'est une liste d'objets
                    total_steps = 0
                    for item in steps_data:
                        if isinstance(item, dict):
                            total_steps += safe_int(item.get('steps') or item.get('value') or item.get('totalSteps'), 0)
                        elif isinstance(item, (int, float)):
                            total_steps += safe_int(item, 0)
                    daily["steps"] = total_steps
                elif isinstance(steps_data, (int, float)):
                    daily["steps"] = safe_int(steps_data, 0)
                
                # Normaliser stats - Essayer plusieurs formats
                if isinstance(stats, dict):
                    # Distance - CORRECTION CRITIQUE : totalDistanceMeters est TOUJOURS en mètres, même si valeur < 1000
                    distance_raw = stats.get('totalDistanceMeters') or stats.get('wellnessDistanceMeters') or 0
                    if isinstance(distance_raw, (int, float)) and distance_raw > 0:
                        # totalDistanceMeters est TOUJOURS en mètres, convertir TOUJOURS en km (même pour 18 m -> 0.018 km)
                        daily["distance"] = round(distance_raw / 1000.0, 3)  # Conversion mètres -> km avec 3 décimales
                        import sys
                        print(f"[DEBUG] Distance daily {d_str}: {distance_raw} m = {daily['distance']} km", file=sys.stderr)
                    else:
                        # Fallback : chercher dans autres champs (peut être déjà en km ou en mètres)
                        distance_raw_fallback = stats.get('totalDistance') or stats.get('distance') or stats.get('distanceInMeters') or stats.get('distanceInKm') or 0
                        if isinstance(distance_raw_fallback, (int, float)) and distance_raw_fallback > 0:
                            # Si > 1000, probablement en mètres, convertir en km
                            if distance_raw_fallback > 1000:
                                daily["distance"] = round(distance_raw_fallback / 1000.0, 3)
                            elif distance_raw_fallback > 1:
                                # Entre 1 et 1000, probablement en mètres aussi (conversion prudente)
                                daily["distance"] = round(distance_raw_fallback / 1000.0, 3)
                            else:
                                # Si < 1, probablement déjà en km
                                daily["distance"] = round(distance_raw_fallback, 3)
                        else:
                            daily["distance"] = 0
                    
                    # Si distance toujours 0, essayer de calculer depuis steps_data
                    if daily["distance"] == 0 and isinstance(steps_data, dict):
                        distance_from_steps = safe_float(steps_data.get('distanceInMeters') or steps_data.get('distance') or steps_data.get('totalDistance'), 0)
                        if distance_from_steps > 0:
                            # Si > 1000, probablement en mètres, convertir en km
                            if distance_from_steps > 1000:
                                daily["distance"] = round(distance_from_steps / 1000.0, 3)
                            else:
                                daily["distance"] = round(distance_from_steps, 3)
                    
                    # VALIDATION : Vérifier cohérence distance/steps (environ 0.7-0.8 m par pas)
                    if daily["steps"] > 0 and daily["distance"] > 0:
                        meters_per_step = (daily["distance"] * 1000) / daily["steps"]
                        if meters_per_step > 2.0:  # Plus de 2m par pas = suspect
                            import sys
                            print(f"[DEBUG] ⚠️  WARNING: Distance/steps ratio suspicious for {d_str}: {meters_per_step:.2f} m/step (distance={daily['distance']} km, steps={daily['steps']})", file=sys.stderr)
                        elif meters_per_step < 0.3:  # Moins de 0.3m par pas = suspect
                            import sys
                            print(f"[DEBUG] ⚠️  WARNING: Distance/steps ratio suspicious for {d_str}: {meters_per_step:.2f} m/step (distance={daily['distance']} km, steps={daily['steps']})", file=sys.stderr)
                    
                    daily["floors"] = safe_int(stats.get('totalFloors') or stats.get('floorsAscended') or stats.get('elevationGain'), 0)
                    daily["calories"]["total"] = safe_int(stats.get('totalKilocalories') or stats.get('calories') or stats.get('totalCalories'), 0)
                    daily["calories"]["active"] = safe_int(stats.get('activeKilocalories') or stats.get('activeCalories') or stats.get('caloriesBurned'), 0)
                    daily["calories"]["resting"] = safe_int(stats.get('bmrKilocalories') or stats.get('restingCalories') or stats.get('restingMetabolicRate'), 0)
                    
                    # FC repos
                    daily["heartRate"]["resting"] = safe_int(stats.get('restingHeartRate') or stats.get('restingHR') or stats.get('avgRestingHeartRate'), 0)
                    
                    # FC max - Essayer plusieurs sources
                    max_hr = safe_int(stats.get('maxHeartRate') or stats.get('maxHR') or stats.get('peakHeartRate'), 0)
                    daily["heartRate"]["max"] = max_hr
                    
                    # FC moyenne
                    avg_hr = safe_int(stats.get('averageHeartRate') or stats.get('avgHR') or stats.get('meanHeartRate'), 0)
                    daily["heartRate"]["avg"] = avg_hr
                
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
                                        "timestamp": datetime.utcfromtimestamp(safe_int(p[0])).strftime('%Y-%m-%dT%H:%M:%SZ'),
                                        "bpm": bpm_val
                                    })
                            except Exception:
                                continue
                
                # Si FC max non dans stats mais dans time series
                if daily["heartRate"]["max"] == 0 and max_hr_from_series > 0:
                    daily["heartRate"]["max"] = max_hr_from_series
                
                # Si FC avg non dans stats mais dans time series
                if daily["heartRate"]["avg"] == 0 and count_hr > 0:
                    daily["heartRate"]["avg"] = round(sum_hr / count_hr)
                
                if len(ts) > 0:
                    ts = ts[::5]  # Downsampling 5min
                daily["heartRate"]["timeSeries"] = ts
                
                # Sleep - Essayer plusieurs formats
                if isinstance(sleep, dict):
                    # Chercher dans dailySleepDTO si présent
                    sleep_dto = sleep.get('dailySleepDTO', {}) or {}
                    if not isinstance(sleep_dto, dict):
                        sleep_dto = {}
                    
                    # Chercher aussi respiration éveillée dans wellnessEpochRespirationDataDTOList et wellnessEpochRespirationAveragesList
                    resp_epoch_data = sleep.get('wellnessEpochRespirationDataDTOList', []) or []
                    resp_avg_data = sleep.get('wellnessEpochRespirationAveragesList', []) or []
                    
                    import sys
                    print(f"[DEBUG] Sleep data for {d_str} - Respiration epoch data: {len(resp_epoch_data)} items, averages: {len(resp_avg_data)} items", file=sys.stderr)
                    
                    # Parser respiration éveillée depuis epoch data si disponible
                    resp_awake_values = []
                    resp_sleep_values = []
                    if resp_epoch_data:
                        import sys
                        print(f"[DEBUG] Parsing {len(resp_epoch_data)} respiration epochs for {d_str}", file=sys.stderr)
                        for epoch in resp_epoch_data:
                            if isinstance(epoch, dict):
                                # Chercher état (awake/sleep) et valeur
                                # Les epochs peuvent avoir 'sleeping' (bool), 'state' (string), ou des champs spécifiques
                                is_sleeping = epoch.get('sleeping')
                                state = epoch.get('state', '').lower() if isinstance(epoch.get('state'), str) else None
                                if is_sleeping is None and isinstance(epoch.get('sleep'), str):
                                    state = epoch.get('sleep').lower()
                                
                                value = epoch.get('value') or epoch.get('respiration') or epoch.get('respirationValue') or epoch.get('respirationRate')
                                if value and isinstance(value, (int, float)) and value > 0:
                                    # Si sleep est False, True, ou state indique awake/wake, classer comme éveillé
                                    if (is_sleeping is False or 
                                        state in ('awake', 'eveille', 'wake', 'waking', 'awakening') or
                                        (state is None and is_sleeping is None)):  # Si pas de state, considérer éveillé par défaut
                                        resp_awake_values.append(float(value))
                                    elif (is_sleeping is True or 
                                          state in ('sleep', 'sommeil', 'asleep', 'sleeping')):
                                        resp_sleep_values.append(float(value))
                        
                        import sys
                        if resp_awake_values:
                            print(f"[DEBUG] Found {len(resp_awake_values)} awake respiration values, range: {min(resp_awake_values):.1f}-{max(resp_awake_values):.1f}, avg: {sum(resp_awake_values)/len(resp_awake_values):.1f}", file=sys.stderr)
                        if resp_sleep_values:
                            print(f"[DEBUG] Found {len(resp_sleep_values)} sleep respiration values, range: {min(resp_sleep_values):.1f}-{max(resp_sleep_values):.1f}, avg: {sum(resp_sleep_values)/len(resp_sleep_values):.1f}", file=sys.stderr)
                    
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
                    
                    # Durée du sommeil (peut être en secondes ou heures)
                    sleep_time_raw = sleep_dto.get('sleepTimeSeconds') or sleep_dto.get('sleepTime') or sleep.get('sleepTime') or sleep.get('sleepTimeSeconds') or sleep.get('duration') or 0
                    sleep_time = safe_int(sleep_time_raw, 0)
                    
                    # Si > 86400, probablement en secondes, convertir en heures
                    if sleep_time > 86400:
                        sleep_duration = sleep_time / 3600.0
                    elif sleep_time > 24:
                        sleep_duration = sleep_time / 60.0 / 60.0  # En minutes, convertir en heures
                    else:
                        sleep_duration = sleep_time  # Déjà en heures
                    
                    # Phases de sommeil (peut être en secondes)
                    deep_sleep = safe_int(sleep_dto.get('deepSleepSeconds') or sleep.get('deepSleepSeconds') or sleep.get('deepSleep') or sleep.get('deepSleepDuration'), 0) / 3600.0
                    light_sleep = safe_int(sleep_dto.get('lightSleepSeconds') or sleep.get('lightSleepSeconds') or sleep.get('lightSleep') or sleep.get('lightSleepDuration'), 0) / 3600.0
                    rem_sleep = safe_int(sleep_dto.get('remSleepSeconds') or sleep.get('remSleepSeconds') or sleep.get('remSleep') or sleep.get('remSleepDuration'), 0) / 3600.0
                    
                    # Heures coucher/lever (timestamps en millisecondes)
                    bed_time_ts = sleep_dto.get('sleepStartTimestampLocal') or sleep_dto.get('sleepStartTimestampGMT') or sleep.get('bedTime') or sleep.get('sleepStart')
                    wake_time_ts = sleep_dto.get('sleepEndTimestampLocal') or sleep_dto.get('sleepEndTimestampGMT') or sleep.get('wakeTime') or sleep.get('sleepEnd')
                    
                    # Convertir timestamps si nécessaire
                    bed_time = None
                    wake_time = None
                    if bed_time_ts:
                        try:
                            if isinstance(bed_time_ts, (int, float)) and bed_time_ts > 1000000000000:  # Timestamp en millisecondes
                                from datetime import datetime
                                bed_time = datetime.fromtimestamp(bed_time_ts / 1000.0).strftime('%H:%M')
                            elif isinstance(bed_time_ts, str):
                                bed_time = bed_time_ts.split('T')[1][:5] if 'T' in bed_time_ts else bed_time_ts
                        except:
                            bed_time = str(bed_time_ts)
                    
                    if wake_time_ts:
                        try:
                            if isinstance(wake_time_ts, (int, float)) and wake_time_ts > 1000000000000:  # Timestamp en millisecondes
                                from datetime import datetime
                                wake_time = datetime.fromtimestamp(wake_time_ts / 1000.0).strftime('%H:%M')
                            elif isinstance(wake_time_ts, str):
                                wake_time = wake_time_ts.split('T')[1][:5] if 'T' in wake_time_ts else wake_time_ts
                        except:
                            wake_time = str(wake_time_ts)
                    
                    daily["sleep"] = {
                        "duration": round(sleep_duration, 2) if sleep_duration > 0 else 0,
                        "quality": safe_int(sleep_dto.get('sleepScore') or sleep.get('sleepScore') or sleep.get('sleepQuality') or sleep.get('overallSleepScore'), 0),
                        "deepSleep": round(deep_sleep, 2) if deep_sleep > 0 else None,
                        "lightSleep": round(light_sleep, 2) if light_sleep > 0 else None,
                        "remSleep": round(rem_sleep, 2) if rem_sleep > 0 else None,
                        "bedTime": bed_time,
                        "wakeTime": wake_time
                    }
                    
                    # Respiration depuis données de sommeil si disponibles
                    resp_from_sleep = {}
                    # CORRECTION : Utiliser aussi avgWakingRespirationValue et avgSleepRespirationValue depuis dailySleepDTO
                    # même si epoch data est vide (cas de 2025-10-27)
                    avg_waking_from_sleep = safe_float(sleep_dto.get('avgWakingRespirationValue'), None) if sleep_dto else None
                    avg_sleep_from_sleep = safe_float(sleep_dto.get('avgSleepRespirationValue'), None) if sleep_dto else None
                    lowest_from_sleep = safe_int(sleep_dto.get('lowestRespirationValue'), None) if sleep_dto else None
                    highest_from_sleep = safe_int(sleep_dto.get('highestRespirationValue'), None) if sleep_dto else None
                    
                    # Utiliser respiration depuis epoch/averages si disponibles, sinon depuis dailySleepDTO
                    if resp_awake_values or resp_awake_from_avg or avg_waking_from_sleep is not None:
                        resp_from_sleep["awake"] = {
                            "min": resp_awake_from_avg.get('min') if resp_awake_from_avg.get('min') else (min(resp_awake_values) if resp_awake_values else lowest_from_sleep),
                            "max": resp_awake_from_avg.get('max') if resp_awake_from_avg.get('max') else (max(resp_awake_values) if resp_awake_values else highest_from_sleep),
                            "avg": resp_awake_from_avg.get('avg') if resp_awake_from_avg.get('avg') else (round(sum(resp_awake_values) / len(resp_awake_values), 1) if resp_awake_values else avg_waking_from_sleep)
                        }
                    
                    if sleep_dto.get('averageRespirationValue') or avg_sleep_from_sleep is not None or sleep_dto.get('lowestRespirationValue') or sleep_dto.get('highestRespirationValue') or resp_sleep_values or resp_sleep_from_avg:
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
                    
                    # Initialiser respiration avec données de sommeil si disponibles
                    if resp_from_sleep and (resp_from_sleep.get("awake") or resp_from_sleep.get("sleep")):
                        if not daily.get("respiration"):
                            daily["respiration"] = resp_from_sleep
                        else:
                            # Fusionner avec respiration existante
                            existing_resp = daily.get("respiration", {})
                            daily["respiration"] = {
                                "awake": resp_from_sleep.get("awake") or existing_resp.get("awake") or None,
                                "sleep": resp_from_sleep.get("sleep") or existing_resp.get("sleep") or None
                            }
                
                # Respiration - NOUVEAU - Fusionner avec données de sommeil si existantes
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
                                import sys
                                print(f"[DEBUG] respiration_data is None for {d_str}, using avgWakingRespirationValue from sleep.dailySleepDTO", file=sys.stderr)
                                # Créer respiration depuis sleep si pas déjà créée
                                if not daily.get("respiration"):
                                    daily["respiration"] = {}
                                existing_resp = daily.get("respiration", {})
                                daily["respiration"] = {
                                    "awake": existing_resp.get("awake") or {
                                        "min": lowest_from_sleep,
                                        "max": highest_from_sleep,
                                        "avg": avg_waking_from_sleep
                                    },
                                    "sleep": existing_resp.get("sleep") or {
                                        "min": lowest_from_sleep,
                                        "max": highest_from_sleep,
                                        "avg": avg_sleep_from_sleep
                                    } if avg_sleep_from_sleep is not None else existing_resp.get("sleep")
                                }
                                import sys
                                print(f"[DEBUG] Saved respiration from sleep.dailySleepDTO for {d_str}: awake.avg={avg_waking_from_sleep}, sleep.avg={avg_sleep_from_sleep}", file=sys.stderr)
                
                if isinstance(respiration_data, dict):
                    import sys
                    print(f"[DEBUG] Respiration data structure for {d_str}: {list(respiration_data.keys())[:20]}", file=sys.stderr)
                    # Logger les valeurs importantes avec leurs valeurs réelles
                    avg_waking = respiration_data.get('avgWakingRespirationValue')
                    avg_sleep = respiration_data.get('avgSleepRespirationValue')
                    lowest = respiration_data.get('lowestRespirationValue')
                    highest = respiration_data.get('highestRespirationValue')
                    
                    if avg_waking is not None:
                        print(f"[DEBUG] avgWakingRespirationValue found: {avg_waking} (type: {type(avg_waking).__name__})", file=sys.stderr)
                    if avg_sleep is not None:
                        print(f"[DEBUG] avgSleepRespirationValue found: {avg_sleep} (type: {type(avg_sleep).__name__})", file=sys.stderr)
                    if lowest is not None:
                        print(f"[DEBUG] lowestRespirationValue found: {lowest} (type: {type(lowest).__name__})", file=sys.stderr)
                    if highest is not None:
                        print(f"[DEBUG] highestRespirationValue found: {highest} (type: {type(highest).__name__})", file=sys.stderr)
                    
                    # Respirations éveillé - Chercher dans plusieurs champs possibles (Garmin utilise avgWakingRespirationValue)
                    # PRIORITÉ: avgWakingRespirationValue (champ principal Garmin)
                    resp_awake_avg_raw = respiration_data.get('avgWakingRespirationValue')
                    if not resp_awake_avg_raw:
                        resp_awake_avg_raw = (respiration_data.get('avgWakingRespiration') or 
                                            respiration_data.get('wakingRespirationAvg') or 
                                            respiration_data.get('respirationAwakeAvg') or 
                                            respiration_data.get('awakeAvg') or 
                                            respiration_data.get('avgRespirationAwake') or 
                                            respiration_data.get('respirationAvgAwake') or 
                                            respiration_data.get('awakeRespirationAvg'))
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
                    import sys
                    if resp_awake_avg_raw is not None:
                        print(f"[DEBUG] resp_awake_avg_raw = {resp_awake_avg_raw} (type: {type(resp_awake_avg_raw).__name__}), parsed = {resp_awake_avg}", file=sys.stderr)
                    
                    # Respirations sommeil - Chercher avgSleepRespirationValue
                    # PRIORITÉ: avgSleepRespirationValue (champ principal Garmin)
                    resp_sleep_avg_raw = respiration_data.get('avgSleepRespirationValue')
                    if not resp_sleep_avg_raw:
                        resp_sleep_avg_raw = (respiration_data.get('avgSleepRespiration') or 
                                            respiration_data.get('sleepRespirationAvg') or 
                                            respiration_data.get('respirationSleepAvg') or 
                                            respiration_data.get('sleepAvg') or 
                                            respiration_data.get('avgRespirationSleep') or 
                                            respiration_data.get('respirationAvgSleep') or 
                                            respiration_data.get('sleepRespirationAvg'))
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
                    import sys
                    if resp_sleep_avg_raw is not None:
                        print(f"[DEBUG] resp_sleep_avg_raw = {resp_sleep_avg_raw} (type: {type(resp_sleep_avg_raw).__name__}), parsed = {resp_sleep_avg}", file=sys.stderr)
                    
                    import sys
                    print(f"[DEBUG] Parsed respiration - Awake: min={resp_awake_min}, max={resp_awake_max}, avg={resp_awake_avg} | Sleep: min={resp_sleep_min}, max={resp_sleep_max}, avg={resp_sleep_avg}", file=sys.stderr)
                    
                    # CORRECTION CRITIQUE : Sauvegarder respiration même si seulement avgWakingRespirationValue trouvé
                    # Si avgWakingRespirationValue ou avgSleepRespirationValue existe, sauvegarder même si min/max sont 0
                    has_resp_data = (
                        (resp_awake_min > 0 or resp_awake_max > 0 or resp_awake_avg > 0) or
                        (resp_sleep_min > 0 or resp_sleep_max > 0 or resp_sleep_avg > 0) or
                        (resp_awake_avg_raw is not None) or  # avgWakingRespirationValue existe - PRIORITÉ ABSOLUE
                        (resp_sleep_avg_raw is not None)  # avgSleepRespirationValue existe - PRIORITÉ ABSOLUE
                    )
                    
                    if has_resp_data:
                        import sys
                        print(f"[DEBUG] has_resp_data=True for {d_str}: resp_awake_avg={resp_awake_avg}, resp_awake_avg_raw={resp_awake_avg_raw}, resp_awake_min={resp_awake_min}, resp_awake_max={resp_awake_max}", file=sys.stderr)
                        # Fusionner avec respiration existante (depuis sommeil)
                        existing_resp = daily.get("respiration", {})
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
                            resp_sleep_avg_final = existing_resp.get("sleep", {}).get("avg") if existing_resp.get("sleep") else (safe_float(sleep_dto.get('averageRespirationValue'), None) if sleep_dto and sleep_dto.get('averageRespirationValue') is not None else None)
                        
                        # CORRECTION : Utiliser global_lowest/highest si resp_sleep_min/max sont 0
                        if resp_sleep_min > 0:
                            resp_sleep_min_final = resp_sleep_min
                        elif global_lowest is not None:
                            resp_sleep_min_final = global_lowest
                        else:
                            resp_sleep_min_final = existing_resp.get("sleep", {}).get("min") if existing_resp.get("sleep") else (safe_int(sleep_dto.get('lowestRespirationValue'), None) if sleep_dto and sleep_dto.get('lowestRespirationValue') is not None else None)
                        
                        if resp_sleep_max > 0:
                            resp_sleep_max_final = resp_sleep_max
                        elif global_highest is not None:
                            resp_sleep_max_final = global_highest
                        else:
                            resp_sleep_max_final = existing_resp.get("sleep", {}).get("max") if existing_resp.get("sleep") else (safe_int(sleep_dto.get('highestRespirationValue'), None) if sleep_dto and sleep_dto.get('highestRespirationValue') is not None else None)
                        
                        # CORRECTION CRITIQUE : Sauvegarder respiration UNIQUEMENT si on a au moins une valeur (avg, min, ou max)
                        # Ne pas sauvegarder si toutes les valeurs sont None (ce qui n'arrivera pas si has_resp_data=True)
                        if resp_awake_avg_final is not None or resp_awake_min_final is not None or resp_awake_max_final is not None or resp_sleep_avg_final is not None or resp_sleep_min_final is not None or resp_sleep_max_final is not None:
                            daily["respiration"] = {
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
                            
                            import sys
                            print(f"[DEBUG] Final respiration for {d_str} - Awake: min={resp_awake_min_final}, max={resp_awake_max_final}, avg={resp_awake_avg_final} | Sleep: min={resp_sleep_min_final}, max={resp_sleep_max_final}, avg={resp_sleep_avg_final}", file=sys.stderr)
                        else:
                            import sys
                            print(f"[DEBUG] WARNING: has_resp_data=True but all final values are None for {d_str}!", file=sys.stderr)
                elif isinstance(respiration_data, list) and len(respiration_data) > 0:
                    # Si c'est une liste, parser différemment
                    resp_values_awake = []
                    resp_values_sleep = []
                    for item in respiration_data:
                        if isinstance(item, dict):
                            state = item.get('sleep') or item.get('state', '').lower()
                            value = safe_int(item.get('value') or item.get('respiration'), 0)
                            if value > 0:
                                if state in ('awake', 'eveille', 'wake'):
                                    resp_values_awake.append(value)
                                elif state in ('sleep', 'sommeil', 'asleep'):
                                    resp_values_sleep.append(value)
                    if len(resp_values_awake) > 0:
                        daily["respiration"] = {
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
                
                # Intensité minutes quotidiennes - NOUVEAU
                if isinstance(intensity_data, dict):
                    intensity_moderate = safe_int(intensity_data.get('moderateMinutes') or intensity_data.get('moderate') or intensity_data.get('intensityMinutesModerate'), 0)
                    intensity_vigorous = safe_int(intensity_data.get('vigorousMinutes') or intensity_data.get('vigorous') or intensity_data.get('intensityMinutesVigorous'), 0)
                    intensity_total = safe_int(intensity_data.get('totalMinutes') or intensity_data.get('total') or intensity_data.get('totalIntensityMinutes'), intensity_moderate + intensity_vigorous)
                    
                    if intensity_moderate > 0 or intensity_vigorous > 0:
                        daily["intensityMinutes"] = {
                            "moderate": intensity_moderate if intensity_moderate > 0 else None,
                            "vigorous": intensity_vigorous if intensity_vigorous > 0 else None,
                            "total": intensity_total if intensity_total > 0 else None
                        }
                elif isinstance(stats, dict):
                    # Chercher intensité minutes dans stats si méthode directe n'existe pas
                    intensity_moderate = safe_int(stats.get('moderateIntensityMinutes') or stats.get('intensityMinutesModerate'), 0)
                    intensity_vigorous = safe_int(stats.get('vigorousIntensityMinutes') or stats.get('intensityMinutesVigorous'), 0)
                    intensity_total = safe_int(stats.get('totalIntensityMinutes') or stats.get('intensityMinutesTotal'), intensity_moderate + intensity_vigorous)
                    
                    if intensity_moderate > 0 or intensity_vigorous > 0:
                        daily["intensityMinutes"] = {
                            "moderate": intensity_moderate if intensity_moderate > 0 else None,
                            "vigorous": intensity_vigorous if intensity_vigorous > 0 else None,
                            "total": intensity_total if intensity_total > 0 else None
                        }
            except Exception:
                # Erreur métriques: garder daily minimal (déjà initialisé)
                pass
            
            # CORRECTION CRITIQUE : Si distance quotidienne toujours 0, essayer d'agréger depuis activités
            # Mais NE JAMAIS remplacer une distance quotidienne valide par la somme des activités
            # La distance quotidienne de Garmin inclut TOUS les pas, pas seulement les activités sportives
            if daily.get("distance", 0) == 0:
                total_distance_from_activities = 0
                # Agrégation depuis activités du jour (distances déjà en km)
                for swim_act in swim_list:
                    if swim_act.get('date') == d_str and swim_act.get('distance'):
                        dist = swim_act.get('distance', 0)
                        if dist and dist > 0:
                            total_distance_from_activities += dist  # Déjà en km
                for jump_act in jump_list:
                    if jump_act.get('date') == d_str and jump_act.get('distance'):
                        dist = jump_act.get('distance', 0)
                        if dist and dist > 0:
                            total_distance_from_activities += dist  # Déjà en km
                for cardio_act in cardio_list:
                    if cardio_act.get('date') == d_str and cardio_act.get('distance'):
                        dist = cardio_act.get('distance', 0)
                        if dist and dist > 0:
                            total_distance_from_activities += dist  # Déjà en km
                if total_distance_from_activities > 0:
                    daily["distance"] = round(total_distance_from_activities, 3)
                    import sys
                    print(f"[DEBUG] Distance daily {d_str} from activities aggregation (fallback): {daily['distance']} km", file=sys.stderr)
            
            # CORRECTION CRITIQUE : Agréger minutes intensives de toutes les activités de la journée
            # Les activités sont dans swim_list, jump_list, cardio_list
            # Sommer leurs intensityMinutes et ajouter à daily["intensityMinutes"]
            if daily.get("intensityMinutes") is None:
                daily["intensityMinutes"] = {"moderate": 0, "vigorous": 0, "total": 0}
            
            # Initialiser si absent
            daily_moderate = safe_int(daily["intensityMinutes"].get("moderate"), 0)
            daily_vigorous = safe_int(daily["intensityMinutes"].get("vigorous"), 0)
            daily_total = safe_int(daily["intensityMinutes"].get("total"), 0)
            
            # Agréger depuis toutes les activités de cette date
            for swim_act in swim_list:
                if swim_act.get('date') and swim_act.get('date').startswith(d_str):
                    intensity = swim_act.get('intensityMinutes', {})
                    if intensity:
                        daily_moderate += safe_int(intensity.get("moderate"), 0)
                        daily_vigorous += safe_int(intensity.get("vigorous"), 0)
                        daily_total += safe_int(intensity.get("total"), 0)
            
            for jump_act in jump_list:
                if jump_act.get('date') and jump_act.get('date').startswith(d_str):
                    intensity = jump_act.get('intensityMinutes', {})
                    if intensity:
                        daily_moderate += safe_int(intensity.get("moderate"), 0)
                        daily_vigorous += safe_int(intensity.get("vigorous"), 0)
                        daily_total += safe_int(intensity.get("total"), 0)
            
            for cardio_act in cardio_list:
                if cardio_act.get('date') and cardio_act.get('date').startswith(d_str):
                    intensity = cardio_act.get('intensityMinutes', {})
                    if intensity:
                        daily_moderate += safe_int(intensity.get("moderate"), 0)
                        daily_vigorous += safe_int(intensity.get("vigorous"), 0)
                        daily_total += safe_int(intensity.get("total"), 0)
            
            # Mettre à jour daily["intensityMinutes"] avec les valeurs agrégées
            if daily_moderate > 0 or daily_vigorous > 0 or daily_total > 0:
                daily["intensityMinutes"] = {
                    "moderate": daily_moderate if daily_moderate > 0 else None,
                    "vigorous": daily_vigorous if daily_vigorous > 0 else None,
                    "total": daily_total if daily_total > 0 else None
                }
                import sys
                print(f"[DEBUG] Aggregated intensityMinutes for {d_str}: moderate={daily_moderate}, vigorous={daily_vigorous}, total={daily_total}", file=sys.stderr)
            
            # CORRECTION : Parser Body Battery, Stress, SpO2
            # Body Battery
            if body_battery:
                import sys
                print(f"[DEBUG] Body Battery data for {d_str}: {type(body_battery)}, keys: {list(body_battery.keys())[:10] if isinstance(body_battery, dict) else 'N/A'}", file=sys.stderr)
                if isinstance(body_battery, dict):
                    # Body Battery peut être une valeur unique ou un objet avec time series
                    body_battery_value = safe_int(
                        body_battery.get('bodyBattery') or
                        body_battery.get('value') or
                        body_battery.get('current') or
                        body_battery.get('average') or
                        body_battery.get('avg'),
                        None
                    )
                    if body_battery_value is not None and body_battery_value >= 0:
                        daily["bodyBattery"] = body_battery_value
                        import sys
                        print(f"[DEBUG] ✅ Parsed Body Battery for {d_str}: {body_battery_value}", file=sys.stderr)
                elif isinstance(body_battery, (int, float)):
                    if body_battery >= 0:
                        daily["bodyBattery"] = safe_int(body_battery, None)
            
            # Stress
            if stress:
                import sys
                print(f"[DEBUG] Stress data for {d_str}: {type(stress)}, keys: {list(stress.keys())[:10] if isinstance(stress, dict) else 'N/A'}", file=sys.stderr)
                if isinstance(stress, dict):
                    # Stress peut être une valeur unique ou un objet avec time series
                    stress_value = safe_int(
                        stress.get('stress') or
                        stress.get('value') or
                        stress.get('average') or
                        stress.get('avg') or
                        stress.get('level'),
                        None
                    )
                    if stress_value is not None and stress_value >= 0:
                        daily["stress"] = stress_value
                        import sys
                        print(f"[DEBUG] ✅ Parsed Stress for {d_str}: {stress_value}", file=sys.stderr)
                elif isinstance(stress, (int, float)):
                    if stress >= 0:
                        daily["stress"] = safe_int(stress, None)
            
            # SpO2
            if spo2:
                import sys
                print(f"[DEBUG] SpO2 data for {d_str}: {type(spo2)}, keys: {list(spo2.keys())[:10] if isinstance(spo2, dict) else 'N/A'}", file=sys.stderr)
                if isinstance(spo2, dict):
                    # SpO2 peut être une valeur unique ou un objet avec time series
                    spo2_value = safe_int(
                        spo2.get('spo2') or
                        spo2.get('value') or
                        spo2.get('average') or
                        spo2.get('avg') or
                        spo2.get('saturation'),
                        None
                    )
                    if spo2_value is not None and 0 <= spo2_value <= 100:
                        daily["spo2"] = spo2_value
                        import sys
                        print(f"[DEBUG] ✅ Parsed SpO2 for {d_str}: {spo2_value}", file=sys.stderr)
                elif isinstance(spo2, (int, float)):
                    if 0 <= spo2 <= 100:
                        daily["spo2"] = safe_int(spo2, None)
            
            # TOUJOURS ajouter daily pour cette date (même si vide)
            daily_dict[d_str] = daily
        
        payload = {
            "activities": {
                "swimming": swim_list,
                "jumpRope": jump_list,
                "cardio": cardio_list
            },
            "dailyMetrics": daily_dict,  # Contient TOUTES les dates
        }
        print_json_ok(payload)
        raise SystemExit(0)
    except Exception as e:
        # Erreur critique (login, etc.) → renvoyer erreur explicite, pas mock
        print_json_err(str(e))
        raise SystemExit(1)
else:
    # Pas d'identifiants → mock
    print_json_ok(build_mock_payload())
    raise SystemExit(0)


