"""
Parser Wellness Garmin - Body Battery, Stress, SpO2
PRIORITÉ: Contient les corrections critiques pour Body Battery, Stress, SpO2
"""
import sys
import os
from typing import Any, Dict, Optional

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug


def fetch_body_battery(client: Any, date_str: str) -> Optional[Any]:
    """
    Récupère les données Body Battery depuis Garmin client.
    Essaie plusieurs méthodes possibles.
    
    Args:
        client: Client Garmin connecté
        date_str: Date au format 'YYYY-MM-DD'
        
    Returns:
        Body Battery data ou None
    """
    try:
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
    except Exception as e:
        print_debug(f"Failed to get Body Battery for {date_str}: {type(e).__name__}: {e}")
        pass
    
    return None


def parse_body_battery(body_battery_data: Any, date_str: str) -> Optional[int]:
    """
    Parse Body Battery depuis les données Garmin.
    
    CORRECTION CRITIQUE: Body Battery peut être:
    - Une liste de valeurs (time series) -> prendre la dernière valeur actuelle
    - Un dict avec 'bodyBattery', 'value', 'current', 'average', 'avg'
    - Un int/float direct
    
    Args:
        body_battery_data: Données Body Battery brutes
        date_str: Date pour les logs
        
    Returns:
        int: Valeur Body Battery (0-100) ou None si non trouvé
    """
    if not body_battery_data:
        return None
    
    print_debug(f"Body Battery data for {date_str}: {type(body_battery_data)}, keys: {list(body_battery_data.keys())[:10] if isinstance(body_battery_data, dict) else 'N/A'}")
    
    # CORRECTION CRITIQUE: Si c'est une liste, prendre la dernière valeur actuelle
    if isinstance(body_battery_data, list):
        print_debug(f"Body Battery is a list with {len(body_battery_data)} items")
        if len(body_battery_data) > 0:
            # Body Battery est une time series, chercher la dernière valeur actuelle
            # Format typique: [{"timestamp": "...", "value": 65}, ...]
            for item in reversed(body_battery_data):  # Commencer par la fin (plus récent)
                if isinstance(item, dict):
                    # Logger la structure pour debug
                    print_debug(f"Body Battery list item keys: {list(item.keys())[:10]}")
                    # Chercher valeur dans plusieurs champs possibles
                    value = (
                        item.get('bodyBattery') if item.get('bodyBattery') is not None else
                        item.get('value') if item.get('value') is not None else
                        item.get('current') if item.get('current') is not None else
                        item.get('average') if item.get('average') is not None else
                        item.get('avg') if item.get('avg') is not None else
                        item.get('bodyBatteryValue') if item.get('bodyBatteryValue') is not None else
                        item.get('batteryValue') if item.get('batteryValue') is not None else
                        None
                    )
                    if value is not None:
                        body_battery_value = safe_int(value, None)
                        if body_battery_value is not None and 0 <= body_battery_value <= 100:
                            print_debug(f"✅ Parsed Body Battery for {date_str} from list (last value): {body_battery_value}")
                            return body_battery_value
                elif isinstance(item, (int, float)):
                    # Si la liste contient directement des nombres, prendre le dernier
                    if 0 <= item <= 100:
                        body_battery_value = safe_int(item, None)
                        print_debug(f"✅ Parsed Body Battery for {date_str} from list (direct value): {body_battery_value}")
                        return body_battery_value
        else:
            print_debug(f"⚠️ Body Battery list is empty for {date_str}")
    
    # Si c'est un dict, chercher dans plusieurs champs
    if isinstance(body_battery_data, dict):
        # Body Battery peut être une valeur unique ou un objet avec time series
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
            return body_battery_value
    
    # Si c'est directement un int/float
    elif isinstance(body_battery_data, (int, float)):
        if 0 <= body_battery_data <= 100:
            body_battery_value = safe_int(body_battery_data, None)
            print_debug(f"✅ Parsed Body Battery for {date_str} (direct): {body_battery_value}")
            return body_battery_value
    
    print_debug(f"❌ Could not parse Body Battery for {date_str}")
    return None


def fetch_stress(client: Any, date_str: str) -> Optional[Any]:
    """
    Récupère les données Stress depuis Garmin client.
    Essaie plusieurs méthodes possibles.
    
    Args:
        client: Client Garmin connecté
        date_str: Date au format 'YYYY-MM-DD'
        
    Returns:
        Stress data ou None
    """
    try:
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
    except Exception as e:
        print_debug(f"Failed to get Stress for {date_str}: {type(e).__name__}: {e}")
        pass
    
    return None


def parse_stress(stress_data: Any, date_str: str) -> Optional[int]:
    """
    Parse Stress depuis les données Garmin.
    
    CORRECTION CRITIQUE: Stress peut être:
    - Un dict avec 'avgStressLevel', 'maxStressLevel', 'stress', 'value', 'average', 'avg', 'level'
    - Un int/float direct
    
    Args:
        stress_data: Données Stress brutes
        date_str: Date pour les logs
        
    Returns:
        int: Valeur Stress (0-100) ou None si non trouvé
    """
    if not stress_data:
        return None
    
    print_debug(f"Stress data for {date_str}: {type(stress_data)}, keys: {list(stress_data.keys())[:10] if isinstance(stress_data, dict) else 'N/A'}")
    
    if isinstance(stress_data, dict):
        # Stress peut être une valeur unique ou un objet avec time series
        # PRIORITÉ: avgStressLevel (champ principal Garmin)
        stress_value = safe_int(
            stress_data.get('avgStressLevel') or  # PRIORITÉ ABSOLUE
            stress_data.get('maxStressLevel') or
            stress_data.get('stress') or
            stress_data.get('value') or
            stress_data.get('average') or
            stress_data.get('avg') or
            stress_data.get('level'),
            None
        )
        if stress_value is not None and stress_value >= 0:
            print_debug(f"✅ Parsed Stress for {date_str}: {stress_value}")
            return stress_value
    
    elif isinstance(stress_data, (int, float)):
        if 0 <= stress_data <= 100:
            stress_value = safe_int(stress_data, None)
            print_debug(f"✅ Parsed Stress for {date_str} (direct): {stress_value}")
            return stress_value
    
    print_debug(f"❌ Could not parse Stress for {date_str}")
    return None


def fetch_spo2(client: Any, date_str: str) -> Optional[Any]:
    """
    Récupère les données SpO2 depuis Garmin client.
    Essaie plusieurs méthodes possibles.
    
    Args:
        client: Client Garmin connecté
        date_str: Date au format 'YYYY-MM-DD'
        
    Returns:
        SpO2 data ou None
    """
    try:
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
    except Exception as e:
        print_debug(f"Failed to get SpO2 for {date_str}: {type(e).__name__}: {e}")
        pass
    
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

