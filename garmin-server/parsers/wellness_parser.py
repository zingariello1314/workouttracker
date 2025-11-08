"""
Parser Wellness Garmin - Body Battery, Stress, SpO2
PRIORITÉ: Contient les corrections critiques pour Body Battery, Stress, SpO2
"""
import sys
import os
from typing import Any, Dict, Optional, Iterable, Tuple
from datetime import datetime, timezone

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug, normalize_datetime_to_utc, recursive_find_value
from utils.retry import retry_with_backoff, retry_on_rate_limit
from parsers.validation_ranges import (
    BODY_BATTERY_MIN, BODY_BATTERY_MAX,
    STRESS_MIN, STRESS_MAX,
    SPO2_MIN, SPO2_MAX
)

# --- Body Battery helpers ----------------------------------------------------

BODY_BATTERY_VALUE_KEYS = {
    "bodyBattery",
    "bodyBatteryValue",
    "currentBodyBattery",
    "current",
    "value",
    "level",
    "endingBodyBattery",
    "endingValue",
    "endingBatteryValue",
    "currentValue"
}
BODY_BATTERY_LIST_KEYS = {
    "bodyBatteryValuesArray",
    "bodyBatteryValues",
    "values",
    "data",
    "timeSeries",
    "bodyBatteryStatusDTOList",
    "bodyBatteryStatusList",
    "batteryValues"
}
BODY_BATTERY_TIMESTAMP_KEYS = {
    "timestamp",
    "time",
    "timeStamp",
    "dateTime",
    "startTimestampGMT",
    "startTimestampLocal",
    "measurementTimestamp",
    "measurementTimeGMT",
    "measurementTimeLocal"
}
BODY_BATTERY_PRIORITY_KEYS = [
    "currentBodyBattery",
    "bodyBattery",
    "current",
    "endingBodyBattery",
    "endingValue",
    "endingBatteryValue",
    "bodyBatteryValue",
    "value",
    "level"
]


def _normalize_timestamp_forgiving(raw: Any) -> Optional[str]:
    if raw in (None, "", 0):
        return None
    normalized = normalize_datetime_to_utc(raw)
    if normalized:
        return normalized
    if isinstance(raw, (int, float)):
        try:
            if raw > 1e12:  # assume milliseconds epoch
                dt = datetime.fromtimestamp(raw / 1000, timezone.utc)
            elif raw > 1e9:  # assume seconds epoch
                dt = datetime.fromtimestamp(raw, timezone.utc)
            else:
                return None
            return dt.isoformat().replace("+00:00", "Z")
        except Exception:
            return None
    if isinstance(raw, str):
        return raw
    return None


def _sanitize_body_battery_value(raw: Any, context: str) -> Optional[int]:
    return safe_int(
        raw,
        None,
        warn_on_fail=True,
        min_value=BODY_BATTERY_MIN,
        max_value=BODY_BATTERY_MAX,
        context=context
    )


def _register_body_battery_value(
    collector: Dict[str, Any],
    value: Optional[int],
    timestamp: Any = None,
    *,
    include_in_series: bool = True
) -> None:
    if value is None:
        return
    collector["all_values"].append(value)
    if include_in_series:
        ts_normalized = _normalize_timestamp_forgiving(timestamp)
        key = (ts_normalized, value)
        if key not in collector["seen_points"]:
            collector["time_series"].append({
                "timestamp": ts_normalized,
                "value": value
            })
            collector["seen_points"].add(key)
    else:
        collector["summary_values"].append(value)


def _collect_body_battery(data: Any, collector: Dict[str, Any], visited: set, path: str = "root") -> None:
    if data is None:
        return
    obj_id = id(data)
    if obj_id in visited:
        return
    visited.add(obj_id)

    if isinstance(data, dict):
        # Prioritised keys for current value (without necessarily having a timestamp)
        for idx, key in enumerate(BODY_BATTERY_PRIORITY_KEYS):
            if key in data and isinstance(data[key], (int, float)):
                val = _sanitize_body_battery_value(data[key], f"bodyBattery.{path}.{key}")
                if val is not None:
                    collector["priority_values"].append((idx, val))
                    include_in_series = key not in {"endingBodyBattery", "endingValue", "endingBatteryValue"}
                    _register_body_battery_value(
                        collector,
                        val,
                        timestamp=data.get("timestamp") or data.get("time") or data.get("dateTime"),
                        include_in_series=include_in_series
                    )

        # Direct value + timestamp within the same dict
        direct_value = None
        for key in BODY_BATTERY_VALUE_KEYS:
            if key in data and isinstance(data[key], (int, float)):
                direct_value = _sanitize_body_battery_value(data[key], f"bodyBattery.{path}.{key}")
                if direct_value is not None:
                    timestamp = None
                    for ts_key in BODY_BATTERY_TIMESTAMP_KEYS:
                        if ts_key in data:
                            timestamp = data.get(ts_key)
                            break
                    _register_body_battery_value(collector, direct_value, timestamp=timestamp)
        # Nested collections that may contain values
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                _collect_body_battery(value, collector, visited, path=f"{path}.{key}")

    elif isinstance(data, (list, tuple)):
        # Gestion des listes/tuples au format [timestamp, valeur]
        if len(data) >= 2:
            first, second = data[0], data[1]
            is_timestamp_candidate = isinstance(first, (int, float, str))
            is_value_candidate = isinstance(second, (int, float))
            if is_timestamp_candidate and is_value_candidate:
                value = _sanitize_body_battery_value(
                    second,
                    f"bodyBattery.{path}[1]"
                )
                if value is not None:
                    _register_body_battery_value(
                        collector,
                        value,
                        timestamp=first,
                        include_in_series=True
                    )
                # Traiter éventuellement les autres éléments de la liste
                for idx, item in enumerate(data[2:], start=2):
                    _collect_body_battery(item, collector, visited, path=f"{path}[{idx}]")
                return

        for idx, item in enumerate(data):
            _collect_body_battery(item, collector, visited, path=f"{path}[{idx}]")

        return

    elif isinstance(data, (int, float)):
        val = _sanitize_body_battery_value(data, f"bodyBattery.{path}")
        _register_body_battery_value(collector, val, timestamp=None)


