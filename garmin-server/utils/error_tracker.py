"""
🟢 PRIORITÉ 4 : Système de tracking et gestion des erreurs de parsing
Gestion centralisée des erreurs avec contexte détaillé et récupération intelligente
"""
import sys
import os
from typing import Any, Dict, Optional, List
from datetime import datetime
from enum import Enum

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.logger import print_debug, warn, error


class ErrorSeverity(Enum):
    """Niveaux de sévérité des erreurs"""
    INFO = "info"           # Information (non bloquant)
    WARNING = "warning"     # Avertissement (peut affecter les données)
    ERROR = "error"         # Erreur (données partiellement manquantes)
    CRITICAL = "critical"   # Critique (données complètement manquantes)


class ErrorCategory(Enum):
    """Catégories d'erreurs"""
    PARSING = "parsing"           # Erreur de parsing de données
    API = "api"                   # Erreur d'appel API
    VALIDATION = "validation"     # Erreur de validation de données
    NETWORK = "network"           # Erreur réseau
    STORAGE = "storage"           # Erreur de stockage
    UNKNOWN = "unknown"           # Erreur non catégorisée


class ParsingError:
    """
    Représente une erreur de parsing avec contexte détaillé.
    """
    def __init__(
        self,
        category: ErrorCategory,
        severity: ErrorSeverity,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None,
        recoverable: bool = False,
        recovery_action: Optional[str] = None
    ):
        self.timestamp = datetime.now().isoformat()
        self.category = category
        self.severity = severity
        self.message = message
        self.context = context or {}
        self.exception_type = type(exception).__name__ if exception else None
        self.exception_message = str(exception) if exception else None
        self.recoverable = recoverable
        self.recovery_action = recovery_action
        self.stack_trace = None
        
        if exception:
            import traceback
            self.stack_trace = traceback.format_exc()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit l'erreur en dictionnaire pour sérialisation"""
        return {
            "timestamp": self.timestamp,
            "category": self.category.value,
            "severity": self.severity.value,
            "message": self.message,
            "context": self.context,
            "exception_type": self.exception_type,
            "exception_message": self.exception_message,
            "recoverable": self.recoverable,
            "recovery_action": self.recovery_action,
            "stack_trace": self.stack_trace
        }
    
    def __str__(self) -> str:
        """Représentation string de l'erreur"""
        severity_icon = {
            ErrorSeverity.INFO: "ℹ️",
            ErrorSeverity.WARNING: "⚠️",
            ErrorSeverity.ERROR: "❌",
            ErrorSeverity.CRITICAL: "🔴"
        }
        
        icon = severity_icon.get(self.severity, "❓")
        context_str = f" | Context: {self.context}" if self.context else ""
        recovery_str = f" | Recovery: {self.recovery_action}" if self.recovery_action else ""
        
        return f"{icon} [{self.category.value.upper()}] {self.message}{context_str}{recovery_str}"


