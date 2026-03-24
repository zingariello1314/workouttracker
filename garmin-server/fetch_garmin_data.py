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
    parse_jump_rope_metrics,
    extract_activity_heart_rate_time_series,
    is_running_like_activity,
    parse_run_cardio_metrics,
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
    extract_respiration_from_sleep,
    extract_heart_rate_from_sleep  # 🟢 PHASE 4 : Extraction FC depuis sommeil
)
from parsers.respiration_parser import (
    parse_respiration_data,
    merge_respiration_sources
)
from parsers.wellness_parser import (
    fetch_body_battery as fetch_body_battery_api,  # ✅ FIX : Renommer pour éviter shadowing
    parse_body_battery,
    fetch_stress as fetch_stress_api,  # ✅ FIX : Renommer pour éviter shadowing
    parse_stress,
    fetch_spo2 as fetch_spo2_api,  # ✅ FIX : Renommer pour éviter shadowing
    parse_spo2
)
from parsers.heart_rate_zones_parser import (
    parse_heart_rate_zones_from_activity,
    calculate_heart_rate_zones_from_time_series,
    parse_daily_heart_rate_zones
)
from parsers.performance_parser import (
    aggregate_daily_performance_metrics
)
from utils.helpers import (
    safe_int,
    safe_float,
    daterange,
    print_debug,
    normalize_datetime_to_utc
)
from utils.error_tracker import (
    get_error_tracker,
    track_parsing_error,
    track_api_error,
    ErrorSeverity,
    ErrorCategory
)
from utils.cache import (
    get_cached_parsed, 
    cache_parsed, 
    get_classification_hash,
    get_cached_daily_metrics,
    get_latest_cached_daily_metrics,  # ✅ PHASE 3.1 : Fonction helper pour trouver cache le plus récent
    cache_daily_metrics,
    get_raw_data_hash
)
from utils.retry import retry_with_backoff, retry_on_rate_limit


