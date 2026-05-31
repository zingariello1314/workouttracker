# Fixtures baseline v6

Snapshots JSON **schedule + quizGenerationMeta** pour les profils SPEC §8 Phase 0 (5 canoniques + `triathlon_olympic` v6.2b).

| Fichier | Profil |
|---------|--------|
| `hypertrophy_street_3j.json` | Hypertrophie street, 3 j Lun–Mer |
| `prep_10k.json` | Préparation 10 km |
| `marathon_light.json` | Semi / volume course élevé |
| `hybrid_strength_cardio.json` | Hybride force + cardio |
| `beginner_total.json` | Débutant total, 2 j |

## Régénérer

```bash
UPDATE_V6_FIXTURES=1 npx vitest run src/features/profileQuestionnaire/quizV6DefinitionOfDone.test.js -t "export snapshots"
```

Source des profils : `src/features/profileQuestionnaire/fixtures/v6AcceptanceProfiles.js`.
