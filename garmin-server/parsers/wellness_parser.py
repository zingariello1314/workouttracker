"""
Parser Wellness Garmin - Body Battery, Stress, SpO2
PRIORITÉ: Contient les corrections critiques pour Body Battery, Stress, SpO2
"""
import sys
import os
from typing import Any, Dict, Optional

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug, normalize_datetime_to_utc
from utils.retry import retry_with_backoff, retry_on_rate_limit
from parsers.validation_ranges import (
    BODY_BATTERY_MIN, BODY_BATTERY_MAX,
    STRESS_MIN, STRESS_MAX,
    SPO2_MIN, SPO2_MAX
)


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _fetch_body_battery_internal(client: Any, date_str: str) -> Optional[Any]:
    """
    Fonction interne pour récupérer Body Battery avec retry automatique
    """
    print_debug(f"Fetching Body Battery for {date_str}...")
    # Essayer plusieurs méthodes possibles pour Body Battery
    try:
        return client.get_body_battery(date_str)
    except AttributeError:
        try:
            return client.get_body_battery_data(date_str)
        except AttributeError:
            try:
                return client.get_body_battery_values(date_str)
            except AttributeError:
                pass
    return None


def fetch_body_battery(client: Any, date_str: str) -> Optional[Any]:
    """
    🔴 FIX #38: Récupère les données Body Battery depuis Garmin client avec retry automatique.
    Essaie plusieurs méthodes possibles.
    
    Args:
        client: Client Garmin connecté
        date_str: Date au format 'YYYY-MM-DD'
        
    Returns:
        Body Battery data ou None
    """
    try:
        return _fetch_body_battery_internal(client, date_str)
    except Exception as e:
        print_debug(f"Failed to get Body Battery for {date_str} after retries: {type(e).__name__}: {e}")
        return None


