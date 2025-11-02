"""
🔴 FIX #24: Compression et downsampling optimisé des time series Garmin
Réduit significativement la taille des données stockées sans perte significative d'information
"""
from typing import List, Dict, Any, Optional
from utils.helpers import print_debug


def downsample_time_series(series: List[Dict], target_points: int = 288, preserve_peaks: bool = True) -> List[Dict]:
    """
    🔴 FIX #24: Downsample une time series de manière intelligente
    
    Stratégie:
    - Si len(series) <= target_points: retourner tel quel
    - Sinon: utiliser un algorithme qui préserve les pics et variations importantes
    - Cible: 288 points pour 24h (1 point toutes les 5 minutes)
    
    Args:
        series: Liste de points {timestamp, value} ou {timestamp, bpm} etc.
        target_points: Nombre cible de points (défaut: 288 pour 24h à 5min)
        preserve_peaks: Si True, préserve les pics de valeurs (défaut: True)
    
    Returns:
        Liste downsamplée
    """
    if not series or len(series) <= target_points:
        return series
    
    # Si on a beaucoup plus de points que nécessaire, downsampler progressivement
    step = max(1, len(series) // target_points)
    
    if not preserve_peaks:
        # Downsampling simple par pas
        return series[::step]
    
    # Algorithme intelligent qui préserve les pics
    downsampled = []
    
    # Toujours garder le premier point
    downsampled.append(series[0])
    
    # Calculer la fenêtre de downsampling
    window_size = len(series) // target_points
    if window_size < 1:
        window_size = 1
    
    # Parcourir par fenêtres
    i = window_size
    while i < len(series):
        window = series[max(0, i - window_size):i + 1]
        
        if len(window) == 1:
            downsampled.append(window[0])
            i += window_size
            continue
        
        # Dans chaque fenêtre, garder:
        # 1. Le point avec la valeur max (pic)
        # 2. Le point avec la valeur min (valley)
        # 3. Le point du milieu (pour tendance)
        
        # Trouver max et min
        max_val = max(w.get('value') or w.get('bpm') or w.get('level') or 0 for w in window)
        min_val = min(w.get('value') or w.get('bpm') or w.get('level') or 0 for w in window)
        
        max_point = next((w for w in window if (w.get('value') or w.get('bpm') or w.get('level') or 0) == max_val), None)
        min_point = next((w for w in window if (w.get('value') or w.get('bpm') or w.get('level') or 0) == min_val), None)
        mid_point = window[len(window) // 2]
        
        # Ajouter les points importants (sans doublons)
        points_to_add = []
        if max_point and max_point not in downsampled:
            points_to_add.append(max_point)
        if min_point and min_point not in downsampled and min_point != max_point:
            points_to_add.append(min_point)
        if mid_point and mid_point not in points_to_add:
            points_to_add.append(mid_point)
        
        downsampled.extend(points_to_add)
        
        i += window_size
    
    # Toujours garder le dernier point
    if series[-1] not in downsampled:
        downsampled.append(series[-1])
    
    # Si on a encore trop de points, downsampler simplement
    if len(downsampled) > target_points * 1.2:  # 20% de marge
        step = len(downsampled) // target_points
        downsampled = [downsampled[0]] + downsampled[1:-1:step] + [downsampled[-1]]
    
    # Trier par timestamp pour garantir l'ordre
    downsampled.sort(key=lambda x: x.get('timestamp') or x.get('time') or 0)
    
    print_debug(f"Downsampled time series: {len(series)} → {len(downsampled)} points (target: {target_points})")
    
    return downsampled[:target_points]  # Limiter au maximum target_points


def compress_time_series_delta(series: List[Dict]) -> List[Dict]:
    """
    🔴 FIX #24: Compression delta encoding pour réduire encore plus la taille
    
    Le premier point est stocké complet, les suivants sont des deltas.
    Cela réduit la taille des données car les deltas sont généralement plus petits.
    
    Args:
        series: Liste de points {timestamp, value} ou {timestamp, bpm} etc.
    
    Returns:
        Liste compressée avec delta encoding
    """
    if not series or len(series) <= 1:
        return series
    
    # Déterminer les clés pour value et timestamp
    first = series[0]
    value_key = 'value' if 'value' in first else 'bpm' if 'bpm' in first else 'level'
    timestamp_key = 'timestamp'
    
    compressed = [first.copy()]  # Premier point complet
    
    for i in range(1, len(series)):
        prev = series[i - 1]
        curr = series[i]
        
        # Convertir timestamps en nombres (milliseconds) si strings
        prev_ts_raw = prev.get(timestamp_key) or 0
        curr_ts_raw = curr.get(timestamp_key) or 0
        
        # Convertir strings ISO en milliseconds si nécessaire
        if isinstance(prev_ts_raw, str):
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(prev_ts_raw.replace('Z', '+00:00'))
                prev_ts = int(dt.timestamp() * 1000)
            except:
                prev_ts = 0
        else:
            prev_ts = int(prev_ts_raw) if prev_ts_raw else 0
        
        if isinstance(curr_ts_raw, str):
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(curr_ts_raw.replace('Z', '+00:00'))
                curr_ts = int(dt.timestamp() * 1000)
            except:
                curr_ts = 0
        else:
            curr_ts = int(curr_ts_raw) if curr_ts_raw else 0
        
        prev_val = prev.get(value_key) or 0
        curr_val = curr.get(value_key) or 0
        
        # Créer un delta
        delta = {
            'd_ts': curr_ts - prev_ts,  # Delta timestamp (en ms)
            'd_val': curr_val - prev_val  # Delta valeur
        }
        
        # Garder les autres clés si présentes (rares cas)
        for key in curr:
            if key not in [timestamp_key, value_key]:
                delta[key] = curr[key]
        
        compressed.append(delta)
    
    print_debug(f"Delta compression: {len(series)} points → {len(compressed)} (ratio: {len(series) * 2 / len(compressed):.1f}x)")
    
    return compressed


def decompress_time_series_delta(compressed: List[Dict]) -> List[Dict]:
    """
    Décompresse une time series compressée avec delta encoding
    
    Args:
        compressed: Liste compressée (premier point complet + deltas)
    
    Returns:
        Liste décompressée complète
    """
    if not compressed or len(compressed) <= 1:
        return compressed
    
    # Déterminer les clés
    first = compressed[0]
    value_key = 'value' if 'value' in first else 'bpm' if 'bpm' in first else 'level'
    timestamp_key = 'timestamp'
    
    decompressed = [first.copy()]
    
    prev_ts = first.get(timestamp_key) or 0
    prev_val = first.get(value_key) or 0
    
    for i in range(1, len(compressed)):
        delta = compressed[i]
        
        # Si c'est un delta, reconstruire
        if 'd_ts' in delta and 'd_val' in delta:
            curr_ts = prev_ts + delta['d_ts']
            curr_val = prev_val + delta['d_val']
            
            point = {
                timestamp_key: curr_ts,
                value_key: curr_val
            }
            
            # Garder les autres clés
            for key in delta:
                if key not in ['d_ts', 'd_val']:
                    point[key] = delta[key]
            
            decompressed.append(point)
            
            prev_ts = curr_ts
            prev_val = curr_val
        else:
            # Point complet (ne devrait pas arriver après le premier)
            decompressed.append(delta)
            prev_ts = delta.get(timestamp_key) or prev_ts
            prev_val = delta.get(value_key) or prev_val
    
    return decompressed


def optimize_time_series(series: List[Dict], target_points: int = 288, use_delta: bool = True) -> List[Dict]:
    """
    🔴 FIX #24: Fonction principale d'optimisation des time series
    
    Combine downsampling intelligent + compression delta si nécessaire
    
    Args:
        series: Liste de points de time series
        target_points: Nombre cible de points (défaut: 288)
        use_delta: Si True, applique aussi la compression delta (défaut: True)
    
    Returns:
        Time series optimisée
    """
    if not series:
        return []
    
    # Étape 1: Downsampling si nécessaire
    downsampled = downsample_time_series(series, target_points, preserve_peaks=True)
    
    # Étape 2: Compression delta si demandée et si ça vaut le coup (plus de 50 points)
    if use_delta and len(downsampled) > 50:
        return compress_time_series_delta(downsampled)
    
    return downsampled

