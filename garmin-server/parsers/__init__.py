"""
Parsers Garmin - Modules de parsing par catégorie
"""
from .activity_parser import (
    classify_activity,
    parse_common_metrics,
    parse_swimming_metrics,
    parse_jump_rope_metrics
)
from .daily_metrics_parser import (
    parse_daily_steps,
    parse_daily_distance,
    parse_daily_calories,
    parse_daily_heart_rate,
    parse_daily_intensity_minutes,
    parse_daily_floors
)
from .sleep_parser import (
    parse_sleep_data,
    parse_sleep_phases,
    parse_sleep_times,
    extract_respiration_from_sleep
)
from .respiration_parser import (
    parse_respiration_data,
    parse_respiration_epochs,
    merge_respiration_sources,
    parse_respiration_list
)
from .wellness_parser import (
    fetch_body_battery,
    parse_body_battery,
    fetch_stress,
    parse_stress,
    fetch_spo2,
    parse_spo2
)

__all__ = [
    # Activity parser
    'classify_activity',
    'parse_common_metrics',
    'parse_swimming_metrics',
    'parse_jump_rope_metrics',
    # Daily metrics parser
    'parse_daily_steps',
    'parse_daily_distance',
    'parse_daily_calories',
    'parse_daily_heart_rate',
    'parse_daily_intensity_minutes',
    'parse_daily_floors',
    # Sleep parser
    'parse_sleep_data',
    'parse_sleep_phases',
    'parse_sleep_times',
    'extract_respiration_from_sleep',
    # Respiration parser
    'parse_respiration_data',
    'parse_respiration_epochs',
    'merge_respiration_sources',
    'parse_respiration_list',
    # Wellness parser
    'fetch_body_battery',
    'parse_body_battery',
    'fetch_stress',
    'parse_stress',
    'fetch_spo2',
    'parse_spo2'
]