def parse_body_battery(body_battery_data: Any, date_str: str) -> Optional[Dict]:
    """
    Parse Body Battery depuis les données Garmin.
    
    PHASE 3.1 : Retourne maintenant un dict avec current + timeSeries au lieu de juste int.
    
    CORRECTION CRITIQUE: Body Battery peut être:
    - Une liste de valeurs (time series) -> extraire time series complète + dernière valeur
    - Un dict avec 'bodyBattery', 'value', 'current', 'average', 'avg'
    - Un int/float direct
    
    Args:
        body_battery_data: Données Body Battery brutes
        date_str: Date pour les logs
        
    Returns:
        dict: {"current": int, "timeSeries": []} ou None si non trouvé
    """
    if not body_battery_data:
        return None
    
    print_debug(f"Body Battery data for {date_str}: {type(body_battery_data)}, keys: {list(body_battery_data.keys())[:10] if isinstance(body_battery_data, dict) else 'N/A'}")
    
    # PHASE 3.1 : Si c'est une liste, extraire time series complète + dernière valeur
    if isinstance(body_battery_data, list):
        print_debug(f"Body Battery is a list with {len(body_battery_data)} items (time series)")
        if len(body_battery_data) > 0:
            # Body Battery est une time series, extraire TOUTES les valeurs
            time_series = []
            last_value = None
            
            for item in body_battery_data:
                if isinstance(item, dict):
                    # Chercher valeur dans plusieurs champs possibles
                    value = (
                        item.get('bodyBattery') if item.get('bodyBattery') is not None else
                        item.get('value') if item.get('value') is not None else
                        item.get('current') if item.get('current') is not None else
                        item.get('bodyBatteryValue') if item.get('bodyBatteryValue') is not None else
                        item.get('batteryValue') if item.get('batteryValue') is not None else
                        None
                    )
                    timestamp = item.get('timestamp') or item.get('time') or item.get('ts')
                    
                    if value is not None:
                        # 🔴 FIX #9: Validation de plage pour Body Battery
                        body_battery_val = safe_int(
                            value, 
                            None,
                            warn_on_fail=True,
                            min_value=BODY_BATTERY_MIN,
                            max_value=BODY_BATTERY_MAX,
                            context=f"bodyBattery.{date_str}.timeSeries"
                        )
                        if body_battery_val is not None:
                            # Convertir timestamp si nécessaire
                            # 🔴 FIX #11: Normaliser timestamp en UTC
                            ts_str = normalize_datetime_to_utc(timestamp)
                            
                            time_series.append({
                                "timestamp": ts_str,
                                "value": body_battery_val
                            })
                            last_value = body_battery_val
                elif isinstance(item, (int, float)):
                    # Si la liste contient directement des nombres
                    if 0 <= item <= 100:
                        # 🔴 FIX #9: Validation de plage pour Body Battery (direct int)
                        body_battery_val = safe_int(
                            item, 
                            None,
                            warn_on_fail=True,
                            min_value=BODY_BATTERY_MIN,
                            max_value=BODY_BATTERY_MAX,
                            context=f"bodyBattery.{date_str}.timeSeries"
                        )
                        time_series.append({
                            "timestamp": None,
                            "value": body_battery_val
                        })
                        last_value = body_battery_val
            
            # Downsampling : 1 point par heure (max 24 points/jour)
            if len(time_series) > 24:
                downsampled = []
                last_hour = None
                for ts_item in time_series:
                    if ts_item.get('timestamp'):
                        try:
                            from datetime import datetime
                            ts_dt = datetime.fromisoformat(ts_item['timestamp'].replace('Z', '+00:00'))
                            hour = ts_dt.hour
                            if hour != last_hour:
                                downsampled.append(ts_item)
                                last_hour = hour
                        except:
                            # Si parsing échoue, garder quand même (limiter à 24)
                            if len(downsampled) < 24:
                                downsampled.append(ts_item)
                    else:
                        # Si pas de timestamp, garder seulement les premiers
                        if len(downsampled) < 24:
                            downsampled.append(ts_item)
                time_series = downsampled
            
            if last_value is not None:
                print_debug(f"✅ Parsed Body Battery time series for {date_str}: {len(time_series)} points, current={last_value}")
                return {
                    "current": last_value,
                    "timeSeries": time_series
                }
        else:
            print_debug(f"⚠️ Body Battery list is empty for {date_str}")
    
    # Si c'est un dict, chercher dans plusieurs champs
    if isinstance(body_battery_data, dict):
        # 🟢 PRIORITÉ 2 : Vérifier si dict contient time series (chercher dans tous les champs possibles)
        # Chercher dans l'ordre de priorité : bodyBatteryValuesArray (API Garmin), timeSeries, values, data
        time_series_data = (
            body_battery_data.get('bodyBatteryValuesArray') or  # 🟢 PRIORITÉ 2 : Champ principal de l'API Garmin
            body_battery_data.get('timeSeries') or
            body_battery_data.get('values') or
            body_battery_data.get('data') or
            body_battery_data.get('bodyBatteryValues') or
            body_battery_data.get('batteryValues')
        )
        
        if time_series_data and isinstance(time_series_data, list):
            # Dict avec time series intégrée
            time_series = []
            last_value = None
            for item in time_series_data:
                if isinstance(item, dict):
                    val = item.get('value') or item.get('bodyBattery') or item.get('battery')
                    ts = item.get('timestamp') or item.get('time')
                    if val is not None:
                        bb_val = safe_int(val, None)
                        if bb_val is not None and 0 <= bb_val <= 100:
                            time_series.append({
                                "timestamp": str(ts) if ts else None,
                                "value": bb_val
                            })
                            last_value = bb_val
            
            # Downsampling si > 24 points
            if len(time_series) > 24:
                from datetime import datetime, timezone
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
            
            if last_value is not None:
                print_debug(f"✅ Parsed Body Battery from dict time series for {date_str}: {len(time_series)} points, current={last_value}")
                return {
                    "current": last_value,
                    "timeSeries": time_series
                }
        
        # Sinon, valeur unique dans dict
        body_battery_value = safe_int(
            body_battery_data.get('bodyBattery') or
            body_battery_data.get('value') or
            body_battery_data.get('current') or
            body_battery_data.get('average') or
            body_battery_data.get('avg'),
            None
        )
        if body_battery_value is not None and body_battery_value >= 0:
            print_debug(f"✅ Parsed Body Battery for {date_str}: {body_battery_value}")
            return {
                "current": body_battery_value,
                "timeSeries": []
            }
    
    # Si c'est directement un int/float
    elif isinstance(body_battery_data, (int, float)):
        if 0 <= body_battery_data <= 100:
            # 🔴 FIX #9: Validation de plage pour Body Battery (direct)
            body_battery_value = safe_int(
                body_battery_data, 
                None,
                warn_on_fail=True,
                min_value=BODY_BATTERY_MIN,
                max_value=BODY_BATTERY_MAX,
                context=f"bodyBattery.{date_str}.direct"
            )
            print_debug(f"✅ Parsed Body Battery for {date_str} (direct): {body_battery_value}")
            return {
                "current": body_battery_value,
                "timeSeries": []
            }
    
    print_debug(f"❌ Could not parse Body Battery for {date_str}")
    return None


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _fetch_stress_internal(client: Any, date_str: str) -> Optional[Any]:
    """
    Fonction interne pour récupérer Stress avec retry automatique
    """
    print_debug(f"Fetching Stress for {date_str}...")
    # Essayer plusieurs méthodes possibles pour Stress
    try:
        return client.get_stress_data(date_str)
    except AttributeError:
        try:
            return client.get_stress_values(date_str)
        except AttributeError:
            try:
                return client.get_stress(date_str)
            except AttributeError:
                pass
    return None


