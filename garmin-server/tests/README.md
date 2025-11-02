# 🧪 Tests Unitaires - Parsers Garmin

## 🔴 FIX #40: Tests pour garantir la qualité du parsing

### Structure

```
tests/
├── __init__.py
├── test_validators.py       # Tests validateurs
├── test_activity_parser.py  # Tests parser activités
├── test_daily_metrics_parser.py  # Tests parser métriques
└── README.md                # Ce fichier
```

### Exécution

**Avec pytest (recommandé) :**
```bash
cd garmin-server
pytest tests/ -v
```

**Avec unittest (si pytest non disponible) :**
```bash
cd garmin-server
python -m unittest discover tests
```

**Tests individuels :**
```bash
python tests/test_validators.py
python tests/test_activity_parser.py
python tests/test_daily_metrics_parser.py
```

### Couverture

- ✅ Validation des données (heart rate, distance, calories, swimming)
- ✅ Classification des activités
- ✅ Parsing métriques communes
- ✅ Parsing natation
- ✅ Parsing corde à sauter
- ✅ Parsing métriques quotidiennes (steps, distance, calories, HR, intensity)

### Améliorations futures

- [ ] Tests pour sleep_parser.py
- [ ] Tests pour respiration_parser.py
- [ ] Tests pour wellness_parser.py
- [ ] Tests d'intégration end-to-end
- [ ] Coverage reports

