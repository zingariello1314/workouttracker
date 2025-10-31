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
                print_debug(f"Fetching activities for {d_str}...")
                activities = client.get_activities_by_date(d_str, d_str)
                print_debug(f"get_activities_by_date returned: {type(activities)}, length: {len(activities) if isinstance(activities, (list, dict)) else 'N/A'}")
                if activities:
                    print_debug(f"Found {len(activities) if isinstance(activities, list) else 'unknown'} activities for {d_str}")
                    for act_summary in activities:
                        act_id = act_summary.get('activityId')
                        if not act_id:
                            continue
                        
                        # Récupérer les détails complets de l'activité
                        act_details = None
                        try:
                            act_details = client.get_activity(act_id)
                        except Exception as e:
                            print_debug(f"Failed to get_activity({act_id}): {e}")
                            pass
                        
                        # Classification d'activité avec parser modulaire
                        is_swimming, is_jump_rope, is_cardio = classify_activity(act_summary, act_details)
                        
                        # Utiliser détails si disponibles, sinon summary
                        act = act_details if act_details else act_summary
                        
                        # Parser métriques communes avec parser modulaire
                        entry_base, summary_dto, distance_m = parse_common_metrics(act, act_details, act_summary)
                        
                        # Corriger act_date et time dans entry_base si nécessaire
                        start = act_summary.get('startTimeGMT') or act_summary.get('startTimeLocal')
                        if start:
                            entry_base["date"] = (start or d_str).split('T')[0]
                            entry_base["time"] = start.split('T')[1][:5] if 'T' in start else ""
                        else:
                            entry_base["date"] = d_str
                            entry_base["time"] = ""
                        
                        duration = entry_base.get("duration", 0)
                        
                        if is_swimming:
                            # Parser métriques natation avec parser modulaire
                            entry_base = parse_swimming_metrics(entry_base, summary_dto, distance_m, act, act_details, act_summary, duration)
                            swim_list.append(entry_base)
                            print_debug(f"Added swimming activity {act_id} to swim_list. Total swimming: {len(swim_list)}")
                        elif is_jump_rope:
                            # Parser métriques corde à sauter avec parser modulaire
                            entry_base, connect_iq = parse_jump_rope_metrics(entry_base, summary_dto, act, act_details, act_summary, duration)
                            
                            # Vérifier que maxContinuousJumps <= jumps si tous deux existent
                            if connect_iq and 'maxContinuousJumps' in connect_iq and 'jumps' in connect_iq:
                                if connect_iq['maxContinuousJumps'] > connect_iq['jumps']:
                                    print_debug(f"⚠️  WARNING: maxContinuousJumps ({connect_iq['maxContinuousJumps']}) > jumps ({connect_iq['jumps']}), adjusting")
                                    connect_iq['maxContinuousJumps'] = min(connect_iq['maxContinuousJumps'], connect_iq['jumps'])
                            
                            # Ajouter connectIQ à entry_base si présent
                            if connect_iq:
                                entry_base["connectIQ"] = connect_iq
                            
                            jump_list.append(entry_base)
                            print_debug(f"Added jump rope activity {act_id} to jump_list. Total jump rope: {len(jump_list)}")
                        elif is_cardio:
                            # Cardio général (sans sauts spécifiques)
                            # Ajouter type d'activité (activityName)
                            activity_name = act.get('activityName') or act_summary.get('activityName') or 'Cardio'
                            act_type_dto = act_summary.get('activityTypeDTO', {}) or {}
                            act_type_key = act_type_dto.get('typeKey') or act_type_dto.get('type') or 'indoor_cardio'
                            
                            entry_base.update({
                                "jumps": None,
                                "connectIQ": None,
                                "activityName": activity_name,
                                "activityType": act_type_key
                            })
                            cardio_list.append(entry_base)
                        else:
                            # Autre type d'activité - traiter comme cardio
                            activity_name = act.get('activityName') or act_summary.get('activityName') or 'Cardio'
                            act_type_dto = act_summary.get('activityTypeDTO', {}) or {}
                            act_type_key = act_type_dto.get('typeKey') or act_type_dto.get('type') or 'indoor_cardio'
                            
                            entry_base.update({
                                "jumps": None,
                                "connectIQ": None,
                                "activityName": activity_name,
                                "activityType": act_type_key
                            })
                            cardio_list.append(entry_base)
            except Exception as e:
                # Erreur activités: continuer quand même mais logger
                print_debug(f"Erreur activités {d_str}: {e}")
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
                    print_debug(f"Fetching stats for {d_str}...")
                    stats = client.get_stats(d_str)
                    # DEBUG: Logger la structure de stats pour identifier les vrais champs
                    if stats:
                        print_debug(f"Stats for {d_str} - Type: {type(stats)}, Keys: {list(stats.keys())[:50] if isinstance(stats, dict) else 'N/A'}")
                        # Logger les valeurs importantes avec TOUS les champs possibles
                        if isinstance(stats, dict):
                            # Logger TOUS les champs liés aux calories
                            calorie_keys = [k for k in stats.keys() if 'calori' in k.lower() or 'kcal' in k.lower()]
                            if calorie_keys:
                                print_debug(f"Stats calorie keys: {calorie_keys}")
                                for k in calorie_keys:
                                    print_debug(f"  {k}: {stats.get(k)}")
                            
                            # Logger TOUS les champs liés à la fréquence cardiaque
                            hr_keys = [k for k in stats.keys() if 'heart' in k.lower() or 'hr' in k.lower() or 'bpm' in k.lower()]
                            if hr_keys:
                                print_debug(f"Stats HR keys: {hr_keys}")
                                for k in hr_keys:
                                    print_debug(f"  {k}: {stats.get(k)}")
                            
                            # Logger valeurs importantes
                            print_debug(f"Stats values - distance: {stats.get('totalDistanceMeters') or stats.get('wellnessDistanceMeters') or stats.get('totalDistance')}, calories: {stats.get('totalKilocalories')}, active: {stats.get('activeKilocalories')}, resting: {stats.get('bmrKilocalories')}")
                except Exception as e:
                    print_debug(f"Failed to get_stats({d_str}): {type(e).__name__}: {e}")
                    pass
                
                try:
                    hr_day = client.get_heart_rates(d_str)
                except Exception:
                    pass
                
                # CORRECTION : Ajouter Body Battery, Stress, SpO2 avec parsers modulaires
                body_battery_data = fetch_body_battery(client, d_str)
                stress_data = fetch_stress(client, d_str)
                spo2_data = fetch_spo2(client, d_str)
                
                try:
                    print_debug(f"Fetching sleep for {d_str}...")
                    sleep = client.get_sleep_data(d_str)
                    # DEBUG: Logger la structure de sleep
                    if sleep:
                        print_debug(f"Sleep for {d_str} - Type: {type(sleep)}, Keys: {list(sleep.keys())[:30] if isinstance(sleep, dict) else 'N/A'}")
                        print_debug(f"Sleep data: {json.dumps(sleep, indent=2, default=str)[:1000]}")
                    else:
                        print_debug(f"Sleep data is None or empty for {d_str}")
                except Exception as e:
                    print_debug(f"Failed to get_sleep_data({d_str}): {type(e).__name__}: {e}")
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
                
                # Utiliser parsers modulaires pour daily metrics
                daily["steps"] = parse_daily_steps(steps_data, d_str)
                daily["distance"] = parse_daily_distance(stats, steps_data, d_str, swim_list, jump_list, cardio_list)
                daily["floors"] = parse_daily_floors(stats)
                
                # Calories avec parser modulaire - OPTIMISATION: logger les valeurs
                try:
                    print_debug(f"Calling parse_daily_calories for {d_str}...")
                    calories = parse_daily_calories(stats, d_str)
                    print_debug(f"✅ parse_daily_calories returned: {calories}")
                    if calories["total"] == 0 and calories["active"] == 0 and calories["resting"] == 0:
                        print_debug(f"⚠️  WARNING: All calories are 0 for {d_str}. Stats keys: {list(stats.keys())[:30] if isinstance(stats, dict) else 'N/A'}")
                        # Logger les valeurs brutes pour debug
                        if isinstance(stats, dict):
                            print_debug(f"Raw stats values for {d_str}: totalKilocalories={stats.get('totalKilocalories')} (type: {type(stats.get('totalKilocalories'))}), activeKilocalories={stats.get('activeKilocalories')}, bmrKilocalories={stats.get('bmrKilocalories')}")
                    print_debug(f"Before update - daily['calories']: {daily['calories']}")
                    daily["calories"].update(calories)
                    print_debug(f"After update - daily['calories']: {daily['calories']}")
                    print_debug(f"Daily calories for {d_str}: total={daily['calories']['total']}, active={daily['calories']['active']}, resting={daily['calories']['resting']}")
                except Exception as e:
                    print_debug(f"❌ ERROR parsing calories for {d_str}: {type(e).__name__}: {e}")
                    import traceback
                    print_debug(traceback.format_exc())
                
                # Heart Rate avec parser modulaire - OPTIMISATION: logger les valeurs
                try:
                    print_debug(f"Calling parse_daily_heart_rate for {d_str}...")
                    heart_rate = parse_daily_heart_rate(stats, hr_day, d_str)
                    print_debug(f"✅ parse_daily_heart_rate returned: {heart_rate}")
                    if heart_rate["resting"] == 0 and heart_rate["max"] == 0 and heart_rate["avg"] == 0:
                        print_debug(f"⚠️  WARNING: All HR values are 0 for {d_str}. Stats keys: {list(stats.keys())[:30] if isinstance(stats, dict) else 'N/A'}, hr_day type: {type(hr_day)}")
                        # Logger les valeurs brutes pour debug
                        if isinstance(stats, dict):
                            print_debug(f"Raw stats HR values for {d_str}: restingHeartRate={stats.get('restingHeartRate')} (type: {type(stats.get('restingHeartRate'))}), maxHeartRate={stats.get('maxHeartRate')}, minHeartRate={stats.get('minHeartRate')}")
                    print_debug(f"Before update - daily['heartRate']: {daily['heartRate']}")
                    daily["heartRate"].update(heart_rate)
                    print_debug(f"After update - daily['heartRate']: {daily['heartRate']}")
                    print_debug(f"Daily HR for {d_str}: resting={daily['heartRate']['resting']}, max={daily['heartRate']['max']}, avg={daily['heartRate']['avg']}")
                except Exception as e:
                    print_debug(f"❌ ERROR parsing heart rate for {d_str}: {type(e).__name__}: {e}")
                    import traceback
                    print_debug(traceback.format_exc())
                
                # Sleep - Utiliser parser modulaire
                sleep_parsed = parse_sleep_data(sleep, d_str)
                if sleep_parsed:
                    daily["sleep"] = sleep_parsed
                
                # Extraire respiration depuis sleep (epochs, averages, dailySleepDTO)
                resp_from_sleep = extract_respiration_from_sleep(sleep, d_str) if isinstance(sleep, dict) else {}
                
                # Respiration - Utiliser parsers modulaires pour parser et fusionner
                respiration_parsed = parse_respiration_data(respiration_data, sleep, d_str)
                sleep_dto = sleep.get('dailySleepDTO', {}) or {} if isinstance(sleep, dict) else {}
                daily["respiration"] = merge_respiration_sources(respiration_parsed, sleep_dto, resp_from_sleep)
                
                # Intensité minutes quotidiennes - Utiliser parser modulaire - OPTIMISATION: logger les valeurs
                intensity_minutes = parse_daily_intensity_minutes(intensity_data, stats, d_str, swim_list, jump_list, cardio_list)
                if intensity_minutes:
                    daily["intensityMinutes"] = intensity_minutes
                    print_debug(f"Daily intensityMinutes for {d_str}: moderate={intensity_minutes.get('moderate')}, vigorous={intensity_minutes.get('vigorous')}, total={intensity_minutes.get('total')}")
                else:
                    print_debug(f"⚠️  WARNING: No intensityMinutes for {d_str}. intensity_data type: {type(intensity_data)}, stats keys: {list(stats.keys())[:30] if isinstance(stats, dict) else 'N/A'}")
            except Exception as e:
                # Erreur métriques: garder daily minimal (déjà initialisé)
                print_debug(f"❌ CRITICAL ERROR in daily metrics parsing for {d_str}: {type(e).__name__}: {e}")
                import traceback
                print_debug(traceback.format_exc())
                # Ne pas passer silencieusement, mais continuer quand même
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
                    print_debug(f"Distance daily {d_str} from activities aggregation (fallback): {daily['distance']} km")
            
            # CORRECTION : Parser Body Battery, Stress, SpO2 avec parsers modulaires - OPTIMISATION: logger les valeurs
            # OPTIMISATION CRITIQUE : Chercher Body Battery dans sleep si non trouvé
            body_battery_value = parse_body_battery(body_battery_data, d_str)
            if body_battery_value is None and isinstance(sleep, dict):
                # Chercher Body Battery dans sleep (sleepBodyBattery, bodyBatteryChange)
                sleep_body_battery = sleep.get('sleepBodyBattery') or sleep.get('bodyBatteryChange')
                if sleep_body_battery is not None:
                    print_debug(f"Found Body Battery in sleep data for {d_str}: {sleep_body_battery}")
                    body_battery_value = parse_body_battery(sleep_body_battery, d_str)
            
            if body_battery_value is not None:
                daily["bodyBattery"] = body_battery_value
                print_debug(f"✅ Body Battery for {d_str}: {body_battery_value}")
            else:
                print_debug(f"⚠️  WARNING: No Body Battery for {d_str}. body_battery_data type: {type(body_battery_data)}, sleep keys: {list(sleep.keys())[:20] if isinstance(sleep, dict) else 'N/A'}")
            
            stress_value = parse_stress(stress_data, d_str)
            if stress_value is not None:
                daily["stress"] = stress_value
                print_debug(f"✅ Stress for {d_str}: {stress_value}")
            else:
                print_debug(f"⚠️  WARNING: No Stress for {d_str}. stress_data type: {type(stress_data)}")
            
            spo2_value = parse_spo2(spo2_data, d_str)
            if spo2_value is not None:
                daily["spo2"] = spo2_value
                print_debug(f"✅ SpO2 for {d_str}: {spo2_value}")
            else:
                print_debug(f"⚠️  WARNING: No SpO2 for {d_str}. spo2_data type: {type(spo2_data)}")
            
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


