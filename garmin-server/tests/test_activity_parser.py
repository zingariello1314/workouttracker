"""
🔴 FIX #40: Tests unitaires pour le parser d'activités
Tests pour s'assurer que le parsing des activités fonctionne correctement
"""
import sys
import os

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from parsers.activity_parser import (
    classify_activity,
    parse_common_metrics,
    parse_swimming_metrics,
    parse_jump_rope_metrics
)


class TestClassifyActivity:
    """Tests pour classify_activity"""
    
    def test_classify_swimming(self):
        """Test classification natation"""
        activity_type = {'typeKey': 'swimming'}
        assert classify_activity(activity_type, {}, {}) == 'swimming'
        
        # Test avec distance et durée caractéristiques
        activity_type = {'typeKey': 'running'}
        act_summary = {'distance': 1500, 'duration': 3600}
        assert classify_activity(activity_type, act_summary, {}) == 'swimming'
    
    def test_classify_jump_rope(self):
        """Test classification corde à sauter"""
        activity_type = {'typeKey': 'jump_rope'}
        assert classify_activity(activity_type, {}, {}) == 'jumpRope'
        
        # Test avec connectIQ data
        activity_type = {'typeKey': 'running'}
        connect_iq = {'jumps': 500}
        assert classify_activity(activity_type, {}, connect_iq) == 'jumpRope'
    
    def test_classify_cardio(self):
        """Test classification cardio (par défaut)"""
        activity_type = {'typeKey': 'running'}
        act_summary = {'distance': 5000, 'duration': 1800}
        assert classify_activity(activity_type, act_summary, {}) == 'cardio'
        
        activity_type = {'typeKey': 'cycling'}
        assert classify_activity(activity_type, {}, {}) == 'cardio'


class TestParseCommonMetrics:
    """Tests pour parse_common_metrics"""
    
    def test_parse_basic_metrics(self):
        """Test parsing métriques de base"""
        act_summary = {
            'distance': 1500.0,  # mètres
            'duration': 3600,    # secondes
            'calories': 300
        }
        act = {}
        
        result = parse_common_metrics(act_summary, act, 'cardio', 'test_activity')
        
        assert result['distance'] == 1.5  # Converti en km
        assert result['duration'] == 3600
        assert 'calories' in result
    
    def test_parse_heart_rate(self):
        """Test parsing fréquence cardiaque"""
        act_summary = {
            'avgHR': 120,
            'maxHR': 180,
            'minHR': 60
        }
        act = {}
        
        result = parse_common_metrics(act_summary, act, 'cardio', 'test_activity')
        
        assert result.get('avgHR') == 120
        assert result.get('maxHR') == 180
        assert result.get('minHR') == 60
    
    def test_parse_location(self):
        """Test parsing localisation"""
        act_summary = {}
        act = {
            'startLatitude': 44.815,
            'startLongitude': -0.586,
            'endLatitude': 44.816,
            'endLongitude': -0.587
        }
        
        result = parse_common_metrics(act_summary, act, 'cardio', 'test_activity')
        
        assert 'location' in result
        assert result['location']['start']['lat'] == 44.815
        assert result['location']['end']['lat'] == 44.816
    
    def test_parse_timestamps(self):
        """Test parsing timestamps"""
        act_summary = {}
        act = {
            'startTimeLocal': '2025-11-01T15:45:53',
            'startTimeGMT': '2025-11-01T14:45:53Z'
        }
        
        result = parse_common_metrics(act_summary, act, 'cardio', 'test_activity')
        
        assert 'startTimeLocal' in result
        assert 'startTimeGMT' in result
    
    def test_parse_empty_data(self):
        """Test avec données vides"""
        act_summary = {}
        act = {}
        
        result = parse_common_metrics(act_summary, act, 'cardio', 'test_activity')
        
        # Ne doit pas crasher, retourne un résultat valide
        assert result is not None
        assert isinstance(result, dict)


class TestParseSwimmingMetrics:
    """Tests pour parse_swimming_metrics"""
    
    def test_parse_swimming_basic(self):
        """Test parsing natation basique"""
        act_summary = {
            'distance': 1500.0,
            'duration': 3600,
            'laps': 60
        }
        act = {}
        
        result = parse_swimming_metrics(act_summary, act, 'test_swim')
        
        assert result['distance'] == 1.5  # km
        assert result['laps'] == 60
    
    def test_parse_swimming_pool_length(self):
        """Test avec longueur de bassin"""
        act_summary = {
            'laps': 40,
            'poolLength': 25
        }
        act = {}
        
        result = parse_swimming_metrics(act_summary, act, 'test_swim')
        
        assert result.get('laps') == 40
        # Distance devrait être calculée : 40 * 25 = 1000m = 1km
    
    def test_parse_swimming_stroke_rate(self):
        """Test parsing stroke rate"""
        act = {
            'averageStrokeRate': 30
        }
        act_summary = {}
        
        result = parse_swimming_metrics(act_summary, act, 'test_swim')
        
        assert 'swimmingMetrics' in result
        # Vérifier que stroke rate est parsé


class TestParseJumpRopeMetrics:
    """Tests pour parse_jump_rope_metrics"""
    
    def test_parse_jumps_basic(self):
        """Test parsing sauts basique"""
        connect_iq = {
            'jumps': 500
        }
        act_summary = {}
        act = {}
        
        result = parse_jump_rope_metrics(connect_iq, act_summary, act, 'test_jump')
        
        assert result['jumps'] == 500
    
    def test_parse_jumps_from_activity(self):
        """Test parsing sauts depuis l'activité"""
        connect_iq = {}
        act_summary = {}
        act = {
            'jumps': 1000
        }
        
        result = parse_jump_rope_metrics(connect_iq, act_summary, act, 'test_jump')
        
        assert result.get('jumps') == 1000


def run_tests():
    """Fonction helper pour exécuter les tests manuellement"""
    import unittest
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestClassifyActivity))
    suite.addTests(loader.loadTestsFromTestCase(TestParseCommonMetrics))
    suite.addTests(loader.loadTestsFromTestCase(TestParseSwimmingMetrics))
    suite.addTests(loader.loadTestsFromTestCase(TestParseJumpRopeMetrics))
    
    runner = unittest.TextTestRunner(verbosity=2)
    return runner.run(suite)


if __name__ == '__main__':
    run_tests()