class ErrorTracker:
    """
    🟢 PRIORITÉ 4 : Système centralisé de tracking des erreurs.
    
    Permet de :
    - Tracker les erreurs avec contexte détaillé
    - Catégoriser les erreurs par sévérité et type
    - Fournir des statistiques sur les erreurs
    - Faciliter le debugging et le reporting
    """
    
    def __init__(self, max_errors: int = 1000):
        """
        Args:
            max_errors: Nombre maximum d'erreurs à garder en mémoire (pour éviter consommation excessive)
        """
        self.errors: List[ParsingError] = []
        self.max_errors = max_errors
        self.error_counts: Dict[str, int] = {}
        self._reset_stats()
    
    def _reset_stats(self):
        """Réinitialise les statistiques"""
        self.error_counts = {
            "total": 0,
            "by_category": {cat.value: 0 for cat in ErrorCategory},
            "by_severity": {sev.value: 0 for sev in ErrorSeverity},
            "recoverable": 0,
            "unrecoverable": 0
        }
    
    def track_error(
        self,
        category: ErrorCategory,
        severity: ErrorSeverity,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        exception: Optional[Exception] = None,
        recoverable: bool = False,
        recovery_action: Optional[str] = None,
        log: bool = True
    ) -> ParsingError:
        """
        Track une erreur avec contexte détaillé.
        
        Args:
            category: Catégorie de l'erreur
            severity: Niveau de sévérité
            message: Message descriptif
            context: Contexte supplémentaire (date, activity_id, field, etc.)
            exception: Exception originale (si disponible)
            recoverable: Si l'erreur est récupérable
            recovery_action: Action de récupération prise (si applicable)
            log: Si True, log l'erreur immédiatement
            
        Returns:
            ParsingError: L'erreur trackée
        """
        error_obj = ParsingError(
            category=category,
            severity=severity,
            message=message,
            context=context or {},
            exception=exception,
            recoverable=recoverable,
            recovery_action=recovery_action
        )
        
        # Ajouter à la liste (avec limite)
        if len(self.errors) >= self.max_errors:
            # Retirer la plus ancienne
            self.errors.pop(0)
        self.errors.append(error_obj)
        
        # Mettre à jour les statistiques
        self.error_counts["total"] += 1
        self.error_counts["by_category"][category.value] += 1
        self.error_counts["by_severity"][severity.value] += 1
        
        if recoverable:
            self.error_counts["recoverable"] += 1
        else:
            self.error_counts["unrecoverable"] += 1
        
        # Logger selon le niveau de sévérité
        if log:
            if severity == ErrorSeverity.CRITICAL:
                error(f"[{category.value}] {message}", extra=context)
            elif severity == ErrorSeverity.ERROR:
                error(f"[{category.value}] {message}", extra=context)
            elif severity == ErrorSeverity.WARNING:
                warn(f"[{category.value}] {message}", extra=context)
            else:
                print_debug(f"[{category.value}] {message}", extra=context)
        
        return error_obj
    
    def get_errors(
        self,
        category: Optional[ErrorCategory] = None,
        severity: Optional[ErrorSeverity] = None,
        limit: Optional[int] = None
    ) -> List[ParsingError]:
        """
        Récupère les erreurs avec filtres optionnels.
        
        Args:
            category: Filtrer par catégorie
            severity: Filtrer par sévérité
            limit: Limiter le nombre de résultats
            
        Returns:
            Liste des erreurs correspondant aux critères
        """
        filtered = self.errors
        
        if category:
            filtered = [e for e in filtered if e.category == category]
        
        if severity:
            filtered = [e for e in filtered if e.severity == severity]
        
        if limit:
            filtered = filtered[-limit:]  # Les plus récentes
        
        return filtered
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Récupère les statistiques sur les erreurs.
        
        Returns:
            Dict avec statistiques détaillées
        """
        return {
            "total": self.error_counts["total"],
            "by_category": self.error_counts["by_category"].copy(),
            "by_severity": self.error_counts["by_severity"].copy(),
            "recoverable": self.error_counts["recoverable"],
            "unrecoverable": self.error_counts["unrecoverable"],
            "recent_errors": [
                e.to_dict() for e in self.errors[-10:]  # 10 dernières erreurs
            ]
        }
    
    def clear(self):
        """Efface toutes les erreurs trackées"""
        self.errors.clear()
        self._reset_stats()
    
    def get_summary(self) -> str:
        """
        Génère un résumé textuel des erreurs.
        
        Returns:
            String avec résumé des erreurs
        """
        if self.error_counts["total"] == 0:
            return "✅ Aucune erreur détectée"
        
        lines = [
            f"📊 Résumé des erreurs ({self.error_counts['total']} total)",
            "",
            "Par catégorie:",
            *[f"  - {cat}: {count}" for cat, count in self.error_counts["by_category"].items() if count > 0],
            "",
            "Par sévérité:",
            *[f"  - {sev}: {count}" for sev, count in self.error_counts["by_severity"].items() if count > 0],
            "",
            f"Récupérables: {self.error_counts['recoverable']}",
            f"Non récupérables: {self.error_counts['unrecoverable']}"
        ]
        
        return "\n".join(lines)


# Instance globale du tracker (singleton)
_global_tracker: Optional[ErrorTracker] = None


def get_error_tracker() -> ErrorTracker:
    """
    Récupère l'instance globale du tracker d'erreurs.
    
    Returns:
        ErrorTracker: Instance globale du tracker
    """
    global _global_tracker
    if _global_tracker is None:
        _global_tracker = ErrorTracker()
    return _global_tracker


def track_parsing_error(
    message: str,
    context: Optional[Dict[str, Any]] = None,
    exception: Optional[Exception] = None,
    severity: ErrorSeverity = ErrorSeverity.WARNING,
    recoverable: bool = False,
    recovery_action: Optional[str] = None
) -> ParsingError:
    """
    Fonction helper pour tracker une erreur de parsing.
    
    Args:
        message: Message descriptif
        context: Contexte supplémentaire
        exception: Exception originale
        severity: Niveau de sévérité
        recoverable: Si l'erreur est récupérable
        recovery_action: Action de récupération
        
    Returns:
        ParsingError: L'erreur trackée
    """
    return get_error_tracker().track_error(
        category=ErrorCategory.PARSING,
        severity=severity,
        message=message,
        context=context,
        exception=exception,
        recoverable=recoverable,
        recovery_action=recovery_action
    )


def track_api_error(
    message: str,
    context: Optional[Dict[str, Any]] = None,
    exception: Optional[Exception] = None,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    recoverable: bool = True,
    recovery_action: Optional[str] = None
) -> ParsingError:
    """
    Fonction helper pour tracker une erreur d'API.
    
    Args:
        message: Message descriptif
        context: Contexte supplémentaire
        exception: Exception originale
        severity: Niveau de sévérité
        recoverable: Si l'erreur est récupérable (généralement oui pour API)
        recovery_action: Action de récupération
        
    Returns:
        ParsingError: L'erreur trackée
    """
    return get_error_tracker().track_error(
        category=ErrorCategory.API,
        severity=severity,
        message=message,
        context=context,
        exception=exception,
        recoverable=recoverable,
        recovery_action=recovery_action
    )

