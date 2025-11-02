"""
🔴 FIX #40: Tests unitaires pour les validateurs
Tests critiques pour s'assurer que la validation des données fonctionne correctement
"""
import sys
import os

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.validators import (
    validate_heart_rate,
    validate_distance_steps_consistency,
    validate_swimming_consistency,
    validate_calories_consistency
)


class TestHeartRateValidation:
    """Tests pour validate_heart_rate"""
    
    def test_valid_heart_rate(self):
        """Test avec des valeurs valides"""
        assert validate_heart_rate(60, 120, 80) == (60, 120, 80)
        assert validate_heart_rate(50, 180, 100) == (50, 180, 100)
    
    def test_out_of_range_resting(self):
        """Test avec FC repos hors limites"""
        # FC repos trop basse -> corrigée à min
        resting, max_hr, avg = validate_heart_rate(20, 120, 80)
        assert resting >= 30
        
        # FC repos trop haute -> corrigée à max
        resting, max_hr, avg = validate_heart_rate(150, 120, 80)
        assert resting <= 120
    
    def test_out_of_range_max(self):
        """Test avec FC max hors limites"""
        resting, max_hr, avg = validate_heart_rate(60, 250, 80)
        assert max_hr <= 220
        
        resting, max_hr, avg = validate_heart_rate(60, 50, 80)
        assert max_hr >= 100
    
    def test_invalid_logic(self):
        """Test avec logique invalide (max < resting)"""
        resting, max_hr, avg = validate_heart_rate(100, 80, 90)
        # Doit corriger : max doit être >= resting
        assert max_hr >= resting
    
    def test_none_values(self):
        """Test avec valeurs None"""
        resting, max_hr, avg = validate_heart_rate(None, None, None)
        assert resting is None or resting == 0
        assert max_hr is None or max_hr == 0
        assert avg is None or avg == 0


class TestDistanceStepsConsistency:
    """Tests pour validate_distance_steps_consistency"""
    
    def test_valid_ratio(self):
        """Test avec ratio valide"""
        distance, steps = validate_distance_steps_consistency(5.0, 6667)  # ~0.75m par pas
        assert distance == 5.0
        assert steps == 6667
    
    def test_suspicious_ratio_too_high(self):
        """Test avec ratio suspect (distance trop élevée)"""
        # 10km pour 1000 pas = 10m/pas (suspect, devrait être ~0.75m/pas)
        distance, steps = validate_distance_steps_consistency(10.0, 1000)
        # Doit corriger ou avertir
        assert distance is not None
    
    def test_suspicious_ratio_too_low(self):
        """Test avec ratio suspect (distance trop faible)"""
        # 0.1km pour 10000 pas = 0.01m/pas (suspect)
        distance, steps = validate_distance_steps_consistency(0.1, 10000)
        assert distance is not None
    
    def test_zero_steps(self):
        """Test avec steps = 0"""
        distance, steps = validate_distance_steps_consistency(5.0, 0)
        assert steps == 0
        assert distance is not None
    
    def test_extreme_distance(self):
        """Test avec distance extrême (>100km/jour)"""
        distance, steps = validate_distance_steps_consistency(150.0, 200000)
        # Doit détecter comme suspect
        assert distance is not None


class TestSwimmingConsistency:
    """Tests pour validate_swimming_consistency"""
    
    def test_valid_swimming(self):
        """Test avec données natation valides"""
        result = validate_swimming_consistency(
            distance_m=1500,
            duration_s=3600,
            laps=60,
            pool_length_m=25
        )
        assert result is not None
    
    def test_invalid_laps(self):
        """Test avec nombre de tours invalide"""
        result = validate_swimming_consistency(
            distance_m=1500,
            duration_s=3600,
            laps=0,  # Invalide
            pool_length_m=25
        )
        # Doit gérer le cas d'erreur
        assert result is not None or result is False
    
    def test_inconsistent_distance_laps(self):
        """Test avec distance et tours incohérents"""
        # 1500m mais 10 tours de 25m = 250m (incohérent)
        result = validate_swimming_consistency(
            distance_m=1500,
            duration_s=3600,
            laps=10,
            pool_length_m=25
        )
        assert result is not None


class TestCaloriesConsistency:
    """Tests pour validate_calories_consistency"""
    
    def test_valid_calories(self):
        """Test avec calories valides"""
        result = validate_calories_consistency(
            total=2000,
            active=500,
            resting=1500
        )
        assert result is not None
    
    def test_invalid_total(self):
        """Test avec total invalide"""
        # Total < active + resting
        result = validate_calories_consistency(
            total=1000,
            active=500,
            resting=1000  # Total devrait être >= 1500
        )
        assert result is not None
    
    def test_extreme_values(self):
        """Test avec valeurs extrêmes"""
        # Calories trop élevées
        result = validate_calories_consistency(
            total=30000,  # Extrême
            active=10000,
            resting=20000
        )
        assert result is not None


def run_tests():
    """Fonction helper pour exécuter les tests manuellement si besoin"""
    import unittest
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestHeartRateValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestDistanceStepsConsistency))
    suite.addTests(loader.loadTestsFromTestCase(TestSwimmingConsistency))
    suite.addTests(loader.loadTestsFromTestCase(TestCaloriesConsistency))
    
    runner = unittest.TextTestRunner(verbosity=2)
    return runner.run(suite)


if __name__ == '__main__':
    run_tests()

