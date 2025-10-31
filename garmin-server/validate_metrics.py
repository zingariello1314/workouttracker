#!/usr/bin/env python3
"""
Script de validation des métriques Garmin
Vérifie que toutes les métriques sont bien parsées et non nulles/abusées
"""
import json
import sys
from datetime import datetime

def validate_activity_metrics(activity, activity_type):
    """Valide les métriques d'une activité"""
    errors = []
    warnings = []
    
    # Métriques de base (obligatoires)
    required_fields = ['id', 'date', 'duration', 'avgHR', 'maxHR', 'calories']
    for field in required_fields:
        if field not in activity or activity[field] is None:
            errors.append(f"{activity_type}: {field} manquant ou null")
        elif field == 'duration' and activity[field] <= 0:
            errors.append(f"{activity_type}: {field} <= 0 ({activity[field]})")
        elif field in ['avgHR', 'maxHR'] and (activity[field] < 40 or activity[field] > 250):
            warnings.append(f"{activity_type}: {field} suspect ({activity[field]} bpm)")
        elif field == 'calories':
            if isinstance(activity[field], dict):
                if activity[field].get('total', 0) <= 0:
                    errors.append(f"{activity_type}: calories.total <= 0")
                elif activity[field].get('total', 0) > 5000:
                    warnings.append(f"{activity_type}: calories.total suspect ({activity[field]['total']} kcal)")
            else:
                if activity[field] <= 0:
                    errors.append(f"{activity_type}: calories <= 0")
                elif activity[field] > 5000:
                    warnings.append(f"{activity_type}: calories suspect ({activity[field]} kcal)")
    
    # Métriques spécifiques par type
    if activity_type == 'swimming':
        if 'distance' not in activity or activity['distance'] is None:
            warnings.append("swimming: distance manquant")
        elif activity['distance'] <= 0:
            errors.append(f"swimming: distance <= 0 ({activity['distance']})")
        elif activity['distance'] > 50:  # Plus de 50km en natation = suspect
            warnings.append(f"swimming: distance suspect ({activity['distance']} km)")
        
        if 'laps' not in activity or activity['laps'] is None:
            warnings.append("swimming: laps manquant")
        elif activity['laps'] <= 0:
            warnings.append(f"swimming: laps <= 0 ({activity['laps']})")
        
        if 'swimmingMetrics' in activity:
            swim_metrics = activity['swimmingMetrics']
            if swim_metrics.get('strokeCount', 0) <= 0:
                warnings.append("swimming: strokeCount manquant ou 0")
            if swim_metrics.get('avgSwolf', 0) <= 0:
                warnings.append("swimming: avgSwolf manquant ou 0")
            if swim_metrics.get('avgSpeed', 0) <= 0:
                warnings.append("swimming: avgSpeed manquant ou 0")
            elif swim_metrics.get('avgSpeed', 0) > 10:  # Plus de 10 km/h en natation = suspect
                warnings.append(f"swimming: avgSpeed suspect ({swim_metrics['avgSpeed']} km/h)")
    
    elif activity_type == 'jumpRope':
        if 'jumps' not in activity or activity['jumps'] is None or activity['jumps'] == 0:
            errors.append("jumpRope: jumps manquant ou 0")
        elif activity['jumps'] < 10:
            warnings.append(f"jumpRope: jumps très faible ({activity['jumps']})")
        elif activity['jumps'] > 10000:
            warnings.append(f"jumpRope: jumps suspect ({activity['jumps']})")
        
        if 'connectIQ' in activity:
            connect_iq = activity['connectIQ']
            if 'speed' in connect_iq:
                speed = connect_iq['speed']
                if speed <= 0:
                    errors.append(f"jumpRope: connectIQ.speed <= 0 ({speed})")
                elif speed < 10 or speed > 300:  # 10-300 sauts/min = plage raisonnable
                    warnings.append(f"jumpRope: connectIQ.speed suspect ({speed} sauts/min)")
            if 'interruptions' in connect_iq:
                interruptions = connect_iq['interruptions']
                if interruptions is None:
                    warnings.append("jumpRope: connectIQ.interruptions null")
                elif interruptions < 0:
                    errors.append(f"jumpRope: connectIQ.interruptions < 0 ({interruptions})")
            if 'maxContinuousJumps' in connect_iq:
                max_cont = connect_iq['maxContinuousJumps']
                if max_cont is None or max_cont == 0:
                    warnings.append("jumpRope: connectIQ.maxContinuousJumps manquant ou 0")
                elif max_cont > activity.get('jumps', 0):
                    errors.append(f"jumpRope: maxContinuousJumps ({max_cont}) > jumps ({activity.get('jumps', 0)})")
    
    # Vérifications communes
    if 'sweatLoss' in activity and activity['sweatLoss']:
        if activity['sweatLoss'] < 0:
            errors.append(f"{activity_type}: sweatLoss < 0 ({activity['sweatLoss']})")
        elif activity['sweatLoss'] > 1000:  # Plus de 1L = suspect
            warnings.append(f"{activity_type}: sweatLoss suspect ({activity['sweatLoss']} ml)")
    
    if 'minHR' in activity and activity['minHR']:
        if activity['minHR'] < 30 or activity['minHR'] > 200:
            warnings.append(f"{activity_type}: minHR suspect ({activity['minHR']} bpm)")
        elif activity['minHR'] > activity.get('avgHR', 0):
            errors.append(f"{activity_type}: minHR ({activity['minHR']}) > avgHR ({activity.get('avgHR', 0)})")
    
    if 'calories' in activity and isinstance(activity['calories'], dict):
        cal = activity['calories']
        if cal.get('active', 0) > cal.get('total', 0):
            errors.append(f"{activity_type}: calories.active > calories.total")
    
    return errors, warnings

