/**
 * nutritionDataCRUD.js
 * 
 * ✅ PHASE 14.1 : Fichier de compatibilité - Réexport depuis modules séparés
 * 
 * Ce fichier maintient la rétrocompatibilité pour les imports existants.
 * Toutes les fonctions sont maintenant dans nutritionDataCRUD/index.js
 * qui les réexporte depuis les modules séparés (dailyMeals, meals, programs, etc.)
 * 
 * @module hooks/nutritionDataCRUD
 * @deprecated Utiliser directement depuis nutritionDataCRUD/index.js ou les modules individuels
 */

// ✅ Réexport de toutes les fonctions depuis index.js (qui réexporte depuis modules séparés)
export * from './nutritionDataCRUD/index';

/* 
 * ANCIEN CODE (2250 lignes) - DÉPLACÉ VERS MODULES SÉPARÉS :
 * 
 * Structure modulaire créée :
 * - nutritionDataCRUD/
 *   - index.js : Point d'entrée centralisé (réexporte toutes les fonctions)
 *   - shared.js : Imports et utilitaires partagés (logger, validations, etc.)
 *   - dailyMeals.js : Opérations CRUD Daily Meals (~360 lignes)
 *   - meals.js : Opérations CRUD Meals (~800 lignes)
 *   - programs.js : Opérations CRUD Programs (~400 lignes)
 *   - favoriteFoods.js : Opérations CRUD Favorite Foods (~200 lignes)
 *   - hydration.js : Opérations CRUD Hydration Logs (~250 lignes)
 * 
 * Bénéfices :
 * - Maintenabilité : Fichiers plus petits et focalisés
 * - Lisibilité : Structure claire par domaine
 * - Performance : Pas d'impact (même code, juste réorganisé)
 * - Rétrocompatibilité : Tous les imports existants fonctionnent toujours
 */
