/**
 * Tests Vitest sur la couche d'adaptation `stretchUtils` :
 *   • normalizeStretchSlots() doit accepter tous les formats historiques
 *   • generateStretchItemKey() doit produire des clés sans collision
 *   • buildPlannedStretchItemsForDateStr() doit dédupliquer + injecter par défaut
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeStretchSlots,
  flattenStretchItems,
  countStretchItems,
  buildDefaultStretchId,
  isStretchId,
  buildPlannedStretchItemsForDateStr,
  STRETCH_MOMENTS
} from '../stretchUtils';
import {
  generateStretchItemKey,
  parseStretchItemKey,
  isStretchItemKey
} from '../exerciseKeyGenerator';
import { stretchDatabase } from '../../data/stretchDatabase';
import { workoutProgram } from '../../data/workoutProgram';

describe('stretchUtils.normalizeStretchSlots', () => {
  it('renvoie {matin:[], midi:[], soir:[]} quand input est null/undefined', () => {
    expect(normalizeStretchSlots(null)).toEqual({ matin: [], midi: [], soir: [] });
    expect(normalizeStretchSlots(undefined)).toEqual({ matin: [], midi: [], soir: [] });
  });

  it('résout le format tableau (nouveau) en injectant les données de la banque', () => {
    const slots = normalizeStretchSlots(
      {
        matin: [
          { id: 9111, stretchKey: 'respiration_nasale_lente', duration: 60 }
        ],
        midi: [],
        soir: [
          { id: 9131, stretchKey: 'jambe_a_la_paroi', duration: 180 }
        ]
      },
      'lundi'
    );
    expect(slots.matin).toHaveLength(1);
    expect(slots.matin[0].fromBank).toBe(true);
    expect(slots.matin[0].name).toBe(stretchDatabase.respiration_nasale_lente.name);
    expect(slots.matin[0].duration).toBe(60);
    expect(slots.midi).toHaveLength(0);
    expect(slots.soir[0].name).toContain('Jambe à la paroi');
  });

  it('parse le format STRING legacy en items individuels (best-effort matching banque)', () => {
    const raw = {
      matin: '1 min respiration nasale lente + 2 min mobilisation cervicale + 2 min rotations d\'épaules'
    };
    const slots = normalizeStretchSlots(raw, 'lundi');
    expect(slots.matin).toHaveLength(3);
    expect(slots.matin[0].duration).toBe(60); // 1 min
    expect(slots.matin[1].duration).toBe(120); // 2 min
    expect(slots.matin[2].duration).toBe(120); // 2 min
    // Au moins le premier doit matcher "respiration_nasale_lente"
    expect(slots.matin[0].fromBank).toBe(true);
    expect(slots.matin[0].stretchKey).toBe('respiration_nasale_lente');
  });

  it('parse le format objet enrichi { instructions } en au moins 1 item', () => {
    const raw = {
      matin: { name: 'Échauffement', duration: '5 min', instructions: 'Mobilisation cervicale + rotations épaules' },
      midi: { name: 'Pause', duration: '2 min', instructions: 'Rien de prévu' }
    };
    const slots = normalizeStretchSlots(raw, 'mardi');
    // Le matin contient un " + " donc parsé comme legacy → 2 items
    expect(slots.matin.length).toBeGreaterThanOrEqual(1);
    // Le midi ne contient pas de " + " → 1 seul item libre
    expect(slots.midi).toHaveLength(1);
    expect(slots.midi[0].fromBank).toBe(false);
    expect(slots.midi[0].name).toBe('Pause');
  });

  it('flattenStretchItems aplatit en respectant l\'ordre matin → midi → soir', () => {
    const slots = normalizeStretchSlots(
      {
        matin: [{ id: 1, stretchKey: 'respiration_nasale_lente', duration: 60 }],
        midi: [{ id: 2, stretchKey: 'posture_sphinx', duration: 60 }],
        soir: [{ id: 3, stretchKey: 'jambe_a_la_paroi', duration: 60 }]
      }
    );
    const flat = flattenStretchItems(slots);
    expect(flat).toHaveLength(3);
    expect(flat[0].moment).toBe('matin');
    expect(flat[1].moment).toBe('midi');
    expect(flat[2].moment).toBe('soir');
  });
});

describe('stretchUtils.buildDefaultStretchId / isStretchId', () => {
  it('produit des IDs déterministes dans le range 9000-9999', () => {
    expect(buildDefaultStretchId('lundi', 'matin', 1)).toBe(9111);
    expect(buildDefaultStretchId('lundi', 'soir', 3)).toBe(9133);
    expect(buildDefaultStretchId('dimanche', 'soir', 9)).toBe(9739);
  });

  it('isStretchId reconnaît les IDs réservés', () => {
    expect(isStretchId(9111)).toBe(true);
    expect(isStretchId(9999)).toBe(true);
    expect(isStretchId(101)).toBe(false); // exo
    expect(isStretchId(8999)).toBe(false);
    expect(isStretchId('9111')).toBe(true); // string accepté
  });
});

describe('exerciseKeyGenerator: generateStretchItemKey / parseStretchItemKey', () => {
  it('génère puis parse correctement les clés d\'item', () => {
    const k = generateStretchItemKey('2026-05-09', 'matin', 9111);
    expect(k).toBe('2026-05-09_stretch_matin_9111');
    expect(isStretchItemKey(k)).toBe(true);

    const parsed = parseStretchItemKey(k);
    expect(parsed).toEqual({ dateStr: '2026-05-09', moment: 'matin', stretchId: '9111' });
  });

  it('renvoie null pour les clés legacy (granularité moment)', () => {
    expect(parseStretchItemKey('2026-05-09_matin')).toBeNull();
    expect(isStretchItemKey('2026-05-09_matin')).toBe(false);
  });

  it('rejette les valeurs invalides', () => {
    expect(parseStretchItemKey(null)).toBeNull();
    expect(parseStretchItemKey('')).toBeNull();
    expect(parseStretchItemKey('garbage')).toBeNull();
  });
});

describe('buildPlannedStretchItemsForDateStr', () => {
  it('renvoie les items du programme par défaut pour un jour donné', () => {
    // 2026-05-09 est un samedi (cf. timestamp utilisateur)
    const items = buildPlannedStretchItemsForDateStr('2026-05-09', workoutProgram);
    expect(items.length).toBeGreaterThan(0);
    // Tous les items du programme par défaut doivent être résolus depuis la banque
    items.forEach((it) => {
      expect(it.stretchKey).toBeTruthy();
      expect(stretchDatabase[it.stretchKey]).toBeDefined();
    });
  });

  it('respecte STRETCH_MOMENTS comme moments valides', () => {
    expect(STRETCH_MOMENTS).toEqual(['matin', 'midi', 'soir']);
  });

  it('peut désactiver l\'inclusion du programme par défaut', () => {
    const items = buildPlannedStretchItemsForDateStr('2026-05-09', workoutProgram, {
      includeDefault: false,
      programs: []
    });
    expect(items).toEqual([]);
  });

  it('joint le programme par défaut + un programme custom (sans dupliquer un même id)', () => {
    const customProgram = {
      schedule: {
        samedi: {
          etirements: {
            matin: [{ id: 99999, stretchKey: 'auto_grandissement_assis', duration: 60 }],
            midi: [],
            soir: []
          }
        }
      }
    };
    const items = buildPlannedStretchItemsForDateStr('2026-05-09', workoutProgram, {
      programs: [customProgram]
    });
    expect(items.find((it) => it.id === 99999)).toBeDefined();
    // Vérifier que les ids du programme par défaut sont aussi présents
    expect(items.find((it) => it.id === 9611)).toBeDefined();
  });
});

describe('countStretchItems', () => {
  it('compte tous les items à travers les 3 moments', () => {
    const slots = {
      matin: [{ id: 1, fromBank: true }, { id: 2, fromBank: true }],
      midi: [{ id: 3, fromBank: true }],
      soir: []
    };
    expect(countStretchItems(slots)).toBe(3);
    expect(countStretchItems({ matin: [], midi: [], soir: [] })).toBe(0);
    expect(countStretchItems(null)).toBe(0);
  });
});
