"""
Parsers Garmin - Modules de parsing par catégorie
"""
from .activity_parser import (
    classify_activity,
    parse_common_metrics,
    parse_swimming_metrics,
    parse_jump_rope_metrics,
    extract_activity_heart_rate_time_series
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
    extract_respiration_from_sleep,
    parse_sleep_awakenings,
    parse_sleep_movements,
    parse_sleep_phases_detailed
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
from .heart_rate_zones_parser import (
    parse_heart_rate_zones_from_activity,
    calculate_heart_rate_zones_from_time_series,
    parse_daily_heart_rate_zones
)
from .performance_parser import (
    parse_all_performance_metrics,
    parse_training_effect,
    parse_recovery_time,
    parse_vo2_max,
    parse_training_status,
    parse_training_load,
    parse_performance_condition,
    aggregate_daily_performance_metrics
)

__all__ = [
    # Activity parser
    'classify_activity',
    'parse_common_metrics',
    'parse_swimming_metrics',
    'parse_jump_rope_metrics',
    'extract_activity_heart_rate_time_series',
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
    'parse_sleep_awakenings',
    'parse_sleep_movements',
    'parse_sleep_phases_detailed',
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
    'parse_spo2',
    # Heart rate zones parser
    'parse_heart_rate_zones_from_activity',
    'calculate_heart_rate_zones_from_time_series',
    'parse_daily_heart_rate_zones',
    # Performance parser
    'parse_all_performance_metrics',
    'parse_training_effect',
    'parse_recovery_time',
    'parse_vo2_max',
    'parse_training_status',
    'parse_training_load',
    'parse_performance_condition',
    'aggregate_daily_performance_metrics'
]

