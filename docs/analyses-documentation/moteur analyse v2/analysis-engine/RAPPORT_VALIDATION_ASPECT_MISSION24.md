# RAPPORT VALIDATION ASPECT — Mission 24

| Exigence | IMP | UT | PIPE | PUB | DOM | QUAL |
|---|---|---|---|---|---|---|
| Mémoire souveraine + persistée | ✓ | ✓ | ✓ | à rejouer v23 | NC | NC |
| Hiérarchie preuve transportée | ✓ | ✓ | ✓ | à rejouer v23 | NC | NC |
| Trajectoires parallèles | ✓ | ✓ | ✓ | à rejouer v23 | NC | NC |
| Sommeil abstention sparse | ✓ | — | ✓ | à rejouer v23 | NC | NC |
| Fingerprint enveloppe | ✓ | ✓ | ✓ | à rejouer v23 | NC | NC |
| Généralisation A–F runner | partiel | ✓ (M7/8/16) | partiel | NC | NC | NC |
| Jeux A/B/C 8 horizons | ✓ | ✓ | partiel | NC | NC | NC |
| DOM | ✓ mécanismes | — | — | — | NC | — |
| Aveugle humain | spec | — | — | — | — | NC |

## Procédure DOM (utilisateur)

1. Recalculer Analyse sous édition v23 (vider caches période si besoin).  
2. Récap → Analyse → « Vérifier les 8 périodes (DOM) ».  
3. Exporter TRACE + AUDIT ; contrôler `runEnvelope.fingerprint` unique MD/JSON.  
4. Remplir `mission23-blind-packet-PENDING.md` / paquet M24.
