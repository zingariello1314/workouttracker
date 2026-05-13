"""
Sous-ensemble des calculs XP alignés sur `src/services/xp/xpCalculations.js`
(nutrition + bonus livres + repère sport) — pour validation serveur progressive.
"""

from __future__ import annotations

import math
from typing import Any

SPORT_XP_PER_NUTRITION_FOOD_REGISTERED = 50
TWO_STAR_INTENSITY_COEFF_UPPER = 1.34


def sport_xp_reference_ten_reps_two_star_bodyweight() -> int:
    weighted_load = 10 * TWO_STAR_INTENSITY_COEFF_UPPER * 1
    return int(round(weighted_load * 0.1))


def count_nutrition_registered_food_items(meals: Any) -> int:
    if not isinstance(meals, list) or len(meals) == 0:
        return 0
    n = 0
    for meal in meals:
        if not isinstance(meal, dict):
            continue
        foods = meal.get("foods")
        if not isinstance(foods, list):
            continue
        for f in foods:
            if not isinstance(f, dict):
                continue
            try:
                qty = float(f.get("quantity", 0))
            except (TypeError, ValueError):
                continue
            if not math.isfinite(qty) or qty <= 0:
                continue
            name = str(f.get("name") or "").strip()
            fid = str(f.get("id") or "").strip()
            if name or fid:
                n += 1
    return n


def compute_nutrition_registered_food_sport_xp(meals: Any) -> dict[str, int]:
    nutrition_food_items = count_nutrition_registered_food_items(meals)
    return {
        "nutritionFoodItems": nutrition_food_items,
        "nutritionFoodXp": nutrition_food_items * SPORT_XP_PER_NUTRITION_FOOD_REGISTERED,
    }


def _nonneg_number(v: Any) -> float:
    """Équivalent JS : Math.max(0, Number(v) || 0) avec NaN → 0."""
    try:
        x = float(v)
    except (TypeError, ValueError):
        return 0.0
    if math.isnan(x) or math.isinf(x):
        return 0.0
    return max(0.0, x)


def books_streak_bonus_xp(current_streak: Any, longest_streak: Any) -> int:
    c = _nonneg_number(current_streak)
    l = _nonneg_number(longest_streak)
    raw = 17 * math.sqrt(c) + 10 * math.sqrt(l)
    return min(240, int(round(raw)))
