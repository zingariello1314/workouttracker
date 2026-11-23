# COMPARAISON IDENTITÉS — v28 → v29

Source : audits gelés M30 baseline (v28) et M31 baseline (v29).  
Clé : `period::phenomenonId|phenomenonKey|occurrenceId|id`.

| Métrique | v28 | v29 |
|---|---|---|
| Cartes accessibles | 717 | 711 |
| Empreinte digests | `c8aa227e` | `c8aa227e` |
| nameMapSize (export principal) | 0 | 0 |
| Phénomènes partagés (clé ci-dessus) | — | 586 |
| Seulement v28 | — | 131 |
| Seulement v29 | — | 125 |
| Corps modifiés (même clé) | — | 43 |

## Lecture

- Δ −6 cartes **n’est pas** une régression automatique : redistributions d’identité / fusion / périodes.
- Même digest `c8aa227e` : mêmes sources reps/checked/weights au sens fingerprint multi-source-v5.
- Mentions `nameMapSize=119` dans d’autres contextes = **autre assemblage** (résolveur journal/programme enrichi), pas le fingerprint d’export audit. Risque cache : un pack calculé avec nameMap≠0 ne doit pas être réutilisé comme équivalent `nameMapSize=0` si l’édition/fingerprint le déclarent — aujourd’hui l’export principal est cohérent à 0.

## Hyperextension (contrôle factuel M30)

Export v29 `3m` : « ~7 séances » + totaux 336/288 — **correction M30 visible en produit**.

## Pertes

Échantillon `onlyV28` / `onlyV29` dans `revalidate-compare.json`.  
Pas d’imposition de retour à 717. Aucune perte injustifiée démontrée comme blocante sur la seule base des titres ; les clés d’identité bougent avec dates/aspects dans l’id.
