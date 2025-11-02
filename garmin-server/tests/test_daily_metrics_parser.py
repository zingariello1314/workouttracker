"""
🔴 FIX #40: Tests unitaires pour le parser de métriques quotidiennes
Tests critiques pour valider le parsing des métriques quotidiennes
"""
import sys
import os

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from parsers.daily_metrics_parser import (
    parse_daily_steps,
    parse_daily_distance,
    parse_daily_calories,
    parse_daily_heart_rate,
    parse_daily_floors,
    parse_daily_intensity_minutes
)


class TestParseDailySteps:
    """Tests pour parse_daily_steps"""
    
    def test_parse_valid_steps(self):
        """Test avec valeurs valides"""
        stats = {'totalSteps': 10000}
        result = parse_daily_steps(stats, '2025-11-01')
        assert result == 10000
    
    def test_parse_zero_steps(self):
        """Test avec 0 pas"""
        stats = {'totalSteps': 0}
        result = parse_daily_steps(stats, '2025-11-01')
        assert result == 0
    
    def test_parse_missing_steps(self):
        """Test avec pas manquants"""
        stats = {}
        result = parse_daily_steps(stats, '2025-11-01')
        # Doit retourner 0 ou None, pas crasher
        assert result == 0 or result is None


class TestParseDailyDistance:
    """Tests pour parse_daily_distance"""
    
    def test_parse_valid_distance(self):
        """Test avec distance valide"""
        stats = {'totalDistanceMeters': 5000}
        result = parse_daily_distance(stats, '2025-11-01')
        assert result == 5.0  # Converti en km
    
    def test_parse_zero_distance(self):
        """Test avec distance zéro"""
        stats = {'totalDistanceMeters': 0}
        result = parse_daily_distance(stats, '2025-11-01')
        assert result == 0.0
    
    def test_parse_missing_distance(self):
        """Test avec distance manquante"""
        stats = {}
        result = parse_daily_distance(stats, '2025-11-01')
        assert result == 0.0 or result is None


class TestParseDailyCalories:
    """Tests pour parse_daily_calories"""
    
    def test_parse_valid_calories(self):
        """Test avec calories valides"""
        stats = {
            'totalKilocalories': 2000.0,
            'activeKilocalories': 500.0,
            'bmrKilocalories': 1500.0
        }
        result = parse_daily_calories(stats, '2025-11-01')
        
        assert result['total'] == 2000
        assert result['active'] == 500
        assert result['resting'] == 1500
    
    def test_parse_calories_calculation(self):
        """Test calcul resting = total - active"""
        stats = {
            'totalKilocalories': 2000.0,
            'activeKilocalories': 500.0
        }
        result = parse_daily_calories(stats, '2025-11-01')
        
        assert result['total'] == 2000
        assert result['active'] == 500
        assert result['resting'] == 1500  # 2000 - 500
    
    def test_parse_missing_calories(self):
        """Test avec calories manquantes"""
        stats = {}
        result = parse_daily_calories(stats, '2025-11-01')
        
        # Doit retourner un dict avec valeurs par défaut
        assert isinstance(result, dict)
        assert result.get('total') == 0 or result.get('total') is None


class TestParseDailyHeartRate:
    """Tests pour parse_daily_heart_rate"""
    
    def test_parse_valid_heart_rate(self):
        """Test avec FC valides"""
        stats = {
            'restingHeartRate': 60,
            'maxHeartRate': 180,
            'averageHeartRate': 120
        }
        hr_day = {}
        
        result = parse_daily_heart_rate(stats, hr_day, '2025-11-01')
        
        assert result['resting'] == 60
        assert result['max'] == 180
        assert result['avg'] == 120
    
    def test_parse_heart_rate_from_hr_day(self):
        """Test avec FC depuis hr_day"""
        stats = {}
        hr_day = {
            'restingHeartRate': 60,
            'maxHeartRate': 180,
            'minHeartRate': 50
        }
        
        result = parse_daily_heart_rate(stats, hr_day, '2025-11-01')
        
        assert result['resting'] == 60
        assert result['max'] == 180
    
    def test_parse_heart_rate_time_series(self):
        """Test parsing time series FC"""
        stats = {'restingHeartRate': 60}
        hr_day = {
            'heartRateValues': [
                {'timestamp': '2025-11-01T00:00:00Z', 'bpm': 65},
                {'timestamp': '2025-11-01T00:05:00Z', 'bpm': 70}
            ]
        }
        
        result = parse_daily_heart_rate(stats, hr_day, '2025-11-01')
        
        assert 'timeSeries' in result
        assert isinstance(result['timeSeries'], list)
    
    def test_parse_missing_heart_rate(self):
        """Test avec FC manquantes"""
        stats = {}
        hr_day = {}
        
        result = parse_daily_heart_rate(stats, hr_day, '2025-11-01')
        
        # Doit retourner un dict valide même sans données
        assert isinstance(result, dict)
        assert result.get('resting') == 0 or result.get('resting') is None


class TestParseDailyIntensityMinutes:
    """Tests pour parse_daily_intensity_minutes"""
    
    def test_parse_valid_intensity(self):
        """Test avec minutes d'intensité valides"""
        stats = {
            'moderateIntensityMinutes': 75,
            'vigorousIntensityMinutes': 25
        }
        
        result = parse_daily_intensity_minutes(stats, '2025-11-01')
        
        assert result['moderate'] == 75
        assert result['vigorous'] == 25
        assert result['total'] == 100
    
    def test_parse_missing_intensity(self):
        """Test avec minutes d'intensité manquantes"""
        stats = {}
        
        result = parse_daily_intensity_minutes(stats, '2025-11-01')
        
        # Doit retourner None ou dict avec zéros
        assert result is None or isinstance(result, dict)


def run_tests():
    """Fonction helper pour exécuter les tests manuellement"""
    import unittest
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestParseDailySteps))
    suite.addTests(loader.loadTestsFromTestCase(TestParseDailyDistance))
    suite.addTests(loader.loadTestsFromTestCase(TestParseDailyCalories))
    suite.addTests(loader.loadTestsFromTestCase(TestParseDailyHeartRate))
    suite.addTests(loader.loadTestsFromTestCase(TestParseDailyIntensityMinutes))
    
    runner = unittest.TextTestRunner(verbosity=2)
    return runner.run(suite)


if __name__ == '__main__':
    run_tests()