def fetch_stress(client: Any, date_str: str) -> Optional[Any]:
    """
    🔴 FIX #38: Récupère les données Stress depuis Garmin client avec retry automatique.
    Essaie plusieurs méthodes possibles.
    
    Args:
        client: Client Garmin connecté
        date_str: Date au format 'YYYY-MM-DD'
        
    Returns:
        Stress data ou None
    """
    try:
        return _fetch_stress_internal(client, date_str)
    except Exception as e:
        print_debug(f"Failed to get Stress for {date_str} after retries: {type(e).__name__}: {e}")
        return None


def parse_stress(stress_data: Any, date_str: str) -> Optional[Dict]:
    """
    Parse Stress depuis les données Garmin.
    
    PHASE 3.2 : Retourne maintenant un dict avec average/max + timeSeries au lieu de juste int.
    
    CORRECTION CRITIQUE: Stress peut être:
    - Un dict avec time series + 'avgStressLevel', 'maxStressLevel', 'stress', 'value', 'average', 'avg', 'level'
    - Une liste de valeurs (time series)
    - Un int/float direct
    
    Args:
        stress_data: Données Stress brutes
        date_str: Date pour les logs
        
    Returns:
        dict: {"average": int, "max": int, "timeSeries": []} ou None si non trouvé
    """
    if not stress_data:
        return None
    
    print_debug(f"Stress data for {date_str}: {type(stress_data)}, keys: {list(stress_data.keys())[:10] if isinstance(stress_data, dict) else 'N/A'}")
    
    # PHASE 3.2 : Si c'est une liste, extraire time series
    if isinstance(stress_data, list):
        print_debug(f"Stress is a list with {len(stress_data)} items (time series)")
        if len(stress_data) > 0:
            time_series = []
            values = []
            
            for item in stress_data:
                if isinstance(item, dict):
                    val = (
                        item.get('stressLevel') or
                        item.get('value') or
                        item.get('stress') or
                        item.get('level') or
                        None
                    )
                    timestamp = item.get('timestamp') or item.get('time') or item.get('ts')
                    
                    if val is not None:
                        stress_val = safe_int(val, None)
                        if stress_val is not None and 0 <= stress_val <= 100:
                            # 🔴 FIX #11: Normaliser timestamp en UTC
                            ts_str = normalize_datetime_to_utc(timestamp)
                            
                            time_series.append({
                                "timestamp": ts_str,
                                "value": stress_val
                            })
                            values.append(stress_val)
                elif isinstance(item, (int, float)):
                    if 0 <= item <= 100:
                        stress_val = safe_int(item, None)
                        time_series.append({
                            "timestamp": None,
                            "value": stress_val
                        })
                        values.append(stress_val)
            
            # Downsampling : 1 point par heure (max 24 points/jour)
            if len(time_series) > 24:
                downsampled = []
                last_hour = None
                for ts_item in time_series:
                    if ts_item.get('timestamp'):
                        try:
                            from datetime import datetime
                            ts_dt = datetime.fromisoformat(ts_item['timestamp'].replace('Z', '+00:00'))
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
            
            if len(values) > 0:
                avg_stress = round(sum(values) / len(values))
                max_stress = max(values)
                print_debug(f"✅ Parsed Stress time series for {date_str}: {len(time_series)} points, avg={avg_stress}, max={max_stress}")
                return {
                    "average": avg_stress,
                    "max": max_stress,
                    "timeSeries": time_series
                }
    
    if isinstance(stress_data, dict):
        # 🟢 PRIORITÉ 2 : Vérifier si dict contient time series (chercher dans tous les champs possibles)
        # Chercher dans l'ordre de priorité : stressValuesArray (API Garmin), timeSeries, values, data, stressValues
        time_series_data = (
            stress_data.get('stressValuesArray') or  # 🟢 PRIORITÉ 2 : Champ principal de l'API Garmin
            stress_data.get('timeSeries') or
            stress_data.get('values') or
            stress_data.get('data') or
            stress_data.get('stressValues') or
            stress_data.get('stressLevels') or
            stress_data.get('stressData')
        )
        
        if time_series_data and isinstance(time_series_data, list):
            # Dict avec time series intégrée
            time_series = []
            values = []
            for item in time_series_data:
                if isinstance(item, dict):
                    val = item.get('value') or item.get('stressLevel') or item.get('stress') or item.get('level')
                    ts = item.get('timestamp') or item.get('time')
                    if val is not None:
                        stress_val = safe_int(val, None)
                        if stress_val is not None and 0 <= stress_val <= 100:
                            time_series.append({
                                "timestamp": str(ts) if ts else None,
                                "value": stress_val
                            })
                            values.append(stress_val)
            
            # Downsampling si > 24 points
            if len(time_series) > 24:
                from datetime import datetime, timezone
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
            
            if len(values) > 0:
                avg_stress = round(sum(values) / len(values))
                max_stress = max(values)
                print_debug(f"✅ Parsed Stress from dict time series for {date_str}: {len(time_series)} points, avg={avg_stress}, max={max_stress}")
                return {
                    "average": avg_stress,
                    "max": max_stress,
                    "timeSeries": time_series
                }
        
        # Sinon, valeur unique dans dict
        # PRIORITÉ: avgStressLevel (champ principal Garmin)
        avg_stress = safe_int(
            stress_data.get('avgStressLevel') or  # PRIORITÉ ABSOLUE
            stress_data.get('average') or
            stress_data.get('avg'),
            None
        )
        max_stress = safe_int(
            stress_data.get('maxStressLevel') or
            stress_data.get('max'),
            None
        )
        
        if avg_stress is not None and avg_stress >= 0:
            result = {
                "average": avg_stress,
                "max": max_stress if max_stress is not None else avg_stress,
                "timeSeries": []
            }
            print_debug(f"✅ Parsed Stress for {date_str}: avg={avg_stress}, max={max_stress or avg_stress}")
            return result
    
    elif isinstance(stress_data, (int, float)):
        if 0 <= stress_data <= 100:
            stress_value = safe_int(stress_data, None)
            print_debug(f"✅ Parsed Stress for {date_str} (direct): {stress_value}")
            return {
                "average": stress_value,
                "max": stress_value,
                "timeSeries": []
            }
    
    print_debug(f"❌ Could not parse Stress for {date_str}")
    return None


