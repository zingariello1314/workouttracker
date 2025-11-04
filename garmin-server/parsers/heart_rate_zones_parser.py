"""
Parser Zones de Fréquence Cardiaque Garmin
🟢 PRIORITÉ 3 : Récupération des zones de FC depuis les activités
"""
import sys
import os
from typing import Any, Dict, Optional, List

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, print_debug


# Définition standard des zones de FC (5 zones basées sur % de FC max)
# Ces valeurs peuvent être personnalisées par l'utilisateur dans Garmin Connect
# Les zones sont définies en pourcentage de FC max (utilisées pour calcul depuis time series)
DEFAULT_ZONE_RANGES = {
    "zone1": {"min": 0, "max": 60, "name": "Zone 1 - Échauffement"},   # 0-60% FC max
    "zone2": {"min": 60, "max": 70, "name": "Zone 2 - Brûlage graisses"},  # 60-70% FC max
    "zone3": {"min": 70, "max": 80, "name": "Zone 3 - Aérobie"},  # 70-80% FC max
    "zone4": {"min": 80, "max": 90, "name": "Zone 4 - Seuil"},  # 80-90% FC max
    "zone5": {"min": 90, "max": 100, "name": "Zone 5 - Maximale"}  # 90-100% FC max
}


def parse_heart_rate_zones_from_activity(act: Dict[str, Any], act_details: Optional[Dict[str, Any]], 
                                         act_summary: Dict[str, Any], max_hr: int = 0) -> Optional[Dict[str, Any]]:
    """
    Parse les zones de FC depuis les données d'activité Garmin.
    
    🟢 PRIORITÉ 3 : Extrait les temps passés dans chaque zone de FC.
    
    Cherche dans plusieurs champs possibles :
    - timeInHeartRateZones (array avec temps par zone en secondes)
    - heartRateZones (définition des zones + temps)
    - heartRateZoneDTOs (array d'objets zone)
    - zoneTimeInSeconds (array avec temps par zone)
    
    Args:
        act: Données brutes de l'activité (act ou act_details)
        act_details: Détails complets de l'activité (optionnel)
        act_summary: Résumé de l'activité
        max_hr: FC max de l'activité (pour calcul si zones non disponibles)
        
    Returns:
        dict: Zones de FC avec temps par zone en secondes, ou None si non trouvé
        Format: {
            "zone1": {"time": int, "percentage": float},
            "zone2": {"time": int, "percentage": float},
            ...
            "zone5": {"time": int, "percentage": float},
            "total": int,  // Temps total en zones
            "zonesDefinition": {...}  // Définition des zones si disponible
        }
    """
    act_id = act_summary.get('activityId')
    
    # Chercher dans act_details d'abord (plus complet)
    data_source = act_details if act_details else act
    
    # Chercher dans summaryDTO aussi
    summary_dto = act.get('activitySummaryDTO', {}) or act.get('summaryDTO', {}) or {}
    if isinstance(act_details, dict):
        summary_dto_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {}) or {}
        if summary_dto_details:
            summary_dto = { **summary_dto, **summary_dto_details }
    
    # 🟢 PRIORITÉ 3 : Chercher timeInHeartRateZones (format principal Garmin)
    time_in_zones = None
    
    # Méthode 1 : timeInHeartRateZones (array direct)
    if isinstance(data_source, dict):
        time_in_zones = (
            data_source.get('timeInHeartRateZones') or
            data_source.get('timeInHeartRateZonesInSeconds') or
            data_source.get('hrZoneTimes') or
            data_source.get('heartRateZoneTimes') or
            summary_dto.get('timeInHeartRateZones') if isinstance(summary_dto, dict) else None or
            summary_dto.get('timeInHeartRateZonesInSeconds') if isinstance(summary_dto, dict) else None
        )
    
    # Méthode 2 : heartRateZones (array d'objets avec zone et time)
    if not time_in_zones and isinstance(data_source, dict):
        hr_zones_array = (
            data_source.get('heartRateZones') or
            data_source.get('heartRateZoneDTOs') or
            data_source.get('hrZones') or
            summary_dto.get('heartRateZones') if isinstance(summary_dto, dict) else None
        )
        
        if isinstance(hr_zones_array, list) and len(hr_zones_array) > 0:
            # Extraire les temps depuis les objets zone
            time_in_zones = []
            for zone_obj in hr_zones_array:
                if isinstance(zone_obj, dict):
                    zone_time = (
                        zone_obj.get('timeInZone') or
                        zone_obj.get('timeInSeconds') or
                        zone_obj.get('time') or
                        zone_obj.get('duration') or
                        0
                    )
                    time_in_zones.append(safe_int(zone_time, 0))
            
            if len(time_in_zones) > 0:
                print_debug(f"Extracted timeInHeartRateZones from heartRateZones array: {time_in_zones} for activity {act_id}")
    
    # Méthode 3 : zoneTimeInSeconds (array)
    if not time_in_zones and isinstance(data_source, dict):
        zone_times = (
            data_source.get('zoneTimeInSeconds') or
            data_source.get('zoneTimes') or
            summary_dto.get('zoneTimeInSeconds') if isinstance(summary_dto, dict) else None
        )
        
        if isinstance(zone_times, list) and len(zone_times) > 0:
            time_in_zones = [safe_int(t, 0) for t in zone_times]
            print_debug(f"Extracted timeInHeartRateZones from zoneTimeInSeconds: {time_in_zones} for activity {act_id}")
    
    # Si time_in_zones trouvé, construire la structure
    if time_in_zones and isinstance(time_in_zones, list):
        # Normaliser à 5 zones (Garmin peut retourner 3, 4, 5 ou plus de zones)
        zones = {
            "zone1": {"time": 0, "percentage": 0.0},
            "zone2": {"time": 0, "percentage": 0.0},
            "zone3": {"time": 0, "percentage": 0.0},
            "zone4": {"time": 0, "percentage": 0.0},
            "zone5": {"time": 0, "percentage": 0.0}
        }
        
        # Mapper les temps aux zones (Garmin retourne généralement 5 zones)
        total_time = sum(time_in_zones)
        
        for i, time_seconds in enumerate(time_in_zones[:5]):  # Limiter à 5 zones
            zone_key = f"zone{i+1}"
            if zone_key in zones:
                zones[zone_key]["time"] = safe_int(time_seconds, 0)
                zones[zone_key]["percentage"] = round((time_seconds / total_time * 100) if total_time > 0 else 0, 1)
        
        result = {
            **zones,
            "total": total_time
        }
        
        # Ajouter définition des zones si disponible
        if isinstance(data_source, dict):
            zones_def = (
                data_source.get('heartRateZones') or
                data_source.get('heartRateZoneDTOs') or
                summary_dto.get('heartRateZones') if isinstance(summary_dto, dict) else None
            )
            
            if isinstance(zones_def, list) and len(zones_def) > 0:
                zones_definition = {}
                for i, zone_def in enumerate(zones_def[:5]):
                    if isinstance(zone_def, dict):
                        zones_definition[f"zone{i+1}"] = {
                            "min": safe_int(zone_def.get('min') or zone_def.get('minHR') or zone_def.get('lowerBound'), 0),
                            "max": safe_int(zone_def.get('max') or zone_def.get('maxHR') or zone_def.get('upperBound'), 0),
                            "name": zone_def.get('name') or f"Zone {i+1}"
                        }
                
                if zones_definition:
                    result["zonesDefinition"] = zones_definition
        
        print_debug(f"✅ Parsed heart rate zones for activity {act_id}: total={total_time}s, zones={[z['time'] for z in zones.values()]}")
        return result
    
    # Si pas de zones trouvées, retourner None (pas d'erreur, juste absence de données)
    print_debug(f"No heart rate zones found for activity {act_id}")
    return None


