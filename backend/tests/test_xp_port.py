"""Tests unitaires alignés sur `xpCalculations.js` (ports Python)."""

import math

from xp_port import (
    books_streak_bonus_xp,
    compute_nutrition_registered_food_sport_xp,
    count_nutrition_registered_food_items,
    sport_xp_reference_ten_reps_two_star_bodyweight,
    SPORT_XP_PER_NUTRITION_FOOD_REGISTERED,
)


def test_sport_xp_reference_matches_js_formula():
    weighted = 10 * 1.34 * 0.1
    assert sport_xp_reference_ten_reps_two_star_bodyweight() == int(round(weighted))


def test_nutrition_empty_meals():
    assert count_nutrition_registered_food_items([]) == 0
    r = compute_nutrition_registered_food_sport_xp([])
    assert r == {"nutritionFoodItems": 0, "nutritionFoodXp": 0}


def test_nutrition_counts_food_with_qty_and_name():
    meals = [
        {
            "foods": [
                {"name": "Riz", "quantity": 1},
                {"name": "", "id": "x", "quantity": 2},
                {"name": "x", "quantity": 0},
            ]
        }
    ]
    assert count_nutrition_registered_food_items(meals) == 2
    r = compute_nutrition_registered_food_sport_xp(meals)
    assert r["nutritionFoodXp"] == 2 * SPORT_XP_PER_NUTRITION_FOOD_REGISTERED


def test_books_streak_bonus_matches_sqrt_formula():
    c, l = 7, 7
    raw = 17 * math.sqrt(c) + 10 * math.sqrt(l)
    assert books_streak_bonus_xp(c, l) == min(240, int(round(raw)))
    assert books_streak_bonus_xp(0, 0) == 0