def validate_daily_metrics(daily_data, date):
    """Valide les métriques quotidiennes"""
    errors = []
    warnings = []
    
    required_fields = ['steps', 'distance', 'calories', 'heartRate']
    for field in required_fields:
        if field not in daily_data:
            errors.append(f"{date}: {field} manquant")
            continue
        
        if field == 'steps':
            steps = daily_data[field]
            if steps is None:
                errors.append(f"{date}: steps null")
            elif steps < 0:
                errors.append(f"{date}: steps < 0 ({steps})")
            elif steps > 100000:
                warnings.append(f"{date}: steps suspect ({steps})")
        
        elif field == 'distance':
            distance = daily_data[field]
            if distance is None:
                warnings.append(f"{date}: distance null")
            elif distance < 0:
                errors.append(f"{date}: distance < 0 ({distance})")
            elif distance > 100:  # Plus de 100km/jour = suspect
                warnings.append(f"{date}: distance suspect ({distance} km)")
        
        elif field == 'calories':
            if isinstance(daily_data[field], dict):
                cal = daily_data[field]
                if cal.get('total', 0) <= 0:
                    errors.append(f"{date}: calories.total <= 0")
                elif cal.get('total', 0) > 10000:
                    warnings.append(f"{date}: calories.total suspect ({cal['total']} kcal)")
                if cal.get('active', 0) > cal.get('total', 0):
                    errors.append(f"{date}: calories.active > calories.total")
        
        elif field == 'heartRate':
            if isinstance(daily_data[field], dict):
                hr = daily_data[field]
                if hr.get('resting', 0) <= 0:
                    warnings.append(f"{date}: heartRate.resting <= 0")
                elif hr.get('resting', 0) < 30 or hr.get('resting', 0) > 120:
                    warnings.append(f"{date}: heartRate.resting suspect ({hr.get('resting', 0)} bpm)")
                if hr.get('max', 0) > 0:
                    if hr.get('max', 0) < 50 or hr.get('max', 0) > 250:
                        warnings.append(f"{date}: heartRate.max suspect ({hr.get('max', 0)} bpm)")
                    if hr.get('max', 0) < hr.get('resting', 0):
                        errors.append(f"{date}: heartRate.max < heartRate.resting")
    
    # Vérifications optionnelles
    if 'sleep' in daily_data and daily_data['sleep']:
        sleep = daily_data['sleep']
        if sleep.get('duration', 0) > 0:
            if sleep['duration'] > 24:  # Plus de 24h = suspect
                errors.append(f"{date}: sleep.duration suspect ({sleep['duration']}h)")
            elif sleep['duration'] < 2:
                warnings.append(f"{date}: sleep.duration très faible ({sleep['duration']}h)")
    
    if 'bodyBattery' in daily_data and daily_data['bodyBattery'] is not None:
        bb = daily_data['bodyBattery']
        if bb < 0 or bb > 100:
            errors.append(f"{date}: bodyBattery invalide ({bb})")
    
    if 'stress' in daily_data and daily_data['stress'] is not None:
        stress = daily_data['stress']
        if stress < 0 or stress > 100:
            errors.append(f"{date}: stress invalide ({stress})")
    
    if 'spo2' in daily_data and daily_data['spo2'] is not None:
        spo2 = daily_data['spo2']
        if spo2 < 70 or spo2 > 100:
            warnings.append(f"{date}: spo2 suspect ({spo2}%)")
    
    return errors, warnings

def main():
    """Point d'entrée principal"""
    if len(sys.argv) < 2:
        print("Usage: python validate_metrics.py <path_to_json_file>")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"ERREUR: Fichier {json_file} introuvable")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"ERREUR: Fichier JSON invalide: {e}")
        sys.exit(1)
    
    all_errors = []
    all_warnings = []
    
    # Valider activités
    if 'activities' in data:
        for activity_type in ['swimming', 'jumpRope', 'cardio']:
            activities = data['activities'].get(activity_type, [])
            for activity in activities:
                errors, warnings = validate_activity_metrics(activity, activity_type)
                all_errors.extend([f"[{activity.get('date', 'N/A')}] {e}" for e in errors])
                all_warnings.extend([f"[{activity.get('date', 'N/A')}] {w}" for w in warnings])
    
    # Valider métriques quotidiennes
    if 'dailyMetrics' in data:
        for date, daily_data in data['dailyMetrics'].items():
            errors, warnings = validate_daily_metrics(daily_data, date)
            all_errors.extend([f"[{date}] {e}" for e in errors])
            all_warnings.extend([f"[{date}] {w}" for w in warnings])
    
    # Résumé
    print("=" * 80)
    print("RAPPORT DE VALIDATION DES MÉTRIQUES GARMIN")
    print("=" * 80)
    print(f"\nErreurs critiques: {len(all_errors)}")
    if all_errors:
        print("\n" + "=" * 80)
        print("ERREURS CRITIQUES:")
        print("=" * 80)
        for error in all_errors:
            print(f"  ❌ {error}")
    
    print(f"\nAvertissements: {len(all_warnings)}")
    if all_warnings:
        print("\n" + "=" * 80)
        print("AVERTISSEMENTS:")
        print("=" * 80)
        for warning in all_warnings:
            print(f"  ⚠️  {warning}")
    
    if not all_errors and not all_warnings:
        print("\n✅ Aucun problème détecté! Toutes les métriques sont valides.")
    elif not all_errors:
        print("\n⚠️  Des avertissements ont été détectés mais aucune erreur critique.")
    else:
        print("\n❌ Des erreurs critiques ont été détectées. Veuillez corriger avant de continuer.")
    
    print("\n" + "=" * 80)
    
    sys.exit(1 if all_errors else 0)

if __name__ == '__main__':
    main()