@retry_with_backoff(max_retries=3, base_delay=1.0)
@retry_on_rate_limit(max_retries=5, base_delay=5.0)
def _fetch_spo2_internal(client: Any, date_str: str) -> Optional[Any]:
    """
    Fonction interne pour récupérer SpO2 avec retry automatique
    """
    print_debug(f"Fetching SpO2 for {date_str}...")
    # Essayer plusieurs méthodes possibles pour SpO2
    try:
        return client.get_spo2_data(date_str)
    except AttributeError:
        try:
            return client.get_spo2_values(date_str)
        except AttributeError:
            try:
                return client.get_spo2(date_str)
            except AttributeError:
                pass
    return None


def fetch_spo2(client: Any, date_str: str) -> Optional[Any]:
    """
    🔴 FIX #38: Récupère les données SpO2 depuis Garmin client avec retry automatique.
    Essaie plusieurs méthodes possibles.
    
    Args:
        client: Client Garmin connecté
        date_str: Date au format 'YYYY-MM-DD'
        
    Returns:
        SpO2 data ou None
    """
    try:
        return _fetch_spo2_internal(client, date_str)
    except Exception as e:
        print_debug(f"Failed to get SpO2 for {date_str} after retries: {type(e).__name__}: {e}")
        return None


def parse_spo2(spo2_data: Any, date_str: str) -> Optional[int]:
    """
    Parse SpO2 depuis les données Garmin.
    
    CORRECTION CRITIQUE: SpO2 peut être:
    - Un dict avec 'spo2', 'value', 'average', 'avg', 'saturation'
    - Un int/float direct (0-100)
    
    Args:
        spo2_data: Données SpO2 brutes
        date_str: Date pour les logs
        
    Returns:
        int: Valeur SpO2 (0-100) ou None si non trouvé
    """
    if not spo2_data:
        return None
    
    print_debug(f"SpO2 data for {date_str}: {type(spo2_data)}, keys: {list(spo2_data.keys())[:10] if isinstance(spo2_data, dict) else 'N/A'}")
    
    if isinstance(spo2_data, dict):
        # SpO2 peut être une valeur unique ou un objet avec time series
        spo2_value = safe_int(
            spo2_data.get('spo2') or
            spo2_data.get('value') or
            spo2_data.get('average') or
            spo2_data.get('avg') or
            spo2_data.get('saturation'),
            None
        )
        if spo2_value is not None and 0 <= spo2_value <= 100:
            print_debug(f"✅ Parsed SpO2 for {date_str}: {spo2_value}")
            return spo2_value
    
    elif isinstance(spo2_data, (int, float)):
        if 0 <= spo2_data <= 100:
            spo2_value = safe_int(spo2_data, None)
            print_debug(f"✅ Parsed SpO2 for {date_str} (direct): {spo2_value}")
            return spo2_value
    
    print_debug(f"❌ Could not parse SpO2 for {date_str}")
    return None

