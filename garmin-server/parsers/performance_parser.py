"""
Parser Données de Performance Garmin
🟢 PRIORITÉ 5 : Récupération complète des données de performance
Inclut : Training Effect, Recovery Time, VO2 max, Training Status, Training Load, etc.
"""
import sys
import os
from typing import Any, Dict, Optional

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.helpers import safe_int, safe_float, print_debug
from utils.error_tracker import track_parsing_error, ErrorSeverity


# Plages de validation pour les métriques de performance
TRAINING_EFFECT_MIN = 0.0
TRAINING_EFFECT_MAX = 5.0
RECOVERY_TIME_MIN = 0.0
RECOVERY_TIME_MAX = 168.0  # 7 jours max
VO2_MAX_MIN = 20.0
VO2_MAX_MAX = 100.0
TRAINING_LOAD_MIN = 0.0
TRAINING_LOAD_MAX = 1000.0


def parse_training_effect(
    summary_dto: Optional[Dict[str, Any]],
    act: Optional[Dict[str, Any]],
    act_details: Optional[Dict[str, Any]],
    metrics_dto: Optional[Dict[str, Any]] = None
) -> Dict[str, float]:
    """
    Parse Training Effect (Aerobic et Anaerobic) depuis les données d'activité.
    
    🟢 PRIORITÉ 5 : Extraction complète et robuste du Training Effect.
    
    Training Effect est une métrique de 0.0 à 5.0 qui indique l'impact d'un entraînement :
    - 0.0-1.0 : Récupération
    - 1.0-2.0 : Aérobie base
    - 2.0-3.0 : Aérobie haute
    - 3.0-4.0 : Anaérobie
    - 4.0-5.0 : Puissance
    
    Args:
        summary_dto: activitySummaryDTO
        act: Données brutes de l'activité
        act_details: Détails complets de l'activité
        metrics_dto: metricsDTO (optionnel)
        
    Returns:
        dict: {"aerobic": float, "anaerobic": float} ou {} si non trouvé
    """
    training_effect = {}
    
    # Sources de données à vérifier (par ordre de priorité)
    sources = []
    if isinstance(summary_dto, dict):
        sources.append(summary_dto)
    if isinstance(act, dict):
        sources.append(act)
    if isinstance(act_details, dict):
        sources.append(act_details)
        # Chercher aussi dans activitySummaryDTO depuis act_details
        summary_from_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {})
        if isinstance(summary_from_details, dict):
            sources.append(summary_from_details)
    if isinstance(metrics_dto, dict):
        sources.append(metrics_dto)
    
    # Chercher Training Effect Aerobic
    aerobic_effect = None
    for source in sources:
        if not isinstance(source, dict):
            continue
        
        aerobic_effect = safe_float(
            source.get('aerobicTrainingEffect') or
            source.get('aerobicTrainingEffectValue') or
            source.get('trainingEffectAerobic') or
            source.get('aerobicTE') or
            source.get('aerobicEffect') or
            source.get('aerobictrainingeffect'),  # Variante casse
            None,
            warn_on_fail=False
        )
        
        if aerobic_effect is not None:
            # Validation de plage
            if TRAINING_EFFECT_MIN <= aerobic_effect <= TRAINING_EFFECT_MAX:
                training_effect["aerobic"] = round(aerobic_effect, 1)
                break
            else:
                print_debug(f"⚠️ Training Effect Aerobic hors plage: {aerobic_effect} (attendu: {TRAINING_EFFECT_MIN}-{TRAINING_EFFECT_MAX})")
                aerobic_effect = None
    
    # Chercher Training Effect Anaerobic
    anaerobic_effect = None
    for source in sources:
        if not isinstance(source, dict):
            continue
        
        anaerobic_effect = safe_float(
            source.get('anaerobicTrainingEffect') or
            source.get('anaerobicTrainingEffectValue') or
            source.get('trainingEffectAnaerobic') or
            source.get('anaerobicTE') or
            source.get('anaerobicEffect') or
            source.get('anaerobictrainingeffect'),  # Variante casse
            None,
            warn_on_fail=False
        )
        
        if anaerobic_effect is not None:
            # Validation de plage
            if TRAINING_EFFECT_MIN <= anaerobic_effect <= TRAINING_EFFECT_MAX:
                training_effect["anaerobic"] = round(anaerobic_effect, 1)
                break
            else:
                print_debug(f"⚠️ Training Effect Anaerobic hors plage: {anaerobic_effect} (attendu: {TRAINING_EFFECT_MIN}-{TRAINING_EFFECT_MAX})")
                anaerobic_effect = None
    
    return training_effect