def _finalize_body_battery_series(points: Iterable[Dict[str, Any]], target_points: int = 48) -> Iterable[Dict[str, Any]]:
    points_with_ts: list[Tuple[Optional[datetime], Dict[str, Any]]] = []
    points_without_ts: list[Dict[str, Any]] = []

    for point in points:
        ts = point.get("timestamp")
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00")) if isinstance(ts, str) else None
            except Exception:
                dt = None
            points_with_ts.append((dt, point))
        else:
            points_without_ts.append(point)

    points_with_ts.sort(key=lambda item: (item[0] is None, item[0]))
    ordered = [p for _, p in points_with_ts]

    if len(ordered) > target_points:
        step = max(1, len(ordered) // target_points)
        ordered = ordered[::step]

    remaining = max(0, target_points - len(ordered))
    if remaining:
        ordered.extend(points_without_ts[:remaining])

    return ordered


# --- SpO2 helpers ------------------------------------------------------------

SPO2_PRIORITY_ORDER = [
    "averageMonitoringSpO2",
    "avgSpO2",
    "averageSpO2",
    "average",
    "avg",
    "spo2",
    "value",
    "saturation",
    "lastSpO2",
    "maxSpO2"
]


def _sanitize_spo2_value(raw: Any, context: str) -> Optional[int]:
    if raw is None:
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    if value < SPO2_MIN or value > SPO2_MAX:
        return None
    return safe_int(
        value,
        None,
        warn_on_fail=False,
        min_value=SPO2_MIN,
        max_value=SPO2_MAX,
        context=context
    )


def _collect_spo2(data: Any, collector: Dict[str, Any], visited: set, path: str = "root") -> None:
    if data is None:
        return
    obj_id = id(data)
    if obj_id in visited:
        return
    visited.add(obj_id)

    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, (int, float)):
                val = _sanitize_spo2_value(value, f"spo2.{path}.{key}")
                if val is not None:
                    collector["all_values"].append(val)
                    if key in SPO2_PRIORITY_ORDER:
                        collector["priority_values"].append((SPO2_PRIORITY_ORDER.index(key), val))
            elif isinstance(value, (dict, list)):
                _collect_spo2(value, collector, visited, path=f"{path}.{key}")
    elif isinstance(data, (list, tuple)):
        if len(data) >= 2:
            first, second = data[0], data[1]
            is_timestamp_candidate = isinstance(first, (int, float, str))
            is_value_candidate = isinstance(second, (int, float))
            if is_timestamp_candidate and is_value_candidate:
                val = _sanitize_spo2_value(second, f"spo2.{path}[1]")
                if val is not None:
                    collector["all_values"].append(val)
                    collector["priority_values"].append((0, val))
                for idx, item in enumerate(data[2:], start=2):
                    _collect_spo2(item, collector, visited, path=f"{path}[{idx}]")
                return

        for idx, item in enumerate(data):
            if isinstance(item, (int, float)):
                val = _sanitize_spo2_value(item, f"spo2.{path}[{idx}]")
                if val is not None:
                    collector["all_values"].append(val)
            else:
                _collect_spo2(item, collector, visited, path=f"{path}[{idx}]")
    elif isinstance(data, (int, float)):
        val = _sanitize_spo2_value(data, f"spo2.{path}")
        if val is not None:
            collector["all_values"].append(val)


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

    collector = {
        "time_series": [],
        "seen_points": set(),
        "all_values": [],
        "summary_values": [],
        "priority_values": []
    }
    _collect_body_battery(body_battery_data, collector, visited=set(), path="root")

    current_value = None
    if collector["priority_values"]:
        priority_sorted = sorted(collector["priority_values"], key=lambda item: item[0])
        current_value = priority_sorted[0][1]
    elif collector["all_values"]:
        current_value = collector["all_values"][-1]
    elif collector["summary_values"]:
        current_value = collector["summary_values"][-1]

    if current_value is None:
        print_debug(f"❌ Could not parse Body Battery for {date_str}")
        return None

    time_series = list(_finalize_body_battery_series(collector["time_series"]))
    print_debug(f"✅ Parsed Body Battery for {date_str}: current={current_value}, points={len(time_series)}")
    return {
        "current": current_value,
        "timeSeries": time_series
    }


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

    collector = {
        "all_values": [],
        "priority_values": []
    }
    _collect_spo2(spo2_data, collector, visited=set(), path="root")

    if collector["priority_values"]:
        priority_sorted = sorted(collector["priority_values"], key=lambda item: item[0])
        selected = priority_sorted[0][1]
        print_debug(f"✅ Parsed SpO2 for {date_str} (priority key): {selected}")
        return selected

    if collector["all_values"]:
        average_value = round(sum(collector["all_values"]) / len(collector["all_values"]))
        print_debug(f"✅ Parsed SpO2 for {date_str} (average): {average_value}")
        return average_value

    print_debug(f"❌ Could not parse SpO2 for {date_str}")
    return None

