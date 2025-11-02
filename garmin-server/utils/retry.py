"""
🔴 FIX #38: Utilitaire de retry avec exponential backoff pour les appels API Garmin
Gère les rate limits et erreurs réseau de manière robuste
"""
import time
from functools import wraps
from typing import Callable, Any, Optional

from utils.helpers import print_debug


def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0, max_delay: float = 30.0):
    """
    Décorateur pour retry avec exponential backoff et jitter
    
    Args:
        max_retries: Nombre maximum de tentatives (défaut: 3)
        base_delay: Délai de base en secondes pour le backoff (défaut: 1.0s)
        max_delay: Délai maximum en secondes (défaut: 30.0s)
    
    Returns:
        Décorateur à appliquer aux fonctions
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    
                    # Si c'est la dernière tentative, lever l'exception
                    if attempt == max_retries - 1:
                        print_debug(f"❌ {func.__name__} échoué après {max_retries} tentatives: {type(e).__name__}: {e}")
                        raise
                    
                    # Calculer le délai avec exponential backoff + jitter
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    # Ajouter un jitter aléatoire (0-20% du délai) pour éviter thundering herd
                    import random
                    jitter = delay * 0.2 * random.random()
                    final_delay = delay + jitter
                    
                    print_debug(f"⚠️ {func.__name__} tentative {attempt + 1}/{max_retries} échouée ({type(e).__name__}: {e}), retry dans {final_delay:.2f}s...")
                    time.sleep(final_delay)
            
            # Ne devrait jamais arriver ici, mais au cas où
            if last_exception:
                raise last_exception
            
        return wrapper
    return decorator


def retry_on_rate_limit(max_retries: int = 5, base_delay: float = 5.0):
    """
    Décorateur spécialisé pour les rate limits Garmin (429 Too Many Requests)
    Utilise des délais plus longs car les rate limits Garmin peuvent être stricts
    
    Args:
        max_retries: Nombre maximum de tentatives (défaut: 5)
        base_delay: Délai de base en secondes (défaut: 5.0s)
    
    Returns:
        Décorateur à appliquer aux fonctions
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    
                    # Vérifier si c'est une erreur de rate limit
                    is_rate_limit = (
                        '429' in str(e) or
                        'Too Many Requests' in str(e) or
                        'rate limit' in str(e).lower() or
                        'quota' in str(e).lower()
                    )
                    
                    if not is_rate_limit:
                        # Si ce n'est pas un rate limit, lever immédiatement
                        raise
                    
                    # Si c'est la dernière tentative, lever l'exception
                    if attempt == max_retries - 1:
                        print_debug(f"❌ {func.__name__} rate limit persistant après {max_retries} tentatives")
                        raise
                    
                    # Délai plus long pour rate limits (5s, 10s, 20s, 40s, 60s)
                    delay = min(base_delay * (2 ** attempt), 60.0)
                    
                    print_debug(f"⏳ {func.__name__} rate limit détecté, attente {delay:.1f}s avant retry {attempt + 1}/{max_retries}...")
                    time.sleep(delay)
            
            # Ne devrait jamais arriver ici
            if last_exception:
                raise last_exception
            
        return wrapper
    return decorator