def parse_recovery_time(
    summary_dto: Optional[Dict[str, Any]],
    act: Optional[Dict[str, Any]],
    act_details: Optional[Dict[str, Any]],
    metrics_dto: Optional[Dict[str, Any]] = None
) -> Optional[float]:
    """
    Parse Recovery Time (temps de récupération) depuis les données d'activité.
    
    🟢 PRIORITÉ 5 : Extraction complète du Recovery Time.
    
    Recovery Time est le temps estimé (en heures) nécessaire pour récupérer complètement.
    Généralement entre 0 et 72 heures.
    
    Args:
        summary_dto: activitySummaryDTO
        act: Données brutes de l'activité
        act_details: Détails complets de l'activité
        metrics_dto: metricsDTO (optionnel)
        
    Returns:
        float: Recovery Time en heures, ou None si non trouvé
    """
    # Sources de données à vérifier (par ordre de priorité)
    sources = []
    if isinstance(summary_dto, dict):
        sources.append(summary_dto)
    if isinstance(act, dict):
        sources.append(act)
    if isinstance(act_details, dict):
        sources.append(act_details)
        # Chercher aussi dans activitySummaryDTO depuis act_details
        summary_from_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {})
        if isinstance(summary_from_details, dict):
            sources.append(summary_from_details)
    if isinstance(metrics_dto, dict):
        sources.append(metrics_dto)
    
    # Chercher Recovery Time
    for source in sources:
        if not isinstance(source, dict):
            continue
        
        recovery_hours = safe_float(
            source.get('recoveryTime') or
            source.get('recoveryTimeValue') or
            source.get('suggestedRecoveryTime') or
            source.get('timeToRecover') or
            source.get('recoveryTimeHours') or
            source.get('recovery') or
            source.get('recoverytime'),  # Variante casse
            None,
            warn_on_fail=False
        )
        
        if recovery_hours is not None:
            # Validation de plage
            if RECOVERY_TIME_MIN <= recovery_hours <= RECOVERY_TIME_MAX:
                return round(recovery_hours, 1)
            else:
                print_debug(f"⚠️ Recovery Time hors plage: {recovery_hours}h (attendu: {RECOVERY_TIME_MIN}-{RECOVERY_TIME_MAX}h)")
    
    return None


def parse_vo2_max(
    summary_dto: Optional[Dict[str, Any]],
    act: Optional[Dict[str, Any]],
    act_details: Optional[Dict[str, Any]],
    metrics_dto: Optional[Dict[str, Any]] = None
) -> Optional[float]:
    """
    Parse VO2 max estimé depuis les données d'activité.
    
    🟢 PRIORITÉ 5 : Extraction du VO2 max si disponible.
    
    VO2 max est la consommation maximale d'oxygène (en ml/kg/min).
    Généralement entre 30 et 70 ml/kg/min pour la plupart des personnes.
    
    Args:
        summary_dto: activitySummaryDTO
        act: Données brutes de l'activité
        act_details: Détails complets de l'activité
        metrics_dto: metricsDTO (optionnel)
        
    Returns:
        float: VO2 max en ml/kg/min, ou None si non trouvé
    """
    # Sources de données à vérifier
    sources = []
    if isinstance(summary_dto, dict):
        sources.append(summary_dto)
    if isinstance(act, dict):
        sources.append(act)
    if isinstance(act_details, dict):
        sources.append(act_details)
        summary_from_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {})
        if isinstance(summary_from_details, dict):
            sources.append(summary_from_details)
    if isinstance(metrics_dto, dict):
        sources.append(metrics_dto)
    
    # Chercher VO2 max
    for source in sources:
        if not isinstance(source, dict):
            continue
        
        vo2_max = safe_float(
            source.get('vo2Max') or
            source.get('vo2max') or
            source.get('vo2MaxValue') or
            source.get('estimatedVO2Max') or
            source.get('estimatedVo2Max') or
            source.get('fitnessVO2Max') or
            source.get('fitnessVo2Max'),
            None,
            warn_on_fail=False
        )
        
        if vo2_max is not None:
            # Validation de plage
            if VO2_MAX_MIN <= vo2_max <= VO2_MAX_MAX:
                return round(vo2_max, 1)
            else:
                print_debug(f"⚠️ VO2 max hors plage: {vo2_max} (attendu: {VO2_MAX_MIN}-{VO2_MAX_MAX})")
    
    return None


