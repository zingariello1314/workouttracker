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
import sys
from datetime import datetime, date, timedelta, timezone
from typing import Dict

# Ajouter le répertoire courant au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Imports des parsers modulaires
from parsers.activity_parser import (
    classify_activity,
    parse_common_metrics,
    parse_swimming_metrics,
    parse_jump_rope_metrics
)
from parsers.daily_metrics_parser import (
    parse_daily_steps,
    parse_daily_distance,
    parse_daily_calories,
    parse_daily_heart_rate,
    parse_daily_intensity_minutes,
    parse_daily_floors
)
from parsers.sleep_parser import (
    parse_sleep_data,
    extract_respiration_from_sleep
)
from parsers.respiration_parser import (
    parse_respiration_data,
    merge_respiration_sources
)
from parsers.wellness_parser import (
    fetch_body_battery,
    parse_body_battery,
    fetch_stress,
    parse_stress,
    fetch_spo2,
    parse_spo2
)
from utils.helpers import (
    safe_int,
    safe_float,
    daterange,
    print_debug
)
from utils.cache import get_cached_parsed, cache_parsed

# Chargement .env (optionnel)
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    pass

EMAIL = os.getenv("GARMIN_EMAIL")
PASSWORD = os.getenv("GARMIN_PASSWORD")

now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
current_date = date.today().strftime('%Y-%m-%d')


