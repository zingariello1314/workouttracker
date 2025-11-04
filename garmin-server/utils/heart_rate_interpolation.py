"""
🟢 NOUVEAU : Interpolation intelligente des time series de fréquence cardiaque
Crée un tracé continu même avec peu de données, similaire à Garmin Connect

Stratégie :
1. Si time series > 50 points : retourner tel quel (données suffisantes)
2. Si time series < 50 points mais > 0 : interpoler entre points avec courbes lisses
3. Si time series = 0 mais métriques agrégées disponibles : créer tracé approximatif
4. Utiliser les activités pour créer des pics FC réalistes
5. Utiliser FC repos pour les périodes de repos (nuit, repos)
"""
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, time
from utils.helpers import print_debug, safe_int, normalize_datetime_to_utc


def interpolate_heart_rate_time_series(
    time_series: List[Dict[str, Any]],
    resting_hr: int,
    max_hr: int,
    avg_hr: int,
    date_str: str,
    activities: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Interpole intelligemment une time series de fréquence cardiaque pour créer un tracé continu.
    
    Args:
        time_series: Time series existante (peut être vide ou avoir peu de points)
        resting_hr: FC repos (bpm)
        max_hr: FC max (bpm)
        avg_hr: FC moyenne (bpm)
        date_str: Date au format YYYY-MM-DD
        activities: Liste des activités du jour (optionnel, pour créer des pics FC)
        
    Returns:
        Time series enrichie avec interpolation (minimum 288 points pour 24h)
    """
    # Si time series > 50 points, considérer comme suffisante
    if len(time_series) >= 50:
        print_debug(f"✅ Time series FC suffisante ({len(time_series)} points) pour {date_str}, pas d'interpolation nécessaire")
        return time_series
    
    # Si pas de métriques agrégées, ne pas interpoler (on ne peut pas deviner)
    if resting_hr == 0 and max_hr == 0 and avg_hr == 0:
        print_debug(f"⚠️ Pas de métriques FC pour {date_str}, impossible d'interpoler")
        return time_series
    
    print_debug(f"🔄 Interpolation FC pour {date_str}: {len(time_series)} points → enrichissement avec métriques (resting={resting_hr}, max={max_hr}, avg={avg_hr})")
    
    # Parser la date
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d')
    except Exception:
        print_debug(f"⚠️ Date invalide {date_str}, utilisation de aujourd'hui")
        target_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Début et fin de la journée (00:00:00 à 23:59:59)
    day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = target_date.replace(hour=23, minute=59, second=59, microsecond=0)
    
    # Si time series vide, créer un tracé approximatif depuis les métriques
    if len(time_series) == 0:
        return create_approximate_time_series(day_start, day_end, resting_hr, max_hr, avg_hr, activities)
    
    # Sinon, enrichir la time series existante avec interpolation
    return enrich_existing_time_series(time_series, day_start, day_end, resting_hr, max_hr, avg_hr, activities)


def create_approximate_time_series(
    day_start: datetime,
    day_end: datetime,
    resting_hr: int,
    max_hr: int,
    avg_hr: int,
    activities: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Crée un tracé approximatif de FC depuis les métriques agrégées.
    
    Stratégie :
    - Nuit (00:00-06:00) : FC repos
    - Journée (06:00-22:00) : FC moyenne avec variations
    - Soir (22:00-00:00) : FC repos
    - Pics lors des activités (si disponibles)
    """
    time_series = []
    
    # Intervalle : 1 point toutes les 5 minutes (288 points pour 24h)
    interval_minutes = 5
    current = day_start
    
    # Extraire les périodes d'activité
    activity_periods = extract_activity_periods(activities, day_start, day_end) if activities else []
    
    while current <= day_end:
        timestamp_str = normalize_datetime_to_utc(current.timestamp())
        hour = current.hour
        
        # Déterminer la FC pour ce moment
        bpm = calculate_heart_rate_for_time(
            current, 
            hour, 
            resting_hr, 
            max_hr, 
            avg_hr, 
            activity_periods
        )
        
        time_series.append({
            "timestamp": timestamp_str,
            "bpm": bpm
        })
        
        current += timedelta(minutes=interval_minutes)
    
    print_debug(f"✅ Créé tracé approximatif FC: {len(time_series)} points pour journée complète")
    return time_series


def enrich_existing_time_series(
    time_series: List[Dict[str, Any]],
    day_start: datetime,
    day_end: datetime,
    resting_hr: int,
    max_hr: int,
    avg_hr: int,
    activities: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Enrichit une time series existante avec interpolation entre les points.
    
    Stratégie :
    1. Garder tous les points existants
    2. Interpoler linéairement entre les points avec gaps > 30 minutes
    3. Utiliser FC repos pour les périodes sans données (nuit, repos)
    4. Ajouter des pics lors des activités
    """
    # Trier par timestamp
    sorted_series = sorted(time_series, key=lambda x: x.get('timestamp', ''))
    
    # Convertir timestamps en datetime pour comparaison
    parsed_points = []
    for point in sorted_series:
        try:
            timestamp_str = point.get('timestamp')
            if not timestamp_str:
                continue
            
            # Parser le timestamp (peut être string ISO ou timestamp)
            if isinstance(timestamp_str, str):
                # Essayer de parser comme ISO
                try:
                    dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                except:
                    # Essayer comme timestamp
                    try:
                        dt = datetime.fromtimestamp(float(timestamp_str))
                    except:
                        continue
            else:
                dt = datetime.fromtimestamp(float(timestamp_str))
            
            bpm = safe_int(point.get('bpm'), 0)
            if bpm > 0:
                parsed_points.append((dt, bpm))
        except Exception:
            continue
    
    if len(parsed_points) == 0:
        # Pas de points valides, créer tracé approximatif
        return create_approximate_time_series(day_start, day_end, resting_hr, max_hr, avg_hr, activities)
    
    # Extraire les périodes d'activité
    activity_periods = extract_activity_periods(activities, day_start, day_end) if activities else []
    
    # Créer une time series enrichie
    enriched = []
    interval_minutes = 5  # 1 point toutes les 5 minutes
    current = day_start
    
    while current <= day_end:
        # Vérifier si on a un point réel à cet instant (avec tolérance de 3 minutes)
        real_point = None
        for dt, bpm in parsed_points:
            time_diff = abs((current - dt).total_seconds())
            if time_diff <= 180:  # 3 minutes de tolérance
                real_point = (dt, bpm)
                break
        
        if real_point:
            # Utiliser le point réel
            timestamp_value = current.timestamp()
            timestamp_str = normalize_datetime_to_utc(timestamp_value) or datetime.fromtimestamp(timestamp_value).isoformat() + 'Z'
            enriched.append({
                "timestamp": timestamp_str,
                "bpm": real_point[1]
            })
        else:
            # Interpoler ou utiliser valeur par défaut
            bpm = interpolate_or_default(
                current,
                parsed_points,
                resting_hr,
                max_hr,
                avg_hr,
                activity_periods
            )
            timestamp_value = current.timestamp()
            timestamp_str = normalize_datetime_to_utc(timestamp_value) or datetime.fromtimestamp(timestamp_value).isoformat() + 'Z'
            enriched.append({
                "timestamp": timestamp_str,
                "bpm": bpm
            })
        
        current += timedelta(minutes=interval_minutes)
    
    print_debug(f"✅ Enrichi time series FC: {len(time_series)} points → {len(enriched)} points")
    return enriched


def extract_activity_periods(
    activities: List[Dict[str, Any]],
    day_start: datetime,
    day_end: datetime
) -> List[Tuple[datetime, datetime, int]]:
    """
    Extrait les périodes d'activité avec FC estimée.
    
    Returns:
        List de tuples (start, end, estimated_hr) pour chaque activité
    """
    periods = []
    
    for activity in activities:
        try:
            # Extraire date/heure de début
            start_str = activity.get('date', '') + ' ' + activity.get('time', '00:00')
            try:
                start_dt = datetime.strptime(start_str, '%Y-%m-%d %H:%M')
            except:
                continue
            
            # Extraire durée
            duration = activity.get('duration', 0)  # en secondes
            if duration <= 0:
                continue
            
            # Calculer fin
            end_dt = start_dt + timedelta(seconds=duration)
            
            # Vérifier que l'activité est dans la journée
            if start_dt < day_start or end_dt > day_end:
                continue
            
            # Estimer FC moyenne pour l'activité
            # Utiliser avgHR si disponible, sinon maxHR * 0.75, sinon avg_hr * 1.3
            estimated_hr = (
                activity.get('avgHR') or
                int(activity.get('maxHR', 0) * 0.75) or
                int(activity.get('avgHR', 0) * 1.3) or
                avg_hr * 1.3
            )
            
            if estimated_hr > 0:
                periods.append((start_dt, end_dt, estimated_hr))
        except Exception as e:
            print_debug(f"⚠️ Erreur extraction période activité: {e}")
            continue
    
    return periods


def calculate_heart_rate_for_time(
    current: datetime,
    hour: int,
    resting_hr: int,
    max_hr: int,
    avg_hr: int,
    activity_periods: List[Tuple[datetime, datetime, int]]
) -> int:
    """
    Calcule la FC pour un instant donné.
    """
    # Vérifier si on est dans une période d'activité
    for start, end, activity_hr in activity_periods:
        if start <= current <= end:
            # Pendant l'activité, utiliser la FC de l'activité
            # Avec une transition douce (courbe)
            return activity_hr
    
    # Nuit (00:00-06:00) : FC repos
    if hour < 6:
        return resting_hr if resting_hr > 0 else avg_hr * 0.85
    
    # Soir (22:00-00:00) : FC repos
    if hour >= 22:
        return resting_hr if resting_hr > 0 else avg_hr * 0.85
    
    # Journée (06:00-22:00) : FC moyenne avec légères variations
    # Simuler une variation naturelle autour de la moyenne
    base_hr = avg_hr if avg_hr > 0 else resting_hr * 1.15
    
    # Variation cyclique basée sur l'heure (plus élevée en milieu de journée)
    hour_factor = 1.0 + 0.1 * abs(14 - hour) / 14  # Pic à 14h
    variation = base_hr * 0.05 * hour_factor  # ±5% de variation
    
    hr = base_hr + variation
    return int(max(resting_hr, min(max_hr, hr)))


def interpolate_or_default(
    current: datetime,
    parsed_points: List[Tuple[datetime, int]],
    resting_hr: int,
    max_hr: int,
    avg_hr: int,
    activity_periods: List[Tuple[datetime, datetime, int]]
) -> int:
    """
    Interpole entre les points existants ou retourne une valeur par défaut.
    """
    # Vérifier période d'activité d'abord
    for start, end, activity_hr in activity_periods:
        if start <= current <= end:
            return activity_hr
    
    # Trouver les points les plus proches
    if len(parsed_points) == 0:
        return calculate_heart_rate_for_time(current, current.hour, resting_hr, max_hr, avg_hr, activity_periods)
    
    # Points avant et après
    before = None
    after = None
    
    for dt, bpm in parsed_points:
        if dt <= current:
            before = (dt, bpm)
        elif dt > current:
            after = (dt, bpm)
            break
    
    # Interpolation linéaire si on a before et after
    if before and after:
        before_dt, before_bpm = before
        after_dt, after_bpm = after
        
        total_diff = (after_dt - before_dt).total_seconds()
        current_diff = (current - before_dt).total_seconds()
        
        if total_diff > 0:
            ratio = current_diff / total_diff
            interpolated = before_bpm + (after_bpm - before_bpm) * ratio
            return int(max(resting_hr, min(max_hr, interpolated)))
    
    # Si seulement before ou after, utiliser valeur + décroissance/croissance
    if before:
        before_dt, before_bpm = before
        time_diff = (current - before_dt).total_seconds() / 3600  # heures
        # Décroissance vers FC repos sur 2 heures
        decay = min(1.0, time_diff / 2.0)
        target_hr = resting_hr if resting_hr > 0 else avg_hr * 0.85
        return int(before_bpm * (1 - decay * 0.3) + target_hr * (decay * 0.3))
    
    if after:
        after_dt, after_bpm = after
        time_diff = (after_dt - current).total_seconds() / 3600  # heures
        # Croissance vers FC activité sur 30 minutes
        growth = min(1.0, time_diff / 0.5)
        target_hr = avg_hr * 1.1
        return int(resting_hr * (1 - growth * 0.5) + target_hr * (growth * 0.5))
    
    # Fallback : utiliser calcul basé sur l'heure
    return calculate_heart_rate_for_time(current, current.hour, resting_hr, max_hr, avg_hr, activity_periods)