# 🟢 NOUVEAU : Fonction optimisée pour récupérer toutes les métriques en parallèle pour aujourd'hui
def fetch_today_metrics_parallel(client, date_str):
    """
    Récupère toutes les métriques quotidiennes en parallèle pour une date donnée.
    Optimisation critique : réduit le temps d'attente de ~33-55s à ~3-5s pour aujourd'hui.
    
    Args:
        client: Client Garmin Connect
        date_str: Date au format YYYY-MM-DD
        
    Returns:
        dict: Toutes les données récupérées avec clés :
            - steps_data
            - stats
            - daily_summary (fallback si stats vide)
            - wellness_summary (fallback si daily_summary vide)
            - hr_day
            - body_battery_data
            - stress_data
            - spo2_data
            - sleep
            - respiration_data
            - intensity_data
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    results = {
        "steps_data": None,
        "stats": None,
        "daily_summary": None,
        "wellness_summary": None,
        "hr_day": None,
        "body_battery_data": None,
        "stress_data": None,
        "spo2_data": None,
        "sleep": None,
        "respiration_data": None,
        "intensity_data": None
    }
    
    def fetch_steps():
        try:
            return ("steps_data", _get_steps_data_with_retry(client, date_str))
        except Exception as e:
            # 🟢 PRIORITÉ 4 : Tracking des erreurs API
            track_api_error(
                message=f"Failed to get_steps_data({date_str}) after retries",
                context={
                    "date": date_str,
                    "endpoint": "get_steps_data",
                    "retries": "exhausted"
                },
                exception=e,
                severity=ErrorSeverity.WARNING,
                recoverable=True,
                recovery_action="Returning None, will use fallback or default values"
            )
            print_debug(f"⚠️ Failed to get_steps_data({date_str}) after retries: {e}")
            return ("steps_data", None)
    
    def _normalize_summary(summary):
        """Garmin peut renvoyer un tableau ou un dict, normaliser en dict."""
        if isinstance(summary, list):
            return summary[0] if summary else None
        return summary

    def _has_meaningful_stats(data):
        """Vérifie si les stats contiennent au moins une valeur exploitable."""
        if not isinstance(data, dict) or not data:
            return False
        numeric_fields = [
            'totalSteps',
            'totalKilocalories',
            'activeKilocalories',
            'bmrKilocalories',
            'totalDistanceMeters',
            'wellnessDistanceMeters',
            'distance',
            'distanceInMeters',
            'distanceInKm',
            'moderateIntensityMinutes',
            'vigorousIntensityMinutes'
        ]
        for field in numeric_fields:
            value = data.get(field)
            if value is None:
                continue
            try:
                # Certains champs peuvent être des booléens ou des strings
                numeric = float(value)
            except (TypeError, ValueError):
                continue
            # On considère qu'une valeur > 0 indique des données utiles
            if numeric > 0:
                return True
        return False

    def fetch_stats():
        try:
            stats = _get_stats_with_retry(client, date_str)
            stats = _normalize_summary(stats)
            stats_source = "get_stats"

            if stats and isinstance(stats, dict):
                empty_stats = not _has_meaningful_stats(stats)
            else:
                empty_stats = True

            if not stats or (isinstance(stats, dict) and len(stats) == 0):
                # Essayer get_daily_summary en fallback
                try:
                    daily_summary = _get_daily_summary_with_retry(client, date_str)
                    daily_summary = _normalize_summary(daily_summary)
                    if daily_summary:
                        print_debug(f"✅ get_daily_summary({date_str}) returned data (fallback)")
                        stats = daily_summary
                        stats_source = "get_daily_summary"
                        empty_stats = not _has_meaningful_stats(stats)
                        if not empty_stats:
                            return ("stats", stats)
                except Exception as e2:
                    print_debug(f"get_daily_summary({date_str}) also failed: {e2}")
                    # Essayer get_wellness_summary en dernier recours
                    try:
                        wellness_summary = _get_wellness_summary_with_retry(client, date_str)
                        wellness_summary = _normalize_summary(wellness_summary)
                        if wellness_summary:
                            print_debug(f"✅ get_wellness_summary({date_str}) returned data (fallback)")
                            stats = wellness_summary
                            stats_source = "get_wellness_summary"
                            empty_stats = not _has_meaningful_stats(stats)
                            if not empty_stats:
                                return ("stats", stats)
                    except Exception as e3:
                        print_debug(f"get_wellness_summary({date_str}) also failed: {e3}")
            elif stats:
                print_debug(f"✅ get_stats({date_str}) returned data: keys={list(stats.keys())[:5] if isinstance(stats, dict) else 'N/A'}")
                if empty_stats:
                    print_debug(f"⚠️ get_stats({date_str}) returned structure sans valeurs exploitables, tentative fallback...")
                    try:
                        daily_summary = _get_daily_summary_with_retry(client, date_str)
                        daily_summary = _normalize_summary(daily_summary)
                        if daily_summary and _has_meaningful_stats(daily_summary):
                            print_debug(f"✅ get_daily_summary({date_str}) provided meaningful data (fallback après structure vide)")
                            return ("stats", daily_summary)
                    except Exception as e2:
                        print_debug(f"get_daily_summary({date_str}) fallback also failed after empty get_stats: {e2}")
                    try:
                        wellness_summary = _get_wellness_summary_with_retry(client, date_str)
                        wellness_summary = _normalize_summary(wellness_summary)
                        if wellness_summary and _has_meaningful_stats(wellness_summary):
                            print_debug(f"✅ get_wellness_summary({date_str}) provided meaningful data (fallback après structure vide)")
                            return ("stats", wellness_summary)
                    except Exception as e3:
                        print_debug(f"get_wellness_summary({date_str}) fallback also failed after empty get_stats: {e3}")
                    # Si aucun fallback n'a donné de valeurs, on log l'état vide
                    print_debug(f"⚠️ Aucune donnée calorique/steps exploitable obtenue pour {date_str} (source: {stats_source})")
                    return ("stats", stats or {})
            return ("stats", stats)
        except Exception as e:
            print_debug(f"Failed to get_stats({date_str}): {e}")
            # En cas d'erreur, essayer get_daily_summary
            try:
                print_debug(f"⚠️ Trying get_daily_summary({date_str}) as fallback...")
                daily_summary = _get_daily_summary_with_retry(client, date_str)
                daily_summary = _normalize_summary(daily_summary)
                if daily_summary and _has_meaningful_stats(daily_summary):
                    print_debug(f"✅ get_daily_summary({date_str}) succeeded as fallback")
                    return ("stats", daily_summary)
            except Exception as e2:
                print_debug(f"get_daily_summary({date_str}) fallback also failed: {e2}")
            return ("stats", None)
    
    def fetch_hr():
        try:
            return ("hr_day", _get_heart_rates_with_retry(client, date_str))
        except Exception as e:
            print_debug(f"⚠️ Failed to get_heart_rates({date_str}) after retries: {e}")
            return ("hr_day", None)
    
    def _fetch_body_battery():
        try:
            # ✅ FIX : Utiliser les fonctions importées (renommées) pour éviter shadowing
            return ("body_battery_data", fetch_body_battery_api(client, date_str))
        except Exception as e:
            print_debug(f"⚠️ Failed to fetch_body_battery({date_str}): {e}")
            return ("body_battery_data", None)
    
    def _fetch_stress():
        try:
            # ✅ FIX : Utiliser les fonctions importées (renommées) pour éviter shadowing
            return ("stress_data", fetch_stress_api(client, date_str))
        except Exception as e:
            print_debug(f"⚠️ Failed to fetch_stress({date_str}): {e}")
            return ("stress_data", None)
    
    def _fetch_spo2():
        try:
            # ✅ FIX : Utiliser les fonctions importées (renommées) pour éviter shadowing
            return ("spo2_data", fetch_spo2_api(client, date_str))
        except Exception as e:
            print_debug(f"⚠️ Failed to fetch_spo2({date_str}): {e}")
            return ("spo2_data", None)
    
    def fetch_sleep():
        try:
            return ("sleep", _get_sleep_data_with_retry(client, date_str))
        except Exception as e:
            print_debug(f"⚠️ Failed to get_sleep_data({date_str}) after retries: {e}")
            return ("sleep", None)
    
    def fetch_respiration():
        try:
            return ("respiration_data", _get_respiration_data_with_retry(client, date_str))
        except Exception as e:
            print_debug(f"⚠️ Failed to get_respiration_data({date_str}) after retries: {e}")
            return ("respiration_data", None)
    
    def fetch_intensity():
        try:
            return ("intensity_data", _get_intensity_minutes_with_retry(client, date_str))
        except Exception as e:
            print_debug(f"⚠️ Failed to get_intensity_minutes({date_str}) after retries: {e}")
            return ("intensity_data", None)
    
    # Exécuter tous les appels en parallèle
    print_debug(f"🚀 Fetching all metrics in parallel for {date_str}...")
    with ThreadPoolExecutor(max_workers=11) as executor:
        futures = {
            executor.submit(fetch_steps): "steps_data",
            executor.submit(fetch_stats): "stats",
            executor.submit(fetch_hr): "hr_day",
            executor.submit(_fetch_body_battery): "body_battery_data",  # ✅ FIX : Utiliser fonction renommée
            executor.submit(_fetch_stress): "stress_data",  # ✅ FIX : Utiliser fonction renommée
            executor.submit(_fetch_spo2): "spo2_data",  # ✅ FIX : Utiliser fonction renommée
            executor.submit(fetch_sleep): "sleep",
            executor.submit(fetch_respiration): "respiration_data",
            executor.submit(fetch_intensity): "intensity_data"
        }
        
        for future in as_completed(futures):
            try:
                key, value = future.result()
                results[key] = value
            except Exception as e:
                print_debug(f"⚠️ Error in parallel fetch for {futures[future]}: {e}")
    
    print_debug(f"✅ Parallel fetch completed for {date_str}")
    return results

# 🔴 FIX #38: Wrappers avec retry pour TOUS les appels API Garmin
@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_activities_with_retry(client, start_date, end_date):
    """Helper avec retry pour get_activities_by_date"""
    return client.get_activities_by_date(start_date, end_date)


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_activity_with_retry(client, act_id):
    """Helper avec retry pour get_activity"""
    return client.get_activity(act_id)


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_activity_splits_with_retry(client, act_id):
    return client.get_activity_splits(str(act_id))


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_activity_typed_splits_with_retry(client, act_id):
    return client.get_activity_typed_splits(str(act_id))


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_activity_split_summaries_with_retry(client, act_id):
    return client.get_activity_split_summaries(str(act_id))


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_activity_details_with_retry(client, act_id):
    return client.get_activity_details(str(act_id))


def _enrich_act_details_for_running(client, act_id, act_details):
    """
    Garmin ne met pas toujours tours / intervalles / cadence dans get_activity() seul.
    Endpoints complémentaires : /splits, /typedsplits, /split_summaries, /details
    """
    if not isinstance(act_details, dict):
        return act_details
    aid = str(act_id)
    try:
        sp = _get_activity_splits_with_retry(client, aid)
        act_details["_garminActivitySplits"] = sp
        if isinstance(sp, dict) and sp.get("lapDTOs"):
            print_debug(f"✅ splits: {len(sp.get('lapDTOs', []))} lapDTOs pour activité {aid}")
    except Exception as e:
        print_debug(f"⚠️ get_activity_splits({aid}): {e}")
    try:
        ts = _get_activity_typed_splits_with_retry(client, aid)
        act_details["_garminTypedSplits"] = ts
    except Exception as e:
        print_debug(f"⚠️ get_activity_typed_splits({aid}): {e}")
    try:
        ss = _get_activity_split_summaries_with_retry(client, aid)
        act_details["_garminSplitSummaries"] = ss
    except Exception as e:
        print_debug(f"⚠️ get_activity_split_summaries({aid}): {e}")
    try:
        det = _get_activity_details_with_retry(client, aid)
        act_details["_garminActivityDetails"] = det
        # Fusionner le résumé « details » (souvent plus complet pour tapis : distance, cadence)
        if isinstance(det, dict):
            s_new = det.get("activitySummaryDTO") or det.get("summaryDTO") or {}
            if isinstance(s_new, dict) and s_new:
                s_old = act_details.get("activitySummaryDTO") or act_details.get("summaryDTO") or {}
                if not isinstance(s_old, dict):
                    s_old = {}
                act_details["activitySummaryDTO"] = {**s_old, **s_new}
    except Exception as e:
        print_debug(f"⚠️ get_activity_details({aid}): {e}")
    return act_details


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_stats_with_retry(client, date_str):
    """Helper avec retry pour get_stats"""
    return client.get_stats(date_str)


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_daily_summary_with_retry(client, date_str):
    """Helper avec retry pour get_daily_summary (si disponible)."""
    getter = getattr(client, "get_daily_summary", None)
    if not callable(getter):
        print_debug("ℹ️ Garmin client ne fournit pas get_daily_summary(), fallback indisponible.")
        return None
    try:
        return getter(date_str)
    except AttributeError as exc:
        # Certains SDK lèvent AttributeError même si la méthode existe partiellement
        print_debug(f"⚠️ get_daily_summary indisponible pour {date_str}: {exc}")
        return None



@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_wellness_summary_with_retry(client, date_str):
    """Helper avec retry pour get_wellness_summary (si disponible)."""
    getter = getattr(client, "get_wellness_summary", None)
    if not callable(getter):
        print_debug("ℹ️ Garmin client ne fournit pas get_wellness_summary(), fallback indisponible.")
        return None
    try:
        return getter(date_str)
    except AttributeError as exc:
        print_debug(f"⚠️ get_wellness_summary indisponible pour {date_str}: {exc}")
        return None


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_steps_data_with_retry(client, date_str):
    """Helper avec retry pour get_steps_data"""
    return client.get_steps_data(date_str)


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_heart_rates_with_retry(client, date_str):
    """Helper avec retry pour get_heart_rates"""
    return client.get_heart_rates(date_str)


# ✅ PHASE 2.3 : Fonction pour récupération incrémentale minute par minute
@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def fetch_heart_rate_incremental(client, date_str, start_timestamp=None):
    """
    ✅ PHASE 2.3 : Récupère les données FC minute par minute depuis start_timestamp.
    
    Cette fonction récupère toutes les données du jour via get_heart_rates(),
    puis filtre uniquement les points depuis start_timestamp pour optimiser
    la récupération incrémentale (évite de récupérer des données déjà stockées).
    
    Args:
        client: Client Garmin Connect
        date_str: Date au format YYYY-MM-DD
        start_timestamp: Timestamp ISO de début (ex: "2025-11-04T14:30:00Z") ou None
        
    Returns:
        dict: Données hr_day avec heartRateValues filtrées depuis start_timestamp,
              ou None si erreur, ou toutes les données si start_timestamp est None
    """
    try:
        # Récupérer toutes les données du jour (obligatoire : l'API ne permet pas de filtrer par timestamp)
        hr_day = _get_heart_rates_with_retry(client, date_str)
        
        if not hr_day or not isinstance(hr_day, dict):
            return None
        
        # Si start_timestamp non fourni, retourner toutes les données
        if not start_timestamp:
            return hr_day
        
        # Convertir start_timestamp en timestamp Unix pour comparaison
        from datetime import datetime, timezone
        try:
            if isinstance(start_timestamp, str):
                # Parser ISO string
                if start_timestamp.endswith('Z'):
                    start_timestamp_normalized = start_timestamp.replace('Z', '+00:00')
                else:
                    start_timestamp_normalized = start_timestamp
                start_dt = datetime.fromisoformat(start_timestamp_normalized)
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
                start_ts = start_dt.timestamp()
            else:
                # Si c'est déjà un timestamp (nombre)
                start_ts = float(start_timestamp) / 1000 if start_timestamp > 1e10 else float(start_timestamp)
        except Exception as e:
            print_debug(f"⚠️ Error parsing start_timestamp {start_timestamp}: {e}")
            return hr_day  # Retourner toutes les données en cas d'erreur
        
        # Extraire les points FC depuis hr_day
        hr_values = (
            hr_day.get('heartRateValues') or
            hr_day.get('values') or
            hr_day.get('data') or
            hr_day.get('timeSeries') or
            []
        )
        
        if not isinstance(hr_values, list):
            hr_values = []
        
        # Filtrer uniquement les points depuis start_timestamp
        filtered_values = []
        for point in hr_values:
            try:
                # Extraire le timestamp du point
                if isinstance(point, list) and len(point) >= 2:
                    point_timestamp_raw = point[0]
                elif isinstance(point, dict):
                    point_timestamp_raw = point.get('timestamp') or point.get('time')
                else:
                    continue
                
                # Normaliser le timestamp du point en UTC ISO
                point_timestamp = normalize_datetime_to_utc(point_timestamp_raw)
                if not point_timestamp:
                    continue
                
                # Convertir en timestamp Unix pour comparaison
                point_dt = datetime.fromisoformat(point_timestamp.replace('Z', '+00:00'))
                point_ts = point_dt.timestamp()
                
                # Filtrer : garder uniquement les points >= start_timestamp
                if point_ts >= start_ts:
                    filtered_values.append(point)
                    
            except Exception as e:
                print_debug(f"⚠️ Error filtering HR point: {e}, point: {point}")
                continue
        
        print_debug(f"✅ Filtered {len(filtered_values)} HR points since {start_timestamp} (from {len(hr_values)} total for {date_str})")
        
        # Retourner hr_day avec les valeurs filtrées (copie pour ne pas modifier l'original)
        filtered_hr_day = hr_day.copy()
        filtered_hr_day['heartRateValues'] = filtered_values
        
        return filtered_hr_day
        
    except Exception as e:
        print_debug(f"⚠️ Error in fetch_heart_rate_incremental for {date_str}: {e}")
        # En cas d'erreur, retourner toutes les données (fallback sécurisé)
        try:
            return _get_heart_rates_with_retry(client, date_str)
        except Exception as e2:
            print_debug(f"⚠️ Fallback also failed: {e2}")
            return None


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_sleep_data_with_retry(client, date_str):
    """Helper avec retry pour get_sleep_data"""
    return client.get_sleep_data(date_str)


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _get_respiration_data_with_retry(client, date_str):
    """Helper avec retry pour get_respiration_data"""
    try:
        return client.get_respiration_data(date_str)
    except AttributeError:
        # Fallback sur get_respiration_values si disponible
        return client.get_respiration_values(date_str)


def _get_intensity_minutes_with_retry(client, date_str):
    """
    Helper pour get_intensity_minutes - gère gracieusement si la méthode n'existe pas
    Note: get_intensity_minutes() n'existe pas dans toutes les versions de l'API Garmin
    """
    try:
        # Essayer d'abord get_intensity_minutes
        if hasattr(client, 'get_intensity_minutes'):
            return client.get_intensity_minutes(date_str)
        # Sinon, essayer get_wellness_intensity_minutes
        elif hasattr(client, 'get_wellness_intensity_minutes'):
            return client.get_wellness_intensity_minutes(date_str)
        # Si aucune méthode n'existe, retourner None (sera parsé depuis stats)
        else:
            return None
    except AttributeError:
        # Méthode inexistante - retourner None (sera parsé depuis stats)
        return None
    except Exception as e:
        # Autres erreurs - logger mais retourner None
        print_debug(f"⚠️ Failed to get_intensity_minutes({date_str}): {type(e).__name__}: {e}")
        return None

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


def connect_garmin_client(email: str, password: str):
    """
    Connexion via python-garminconnect avec jetons persistés (dossier GARMINTOKENS ou ~/.garminconnect).
    Évite un login SSO complet à chaque sync → beaucoup moins de risques de 429 côté Garmin.
    """
    from pathlib import Path

    from garminconnect import (  # type: ignore
        Garmin,
        GarminConnectConnectionError,
        GarminConnectTooManyRequestsError,
    )

    tokenstore = os.getenv("GARMINTOKENS")
    if tokenstore:
        tokenstore_path = Path(tokenstore).expanduser().resolve()
    else:
        tokenstore_path = (Path.home() / ".garminconnect").resolve()
    tokenstore_path.mkdir(parents=True, exist_ok=True)
    ts = str(tokenstore_path)

    client = Garmin(email=email, password=password, is_cn=False, return_on_mfa=False)

    oauth1 = tokenstore_path / "oauth1_token.json"

    def _do_login():
        """
        Si aucun jeton sur disque : login(email/password) sans chemin — sinon la lib lève
        FileNotFoundError sur oauth1_token.json au lieu de se connecter.
        GARMINTOKENS est retiré temporairement pour que login(tokenstore=None) ne recharge pas le chemin.
        """
        env_backup = os.environ.pop("GARMINTOKENS", None)
        try:
            if oauth1.is_file():
                try:
                    client.login(tokenstore=ts)
                except FileNotFoundError:
                    # Jetons incomplets / fichier manquant
                    client.login(tokenstore=None)
            else:
                client.login(tokenstore=None)
        finally:
            if env_backup is not None:
                os.environ["GARMINTOKENS"] = env_backup

    # Pas de nouvelle tentative après 60s : Garmin garde souvent le 429 plus longtemps ;
    # une 2e tentative aggrave la limite. Le serveur Node applique un cooldown entre les syncs.
    try:
        _do_login()
    except GarminConnectTooManyRequestsError as e:
        raise RuntimeError(
            "Garmin a refusé la connexion (trop de demandes — code 429). "
            "Attendez 30 à 60 minutes sans lancer de synchro, puis réessayez une seule fois. "
            f"Détail: {e}"
        ) from e
    except GarminConnectConnectionError as e:
        err = str(e)
        if "429" in err or "Too Many Requests" in err:
            raise RuntimeError(
                "Garmin a refusé la connexion (trop de demandes — code 429). "
                "Attendez 30 à 60 minutes sans lancer de synchro, puis réessayez une seule fois. "
                f"Détail: {e}"
            ) from e
        raise

    try:
        client.garth.dump(ts)
    except Exception as e:
        print_debug(f"⚠️ Enregistrement des jetons Garmin: {e}")

    return client


# Tentative d'intégration réelle
args = sys.argv[1:]
arg_start = None
arg_end = None
arg_last_sync_timestamp = None  # ✅ PHASE 2.4 : Timestamp de dernière sync pour récupération incrémentale
try:
    if '--start' in args:
        arg_start = args[args.index('--start') + 1]
    if '--end' in args:
        arg_end = args[args.index('--end') + 1]
    # ✅ PHASE 2.4 : Récupérer le timestamp de dernière sync si fourni
    if '--lastSyncTimestamp' in args:
        arg_last_sync_timestamp = args[args.index('--lastSyncTimestamp') + 1]
        print_debug(f"✅ Received lastSyncTimestamp: {arg_last_sync_timestamp}")
except Exception:
    arg_start = None
    arg_end = None
    arg_last_sync_timestamp = None

if EMAIL and PASSWORD:
    try:
        client = connect_garmin_client(EMAIL, PASSWORD)
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
        
        # 🔴 FIX #23: Collecte des erreurs de parsing pour remontée au frontend
        parsing_errors = []
        parsing_errors_lock = threading.Lock()
        
        def process_day(d_str: str, last_sync_timestamp_for_date: str = None) -> Dict:
            """Processe les données pour un jour donné"""
            day_swim = []
            day_jump = []
            day_cardio = []
            # 🟢 NOUVEAU : Accumuler les time series FC depuis toutes les activités du jour
            all_activities_hr_time_series = []
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
            # Variables de contrôle initialisées par défaut pour éviter tout accès avant affectation
            should_skip_api_calls = False
            cached_daily_before_api = None
            
            try:
                # 🔴 FIX #38: Activités - Récupérer liste de base avec retry automatique
                print_debug(f"Fetching activities for {d_str}...")
                activities = _get_activities_with_retry(client, d_str, d_str)
                print_debug(f"get_activities_by_date returned: {type(activities)}, length: {len(activities) if isinstance(activities, (list, dict)) else 'N/A'}")
                if not activities:
                    print_debug(
                        f"ℹ️ Aucune activité pour {d_str} — si ta séance est la veille, "
                        f"élargis la synchro (start/end) ou resynchronise : la fenêtre « un seul jour » "
                        f"ne recharge pas les jours précédents."
                    )
                if activities:
                    print_debug(f"Found {len(activities) if isinstance(activities, list) else 'unknown'} activities for {d_str}")
                    for act_summary in activities:
                        act_id = act_summary.get('activityId')
                        if not act_id:
                            continue
                        
                        # 🔴 FIX #23: Try-catch pour capturer les erreurs de parsing d'activité
                        try:
                            # 🔴 FIX : Vérifier le cache avec hash de classification pour invalidation intelligente
                            current_classification_hash = get_classification_hash(act_summary)
                            cached_parsed = get_cached_parsed(act_id, act_summary, current_classification_hash)
                            if cached_parsed:
                                print_debug(f"✅ Using cached parsed data for activity {act_id}")
                                activity_type = cached_parsed.get('type') or cached_parsed.get('activityType') or ''
                                if activity_type == 'swimming' or 'swim' in str(activity_type).lower():
                                    day_swim.append(cached_parsed)
                                elif activity_type == 'jumpRope' or 'jump' in str(activity_type).lower():
                                    day_jump.append(cached_parsed)
                                else:
                                    day_cardio.append(cached_parsed)
                                continue
                            
                            # OPTIMISATION : Parser summary d'abord pour identifier si details nécessaires
                            is_swimming_preview, is_jump_rope_preview, is_cardio_preview = classify_activity(act_summary, None)
                            
                            # Récupérer les détails complets : natation, corde, et courses (tours, allure, cadence, intervalles)
                            act_details = None
                            # Toute activité cardio : get_activity() — sinon le résumé liste seul manque souvent
                            # distance, allure, cadence, tours (surtout indoor_cardio / types génériques Garmin).
                            needs_details = (
                                is_swimming_preview
                                or is_jump_rope_preview
                                or is_cardio_preview
                                or is_running_like_activity(act_summary)
                            )
                            
                            if needs_details:
                                try:
                                    # 🔴 FIX #38: Retry automatique pour get_activity
                                    act_details = _get_activity_with_retry(client, act_id)
                                    # Splits / details : intervalles, distance, cadence (toute cardio avec détails)
                                    if act_details and (
                                        is_running_like_activity(act_summary) or is_cardio_preview
                                    ):
                                        act_details = _enrich_act_details_for_running(
                                            client, act_id, act_details
                                        )
                                except Exception as e:
                                    print_debug(f"Failed to get_activity({act_id}) after retries: {e}")
                                    pass
                            
                            # Classification d'activité avec parser modulaire
                            is_swimming, is_jump_rope, is_cardio = classify_activity(act_summary, act_details)
                            act = act_details if act_details else act_summary
                            entry_base, summary_dto, distance_m = parse_common_metrics(act, act_details, act_summary)
                            
                            # 🟢 PRIORITÉ 3 : Parser les zones de FC depuis l'activité
                            max_hr = entry_base.get("maxHR", 0)
                            hr_zones = parse_heart_rate_zones_from_activity(act, act_details, act_summary, max_hr)
                            
                            # Si zones non disponibles depuis API, essayer de calculer depuis time series si disponible
                            if not hr_zones and act_details:
                                # Chercher time series de FC dans act_details
                                hr_time_series = None
                                if isinstance(act_details, dict):
                                    hr_time_series = (
                                        act_details.get('heartRateDTO') or
                                        act_details.get('heartRate') or
                                        {}
                                    )
                                    if isinstance(hr_time_series, dict):
                                        hr_time_series = hr_time_series.get('heartRateValues') or hr_time_series.get('values') or []
                                
                                if hr_time_series and isinstance(hr_time_series, list) and len(hr_time_series) > 0:
                                    # Convertir au format attendu : [{timestamp, bpm}]
                                    time_series_formatted = []
                                    for point in hr_time_series:
                                        if isinstance(point, dict):
                                            bpm = point.get('bpm') or point.get('value') or point.get('heartRate')
                                            timestamp = point.get('timestamp') or point.get('time')
                                            if bpm and timestamp:
                                                time_series_formatted.append({
                                                    "timestamp": str(timestamp),
                                                    "bpm": safe_int(bpm, 0)
                                                })
                                    
                                    if len(time_series_formatted) > 0:
                                        hr_zones = calculate_heart_rate_zones_from_time_series(time_series_formatted, max_hr)
                                        if hr_zones:
                                            print_debug(f"✅ Calculated heart rate zones from time series for activity {act_id}")
                            
                            # Ajouter zones de FC à entry_base si disponibles
                            if hr_zones:
                                entry_base["heartRateZones"] = hr_zones
                            
                            # 🟢 NOUVEAU : Extraire time series FC depuis act_details pour fusion dans daily metrics
                            if act_details:
                                activity_hr_ts = extract_activity_heart_rate_time_series(act_details, act_summary)
                                if activity_hr_ts and len(activity_hr_ts) > 0:
                                    all_activities_hr_time_series.extend(activity_hr_ts)
                                    print_debug(f"✅ Extracted {len(activity_hr_ts)} HR time series points from activity {act_id}")
                            
                            start = act_summary.get('startTimeGMT') or act_summary.get('startTimeLocal')
                            if start:
                                entry_base["date"] = (start or d_str).split('T')[0]
                                entry_base["time"] = start.split('T')[1][:5] if 'T' in start else ""
                            else:
                                entry_base["date"] = d_str
                                entry_base["time"] = ""
                            
                            duration = entry_base.get("duration", 0)
                            
                            # 🔴 FIX #25: Vérification post-parsing robuste pour détecter mal-classifications
                            originally_swimming = is_swimming
                            originally_jump_rope = is_jump_rope
                            originally_cardio = is_cardio
                            
                            act_name_lower = (act.get('activityName') or act_summary.get('activityName') or '').lower()
                            
                            # Récupérer le type d'activité explicite de Garmin
                            act_type_dto = act_summary.get('activityTypeDTO', {}) or {}
                            act_type_key = act_type_dto.get('typeKey') or act_type_dto.get('type') or ''
                            act_type_key_lower = act_type_key.lower() if act_type_key else ''
                            
                            # 🔴 FIX CRITIQUE : Ne JAMAIS reclassifier si l'utilisateur a explicitement choisi un type
                            # Vérifier si c'est un type cardio explicite
                            is_explicitly_cardio = (
                                'cardio' in act_type_key_lower or
                                'cardio' in act_name_lower or
                                act_type_dto.get('typeId') in (11, 29)  # Type IDs pour indoor_cardio
                            )
                            
                            # Vérification 1: Si classé comme cardio mais caractéristiques de natation
                            # UNIQUEMENT si ce n'est PAS explicitement marqué comme cardio par l'utilisateur
                            # Ni une activité « course » côté Garmin (évite fausses natations sur fractionné / 5 km).
                            if (
                                is_cardio
                                and not is_swimming
                                and not is_jump_rope
                                and not is_explicitly_cardio
                                and not is_running_like_activity(act_summary)
                            ):
                                # Critères pour natation:
                                # - Distance entre 50m et 5000m (distance typique piscine)
                                # - Durée > 5min (300s)
                                # - Pas de jumps/sauts
                                # - Nom contient mots-clés natation OU distance cohérente avec natation
                                if distance_m and distance_m > 0 and duration and duration > 300:
                                    # Distance cohérente avec natation (50m-5000m)
                                    if 50 <= distance_m <= 5000:
                                        # Uniquement si le nom / l’intention évocateurs natation — jamais sur la seule distance
                                        # (sinon les courses 1–4 km avec typeKey « running » / GPS étaient reclassées en natation).
                                        if any(keyword in act_name_lower for keyword in ['swim', 'natation', 'pool', 'laps', 'crawl', 'brasse']):
                                            print_debug(f"⚠️ Activity {act_id} reclassifiée: cardio → swimming (distance={distance_m}m, duration={duration}s, name keywords)")
                                            is_swimming = True
                                            is_cardio = False
                            
                            # Vérification 2: Si classé comme natation mais nom ne correspond pas, double-vérification
                            if is_swimming and not originally_swimming:
                                # Vérifier cohérence: si distance absente ou très faible, peut-être erreur
                                if (not distance_m or distance_m < 10) and duration > 300:
                                    print_debug(f"⚠️ Activity {act_id} classée natation mais distance absente/suspecte, vérification recommandée")
                            
                            # Vérification 3: Si natation ET distance très élevée (>5000m), peut-être open water
                            if is_swimming and distance_m > 5000:
                                print_debug(f"✅ Activity {act_id} natation open water détectée (distance={distance_m}m)")
                            
                            # Vérification 4: Si cardio avec distance modérée mais pas de caractéristiques natation/corde
                            if is_cardio and distance_m and 100 <= distance_m <= 5000 and duration > 300:
                                # Vérifier si c'est peut-être une autre activité (vélo, course, etc.)
                                # Mais ne pas reclassifier automatiquement, juste logger
                                if 'run' in act_name_lower or 'course' in act_name_lower or 'marathon' in act_name_lower:
                                    print_debug(f"ℹ️ Activity {act_id} cardio avec distance cohérente course à pied (distance={distance_m}m)")
                                elif 'bike' in act_name_lower or 'vélo' in act_name_lower or 'cycling' in act_name_lower:
                                    print_debug(f"ℹ️ Activity {act_id} cardio avec distance cohérente vélo (distance={distance_m}m)")
                            
                            if is_swimming:
                                entry_base = parse_swimming_metrics(entry_base, summary_dto, distance_m, act, act_details, act_summary, duration)
                                entry_base["type"] = "swimming"
                                if originally_cardio:
                                    print_debug(f"✅ Activity {act_id} reclassifiée: cardio → swimming")
                                # 🔴 FIX : Sauvegarder cache avec hash de classification
                                cache_parsed(act_id, act_summary, entry_base, current_classification_hash)
                                day_swim.append(entry_base)
                            elif is_jump_rope:
                                entry_base, connect_iq = parse_jump_rope_metrics(entry_base, summary_dto, act, act_details, act_summary, duration)
                                if connect_iq and 'maxContinuousJumps' in connect_iq and 'jumps' in connect_iq:
                                    if connect_iq['maxContinuousJumps'] > connect_iq['jumps']:
                                        connect_iq['maxContinuousJumps'] = min(connect_iq['maxContinuousJumps'], connect_iq['jumps'])
                                if connect_iq:
                                    entry_base["connectIQ"] = connect_iq
                                entry_base["type"] = "jumpRope"
                                # 🔴 FIX : Sauvegarder cache avec hash de classification
                                cache_parsed(act_id, act_summary, entry_base, current_classification_hash)
                                day_jump.append(entry_base)
                            else:
                                activity_name = act.get('activityName') or act_summary.get('activityName') or 'Cardio'
                                act_type_dto = act_summary.get('activityTypeDTO', {}) or {}
                                act_type_key = act_type_dto.get('typeKey') or act_type_dto.get('type') or 'indoor_cardio'
                                # Parser métriques course / tours dès qu’on a le détail activité (pas seulement typeKey « running »)
                                if act_details:
                                    entry_base = parse_run_cardio_metrics(
                                        entry_base,
                                        summary_dto,
                                        act,
                                        act_details,
                                        act_summary,
                                        distance_m,
                                        duration,
                                    )
                                # Affichage : clés génériques Garmin + GPS → afficher « running » pour l’UI
                                display_type_key = act_type_key
                                tk_low = (act_type_key or '').lower()
                                loc = entry_base.get('location') or {}
                                has_gps = bool(loc.get('start') or loc.get('end'))
                                _gps_running_types = (
                                    'indoor_cardio',
                                    'cardio',
                                    'fitness_equipment',
                                    'hiit',
                                )
                                if has_gps and (
                                    tk_low in _gps_running_types
                                    or ('cardio' in tk_low and tk_low != 'open_water_swimming')
                                ):
                                    display_type_key = 'running'
                                entry_base.update({
                                    "jumps": None,
                                    "connectIQ": None,
                                    "activityName": activity_name,
                                    "activityType": display_type_key,
                                    "garminTypeKey": act_type_key,
                                    "type": "cardio"
                                })
                                # 🔴 FIX : Sauvegarder cache avec hash de classification
                                cache_parsed(act_id, act_summary, entry_base, current_classification_hash)
                                day_cardio.append(entry_base)
                        except Exception as e:
                            # 🟢 PRIORITÉ 4 : Tracking amélioré des erreurs de parsing avec contexte détaillé
                            import traceback
                            error_context = {
                                "activity_id": act_id,
                                "date": d_str,
                                "activity_name": act_summary.get('activityName', 'unknown'),
                                "activity_type": act_summary.get('activityTypeDTO', {}).get('typeKey', 'unknown'),
                                "has_details": act_details is not None,
                                "context": "activity_parsing"
                            }
                            
                            # Déterminer la sévérité selon le type d'erreur
                            severity = ErrorSeverity.ERROR
                            recoverable = True
                            recovery_action = "Skipped activity, continuing with next"
                            
                            # Si c'est une erreur de validation, c'est moins critique
                            if "ValidationError" in type(e).__name__ or "ValueError" in type(e).__name__:
                                severity = ErrorSeverity.WARNING
                            
                            # Si c'est une erreur réseau/API, c'est récupérable
                            if "ConnectionError" in type(e).__name__ or "Timeout" in type(e).__name__:
                                severity = ErrorSeverity.WARNING
                                recovery_action = "Network error, will retry on next sync"
                            
                            track_parsing_error(
                                message=f"Failed to parse activity {act_id} for {d_str}",
                                context=error_context,
                                exception=e,
                                severity=severity,
                                recoverable=recoverable,
                                recovery_action=recovery_action
                            )
                            
                            # Garder aussi l'ancien système pour compatibilité
                            error_obj = {
                                "activity_id": act_id,
                                "date": d_str,
                                "error": str(e),
                                "type": type(e).__name__,
                                "context": "activity_parsing"
                            }
                            with parsing_errors_lock:
                                parsing_errors.append(error_obj)
                            
                            continue  # Continuer avec l'activité suivante
            except Exception as e:
                # 🟢 PRIORITÉ 4 : Tracking des erreurs générales dans traitement des activités
                track_parsing_error(
                    message=f"General error processing activities for {d_str}",
                    context={
                        "date": d_str,
                        "context": "activities_processing"
                    },
                    exception=e,
                    severity=ErrorSeverity.ERROR,
                    recoverable=True,
                    recovery_action="Continuing with daily metrics"
                )
                print_debug(f"Erreur général activités {d_str}: {e}")
            
            # Métriques quotidiennes
            # 🟢 OPTIMISATION : Utiliser récupération parallèle pour aujourd'hui (gain de temps ~90%)
            # ✅ PHASE 2.5 : Utiliser récupération incrémentale pour FC si lastSyncTimestamp fourni
            # ✅ PHASE 3.1 : Vérifier cache parsé avant appels API si lastSyncTimestamp récent
            if d_str == current_date:
                # ✅ PHASE 3.1 : Si lastSyncTimestamp < 5 minutes, vérifier cache parsé AVANT les appels API
                
                if last_sync_timestamp_for_date:
                    try:
                        from datetime import datetime, timezone
                        last_sync_dt = datetime.fromisoformat(last_sync_timestamp_for_date.replace('Z', '+00:00'))
                        if last_sync_dt.tzinfo is None:
                            last_sync_dt = last_sync_dt.replace(tzinfo=timezone.utc)
                        now_dt = datetime.now(timezone.utc)
                        last_sync_age_minutes = (now_dt - last_sync_dt).total_seconds() / 60
                        
                        # Si sync il y a moins de 5 minutes, vérifier le cache parsé
                        if last_sync_age_minutes < 5:
                            print_debug(f"✅ PHASE 3.1 - Sync récente ({last_sync_age_minutes:.1f} min), vérification cache parsé avant appels API...")
                            # ✅ PHASE 3.1 : Utiliser fonction helper pour trouver cache le plus récent (indépendamment du hash)
                            cached_daily_before_api = get_latest_cached_daily_metrics(d_str)
                            
                            # Si cache disponible et valide (pas vide, pas de métadonnées de cache seulement)
                            if cached_daily_before_api:
                                # Vérifier que ce n'est pas juste des métadonnées
                                cache_content = {k: v for k, v in cached_daily_before_api.items() if not k.startswith('_')}
                                if cache_content and (cache_content.get('steps', 0) > 0 or cache_content.get('calories', {}).get('total', 0) > 0):
                                    should_skip_api_calls = True
                                    print_debug(f"✅ PHASE 3.1 - Cache parsé disponible, skip appels API pour steps/stats (économie de requêtes Garmin)")
                                else:
                                    print_debug(f"⚠️ PHASE 3.1 - Cache parsé vide ou invalide, récupération API nécessaire")
                            else:
                                print_debug(f"ℹ️ PHASE 3.1 - Pas de cache parsé disponible, récupération API nécessaire")
                    except Exception as e:
                        print_debug(f"⚠️ PHASE 3.1 - Erreur vérification cache: {e}, récupération API normale")
                
                if should_skip_api_calls and cached_daily_before_api:
                    # ✅ PHASE 3.1 : Utiliser cache parsé, ne PAS faire les appels API pour steps/stats
                    # Mais on récupère quand même body_battery, stress, spo2, sleep, respiration, intensity (peuvent avoir changé)
                    print_debug(f"✅ PHASE 3.1 - Utilisation cache parsé, récupération sélective (body_battery, stress, etc.)")
                    
                    # Récupérer uniquement les métriques qui peuvent changer rapidement
                    from concurrent.futures import ThreadPoolExecutor, as_completed
                    parallel_results = {
                        "steps_data": None,  # ✅ PHASE 3.1 : Skip API call
                        "stats": None,  # ✅ PHASE 3.1 : Skip API call
                        "hr_day": None,  # Sera géré par fetch_heart_rate_incremental
                        "body_battery_data": None,
                        "stress_data": None,
                        "spo2_data": None,
                        "sleep": None,
                        "respiration_data": None,
                        "intensity_data": None
                    }
                    
                    # ✅ PHASE 3.1 : Récupérer uniquement les métriques qui peuvent changer rapidement
                    # Fonctions helper pour éviter problèmes avec lambda dans executor
                    def _fetch_body_battery_wrapper():
                        try:
                            return ("body_battery_data", fetch_body_battery_api(client, d_str))
                        except Exception as e:
                            print_debug(f"⚠️ Failed to fetch_body_battery({d_str}): {e}")
                            return ("body_battery_data", None)
                    
                    def _fetch_stress_wrapper():
                        try:
                            return ("stress_data", fetch_stress_api(client, d_str))
                        except Exception as e:
                            print_debug(f"⚠️ Failed to fetch_stress({d_str}): {e}")
                            return ("stress_data", None)
                    
                    def _fetch_spo2_wrapper():
                        try:
                            return ("spo2_data", fetch_spo2_api(client, d_str))
                        except Exception as e:
                            print_debug(f"⚠️ Failed to fetch_spo2({d_str}): {e}")
                            return ("spo2_data", None)
                    
                    def _fetch_sleep_wrapper():
                        try:
                            return ("sleep", _get_sleep_data_with_retry(client, d_str))
                        except Exception as e:
                            print_debug(f"⚠️ Failed to get_sleep_data({d_str}): {e}")
                            return ("sleep", None)
                    
                    def _fetch_respiration_wrapper():
                        try:
                            return ("respiration_data", _get_respiration_data_with_retry(client, d_str))
                        except Exception as e:
                            print_debug(f"⚠️ Failed to get_respiration_data({d_str}): {e}")
                            return ("respiration_data", None)
                    
                    def _fetch_intensity_wrapper():
                        try:
                            return ("intensity_data", _get_intensity_minutes_with_retry(client, d_str))
                        except Exception as e:
                            print_debug(f"⚠️ Failed to get_intensity_minutes({d_str}): {e}")
                            return ("intensity_data", None)
                    
                    with ThreadPoolExecutor(max_workers=6) as executor:
                        futures = {
                            executor.submit(_fetch_body_battery_wrapper): "body_battery_data",
                            executor.submit(_fetch_stress_wrapper): "stress_data",
                            executor.submit(_fetch_spo2_wrapper): "spo2_data",
                            executor.submit(_fetch_sleep_wrapper): "sleep",
                            executor.submit(_fetch_respiration_wrapper): "respiration_data",
                            executor.submit(_fetch_intensity_wrapper): "intensity_data"
                        }
                        
                        for future in as_completed(futures):
                            try:
                                key, value = future.result()
                                parallel_results[key] = value
                            except Exception as e:
                                print_debug(f"⚠️ Error in selective fetch for {futures[future]}: {e}")
                    
                    steps_data = None  # ✅ PHASE 3.1 : Pas d'appel API
                    stats = None  # ✅ PHASE 3.1 : Pas d'appel API
                    body_battery_data = parallel_results["body_battery_data"]
                    stress_data = parallel_results["stress_data"]
                    spo2_data = parallel_results["spo2_data"]
                    sleep = parallel_results["sleep"]
                    respiration_data = parallel_results["respiration_data"]
                    intensity_data = parallel_results["intensity_data"]
                    
                    # Utiliser le cache parsé pour steps/calories/distance
                    print_debug(f"✅ PHASE 3.1 - Utilisation valeurs du cache parsé pour steps/calories/distance")
                else:
                    # Récupération normale (toutes les métriques en parallèle)
                    print_debug(f"🚀 Using parallel fetch for today ({d_str})...")
                    
                    # Récupérer toutes les métriques en parallèle (steps, stats, body battery, etc.)
                    parallel_results = fetch_today_metrics_parallel(client, d_str)
                    steps_data = parallel_results["steps_data"]
                    stats = parallel_results["stats"]
                    body_battery_data = parallel_results["body_battery_data"]
                    stress_data = parallel_results["stress_data"]
                    spo2_data = parallel_results["spo2_data"]
                    sleep = parallel_results["sleep"]
                    respiration_data = parallel_results["respiration_data"]
                    intensity_data = parallel_results["intensity_data"]
                
                # ✅ PHASE 2.5 : Si lastSyncTimestamp fourni, utiliser récupération incrémentale pour FC
                if last_sync_timestamp_for_date:
                    print_debug(f"✅ Using incremental HR fetch for {d_str} since {last_sync_timestamp_for_date}")
                    hr_day_incremental = fetch_heart_rate_incremental(client, d_str, last_sync_timestamp_for_date)
                    if hr_day_incremental:
                        hr_points_count = len(hr_day_incremental.get('heartRateValues', []))
                        print_debug(f"✅ Incremental HR fetch returned {hr_points_count} points")
                        
                        # ✅ FIX B.1 : Si récupération incrémentale retourne 0 points et qu'on est après 00:15, essayer récupération complète
                        if hr_points_count == 0:
                            from datetime import datetime, time
                            now = datetime.now()
                            midnight = datetime.combine(now.date(), time.min)
                            minutes_since_midnight = (now - midnight).total_seconds() / 60
                            
                            if minutes_since_midnight > 15:
                                print_debug(f"⚠️ Récupération incrémentale vide après 00:15 (minutes: {minutes_since_midnight:.1f}), tentative récupération complète...")
                                hr_day_complete = _get_heart_rates_with_retry(client, d_str)
                                hr_values_complete = hr_day_complete.get('heartRateValues') if hr_day_complete else []
                                if hr_values_complete:
                                    hr_day = hr_day_complete
                                    print_debug(f"✅ Récupération complète réussie: {len(hr_values_complete)} points")
                                else:
                                    hr_day = hr_day_incremental  # Utiliser quand même l'incrémentale (même si vide)
                            else:
                                hr_day = hr_day_incremental  # Trop tôt dans la journée, normal qu'il n'y ait pas de données
                        else:
                            hr_day = hr_day_incremental
                    else:
                        # Fallback : utiliser hr_day de parallel_results
                        hr_day = parallel_results["hr_day"]
                        print_debug(f"⚠️ Incremental HR fetch returned None, using parallel fetch result")
                else:
                    # Pas de lastSyncTimestamp : utiliser récupération normale
                    hr_day = parallel_results["hr_day"]
            else:
                # Pour les dates passées, utiliser récupération séquentielle (moins critique)
                try:
                    steps_data = None
                    stats = None
                    hr_day = None
                    sleep = None
                    
                    try:
                        steps_data = _get_steps_data_with_retry(client, d_str)
                    except Exception as e:
                        print_debug(f"⚠️ Failed to get_steps_data({d_str}) after retries: {e}")
                        steps_data = None
                    
                    try:
                        stats = _get_stats_with_retry(client, d_str)
                        if stats:
                            print_debug(f"✅ get_stats({d_str}) returned data: keys={list(stats.keys())[:5] if isinstance(stats, dict) else 'N/A'}")
                    except Exception as e:
                        print_debug(f"Failed to get_stats({d_str}): {e}")
                        stats = None
                    
                    try:
                        hr_day = _get_heart_rates_with_retry(client, d_str)
                    except Exception as e:
                        print_debug(f"⚠️ Failed to get_heart_rates({d_str}) after retries: {e}")
                        hr_day = None
                    
                    body_battery_data = fetch_body_battery_api(client, d_str)  # ✅ FIX : Utiliser fonction renommée
                    stress_data = fetch_stress_api(client, d_str)  # ✅ FIX : Utiliser fonction renommée
                    spo2_data = fetch_spo2_api(client, d_str)  # ✅ FIX : Utiliser fonction renommée
                    
                    try:
                        sleep = _get_sleep_data_with_retry(client, d_str)
                    except Exception as e:
                        print_debug(f"⚠️ Failed to get_sleep_data({d_str}) after retries: {e}")
                        sleep = None
                    
                    respiration_data = None
                    try:
                        respiration_data = _get_respiration_data_with_retry(client, d_str)
                    except Exception as e:
                        print_debug(f"⚠️ Failed to get_respiration_data({d_str}) after retries: {e}")
                        respiration_data = None
                    
                    intensity_data = None
                    try:
                        intensity_data = _get_intensity_minutes_with_retry(client, d_str)
                    except Exception as e:
                        print_debug(f"⚠️ Failed to get_intensity_minutes({d_str}) after retries: {e}")
                        intensity_data = None
                except Exception as e:
                    print_debug(f"❌ Error fetching metrics for {d_str}: {e}")
                    steps_data = stats = hr_day = sleep = None
                    body_battery_data = stress_data = spo2_data = respiration_data = intensity_data = None

            # Normaliser les structures potentiellement None pour éviter les TypeError (len(None), attributs manquants, etc.)
            if steps_data is None:
                steps_data = {}
            if stats is None:
                stats = {}
            if hr_day is None:
                hr_day = {}
            if sleep is None:
                sleep = {}
            if body_battery_data is None:
                body_battery_data = {}
            if stress_data is None:
                stress_data = {}
            if spo2_data is None:
                spo2_data = {}
            if respiration_data is None:
                respiration_data = {}
            if intensity_data is None:
                intensity_data = {}
            
            # 🟢 OPTIMISATION : Vérifier le cache avant de parser les métriques quotidiennes
            raw_data_hash = get_raw_data_hash(
                stats, steps_data, hr_day, sleep,
                body_battery_data, stress_data, spo2_data,
                respiration_data, intensity_data, d_str
            )
            
            # ✅ PHASE 3.1 : Flag pour indiquer si on doit skip le parsing statique (steps/calories/distance)
            should_skip_static_parsing = False
            
            # ✅ PHASE 3.1 : Si on a utilisé le cache parsé avant les appels API, l'utiliser maintenant
            if should_skip_api_calls and cached_daily_before_api:
                # ✅ PHASE 3.1 : Utiliser le cache parsé pour steps/calories/distance
                print_debug(f"✅ PHASE 3.1 - Utilisation cache parsé pour steps/calories/distance (évite parsing depuis API)")
                # Utiliser le cache parsé comme base
                cached_daily = cached_daily_before_api
                should_skip_static_parsing = True  # ✅ PHASE 3.1 : Skip parsing statique
                # Note : Les métriques dynamiques (body_battery, stress, etc.) seront parsées depuis les données récupérées
            # ✅ FIX A.2 : Ne pas utiliser le cache si récupération incrémentale (données peuvent avoir changé)
            elif last_sync_timestamp_for_date and d_str == current_date:
                print_debug(f"🔄 Récupération incrémentale active, bypass du cache pour {d_str}")
                cached_daily = None
            else:
                # Essayer de récupérer depuis le cache
                cached_daily = get_cached_daily_metrics(d_str, raw_data_hash)
            
            if cached_daily:
                # ✅ FIX A.1 : Ne pas utiliser le cache si données vides et après 00:15
                # ✅ PHASE 3.1 : Exception : si cache utilisé pour Phase 3.1, ne pas vérifier (déjà validé)
                from datetime import datetime, time
                is_phase3_cache = should_skip_api_calls and cached_daily == cached_daily_before_api
                
                if not is_phase3_cache:
                    # Validation normale du cache (pas Phase 3.1)
                    now = datetime.now()
                    midnight = datetime.combine(now.date(), time.min)
                    minutes_since_midnight = (now - midnight).total_seconds() / 60
                    
                    # Retirer les métadonnées de cache avant de vérifier
                    day_daily_temp = {k: v for k, v in cached_daily.items() 
                                   if not k.startswith('_')}
                    
                    # Vérifier si données sont vides
                    is_empty = (
                        day_daily_temp.get('steps', 0) == 0 and
                        day_daily_temp.get('calories', {}).get('total', 0) == 0 and
                        len(day_daily_temp.get('heartRate', {}).get('timeSeries', [])) == 0
                    )
                    
                    # Si données vides et après 00:15, invalider le cache
                    if is_empty and minutes_since_midnight > 15 and d_str == current_date:
                        print_debug(f"⚠️ Cache invalidé: données vides pour {d_str} après 00:15 (minutes depuis minuit: {minutes_since_midnight:.1f})")
                        cached_daily = None  # Forcer re-parsing
                    else:
                        print_debug(f"✅ Using cached daily metrics for {d_str}")
                        # Retirer les métadonnées de cache avant de l'utiliser
                        day_daily = day_daily_temp
                        # S'assurer que toutes les clés de base sont présentes (même si vides)
                        if 'calories' not in day_daily:
                            day_daily['calories'] = {"total": 0, "active": 0, "resting": 0}
                        if 'heartRate' not in day_daily:
                            day_daily['heartRate'] = {"resting": 0, "max": 0, "avg": 0, "timeSeries": []}
                else:
                    # ✅ PHASE 3.1 : Utiliser cache directement (déjà validé avant)
                    print_debug(f"✅ PHASE 3.1 - Using validated cache for {d_str}")
                    day_daily_temp = {k: v for k, v in cached_daily.items() if not k.startswith('_')}
                    day_daily = day_daily_temp.copy()  # Copie pour éviter modifications
                    # S'assurer que toutes les clés de base sont présentes (même si vides)
                    if 'calories' not in day_daily:
                        day_daily['calories'] = {"total": 0, "active": 0, "resting": 0}
                    if 'heartRate' not in day_daily:
                        day_daily['heartRate'] = {"resting": 0, "max": 0, "avg": 0, "timeSeries": []}
                    
                    # ✅ PHASE 3.1 : Parser les métriques dynamiques (body_battery, stress, etc.) depuis les données récupérées
                    # Ces métriques peuvent avoir changé rapidement, donc on les récupère toujours
                    print_debug(f"✅ PHASE 3.1 - Parsing métriques dynamiques (body_battery, stress, etc.) depuis données récupérées...")
                    # On marque un flag pour indiquer qu'on doit fusionner après le parsing normal
                    day_daily['_phase3_merge_needed'] = True
            
            # ✅ PHASE 3.1 : Parser les métriques dynamiques même si cache Phase 3.1 utilisé
            if not cached_daily or should_skip_static_parsing:
                # Pas de cache valide, ou cache Phase 3.1 utilisé (on parse seulement les métriques dynamiques)
                if should_skip_static_parsing:
                    print_debug(f"✅ PHASE 3.1 - Parsing métriques dynamiques uniquement (steps/calories/distance depuis cache)")
                else:
                    print_debug(f"🔄 Parsing daily metrics for {d_str} (cache miss or expired)")
                
                # ✅ PHASE 3.1 : Parser steps/calories/distance seulement si pas de cache Phase 3.1
                if not should_skip_static_parsing:
                    # ✅ FIX B.3 : Logs détaillés pour diagnostic
                    print_debug(f"📊 Stats récupérés: {bool(stats)}, clés: {list(stats.keys())[:10] if stats and isinstance(stats, dict) else 'None'}")
                    print_debug(f"👣 Steps récupérés: {bool(steps_data)}, clés: {list(steps_data.keys())[:10] if steps_data and isinstance(steps_data, dict) else 'None'}")
                    hr_values_raw = hr_day.get('heartRateValues') if hr_day and isinstance(hr_day, dict) else []
                    hr_values_count = len(hr_values_raw or [])
                    print_debug(f"❤️ HR récupérés: {bool(hr_day)}, points: {hr_values_count}")
                    print_debug(f"💤 Sleep récupéré: {bool(sleep)}, type: {type(sleep)}")
                    print_debug(f"🔋 Body Battery récupéré: {bool(body_battery_data)}, type: {type(body_battery_data)}")
                    print_debug(f"😰 Stress récupéré: {bool(stress_data)}, type: {type(stress_data)}")
                    print_debug(f"🫁 SpO2 récupéré: {bool(spo2_data)}, type: {type(spo2_data)}")
                    
                    # ✅ FIX B.2 : Validation des données brutes avant parsing
                    # Vérifier que les données ne sont pas toutes vides/None (structure valide mais données absentes)
                    has_any_raw_data = (
                        (stats and isinstance(stats, dict) and len(stats) > 0) or
                        (steps_data and isinstance(steps_data, dict) and len(steps_data) > 0) or
                        (hr_day and isinstance(hr_day, dict) and len((hr_day.get('heartRateValues') or [])) > 0) or
                        (sleep and isinstance(sleep, dict) and len(sleep) > 0) or
                        (body_battery_data is not None) or
                        (stress_data is not None) or
                        (spo2_data is not None)
                    )
                    
                    if not has_any_raw_data and d_str == current_date:
                        from datetime import datetime, time
                        now = datetime.now()
                        midnight = datetime.combine(now.date(), time.min)
                        minutes_since_midnight = (now - midnight).total_seconds() / 60
                        
                        if minutes_since_midnight > 15:
                            print_debug(f"⚠️⚠️ Aucune donnée brute récupérée pour {d_str} après 00:15 (minutes: {minutes_since_midnight:.1f})")
                            print_debug(f"⚠️ Cela peut indiquer un problème de récupération depuis l'API Garmin")
                        else:
                            print_debug(f"ℹ️ Aucune donnée brute encore disponible pour {d_str} (trop tôt dans la journée: {minutes_since_midnight:.1f} min)")
                
                # Utiliser parsers modulaires (pour aujourd'hui ET dates passées)
                try:
                    # ✅ PHASE 3.1 : Parser steps/calories/distance seulement si pas de cache Phase 3.1
                    if not should_skip_static_parsing:
                        day_daily["steps"] = parse_daily_steps(steps_data, d_str)
                        day_daily["distance"] = parse_daily_distance(stats, steps_data, d_str, day_swim, day_jump, day_cardio)
                        day_daily["floors"] = parse_daily_floors(stats)
                        
                        # 🟡 FIX : Essayer de parser calories depuis stats ET steps_data pour aujourd'hui
                        calories = parse_daily_calories(stats, d_str, steps_data if d_str == current_date else None)
                        day_daily["calories"].update(calories)
                    else:
                        # ✅ PHASE 3.1 : Utiliser valeurs du cache pour steps/calories/distance
                        print_debug(f"✅ PHASE 3.1 - Utilisation valeurs cache pour steps/calories/distance (skip parsing statique)")
                        # Les valeurs sont déjà dans day_daily depuis le cache
                    
                    # 🔴 FIX CRITIQUE : Si toujours à 0 pour aujourd'hui, recherche récursive dans TOUTES les données
                    # ✅ PHASE 3.1 : Skip cette vérification si on utilise le cache (calories déjà validées)
                    if not should_skip_static_parsing and d_str == current_date:
                        # Récupérer calories depuis day_daily (peut être depuis cache ou parsing)
                        calories_check = day_daily.get("calories", {})
                        if calories_check.get("total", 0) == 0 and calories_check.get("active", 0) == 0 and calories_check.get("resting", 0) == 0:
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
                    # 🟢 PRIORITÉ 4 : Tracking amélioré des erreurs de parsing calories
                    track_parsing_error(
                        message=f"Failed to parse calories for {d_str}",
                        context={
                            "date": d_str,
                            "is_today": d_str == current_date,
                            "has_stats": stats is not None,
                            "has_steps_data": steps_data is not None,
                            "field": "calories"
                        },
                        exception=e,
                        severity=ErrorSeverity.WARNING,
                        recoverable=True,
                        recovery_action="Using default values (0)"
                    )
                    print_debug(f"❌ ERROR parsing calories for {d_str}: {e}")
                    import traceback
                    print_debug(f"Traceback: {traceback.format_exc()}")
                
                try:
                    # 🟡 FIX : Heart rate depuis stats et hr_day, mais aussi essayer steps_data pour aujourd'hui
                    # 🟢 NOUVEAU : Passer les time series des activités pour fusion (déjà extraites lors du parsing)
                    # 🟢 NOUVEAU : Passer aussi les activités pour interpolation intelligente
                    # 🟢 PHASE 4 : Extraire les FC du sommeil et les fusionner
                    all_activities = day_swim + day_jump + day_cardio
                    sleep_hr_time_series = None
                    if sleep and isinstance(sleep, dict):
                        try:
                            sleep_hr_time_series = extract_heart_rate_from_sleep(sleep, d_str)
                            if sleep_hr_time_series and len(sleep_hr_time_series) > 0:
                                print_debug(f"✅ Extracted {len(sleep_hr_time_series)} HR points from sleep data for {d_str}")
                        except Exception as e:
                            print_debug(f"⚠️ Error extracting HR from sleep for {d_str}: {e}")
                            sleep_hr_time_series = None
                    
                    heart_rate = parse_daily_heart_rate(
                        stats, 
                        hr_day, 
                        d_str, 
                        steps_data if d_str == current_date else None,
                        all_activities_hr_time_series if all_activities_hr_time_series else None,
                        all_activities if all_activities else None,
                        sleep_hr_time_series  # 🟢 PHASE 4 : FC du sommeil
                    )
                    day_daily["heartRate"].update(heart_rate)
                    
                    # 🟢 PRIORITÉ 3 : Calculer zones de FC quotidiennes depuis time series
                    if heart_rate.get("timeSeries") and len(heart_rate.get("timeSeries", [])) > 0:
                        daily_zones = parse_daily_heart_rate_zones(day_daily, d_str)
                        if daily_zones:
                            day_daily["heartRateZones"] = daily_zones
                            print_debug(f"✅ Calculated daily heart rate zones for {d_str}")
                    
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
                    # 🟢 PRIORITÉ 4 : Tracking amélioré des erreurs de parsing heart rate
                    track_parsing_error(
                        message=f"Failed to parse heart rate for {d_str}",
                        context={
                            "date": d_str,
                            "is_today": d_str == current_date,
                            "has_stats": stats is not None,
                            "has_hr_day": hr_day is not None,
                            "has_steps_data": steps_data is not None,
                            "field": "heartRate"
                        },
                        exception=e,
                        severity=ErrorSeverity.WARNING,
                        recoverable=True,
                        recovery_action="Using default values (0)"
                    )
                    print_debug(f"❌ ERROR parsing heart rate for {d_str}: {e}")
                    import traceback
                    print_debug(f"Traceback: {traceback.format_exc()}")
                
                try:
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
                    # 🟢 PRIORITÉ 4 : Tracking des erreurs critiques dans le parsing quotidien
                    track_parsing_error(
                        message=f"Critical error in daily metrics parsing for {d_str}",
                        context={
                            "date": d_str,
                            "is_today": d_str == current_date,
                            "field": "daily_metrics",
                            "has_sleep": sleep is not None,
                            "has_body_battery": body_battery_data is not None,
                            "has_stress": stress_data is not None
                        },
                        exception=e,
                        severity=ErrorSeverity.ERROR,
                        recoverable=True,
                        recovery_action="Partial metrics saved, missing fields will be None"
                    )
                    print_debug(f"❌ CRITICAL ERROR in daily metrics parsing for {d_str}: {e}")
                
                # 🟢 OPTIMISATION : Mettre en cache les métriques parsées
                # Préparer les métriques pour le cache (inclure la date)
                metrics_to_cache = day_daily.copy()
                metrics_to_cache['date'] = d_str
                
                try:
                    cache_daily_metrics(d_str, raw_data_hash, metrics_to_cache)
                    print_debug(f"✅ Cached daily metrics for {d_str}")
                except Exception as e:
                    print_debug(f"⚠️ Failed to cache daily metrics for {d_str}: {e}")
            
            # 🟢 PRIORITÉ 5 : Agrégation des métriques de performance quotidiennes depuis les activités
            all_activities = day_swim + day_jump + day_cardio
            if all_activities:
                try:
                    daily_performance = aggregate_daily_performance_metrics(all_activities, d_str)
                    if daily_performance:
                        day_daily["performance"] = daily_performance
                        print_debug(f"✅ Added daily performance metrics for {d_str}")
                except Exception as e:
                    track_parsing_error(
                        message=f"Failed to aggregate daily performance metrics for {d_str}",
                        context={
                            "date": d_str,
                            "activities_count": len(all_activities),
                            "field": "performance"
                        },
                        exception=e,
                        severity=ErrorSeverity.WARNING,
                        recoverable=True,
                        recovery_action="Skipping daily performance aggregation, continuing"
                    )
                    print_debug(f"⚠️ Failed to aggregate daily performance metrics for {d_str}: {e}")
            
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
        
        # ✅ PHASE 2.5 : Déterminer le lastSyncTimestamp pour le jour en cours
        last_sync_timestamp_for_today = None
        if arg_last_sync_timestamp and current_date in dates_to_process:
            last_sync_timestamp_for_today = arg_last_sync_timestamp
            print_debug(f"✅ Using incremental sync for today ({current_date}) with lastSyncTimestamp: {last_sync_timestamp_for_today}")
        
        if len(dates_to_process) > 1 and max_workers > 1:
            print_debug(f"Parallélisation activée : {len(dates_to_process)} jours avec {max_workers} workers")
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # ✅ PHASE 2.5 : Passer lastSyncTimestamp uniquement pour le jour en cours
                future_to_date = {
                    executor.submit(
                        process_day, 
                        d_str, 
                        last_sync_timestamp_for_today if d_str == current_date else None
                    ): d_str 
                    for d_str in dates_to_process
                }
                
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
                        raise
        else:
            # Pas de parallélisation si 1 seul jour ou workers insuffisants
            for d_str in dates_to_process:
                try:
                    # ✅ PHASE 2.5 : Passer lastSyncTimestamp uniquement pour le jour en cours
                    result = process_day(
                        d_str, 
                        last_sync_timestamp_for_today if d_str == current_date else None
                    )
                    swim_list.extend(result["swim"])
                    jump_list.extend(result["jump"])
                    cardio_list.extend(result["cardio"])
                    daily_dict[result["date"]] = result["daily"]
                except Exception as e:
                    print_debug(f"❌ ERROR processing day {d_str}: {e}")
                    raise
        
        # Finaliser les données pour le JSON de sortie
        payload = {
            "activities": {
                "swimming": swim_list,
                "jumpRope": jump_list,
                "cardio": cardio_list
            },
            "dailyMetrics": daily_dict,  # Contient TOUTES les dates
        }
        
        # 🔴 FIX #23: Ajouter les erreurs de parsing dans la réponse si présentes
        if parsing_errors:
            payload["parsing_errors"] = parsing_errors
            print_debug(f"⚠️ {len(parsing_errors)} erreur(s) de parsing capturée(s)")
        
        # 🟢 PRIORITÉ 4 : Ajouter statistiques d'erreurs dans la réponse
        error_tracker = get_error_tracker()
        error_stats = error_tracker.get_stats()
        if error_stats["total"] > 0:
            payload["error_stats"] = {
                "total": error_stats["total"],
                "by_category": error_stats["by_category"],
                "by_severity": error_stats["by_severity"],
                "recoverable": error_stats["recoverable"],
                "unrecoverable": error_stats["unrecoverable"]
            }
            # Inclure les 10 dernières erreurs pour debugging
            payload["recent_errors"] = error_stats["recent_errors"][:10]
            print_debug(f"📊 Error tracking: {error_stats['total']} total errors ({error_stats['recoverable']} recoverable, {error_stats['unrecoverable']} unrecoverable)")
        
        # ✅ PHASE 1 : Logging détaillé avant envoi JSON
        activities_count = sum(len(arr) for arr in payload.get("activities", {}).values() if isinstance(arr, list))
        daily_metrics_count = len(payload.get("dailyMetrics", {}))
        print_debug(f"[🔍 DIAGNOSTIC PYTHON] Données finales - Activités: {activities_count}, Métriques: {daily_metrics_count}, LastSync: {now_iso}")
        if arg_last_sync_timestamp:
            print_debug(f"[🔍 DIAGNOSTIC PYTHON] Récupération incrémentale depuis: {arg_last_sync_timestamp}")
        
        print_json_ok(payload)
        raise SystemExit(0)
    except Exception as e:
        # Erreur critique (login, etc.) → renvoyer erreur explicite, pas mock
        print_json_err(str(e))
        raise SystemExit(1)
else:
    # 🔴 Pas d'identifiants → retourner payload vide (pas de données mock)
    print_json_ok({
        "activities": {
            "swimming": [],
            "jumpRope": [],
            "cardio": []
        },
        "dailyMetrics": {}
    })
    raise SystemExit(0)