def build_mock_payload():
    d = current_date
    return {
        "activities": {
            "swimming": [
                {
                    "id": int(datetime.now(timezone.utc).timestamp()),
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
                    "id": int(datetime.now(timezone.utc).timestamp()) - 1000,
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

        # Boucle jour par jour - TOUTES les dates même vides
        start_dt = datetime.strptime(start_for, '%Y-%m-%d').date()
        end_dt = datetime.strptime(end_for, '%Y-%m-%d').date()
        
        # OPTIMISATION : Parallélisation des requêtes pour améliorer performance
        # Utiliser ThreadPoolExecutor pour paralléliser les jours
        from concurrent.futures import ThreadPoolExecutor, as_completed
        import threading
        
        # Lock pour thread-safety des listes partagées
        activities_lock = threading.Lock()
        
        def process_day(d_str: str) -> Dict:
            """Processe les données pour un jour donné"""
            day_swim = []
            day_jump = []
            day_cardio = []
            day_daily = {
                "steps": 0,
                "distance": 0,
                "floors": 0,
                "calories": {"total": 0, "active": 0, "resting": 0},
                "heartRate": {"resting": 0, "max": 0, "avg": 0, "timeSeries": []},
                "respiration": None,
                "intensityMinutes": None,
                "bodyBattery": None,
                "stress": None,
                "spo2": None
            }
            
            try:
                # Activités - Récupérer liste de base puis détails complets
                print_debug(f"Fetching activities for {d_str}...")
                activities = client.get_activities_by_date(d_str, d_str)
                print_debug(f"get_activities_by_date returned: {type(activities)}, length: {len(activities) if isinstance(activities, (list, dict)) else 'N/A'}")
                if activities:
                    print_debug(f"Found {len(activities) if isinstance(activities, list) else 'unknown'} activities for {d_str}")
                    for act_summary in activities:
                        act_id = act_summary.get('activityId')
                        if not act_id:
                            continue
                        
                        # OPTIMISATION : Vérifier le cache avant parsing
                        cached_parsed = get_cached_parsed(act_id, act_summary)
                        if cached_parsed:
                            print_debug(f"✅ Using cached parsed data for activity {act_id}")
                            activity_type = cached_parsed.get('type') or cached_parsed.get('activityType')
                            if activity_type == 'swimming' or 'swim' in str(activity_type).lower():
                                day_swim.append(cached_parsed)
                            elif activity_type == 'jumpRope' or 'jump' in str(activity_type).lower():
                                day_jump.append(cached_parsed)
                            else:
                                day_cardio.append(cached_parsed)
                            continue
                        
                        # OPTIMISATION : Parser summary d'abord pour identifier si details nécessaires
                        is_swimming_preview, is_jump_rope_preview, is_cardio_preview = classify_activity(act_summary, None)
                        
                        # Récupérer les détails complets SEULEMENT si nécessaire
                        act_details = None
                        needs_details = is_swimming_preview or is_jump_rope_preview
                        
                        if needs_details:
                            try:
                                act_details = client.get_activity(act_id)
                            except Exception as e:
                                print_debug(f"Failed to get_activity({act_id}): {e}")
                                pass
                        
                        # Classification d'activité avec parser modulaire
                        is_swimming, is_jump_rope, is_cardio = classify_activity(act_summary, act_details)
                        act = act_details if act_details else act_summary
                        entry_base, summary_dto, distance_m = parse_common_metrics(act, act_details, act_summary)
                        
                        start = act_summary.get('startTimeGMT') or act_summary.get('startTimeLocal')
                        if start:
                            entry_base["date"] = (start or d_str).split('T')[0]
                            entry_base["time"] = start.split('T')[1][:5] if 'T' in start else ""
                        else:
                            entry_base["date"] = d_str
                            entry_base["time"] = ""
                        
                        duration = entry_base.get("duration", 0)
                        
                        # 🟡 FIX #25: Vérification post-parsing pour détecter mal-classifications
                        originally_swimming = is_swimming
                        originally_jump_rope = is_jump_rope
                        originally_cardio = is_cardio
                        
                        # Si classé comme cardio mais distance > 0 et durée > 300s (5min), vérifier si natation
                        if is_cardio and not is_swimming and not is_jump_rope:
                            if distance_m and distance_m > 0 and duration and duration > 300:
                                # Distance positive + durée significative = probablement natation
                                act_name_lower = (act.get('activityName') or act_summary.get('activityName') or '').lower()
                                if 'swim' in act_name_lower or 'natation' in act_name_lower or 'pool' in act_name_lower:
                                    print_debug(f"⚠️ Activity {act_id} reclassifiée: cardio → swimming (distance={distance_m}m, duration={duration}s, name={act.get('activityName')})")
                                    is_swimming = True
                                    is_cardio = False
                                # Si distance modérée (50-5000m) et pas de jumps, peut-être natation
                                elif 50 <= distance_m <= 5000 and duration > 300:
                                    print_debug(f"⚠️ Activity {act_id} possible natation (distance={distance_m}m, duration={duration}s), vérification manuelle recommandée")
                        
                        if is_swimming:
                            entry_base = parse_swimming_metrics(entry_base, summary_dto, distance_m, act, act_details, act_summary, duration)
                            entry_base["type"] = "swimming"
                            if originally_cardio:
                                print_debug(f"✅ Activity {act_id} reclassifiée: cardio → swimming")
                            cache_parsed(act_id, act_summary, entry_base)
                            day_swim.append(entry_base)
                        elif is_jump_rope:
                            entry_base, connect_iq = parse_jump_rope_metrics(entry_base, summary_dto, act, act_details, act_summary, duration)
                            if connect_iq and 'maxContinuousJumps' in connect_iq and 'jumps' in connect_iq:
                                if connect_iq['maxContinuousJumps'] > connect_iq['jumps']:
                                    connect_iq['maxContinuousJumps'] = min(connect_iq['maxContinuousJumps'], connect_iq['jumps'])
                            if connect_iq:
                                entry_base["connectIQ"] = connect_iq
                            entry_base["type"] = "jumpRope"
                            cache_parsed(act_id, act_summary, entry_base)
                            day_jump.append(entry_base)
                        else:
                            activity_name = act.get('activityName') or act_summary.get('activityName') or 'Cardio'
                            act_type_dto = act_summary.get('activityTypeDTO', {}) or {}
                            act_type_key = act_type_dto.get('typeKey') or act_type_dto.get('type') or 'indoor_cardio'
                            entry_base.update({
                                "jumps": None,
                                "connectIQ": None,
                                "activityName": activity_name,
                                "activityType": act_type_key,
                                "type": "cardio"
                            })
                            cache_parsed(act_id, act_summary, entry_base)
                            day_cardio.append(entry_base)
            except Exception as e:
                print_debug(f"Erreur activités {d_str}: {e}")
            
            # Métriques quotidiennes (code existant simplifié)
            try:
                steps_data = None
                stats = None
                hr_day = None
                sleep = None
                
                try:
                    steps_data = client.get_steps_data(d_str)
                except Exception:
                    pass
                
                try:
                    stats = client.get_stats(d_str)
                    # 🟡 FIX : Si get_stats ne retourne rien pour aujourd'hui, essayer get_daily_summary
                    if not stats or (isinstance(stats, dict) and len(stats) == 0):
                        if d_str == current_date:
                            print_debug(f"⚠️ get_stats({d_str}) returned empty, trying get_daily_summary...")
                            try:
                                daily_summary = client.get_daily_summary(d_str)
                                if daily_summary:
                                    print_debug(f"✅ get_daily_summary({d_str}) returned data")
                                    stats = daily_summary
                            except Exception as e2:
                                print_debug(f"get_daily_summary({d_str}) also failed: {e2}")
                                # Essayer get_wellness_summary si disponible
                                try:
                                    wellness_summary = client.get_wellness_summary(d_str)
                                    if wellness_summary:
                                        print_debug(f"✅ get_wellness_summary({d_str}) returned data")
                                        stats = wellness_summary
                                except Exception as e3:
                                    print_debug(f"get_wellness_summary({d_str}) also failed: {e3}")
                    elif stats:
                        print_debug(f"✅ get_stats({d_str}) returned data: keys={list(stats.keys())[:5] if isinstance(stats, dict) else 'N/A'}")
                except Exception as e:
                    print_debug(f"Failed to get_stats({d_str}): {e}")
                    # En cas d'erreur, essayer get_daily_summary pour aujourd'hui
                    if d_str == current_date:
                        try:
                            print_debug(f"⚠️ Trying get_daily_summary({d_str}) as fallback...")
                            stats = client.get_daily_summary(d_str)
                            if stats:
                                print_debug(f"✅ get_daily_summary({d_str}) succeeded as fallback")
                        except Exception as e2:
                            print_debug(f"get_daily_summary({d_str}) fallback also failed: {e2}")
                            stats = None
                    else:
                        stats = None
                
                try:
                    hr_day = client.get_heart_rates(d_str)
                except Exception:
                    pass
                
                body_battery_data = fetch_body_battery(client, d_str)
                stress_data = fetch_stress(client, d_str)
                spo2_data = fetch_spo2(client, d_str)
                
                try:
                    sleep = client.get_sleep_data(d_str)
                except Exception as e:
                    print_debug(f"Failed to get_sleep_data({d_str}): {e}")
                    pass
                
                respiration_data = None
                try:
                    respiration_data = client.get_respiration_data(d_str)
                except Exception:
                    try:
                        respiration_data = client.get_respiration_values(d_str)
                    except Exception:
                        pass
                
                intensity_data = None
                try:
                    intensity_data = client.get_intensity_minutes(d_str)
                except Exception:
                    pass
                
                # Utiliser parsers modulaires
                day_daily["steps"] = parse_daily_steps(steps_data, d_str)
                day_daily["distance"] = parse_daily_distance(stats, steps_data, d_str, day_swim, day_jump, day_cardio)
                day_daily["floors"] = parse_daily_floors(stats)
                
                try:
                    # 🟡 FIX : Essayer de parser calories depuis stats ET steps_data pour aujourd'hui
                    calories = parse_daily_calories(stats, d_str, steps_data if d_str == current_date else None)
                    day_daily["calories"].update(calories)
                    
                    # 🔴 FIX CRITIQUE : Si toujours à 0 pour aujourd'hui, recherche récursive dans TOUTES les données
                    if d_str == current_date and calories["total"] == 0 and calories["active"] == 0 and calories["resting"] == 0:
                        print_debug(f"⚠️⚠️⚠️ Calories still 0 for today ({d_str}), performing DEEP SEARCH in all data structures...")
                        
                        # Dump complet de toutes les structures pour debug
                        print_debug(f"=== DEEP SEARCH: stats type={type(stats)}, keys={list(stats.keys())[:30] if isinstance(stats, dict) else 'N/A'}")
                        print_debug(f"=== DEEP SEARCH: steps_data type={type(steps_data)}, keys={list(steps_data.keys())[:30] if isinstance(steps_data, dict) else 'N/A'}")
                        print_debug(f"=== DEEP SEARCH: hr_day type={type(hr_day)}, keys={list(hr_day.keys())[:30] if isinstance(hr_day, dict) else 'N/A'}")
                        
                        # Recherche récursive de toutes les clés contenant "calorie" ou "kcal"
                        from utils.helpers import recursive_find_value
                        all_data_sources = [("stats", stats), ("steps_data", steps_data), ("hr_day", hr_day)]
                        
                        for source_name, source_data in all_data_sources:
                            if source_data:
                                found = recursive_find_value(source_data, ["calorie", "kcal"])
                                if found:
                                    print_debug(f"✅✅✅ FOUND CALORIES in {source_name}: {found[:10]}")  # Limiter à 10 pour pas trop de logs
                                    # Extraire les valeurs trouvées
                                    for key_path, value in found:
                                        if value and isinstance(value, (int, float)) and value > 0:
                                            key_lower = str(key_path).lower()
                                            if "total" in key_lower or ("calorie" in key_lower and "active" not in key_lower and "resting" not in key_lower):
                                                if calories["total"] == 0:
                                                    calories["total"] = safe_int(value, 0)
                                                    print_debug(f"✅ Set total calories from {source_name}.{key_path} = {calories['total']}")
                                            if "active" in key_lower:
                                                if calories["active"] == 0:
                                                    calories["active"] = safe_int(value, 0)
                                                    print_debug(f"✅ Set active calories from {source_name}.{key_path} = {calories['active']}")
                                            if "resting" in key_lower or "bmr" in key_lower:
                                                if calories["resting"] == 0:
                                                    calories["resting"] = safe_int(value, 0)
                                                    print_debug(f"✅ Set resting calories from {source_name}.{key_path} = {calories['resting']}")
                                    
                                    # Recalculer total si nécessaire
                                    if calories["total"] == 0 and (calories["active"] > 0 or calories["resting"] > 0):
                                        calories["total"] = calories["active"] + calories["resting"]
                                        print_debug(f"✅ Calculated total from found values: {calories['total']}")
                        
                        day_daily["calories"].update(calories)
                except Exception as e:
                    print_debug(f"❌ ERROR parsing calories for {d_str}: {e}")
                    import traceback
                    print_debug(f"Traceback: {traceback.format_exc()}")
                
                try:
                    # 🟡 FIX : Heart rate depuis stats et hr_day, mais aussi essayer steps_data pour aujourd'hui
                    heart_rate = parse_daily_heart_rate(stats, hr_day, d_str, steps_data if d_str == current_date else None)
                    day_daily["heartRate"].update(heart_rate)
                    
                    # 🔴 FIX CRITIQUE : Si toujours à 0 pour aujourd'hui, recherche récursive dans TOUTES les données
                    if d_str == current_date and heart_rate["resting"] == 0 and heart_rate["max"] == 0 and heart_rate["avg"] == 0:
                        print_debug(f"⚠️⚠️⚠️ Heart rate still 0 for today ({d_str}), performing DEEP SEARCH in all data structures...")
                        
                        # Recherche récursive de toutes les clés contenant "heart", "hr", "bpm", "resting"
                        from utils.helpers import recursive_find_value, safe_int
                        from parsers.validation_ranges import HR_RESTING_MIN, HR_RESTING_MAX
                        all_data_sources = [("stats", stats), ("steps_data", steps_data), ("hr_day", hr_day)]
                        
                        for source_name, source_data in all_data_sources:
                            if source_data:
                                found = recursive_find_value(source_data, ["restingheart", "restinghr", "resting", "rhr", "heartrate", "heart_rate"])
                                if found:
                                    print_debug(f"✅✅✅ FOUND HEART RATE in {source_name}: {found[:10]}")
                                    # Extraire les valeurs trouvées pour FC repos
                                    for key_path, value in found:
                                        if value and isinstance(value, (int, float)) and value > 0:
                                            key_lower = str(key_path).lower()
                                            if ("resting" in key_lower or "rhr" in key_lower) and heart_rate["resting"] == 0:
                                                hr_val = safe_int(value, 0, min_value=HR_RESTING_MIN, max_value=HR_RESTING_MAX)
                                                if hr_val > 0:
                                                    heart_rate["resting"] = hr_val
                                                    print_debug(f"✅ Set resting HR from {source_name}.{key_path} = {heart_rate['resting']}")
                        
                        day_daily["heartRate"].update(heart_rate)
                except Exception as e:
                    print_debug(f"❌ ERROR parsing heart rate for {d_str}: {e}")
                    import traceback
                    print_debug(f"Traceback: {traceback.format_exc()}")
                
                sleep_parsed = parse_sleep_data(sleep, d_str)
                if sleep_parsed:
                    day_daily["sleep"] = sleep_parsed
                
                resp_from_sleep = extract_respiration_from_sleep(sleep, d_str) if isinstance(sleep, dict) else {}
                respiration_parsed = parse_respiration_data(respiration_data, sleep, d_str)
                sleep_dto = sleep.get('dailySleepDTO', {}) or {} if isinstance(sleep, dict) else {}
                day_daily["respiration"] = merge_respiration_sources(respiration_parsed, sleep_dto, resp_from_sleep)
                
                intensity_minutes = parse_daily_intensity_minutes(intensity_data, stats, d_str, day_swim, day_jump, day_cardio)
                if intensity_minutes:
                    day_daily["intensityMinutes"] = intensity_minutes
                
                body_battery_value = parse_body_battery(body_battery_data, d_str)
                if body_battery_value is None and isinstance(sleep, dict):
                    sleep_body_battery = sleep.get('sleepBodyBattery') or sleep.get('bodyBatteryChange')
                    if sleep_body_battery is not None:
                        body_battery_value = parse_body_battery(sleep_body_battery, d_str)
                
                if body_battery_value is not None:
                    day_daily["bodyBattery"] = body_battery_value
                
                stress_value = parse_stress(stress_data, d_str)
                if stress_value is not None:
                    day_daily["stress"] = stress_value
                
                spo2_value = parse_spo2(spo2_data, d_str)
                if spo2_value is not None:
                    day_daily["spo2"] = spo2_value
                    
            except Exception as e:
                print_debug(f"❌ CRITICAL ERROR in daily metrics parsing for {d_str}: {e}")
            
            return {
                "date": d_str,
                "swim": day_swim,
                "jump": day_jump,
                "cardio": day_cardio,
                "daily": day_daily
            }
        
        # Parallélisation : traiter plusieurs jours en parallèle (max 5 pour éviter rate limit)
        dates_to_process = [d.strftime('%Y-%m-%d') for d in daterange(start_dt, end_dt)]
        max_workers = min(5, len(dates_to_process))  # Limiter à 5 workers pour éviter rate limit
        
        if len(dates_to_process) > 1 and max_workers > 1:
            print_debug(f"Parallélisation activée : {len(dates_to_process)} jours avec {max_workers} workers")
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_date = {executor.submit(process_day, d_str): d_str for d_str in dates_to_process}
                
                for future in as_completed(future_to_date):
                    d_str = future_to_date[future]
                    try:
                        result = future.result()
                        # Thread-safe ajout aux listes globales
                        with activities_lock:
                            swim_list.extend(result["swim"])
                            jump_list.extend(result["jump"])
                            cardio_list.extend(result["cardio"])
                            daily_dict[result["date"]] = result["daily"]
                    except Exception as e:
                        print_debug(f"❌ ERROR processing day {d_str}: {e}")
        else:
            # Pas de parallélisation si 1 seul jour ou workers insuffisants
            for d_str in dates_to_process:
                result = process_day(d_str)
                swim_list.extend(result["swim"])
                jump_list.extend(result["jump"])
                cardio_list.extend(result["cardio"])
                daily_dict[result["date"]] = result["daily"]
        
        # Finaliser les données pour le JSON de sortie
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