def parse_training_status(
    summary_dto: Optional[Dict[str, Any]],
    act: Optional[Dict[str, Any]],
    act_details: Optional[Dict[str, Any]],
    metrics_dto: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Parse Training Status depuis les données d'activité.
    
    🟢 PRIORITÉ 5 : Extraction du Training Status si disponible.
    
    Training Status peut être : "Productive", "Peaking", "Maintaining", "Recovering", "Unproductive", etc.
    
    Args:
        summary_dto: activitySummaryDTO
        act: Données brutes de l'activité
        act_details: Détails complets de l'activité
        metrics_dto: metricsDTO (optionnel)
        
    Returns:
        str: Training Status, ou None si non trouvé
    """
    # Sources de données à vérifier
    sources = []
    if isinstance(summary_dto, dict):
        sources.append(summary_dto)
    if isinstance(act, dict):
        sources.append(act)
    if isinstance(act_details, dict):
        sources.append(act_details)
        summary_from_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {})
        if isinstance(summary_from_details, dict):
            sources.append(summary_from_details)
    if isinstance(metrics_dto, dict):
        sources.append(metrics_dto)
    
    # Chercher Training Status
    for source in sources:
        if not isinstance(source, dict):
            continue
        
        training_status = source.get('trainingStatus') or source.get('trainingstatus') or source.get('status')
        
        if training_status and isinstance(training_status, str):
            return training_status.strip()
    
    return None


def parse_training_load(
    summary_dto: Optional[Dict[str, Any]],
    act: Optional[Dict[str, Any]],
    act_details: Optional[Dict[str, Any]],
    metrics_dto: Optional[Dict[str, Any]] = None
) -> Optional[float]:
    """
    Parse Training Load depuis les données d'activité.
    
    🟢 PRIORITÉ 5 : Extraction du Training Load si disponible.
    
    Training Load est une métrique de charge d'entraînement (généralement 0-1000).
    
    Args:
        summary_dto: activitySummaryDTO
        act: Données brutes de l'activité
        act_details: Détails complets de l'activité
        metrics_dto: metricsDTO (optionnel)
        
    Returns:
        float: Training Load, ou None si non trouvé
    """
    # Sources de données à vérifier
    sources = []
    if isinstance(summary_dto, dict):
        sources.append(summary_dto)
    if isinstance(act, dict):
        sources.append(act)
    if isinstance(act_details, dict):
        sources.append(act_details)
        summary_from_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {})
        if isinstance(summary_from_details, dict):
            sources.append(summary_from_details)
    if isinstance(metrics_dto, dict):
        sources.append(metrics_dto)
    
    # Chercher Training Load
    for source in sources:
        if not isinstance(source, dict):
            continue
        
        training_load = safe_float(
            source.get('trainingLoad') or
            source.get('trainingload') or
            source.get('trainingLoadValue') or
            source.get('load') or
            source.get('epoc') or  # EPOC (Excess Post-Exercise Oxygen Consumption) est parfois utilisé
            source.get('trainingStressScore') or  # TSS (Training Stress Score)
            source.get('tss'),
            None,
            warn_on_fail=False
        )
        
        if training_load is not None:
            # Validation de plage
            if TRAINING_LOAD_MIN <= training_load <= TRAINING_LOAD_MAX:
                return round(training_load, 1)
            else:
                print_debug(f"⚠️ Training Load hors plage: {training_load} (attendu: {TRAINING_LOAD_MIN}-{TRAINING_LOAD_MAX})")
    
    return None


def parse_performance_condition(
    summary_dto: Optional[Dict[str, Any]],
    act: Optional[Dict[str, Any]],
    act_details: Optional[Dict[str, Any]],
    metrics_dto: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Parse Performance Condition depuis les données d'activité.
    
    🟢 PRIORITÉ 5 : Extraction de Performance Condition si disponible.
    
    Performance Condition peut inclure :
    - Condition avant l'entraînement
    - Condition pendant l'entraînement
    - Condition après l'entraînement
    
    Args:
        summary_dto: activitySummaryDTO
        act: Données brutes de l'activité
        act_details: Détails complets de l'activité
        metrics_dto: metricsDTO (optionnel)
        
    Returns:
        dict: Performance Condition avec pré/during/post, ou None si non trouvé
    """
    # Sources de données à vérifier
    sources = []
    if isinstance(summary_dto, dict):
        sources.append(summary_dto)
    if isinstance(act, dict):
        sources.append(act)
    if isinstance(act_details, dict):
        sources.append(act_details)
        summary_from_details = act_details.get('activitySummaryDTO', {}) or act_details.get('summaryDTO', {})
        if isinstance(summary_from_details, dict):
            sources.append(summary_from_details)
    if isinstance(metrics_dto, dict):
        sources.append(metrics_dto)
    
    performance_condition = {}
    
    # Chercher Performance Condition
    for source in sources:
        if not isinstance(source, dict):
            continue
        
        # Condition avant (pré-entraînement)
        pre_condition = source.get('performanceCondition') or source.get('performancecondition') or source.get('condition')
        if pre_condition is not None:
            if isinstance(pre_condition, (int, float)):
                performance_condition["pre"] = round(float(pre_condition), 1)
            elif isinstance(pre_condition, dict):
                # Si c'est un objet avec pré/during/post
                if "pre" in pre_condition or "before" in pre_condition:
                    performance_condition["pre"] = safe_float(pre_condition.get("pre") or pre_condition.get("before"), None, warn_on_fail=False)
                if "during" in pre_condition:
                    performance_condition["during"] = safe_float(pre_condition.get("during"), None, warn_on_fail=False)
                if "post" in pre_condition or "after" in pre_condition:
                    performance_condition["post"] = safe_float(pre_condition.get("post") or pre_condition.get("after"), None, warn_on_fail=False)
        
        # Condition pendant (si séparée)
        during_condition = source.get('performanceConditionDuring') or source.get('conditionDuring')
        if during_condition is not None and isinstance(during_condition, (int, float)):
            performance_condition["during"] = round(float(during_condition), 1)
        
        # Condition après (si séparée)
        post_condition = source.get('performanceConditionPost') or source.get('conditionPost')
        if post_condition is not None and isinstance(post_condition, (int, float)):
            performance_condition["post"] = round(float(post_condition), 1)
        
        if performance_condition:
            break
    
    return performance_condition if performance_condition else None


def parse_all_performance_metrics(
    summary_dto: Optional[Dict[str, Any]],
    act: Optional[Dict[str, Any]],
    act_details: Optional[Dict[str, Any]],
    act_id: Optional[str] = None,
    date_str: Optional[str] = None
) -> Dict[str, Any]:
    """
    Parse toutes les métriques de performance depuis les données d'activité.
    
    🟢 PRIORITÉ 5 : Extraction complète de toutes les métriques de performance.
    
    Args:
        summary_dto: activitySummaryDTO
        act: Données brutes de l'activité
        act_details: Détails complets de l'activité
        act_id: ID de l'activité (pour logs)
        date_str: Date de l'activité (pour logs)
        
    Returns:
        dict: Toutes les métriques de performance trouvées
        Format: {
            "trainingEffect": {"aerobic": float, "anaerobic": float},
            "recoveryTime": float,  # en heures
            "vo2Max": float,  # en ml/kg/min
            "trainingStatus": str,
            "trainingLoad": float,
            "performanceCondition": {"pre": float, "during": float, "post": float}
        }
    """
    # Chercher metricsDTO si disponible
    metrics_dto = None
    if isinstance(act, dict):
        metrics_dto = act.get('metricsDTO') or act.get('metrics')
    if isinstance(act_details, dict) and not metrics_dto:
        metrics_dto = act_details.get('metricsDTO') or act_details.get('metrics')
    
    performance_metrics = {}
    
    # Parser Training Effect
    try:
        training_effect = parse_training_effect(summary_dto, act, act_details, metrics_dto)
        if training_effect:
            performance_metrics["trainingEffect"] = training_effect
            if act_id and date_str:
                print_debug(f"✅ Parsed Training Effect for activity {act_id} ({date_str}): {training_effect}")
    except Exception as e:
        track_parsing_error(
            message=f"Failed to parse Training Effect for activity {act_id}",
            context={"activity_id": act_id, "date": date_str, "field": "trainingEffect"},
            exception=e,
            severity=ErrorSeverity.WARNING,
            recoverable=True,
            recovery_action="Skipping Training Effect, continuing with other metrics"
        )
    
    # Parser Recovery Time
    try:
        recovery_time = parse_recovery_time(summary_dto, act, act_details, metrics_dto)
        if recovery_time is not None:
            performance_metrics["recoveryTime"] = recovery_time
            if act_id and date_str:
                print_debug(f"✅ Parsed Recovery Time for activity {act_id} ({date_str}): {recovery_time}h")
    except Exception as e:
        track_parsing_error(
            message=f"Failed to parse Recovery Time for activity {act_id}",
            context={"activity_id": act_id, "date": date_str, "field": "recoveryTime"},
            exception=e,
            severity=ErrorSeverity.WARNING,
            recoverable=True,
            recovery_action="Skipping Recovery Time, continuing with other metrics"
        )
    
    # Parser VO2 max
    try:
        vo2_max = parse_vo2_max(summary_dto, act, act_details, metrics_dto)
        if vo2_max is not None:
            performance_metrics["vo2Max"] = vo2_max
            if act_id and date_str:
                print_debug(f"✅ Parsed VO2 max for activity {act_id} ({date_str}): {vo2_max} ml/kg/min")
    except Exception as e:
        track_parsing_error(
            message=f"Failed to parse VO2 max for activity {act_id}",
            context={"activity_id": act_id, "date": date_str, "field": "vo2Max"},
            exception=e,
            severity=ErrorSeverity.WARNING,
            recoverable=True,
            recovery_action="Skipping VO2 max, continuing with other metrics"
        )
    
    # Parser Training Status
    try:
        training_status = parse_training_status(summary_dto, act, act_details, metrics_dto)
        if training_status:
            performance_metrics["trainingStatus"] = training_status
            if act_id and date_str:
                print_debug(f"✅ Parsed Training Status for activity {act_id} ({date_str}): {training_status}")
    except Exception as e:
        track_parsing_error(
            message=f"Failed to parse Training Status for activity {act_id}",
            context={"activity_id": act_id, "date": date_str, "field": "trainingStatus"},
            exception=e,
            severity=ErrorSeverity.WARNING,
            recoverable=True,
            recovery_action="Skipping Training Status, continuing with other metrics"
        )
    
    # Parser Training Load
    try:
        training_load = parse_training_load(summary_dto, act, act_details, metrics_dto)
        if training_load is not None:
            performance_metrics["trainingLoad"] = training_load
            if act_id and date_str:
                print_debug(f"✅ Parsed Training Load for activity {act_id} ({date_str}): {training_load}")
    except Exception as e:
        track_parsing_error(
            message=f"Failed to parse Training Load for activity {act_id}",
            context={"activity_id": act_id, "date": date_str, "field": "trainingLoad"},
            exception=e,
            severity=ErrorSeverity.WARNING,
            recoverable=True,
            recovery_action="Skipping Training Load, continuing with other metrics"
        )
    
    # Parser Performance Condition
    try:
        performance_condition = parse_performance_condition(summary_dto, act, act_details, metrics_dto)
        if performance_condition:
            performance_metrics["performanceCondition"] = performance_condition
            if act_id and date_str:
                print_debug(f"✅ Parsed Performance Condition for activity {act_id} ({date_str}): {performance_condition}")
    except Exception as e:
        track_parsing_error(
            message=f"Failed to parse Performance Condition for activity {act_id}",
            context={"activity_id": act_id, "date": date_str, "field": "performanceCondition"},
            exception=e,
            severity=ErrorSeverity.WARNING,
            recoverable=True,
            recovery_action="Skipping Performance Condition, continuing with other metrics"
        )
    
    return performance_metrics


def aggregate_daily_performance_metrics(
    activities: list,
    date_str: str
) -> Dict[str, Any]:
    """
    Agrège les métriques de performance depuis les activités d'une journée.
    
    🟢 PRIORITÉ 5 : Calcul des métriques de performance quotidiennes.
    
    Pour chaque métrique :
    - Training Effect : moyenne des effets aérobie/anaérobie
    - Recovery Time : maximum (temps de récupération le plus long)
    - VO2 max : maximum (meilleure condition de la journée)
    - Training Load : somme (charge totale de la journée)
    - Training Status : le plus récent ou le plus fréquent
    - Performance Condition : moyenne
    
    Args:
        activities: Liste des activités de la journée
        date_str: Date pour les logs
        
    Returns:
        dict: Métriques de performance agrégées pour la journée
    """
    if not activities or len(activities) == 0:
        return {}
    
    performance_metrics = {
        "trainingEffect": {"aerobic": [], "anaerobic": []},
        "recoveryTime": [],
        "vo2Max": [],
        "trainingLoad": [],
        "trainingStatus": [],
        "performanceCondition": {"pre": [], "during": [], "post": []}
    }
    
    # Collecter toutes les métriques depuis les activités
    for activity in activities:
        if not isinstance(activity, dict):
            continue
        
        # Training Effect
        if activity.get("trainingEffect"):
            te = activity["trainingEffect"]
            if isinstance(te, dict):
                if te.get("aerobic") is not None:
                    performance_metrics["trainingEffect"]["aerobic"].append(te["aerobic"])
                if te.get("anaerobic") is not None:
                    performance_metrics["trainingEffect"]["anaerobic"].append(te["anaerobic"])
        
        # Recovery Time
        if activity.get("recoveryTime") is not None:
            performance_metrics["recoveryTime"].append(activity["recoveryTime"])
        
        # VO2 max
        if activity.get("vo2Max") is not None:
            performance_metrics["vo2Max"].append(activity["vo2Max"])
        
        # Training Load
        if activity.get("trainingLoad") is not None:
            performance_metrics["trainingLoad"].append(activity["trainingLoad"])
        
        # Training Status
        if activity.get("trainingStatus"):
            performance_metrics["trainingStatus"].append(activity["trainingStatus"])
        
        # Performance Condition
        if activity.get("performanceCondition"):
            pc = activity["performanceCondition"]
            if isinstance(pc, dict):
                if pc.get("pre") is not None:
                    performance_metrics["performanceCondition"]["pre"].append(pc["pre"])
                if pc.get("during") is not None:
                    performance_metrics["performanceCondition"]["during"].append(pc["during"])
                if pc.get("post") is not None:
                    performance_metrics["performanceCondition"]["post"].append(pc["post"])
    
    # Calculer les valeurs agrégées
    aggregated = {}
    
    # Training Effect : moyenne
    if performance_metrics["trainingEffect"]["aerobic"] or performance_metrics["trainingEffect"]["anaerobic"]:
        aggregated["trainingEffect"] = {}
        if performance_metrics["trainingEffect"]["aerobic"]:
            avg_aerobic = sum(performance_metrics["trainingEffect"]["aerobic"]) / len(performance_metrics["trainingEffect"]["aerobic"])
            aggregated["trainingEffect"]["aerobic"] = round(avg_aerobic, 1)
        if performance_metrics["trainingEffect"]["anaerobic"]:
            avg_anaerobic = sum(performance_metrics["trainingEffect"]["anaerobic"]) / len(performance_metrics["trainingEffect"]["anaerobic"])
            aggregated["trainingEffect"]["anaerobic"] = round(avg_anaerobic, 1)
    
    # Recovery Time : maximum (temps de récupération le plus long)
    if performance_metrics["recoveryTime"]:
        aggregated["recoveryTime"] = round(max(performance_metrics["recoveryTime"]), 1)
    
    # VO2 max : maximum (meilleure condition de la journée)
    if performance_metrics["vo2Max"]:
        aggregated["vo2Max"] = round(max(performance_metrics["vo2Max"]), 1)
    
    # Training Load : somme (charge totale de la journée)
    if performance_metrics["trainingLoad"]:
        aggregated["trainingLoad"] = round(sum(performance_metrics["trainingLoad"]), 1)
    
    # Training Status : le plus fréquent (ou le plus récent si égalité)
    if performance_metrics["trainingStatus"]:
        from collections import Counter
        status_counts = Counter(performance_metrics["trainingStatus"])
        most_common = status_counts.most_common(1)
        if most_common:
            aggregated["trainingStatus"] = most_common[0][0]
    
    # Performance Condition : moyenne
    if (performance_metrics["performanceCondition"]["pre"] or 
        performance_metrics["performanceCondition"]["during"] or 
        performance_metrics["performanceCondition"]["post"]):
        aggregated["performanceCondition"] = {}
        if performance_metrics["performanceCondition"]["pre"]:
            avg_pre = sum(performance_metrics["performanceCondition"]["pre"]) / len(performance_metrics["performanceCondition"]["pre"])
            aggregated["performanceCondition"]["pre"] = round(avg_pre, 1)
        if performance_metrics["performanceCondition"]["during"]:
            avg_during = sum(performance_metrics["performanceCondition"]["during"]) / len(performance_metrics["performanceCondition"]["during"])
            aggregated["performanceCondition"]["during"] = round(avg_during, 1)
        if performance_metrics["performanceCondition"]["post"]:
            avg_post = sum(performance_metrics["performanceCondition"]["post"]) / len(performance_metrics["performanceCondition"]["post"])
            aggregated["performanceCondition"]["post"] = round(avg_post, 1)
    
    if aggregated:
        print_debug(f"✅ Aggregated daily performance metrics for {date_str}: {len(activities)} activities")
    
    return aggregated

