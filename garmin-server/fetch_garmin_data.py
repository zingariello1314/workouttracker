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
                "intensityMinutes": None  # Sera rempli si données disponibles
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
                        
                        act_type = (act_summary.get('activityTypeDTO', {}) or {}).get('typeKey', '').lower()
                        act_name = (act_summary.get('activityName') or '').lower()
                        start = act_summary.get('startTimeGMT') or act_summary.get('startTimeLocal')
                        act_date = (start or d_str).split('T')[0]
                        
                        # Détecter le vrai type d'activité basé sur le nom ET le type
                        # Natation
                        is_swimming = act_type in ('swimming', 'lap_swimming', 'pool_swimming', 'open_water') or 'swim' in act_type or 'natation' in act_name or 'pool' in act_name
                        # Corde à sauter
                        is_jump_rope = act_type in ('jump_rope', 'jumprope', 'skipping') or 'jump' in act_name.lower() or 'saut' in act_name.lower() or 'jumprope' in act_name.lower() or 'jumpro' in act_name.lower()
                        # Cardio général (tout le reste)
                        is_cardio = act_type in ('cardio', 'cardio_general', 'indoor_cardio', 'indoor_cardio') or (not is_swimming and not is_jump_rope and ('cardio' in act_type or 'cardio' in act_name))
                        
                        # Récupérer les détails complets de l'activité
                        act_details = None
                        try:
                            act_details = client.get_activity(act_id)
                            # Si on a les détails, mettre à jour le nom de l'activité si disponible
                            if act_details and act_details.get('activityName'):
                                act_name = act_details.get('activityName', '').lower()
                                # Re-détecter avec le nom complet
                                if not is_swimming and not is_jump_rope:
                                    if 'swim' in act_name or 'natation' in act_name or 'pool' in act_name:
                                        is_swimming = True
                                    elif 'jump' in act_name or 'saut' in act_name or 'jumprope' in act_name or 'jumpro' in act_name:
                                        is_jump_rope = True
                            # DEBUG: Logger la structure complète pour identifier les vrais champs
                            if act_details:
                                import sys
                                print(f"[DEBUG] Activity {act_id} (type:{act_type}, name:{act_name}, detected:swim={is_swimming}, jump={is_jump_rope}, cardio={is_cardio}) - Full structure:", json.dumps(act_details, indent=2, default=str)[:2000], file=sys.stderr)
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
                        
                        # Calories actives/repos - Chercher dans activitySummaryDTO ou autres structures
                        summary_dto = act.get('activitySummaryDTO', {}) or act.get('summaryDTO', {}) or {}
                        if isinstance(summary_dto, dict):
                            calories_resting = safe_int(
                                summary_dto.get('caloriesResting') or summary_dto.get('restingCalories') or summary_dto.get('bmrCalories') or act.get('caloriesResting') or act.get('restingCalories'),
                                0
                            )
                            calc_active = summary_dto.get('calories') - summary_dto.get('caloriesResting', 0) if (summary_dto.get('calories') and summary_dto.get('caloriesResting')) else None
                            calories_active = safe_int(
                                summary_dto.get('caloriesActive') or summary_dto.get('activeCalories') or summary_dto.get('caloriesBurned') or calc_active or act.get('caloriesActive') or act.get('activeCalories') or act.get('caloriesBurned'),
                                0
                            )
                        else:
                            calories_resting = safe_int(act.get('caloriesResting') or act.get('restingCalories'), 0)
                            calories_active = safe_int(act.get('caloriesActive') or act.get('activeCalories') or act.get('caloriesBurned'), 0)
                        
                        avg_hr = safe_int(
                            act.get('averageHR') or act.get('averageHeartRate') or (summary_dto.get('averageHR') if isinstance(summary_dto, dict) else None) or act_summary.get('averageHR'),
                            0
                        )
                        max_hr = safe_int(
                            act.get('maxHR') or act.get('maxHeartRate') or (summary_dto.get('maxHR') if isinstance(summary_dto, dict) else None) or act_summary.get('maxHR'),
                            0
                        )
                        distance_m = act.get('distance') or summary_dto.get('distance') if isinstance(summary_dto, dict) else 0 or act_summary.get('distance') or 0
                        
                        # Transpiration - Chercher dans plusieurs endroits
                        sweat_loss = safe_int(
                            (summary_dto.get('sweatLoss') if isinstance(summary_dto, dict) else None) or (summary_dto.get('estimatedSweatLoss') if isinstance(summary_dto, dict) else None) or act.get('sweatLoss') or act.get('estimatedSweatLoss') or act.get('totalSweatLoss'),
                            0
                        )
                        
                        # Intensité minutes - Chercher dans activitySummaryDTO et autres structures
                        intensity_moderate = safe_int(
                            (summary_dto.get('moderateIntensityMinutes') if isinstance(summary_dto, dict) else None) or (summary_dto.get('intensityMinutesModerate') if isinstance(summary_dto, dict) else None) or act.get('moderateIntensityMinutes') or act.get('intensityMinutesModerate'),
                            0
                        )
                        intensity_vigorous = safe_int(
                            (summary_dto.get('vigorousIntensityMinutes') if isinstance(summary_dto, dict) else None) or (summary_dto.get('intensityMinutesVigorous') if isinstance(summary_dto, dict) else None) or act.get('vigorousIntensityMinutes') or act.get('intensityMinutesVigorous'),
                            0
                        )
                        intensity_total = safe_int(
                            (summary_dto.get('totalIntensityMinutes') if isinstance(summary_dto, dict) else None) or (summary_dto.get('intensityMinutesTotal') if isinstance(summary_dto, dict) else None) or act.get('totalIntensityMinutes') or act.get('intensityMinutesTotal'),
                            intensity_moderate + intensity_vigorous if (intensity_moderate > 0 or intensity_vigorous > 0) else 0
                        )
                        
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
                            "sweatLoss": sweat_loss if sweat_loss > 0 else None,
                            "intensityMinutes": {
                                "moderate": intensity_moderate if intensity_moderate > 0 else None,
                                "vigorous": intensity_vigorous if intensity_vigorous > 0 else None,
                                "total": intensity_total if intensity_total > 0 else None
                            },
                            "source": "garmin"
                        }
                        
                        if is_swimming:
                            # Distance peut être en mètres ou déjà en km
                            distance_swim = distance_m or 0
                            if distance_swim > 10000:  # Si > 10000, probablement en mètres
                                distance_swim = round(distance_swim / 1000, 3)  # Convertir en km
                            elif distance_swim > 100:  # Si > 100 mais < 10000, peut-être en mètres
                                distance_swim = round(distance_swim / 1000, 3)  # Convertir en km
                            else:
                                distance_swim = round(distance_swim, 3)  # Déjà en km ou < 100m
                            
                            # Laps peut être dans plusieurs champs
                            laps_count = safe_int(act.get('laps') or act.get('lapCount') or act.get('numberOfLaps') or act.get('poolLapCount') or act_summary.get('laps'), 0)
                            
                            # Métriques natation détaillées - Chercher dans activityDetailDTO et autres structures
                            detail_dto = act.get('activityDetailDTO', {}) or act.get('detailDTO', {}) or {}
                            if not isinstance(detail_dto, dict):
                                detail_dto = {}
                            
                            # Stroke count et métriques de nage
                            stroke_count = safe_int(
                                detail_dto.get('strokeCount') or detail_dto.get('totalStrokes') or detail_dto.get('strokes') or act.get('strokeCount') or act.get('totalStrokes') or act.get('strokes'),
                                0
                            )
                            avg_stroke_rate = safe_float(
                                detail_dto.get('averageStrokeRate') or detail_dto.get('avgStrokeRate') or detail_dto.get('strokeRate') or act.get('averageStrokeRate') or act.get('avgStrokeRate') or act.get('strokeRate'),
                                0
                            )
                            avg_swolf = safe_float(
                                detail_dto.get('averageSwolf') or detail_dto.get('avgSwolf') or detail_dto.get('swolf') or act.get('averageSwolf') or act.get('avgSwolf') or act.get('swolf'),
                                0
                            )
                            pool_length = safe_float(detail_dto.get('poolLength') or act.get('poolLength'), 0)
                            avg_movements_per_lap = (stroke_count / laps_count) if laps_count > 0 else None
                            
                            # Allure (peut être en secondes par 100m ou en secondes total)
                            avg_pace = safe_int(
                                detail_dto.get('avgPace') or detail_dto.get('averagePace') or detail_dto.get('pace') or act.get('avgPace') or act.get('averagePace') or act.get('pace'),
                                0
                            )
                            # Si pace semble être en millisecondes ou très grand, diviser par 1000
                            if avg_pace > 10000:
                                avg_pace = avg_pace / 1000
                            
                            avg_pace_movement = safe_int(
                                detail_dto.get('avgPaceMovement') or detail_dto.get('averagePaceMovement') or act.get('avgPaceMovement') or act.get('averagePaceMovement'),
                                0
                            )
                            if avg_pace_movement > 10000:
                                avg_pace_movement = avg_pace_movement / 1000
                            
                            best_pace = safe_int(
                                detail_dto.get('bestPace') or detail_dto.get('fastestPace') or act.get('bestPace') or act.get('fastestPace'),
                                0
                            )
                            if best_pace > 10000:
                                best_pace = best_pace / 1000
                            
                            # Vitesse (peut être en m/s, convertir en km/h si nécessaire)
                            avg_speed = safe_float(
                                detail_dto.get('avgSpeed') or detail_dto.get('averageSpeed') or act.get('avgSpeed') or act.get('averageSpeed'),
                                0
                            )
                            if avg_speed > 0 and avg_speed < 10:
                                avg_speed = avg_speed * 3.6  # Convertir m/s en km/h
                            
                            avg_speed_movement = safe_float(
                                detail_dto.get('avgSpeedMovement') or detail_dto.get('averageSpeedMovement') or act.get('avgSpeedMovement') or act.get('averageSpeedMovement'),
                                0
                            )
                            if avg_speed_movement > 0 and avg_speed_movement < 10:
                                avg_speed_movement = avg_speed_movement * 3.6
                            
                            max_speed = safe_float(
                                detail_dto.get('maxSpeed') or detail_dto.get('maximumSpeed') or act.get('maxSpeed') or act.get('maximumSpeed'),
                                0
                            )
                            if max_speed > 0 and max_speed < 10:
                                max_speed = max_speed * 3.6
                            
                            # Temps
                            total_time = safe_int(
                                act.get('elapsedTime') or act.get('elapsedDuration') or act.get('totalTime') or duration,
                                0
                            )
                            active_time = safe_int(
                                detail_dto.get('activeTime') or detail_dto.get('movingTime') or act.get('activeTime') or act.get('movingTime') or total_time,
                                0
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
                                    "elapsedTime": total_time
                                }
                            })
                            swim_list.append(entry_base)
                        elif is_jump_rope:
                            # Métriques corde à sauter
                            jumps = safe_int(act.get('steps') or act.get('sumSteps') or act.get('jumps') or act_summary.get('steps'), 0)
                            
                            # Chercher données Connect IQ dans les détails
                            connect_iq = {}
                            if act_details:
                                # Chercher dans activityDetailDTO, measurements, ou champs custom
                                detail_dto_conn = act_details.get('activityDetailDTO', {}) or act_details.get('detailDTO', {}) or {}
                                measurements = detail_dto_conn.get('measurements', []) or act_details.get('measurements', []) or []
                                
                                # Chercher aussi dans activitySummaryDTO
                                summary_dto_conn = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {}) or {}
                                if summary_dto_conn:
                                    # Chercher champs custom dans summary
                                    for key, value in summary_dto_conn.items():
                                        key_lower = str(key).lower()
                                        if 'jump' in key_lower or 'saut' in key_lower:
                                            if 'max' in key_lower or 'continuous' in key_lower:
                                                connect_iq['maxContinuousJumps'] = safe_int(value, 0)
                                            else:
                                                connect_iq['jumps'] = safe_int(value, jumps)
                                        elif 'speed' in key_lower or 'vitesse' in key_lower or 'jumpspermin' in key_lower:
                                            connect_iq['speed'] = safe_float(value, 0)
                                        elif 'interruption' in key_lower:
                                            connect_iq['interruptions'] = safe_int(value, 0)
                                
                                # Chercher dans measurements
                                for m in measurements:
                                    if isinstance(m, dict):
                                        field_name = str(m.get('field') or m.get('name') or m.get('key') or '').lower()
                                        field_value = m.get('value') or m.get('displayValue') or m.get('metric')
                                        
                                        # Jumps/Sauts
                                        if 'jump' in field_name or 'saut' in field_name:
                                            if 'max' in field_name or 'continuous' in field_name or 'series' in field_name:
                                                connect_iq['maxContinuousJumps'] = safe_int(field_value, connect_iq.get('maxContinuousJumps', 0))
                                            else:
                                                val = safe_int(field_value, 0)
                                                if val > 0:
                                                    connect_iq['jumps'] = val
                                        # Vitesse
                                        elif 'speed' in field_name or 'vitesse' in field_name or 'rate' in field_name:
                                            val = safe_float(field_value, 0)
                                            if val > 0:
                                                connect_iq['speed'] = val
                                        # Interruptions
                                        elif 'interruption' in field_name or 'stop' in field_name:
                                            connect_iq['interruptions'] = safe_int(field_value, 0)
                                
                                # Chercher aussi dans les champs top-level de act_details
                                for key, value in act_details.items():
                                    if isinstance(value, (int, float)) and value > 0:
                                        key_lower = str(key).lower()
                                        if ('jump' in key_lower or 'saut' in key_lower) and ('max' in key_lower or 'continuous' in key_lower):
                                            connect_iq['maxContinuousJumps'] = safe_int(value, connect_iq.get('maxContinuousJumps', 0))
                                        elif 'jumpspermin' in key_lower or ('speed' in key_lower and 'jump' in key_lower):
                                            connect_iq['speed'] = safe_float(value, connect_iq.get('speed', 0))
                                
                                # Chercher dans les laps/splits pour données Connect IQ (parfois les données sont dans les laps)
                                laps_data = detail_dto_conn.get('laps', []) or act_details.get('laps', []) or []
                                for lap in laps_data:
                                    if isinstance(lap, dict):
                                        for key, value in lap.items():
                                            key_lower = str(key).lower()
                                            if ('jump' in key_lower or 'saut' in key_lower) and value:
                                                if 'max' in key_lower or 'continuous' in key_lower:
                                                    connect_iq['maxContinuousJumps'] = safe_int(value, connect_iq.get('maxContinuousJumps', 0))
                                                else:
                                                    connect_iq['jumps'] = safe_int(value, connect_iq.get('jumps', jumps))
                                            elif 'speed' in key_lower or 'vitesse' in key_lower:
                                                connect_iq['speed'] = safe_float(value, connect_iq.get('speed', 0))
                                            elif 'interruption' in key_lower:
                                                connect_iq['interruptions'] = safe_int(value, connect_iq.get('interruptions', 0))
                                
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
                            
                            # Si jumps vient de Connect IQ, mettre à jour
                            if 'jumps' in connect_iq:
                                jumps = connect_iq['jumps']
                            
                            # Vitesse calculée si durée et sauts disponibles
                            speed = connect_iq.get('speed', 0)
                            if speed == 0 and duration > 0 and jumps > 0:
                                speed = round((jumps / (duration / 60.0)), 2)  # sauts/min
                                connect_iq['speed'] = speed
                            
                            entry_base.update({
                                "jumps": jumps if jumps > 0 else None,
                                "connectIQ": connect_iq if connect_iq else None
                            })
                            
                            jump_list.append(entry_base)
                        elif is_cardio:
                            # Cardio général (sans sauts spécifiques)
                            entry_base.update({
                                "jumps": None,
                                "connectIQ": None
                            })
                            cardio_list.append(entry_base)
                        else:
                            # Autre type d'activité - traiter comme cardio
                            entry_base.update({
                                "jumps": None,
                                "connectIQ": None
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
                            print(f"[DEBUG] Stats values - distance: {stats.get('totalDistance')}, calories: {stats.get('totalKilocalories')}, active: {stats.get('activeKilocalories')}, resting: {stats.get('bmrKilocalories')}", file=sys.stderr)
                except Exception as e:
                    import sys
                    print(f"[DEBUG] Failed to get_stats({d_str}): {type(e).__name__}: {e}", file=sys.stderr)
                    pass
                
                try:
                    hr_day = client.get_heart_rates(d_str)
                except Exception:
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
                    # Distance (peut être en mètres ou km)
                    distance_raw = stats.get('totalDistanceMeters') or stats.get('totalDistance') or stats.get('distance') or stats.get('distanceInMeters') or stats.get('distanceInKm') or stats.get('wellnessDistanceMeters') or 0
                    if isinstance(distance_raw, (int, float)):
                        # Si > 1000, probablement en mètres, convertir en km
                        if distance_raw > 1000:
                            daily["distance"] = round(distance_raw / 1000.0, 2)
                        else:
                            daily["distance"] = round(distance_raw, 2)
                    else:
                        daily["distance"] = 0
                    
                    # Si distance toujours 0, essayer de calculer depuis steps_data
                    if daily["distance"] == 0 and isinstance(steps_data, dict):
                        distance_from_steps = safe_float(steps_data.get('distanceInMeters') or steps_data.get('distance') or steps_data.get('totalDistance'), 0)
                        if distance_from_steps > 0:
                            daily["distance"] = round(distance_from_steps / 1000.0 if distance_from_steps > 1000 else distance_from_steps, 2)
                    
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
                    if not daily.get("respiration") and (sleep_dto.get('averageRespirationValue') or sleep_dto.get('lowestRespirationValue') or sleep_dto.get('highestRespirationValue')):
                        daily["respiration"] = {
                            "sleep": {
                                "min": safe_int(sleep_dto.get('lowestRespirationValue'), 0) if sleep_dto.get('lowestRespirationValue') else None,
                                "max": safe_int(sleep_dto.get('highestRespirationValue'), 0) if sleep_dto.get('highestRespirationValue') else None,
                                "avg": safe_int(sleep_dto.get('averageRespirationValue'), 0) if sleep_dto.get('averageRespirationValue') else None
                            },
                            "awake": None  # Pas dans les données de sommeil
                        }
                
                # Respiration - NOUVEAU
                if isinstance(respiration_data, dict):
                    # Respirations éveillé
                    resp_awake_min = safe_int(respiration_data.get('respirationAwakeMin') or respiration_data.get('awakeMin') or respiration_data.get('minRespirationAwake'), 0)
                    resp_awake_max = safe_int(respiration_data.get('respirationAwakeMax') or respiration_data.get('awakeMax') or respiration_data.get('maxRespirationAwake'), 0)
                    resp_awake_avg = safe_int(respiration_data.get('respirationAwakeAvg') or respiration_data.get('awakeAvg') or respiration_data.get('avgRespirationAwake'), 0)
                    
                    # Respirations sommeil
                    resp_sleep_min = safe_int(respiration_data.get('respirationSleepMin') or respiration_data.get('sleepMin') or respiration_data.get('minRespirationSleep'), 0)
                    resp_sleep_max = safe_int(respiration_data.get('respirationSleepMax') or respiration_data.get('sleepMax') or respiration_data.get('maxRespirationSleep'), 0)
                    resp_sleep_avg = safe_int(respiration_data.get('respirationSleepAvg') or respiration_data.get('sleepAvg') or respiration_data.get('avgRespirationSleep'), 0)
                    
                    # Si données disponibles, ajouter
                    if resp_awake_min > 0 or resp_awake_max > 0 or resp_awake_avg > 0 or resp_sleep_min > 0 or resp_sleep_max > 0 or resp_sleep_avg > 0:
                        daily["respiration"] = {
                            "awake": {
                                "min": resp_awake_min if resp_awake_min > 0 else None,
                                "max": resp_awake_max if resp_awake_max > 0 else None,
                                "avg": resp_awake_avg if resp_awake_avg > 0 else None
                            },
                            "sleep": {
                                "min": resp_sleep_min if resp_sleep_min > 0 else None,
                                "max": resp_sleep_max if resp_sleep_max > 0 else None,
                                "avg": resp_sleep_avg if resp_sleep_avg > 0 else None
                            }
                        }
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
            
            # Si distance toujours 0, calculer depuis les activités de la journée (après traitement métriques)
            if daily["distance"] == 0:
                total_distance_from_activities = 0
                # Somme distance de toutes les activités de la journée
                for swim_act in swim_list:
                    if swim_act.get('date') == d_str and swim_act.get('distance'):
                        total_distance_from_activities += swim_act.get('distance', 0)
                for jump_act in jump_list:
                    if jump_act.get('date') == d_str and jump_act.get('distance'):
                        total_distance_from_activities += jump_act.get('distance', 0)
                for cardio_act in cardio_list:
                    if cardio_act.get('date') == d_str and cardio_act.get('distance'):
                        total_distance_from_activities += cardio_act.get('distance', 0)
                if total_distance_from_activities > 0:
                    daily["distance"] = round(total_distance_from_activities, 2)
            
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


