"""
🔴 FIX #9: Constantes de validation pour les données Garmin
Plages de valeurs raisonnables pour chaque métrique
"""

# Fréquence cardiaque (bpm)
HR_MIN = 30  # FC minimale acceptable (même pour un sédentaire)
HR_MAX = 220  # FC maximale théorique (220 - âge, mais on prend large)
HR_RESTING_MIN = 35
HR_RESTING_MAX = 110  # FC repos même pour un athlète très entraîné

# Calories (kcal)
CALORIES_MIN = 0
CALORIES_MAX = 20000  # Maximum raisonnable pour une journée très active

# Distance (km)
DISTANCE_MIN = 0
DISTANCE_MAX = 500  # Maximum raisonnable (ultra-marathon)

# Durée (secondes)
DURATION_MIN = 0
DURATION_MAX = 86400  # 24 heures en secondes

# Body Battery
BODY_BATTERY_MIN = 0
BODY_BATTERY_MAX = 100

# Stress
STRESS_MIN = 0
STRESS_MAX = 100

# SpO2 (%)
SPO2_MIN = 70  # Minimum viable
SPO2_MAX = 100

# Pas
STEPS_MIN = 0
STEPS_MAX = 100000  # Maximum raisonnable pour une journée

# Sauts (jump rope)
JUMPS_MIN = 0
JUMPS_MAX = 50000  # Maximum raisonnable pour une session

# Vitesse (km/h)
SPEED_MIN = 0
SPEED_MAX = 50  # Maximum raisonnable (cyclisme sprint)

# Élévation (m)
ELEVATION_MIN = -500  # Niveau de la mer négatif possible (Dead Sea)
ELEVATION_MAX = 9000  # Mont Everest ~8848m

# Température (°C)
TEMP_MIN = -30
TEMP_MAX = 50

# Distance de natation (m)
SWIM_DISTANCE_MIN = 0
SWIM_DISTANCE_MAX = 30000  # 30km maximum (ultra-natation)

# Allure (seconds per 100m)
PACE_MIN = 30  # 30s/100m = très rapide (2min/km)
PACE_MAX = 600  # 10min/100m = très lent (100min/km)