def calculate_heart_rate_zones_from_time_series(time_series: List[Dict[str, Any]], max_hr: int, 
                                                 resting_hr: int = 0) -> Optional[Dict[str, Any]]:
    """
    Calcule les zones de FC depuis les time series si les zones ne sont pas disponibles depuis l'API.
    
    🟢 PRIORITÉ 3 : Calcul alternatif depuis time series.
    
    Args:
        time_series: Liste de points {timestamp: str, bpm: int}
        max_hr: FC max (pour calculer les seuils de zones)
        resting_hr: FC au repos (optionnel, pour zones basées sur réserve)
        
    Returns:
        dict: Zones de FC calculées ou None si pas de données
    """
    if not time_series or not isinstance(time_series, list) or len(time_series) == 0:
        return None
    
    if max_hr <= 0:
        # Si pas de FC max, essayer de calculer depuis les time series
        hr_values = [point.get('bpm') or point.get('value') for point in time_series if isinstance(point, dict)]
        hr_values = [h for h in hr_values if isinstance(h, (int, float)) and h > 0]
        if hr_values:
            max_hr = max(hr_values)
            print_debug(f"Calculated max HR from time series: {max_hr}")
        else:
            return None
    
    # 🟢 PRIORITÉ 3 : Calculer les seuils de zones (5 zones basées sur % de FC max)
    # Zones standard : Zone 1 (0-60%), Zone 2 (60-70%), Zone 3 (70-80%), Zone 4 (80-90%), Zone 5 (90-100%)
    zone_thresholds = {
        "zone1": {"min": 0, "max": int(max_hr * 0.6)},      # 0-60% FC max
        "zone2": {"min": int(max_hr * 0.6), "max": int(max_hr * 0.7)},  # 60-70% FC max
        "zone3": {"min": int(max_hr * 0.7), "max": int(max_hr * 0.8)},  # 70-80% FC max
        "zone4": {"min": int(max_hr * 0.8), "max": int(max_hr * 0.9)},  # 80-90% FC max
        "zone5": {"min": int(max_hr * 0.9), "max": max_hr}  # 90-100% FC max
    }
    
    # Compter le temps dans chaque zone
    # Hypothèse : chaque point représente un intervalle de temps
    # Si pas de durée explicite, estimer 1 point = 1 seconde (approximation)
    zone_times = {
        "zone1": 0,
        "zone2": 0,
        "zone3": 0,
        "zone4": 0,
        "zone5": 0
    }
    
    # Calculer l'intervalle entre les points pour estimation précise
    if len(time_series) > 1:
        # Estimer intervalle moyen entre points
        timestamps = [point.get('timestamp') for point in time_series if point.get('timestamp')]
        if len(timestamps) > 1:
            try:
                from datetime import datetime
                ts1 = datetime.fromisoformat(timestamps[0].replace('Z', '+00:00'))
                ts2 = datetime.fromisoformat(timestamps[1].replace('Z', '+00:00'))
                interval_seconds = abs((ts2 - ts1).total_seconds())
            except:
                interval_seconds = 1  # Fallback : 1 seconde par point
        else:
            interval_seconds = 1
    else:
        interval_seconds = 1
    
    # Compter le temps dans chaque zone
    for point in time_series:
        if not isinstance(point, dict):
            continue
        
        hr_value = safe_int(point.get('bpm') or point.get('value'), 0)
        if hr_value <= 0:
            continue
        
        # Déterminer dans quelle zone se trouve cette FC
        if hr_value <= zone_thresholds["zone1"]["max"]:
            zone_times["zone1"] += interval_seconds
        elif hr_value <= zone_thresholds["zone2"]["max"]:
            zone_times["zone2"] += interval_seconds
        elif hr_value <= zone_thresholds["zone3"]["max"]:
            zone_times["zone3"] += interval_seconds
        elif hr_value <= zone_thresholds["zone4"]["max"]:
            zone_times["zone4"] += interval_seconds
        else:
            zone_times["zone5"] += interval_seconds
    
    total_time = sum(zone_times.values())
    
    if total_time == 0:
        return None
    
    # Construire la structure
    zones = {}
    for zone_key, time_seconds in zone_times.items():
        zones[zone_key] = {
            "time": safe_int(time_seconds, 0),
            "percentage": round((time_seconds / total_time * 100) if total_time > 0 else 0, 1)
        }
    
    result = {
        **zones,
        "total": total_time,
        "zonesDefinition": {
            zone_key: {
                "min": zone_thresholds[zone_key]["min"],
                "max": zone_thresholds[zone_key]["max"],
                "name": DEFAULT_ZONE_RANGES[zone_key]["name"]
            }
            for zone_key in zone_thresholds.keys()
        },
        "calculatedFromTimeSeries": True  # Indicateur que c'est calculé, pas depuis API
    }
    
    print_debug(f"✅ Calculated heart rate zones from time series: total={total_time}s, zones={[z['time'] for z in zones.values()]}")
    return result


def parse_daily_heart_rate_zones(daily_metrics: Dict[str, Any], date_str: str) -> Optional[Dict[str, Any]]:
    """
    Parse les zones de FC pour les métriques quotidiennes.
    
    🟢 PRIORITÉ 3 : Calcule les zones depuis les time series quotidiennes si disponibles.
    
    Args:
        daily_metrics: Métriques quotidiennes avec heartRate.timeSeries
        date_str: Date pour les logs
        
    Returns:
        dict: Zones de FC quotidiennes ou None
    """
    heart_rate = daily_metrics.get('heartRate', {})
    if not isinstance(heart_rate, dict):
        return None
    
    time_series = heart_rate.get('timeSeries', [])
    max_hr = heart_rate.get('max', 0)
    resting_hr = heart_rate.get('resting', 0)
    
    if not time_series or len(time_series) == 0:
        return None
    
    # Calculer depuis time series
    return calculate_heart_rate_zones_from_time_series(time_series, max_hr, resting_hr)

