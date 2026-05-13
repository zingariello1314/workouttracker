"""
Routes Phase 2 — validation XP progressive (alignement `xpCalculations.js`).
"""

from __future__ import annotations

from typing import Any, Callable, Optional

from fastapi import FastAPI, Header
from pydantic import BaseModel, Field

from xp_port import (
    books_streak_bonus_xp,
    compute_nutrition_registered_food_sport_xp,
    sport_xp_reference_ten_reps_two_star_bodyweight,
)


class XpPortVerifyV1(BaseModel):
    """Corps POST /api/v1/xp/port-verify — champs optionnels pour étendre sans casser."""

    meals: list[Any] = Field(default_factory=list)
    clientNutritionFoodXp: int | None = Field(default=None, ge=0)
    currentBookStreak: int | None = Field(default=None, ge=0)
    longestBookStreak: int | None = Field(default=None, ge=0)


def register_xp_routes(
    app: FastAPI,
    get_user_from_access_token: Callable[[Optional[str]], Any],
) -> None:
    @app.post("/api/v1/xp/port-verify")
    async def api_v1_xp_port_verify(
        body: XpPortVerifyV1,
        authorization: Optional[str] = Header(default=None),
    ):
        """
        Recalcule un sous-ensemble d’XP côté serveur (nutrition + bonus livres + repère sport).
        Compare `clientNutritionFoodXp` si fourni.
        """
        get_user_from_access_token(authorization)

        nut = compute_nutrition_registered_food_sport_xp(body.meals)
        match: bool | None = None
        if body.clientNutritionFoodXp is not None:
            match = int(body.clientNutritionFoodXp) == int(nut["nutritionFoodXp"])

        books_xp: int | None = None
        if body.currentBookStreak is not None and body.longestBookStreak is not None:
            books_xp = books_streak_bonus_xp(body.currentBookStreak, body.longestBookStreak)

        return {
            "nutritionFoodItems": nut["nutritionFoodItems"],
            "nutritionFoodXp": nut["nutritionFoodXp"],
            "clientNutritionFoodXpMatch": match,
            "booksStreakBonusXp": books_xp,
            "sportXpReferenceTenRepsTwoStarBodyweight": sport_xp_reference_ten_reps_two_star_bodyweight(),
        }
