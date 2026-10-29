# Mission autonome — amélioration du moteur d’analyse Momentum Sport

**Rôle de ce document :** consigne de travail / fil rouge opérationnel pour l’agent (autonomie maximale, validations humaines seulement sur arbitrages métier ou risques irréversibles).

**Compléments :** [AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md](./AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md) · [ARCHITECTURE-CIBLE-MOTEUR-ANALYSE.md](./ARCHITECTURE-CIBLE-MOTEUR-ANALYSE.md)

**Session de validation live :** une instance Momentum avec données réelles peut tourner sur `http://localhost:3001/` — s’en servir pour observer l’évolution des analyses avant/après, sans dépendre d’un avis humain à chaque itération.

---

## 1. Ton rôle et l'objectif final

Tu es responsable de l'audit, de la conception, de l'implémentation et de la validation des améliorations du moteur d'analyse de Momentum Sport.

Tu disposes du code existant : commence par le comprendre réellement avant de décider quoi modifier. Tu es libre de choisir l'architecture, les fonctions, les algorithmes et les modifications nécessaires, à condition de respecter les contraintes de ce projet et de justifier tes choix par le code et les résultats observés.

**Je souhaite intervenir le moins possible.** Ne me demande pas de choisir entre plusieurs solutions techniques lorsque tu peux prendre une décision raisonnable à partir du code, des données et des objectifs. En cas d'incertitude, privilégie la solution la plus simple, robuste, réversible et cohérente avec l'architecture existante.

Ne te contente pas de produire un rapport ou des recommandations : réalise le travail, teste-le et corrige les problèmes que tu découvres. Ne t'arrête pas après l'audit pour me demander si tu peux commencer l'implémentation.

En revanche, ne prends pas de décision destructive ou irréversible, ne supprime pas des données et ne lance pas une migration risquée sans nécessité démontrée.

## 2. Le problème à résoudre

Le moteur sait déjà générer des analyses, mais il n'exploite pas suffisamment les relations entre les données sportives, leur évolution dans le temps, les habitudes de l'utilisateur et les différents événements de son historique.

Le problème n'est pas simplement de rendre les phrases plus jolies. Il faut améliorer la qualité du raisonnement qui détermine :

- Ce que l'application remarque dans les données.
- Ce qu'elle en déduit réellement.
- Les éléments qui justifient cette déduction.
- Le moment où cette information est pertinente.
- La distinction entre un événement ponctuel, une tendance durable et une évolution récente.
- La priorité accordée aux analyses les plus utiles.
- La capacité à ne pas répéter la même observation sous plusieurs formes.
- La capacité à ne rien affirmer lorsque les données ne permettent pas de conclure.

L'objectif est que l'application ressemble davantage à un système qui comprend l'historique sportif d'une personne qu'à un générateur de cartes statistiques.

Les 14 analyses déjà examinées constituent un point de départ, pas une liste exhaustive des défauts. Ne limite donc pas ton audit aux exemples connus.

## 3. Commence par comprendre le moteur existant

Parcours le code réellement utilisé en production dans l'application, en remontant toute la chaîne :

1. Sources de données et structure de l'historique.
2. Calculs sportifs et agrégations temporelles.
3. Détection des événements et des tendances.
4. Génération des analyses candidates.
5. Sélection, classement, déduplication et filtrage.
6. Construction des textes, titres, catégories et badges.
7. Affichage final et éventuelles transformations intermédiaires.

Identifie précisément les fichiers, fonctions, données et dépendances concernés.

Ne suppose pas qu'une fonction ou une donnée existe parce qu'elle est mentionnée dans un document d'architecture. Vérifie le code effectif et les chemins d'exécution.

Repère notamment :

- Les calculs dupliqués ou contradictoires.
- Les données disponibles mais ignorées.
- Les relations entre données qui ne sont jamais examinées.
- Les règles temporelles trop simplistes.
- Les analyses qui peuvent être sélectionnées malgré leur faible valeur informative.
- Les doublons sémantiques.
- Les seuils arbitraires et les règles qui produisent des résultats fragiles.
- Les cas où l'absence de données est confondue avec une absence d'activité.
- Les endroits où les analyses perdent leur contexte ou leur justification.

Ne refactorise pas tout le moteur simplement parce qu'une architecture plus élégante est imaginable. Fais évoluer l'existant lorsque cela suffit ; change plus profondément l'architecture uniquement si un problème concret le justifie.

## 4. Construis une base de référence avant de modifier le comportement

Avant de toucher aux règles de génération ou de sélection, crée un moyen reproductible d'évaluer la qualité du moteur.

Utilise les 14 analyses déjà examinées comme premier cas de référence, puis complète-les avec des cas couvrant autant que possible :

- Les périodes de 7 jours, 30 jours, 3 mois et l'historique complet.
- Une activité régulière et une activité irrégulière.
- Une reprise réelle après une interruption.
- Une reprise apparente qui n'en est pas une.
- Une progression durable et un simple pic ponctuel.
- Une baisse temporaire et une baisse persistante.
- Des données incomplètes ou une période sans activité.
- Un historique très court.
- Des exercices fréquents et des exercices rarement pratiqués.
- Des changements de programme ou de modalités d'entraînement.
- Des analyses qui se ressemblent en surface mais apportent des informations différentes.
- Des données qui ne permettent pas de tirer une conclusion fiable.

Utilise des données de test, des fixtures ou des historiques existants de manière non destructive. N'invente pas des résultats présentés comme issus de véritables utilisateurs.

Si plusieurs profils ou historiques sont disponibles sans manipulation risquée, utilise-les également. Sinon, documente honnêtement les limites de la couverture.

Pour chaque scénario, conserve autant que possible :
- Les analyses générées.
- Leur ordre de priorité.
- Leur catégorie et leur identifiant.
- Les données qui les justifient.
- Les raisons pour lesquelles certaines analyses sont retenues, écartées ou considérées comme redondantes.

Privilégie des tests déterministes et reproductibles. N'introduis pas une nouvelle dépendance externe si le projet peut faire ce travail avec ses outils actuels.

## 5. Traite correctement la temporalité

C'est un point particulièrement important.

Une analyse doit tenir compte de la date réelle des événements, de leur ancienneté, de leur fréquence et de leur place dans l'évolution globale de l'utilisateur.

Ne confonds jamais automatiquement :
- Un événement survenu pendant la période analysée.
- Un événement survenu récemment.
- Un événement encore en cours.
- Une tendance qui vient de commencer.
- Une tendance qui dure depuis plusieurs semaines.
- Un fait ancien qui reste pertinent aujourd'hui.

Par exemple, si un utilisateur a repris l'entraînement il y a trois semaines, une analyse affichée dans une fenêtre de 30 jours ne doit pas nécessairement affirmer qu'il « vient de reprendre ». Il faut examiner la date exacte de reprise et les événements postérieurs.

Inversement, ne bannis pas les formulations comme « tu reprends », « tu progresses » ou « tu consolides tes acquis ». Elles restent pertinentes lorsqu'elles correspondent aux faits.

Implémente une logique temporelle adaptée aux données disponibles. Réutilise les calculs de dates et les notions de périodes déjà présents lorsqu'ils sont fiables. Évite de créer plusieurs systèmes concurrents pour calculer les mêmes informations.

Vérifie notamment les limites de périodes, les fuseaux horaires, les dates manquantes, les historiques incomplets et les éventuelles incohérences entre dates d'entraînement et dates d'enregistrement.

Lorsqu'une conclusion dépend d'une durée minimale, d'une comparaison ou d'un nombre d'observations, choisis un critère justifiable par les données et teste les cas limites. N'invente pas une précision que l'historique ne permet pas d'avoir.

## 6. Améliore la valeur informative, pas seulement le texte

Recherche des améliorations qui permettent au moteur de tirer des conclusions plus intéressantes à partir des données existantes.

Examine en particulier les possibilités suivantes, sans les implémenter aveuglément :

- Comparer des périodes réellement comparables.
- Distinguer volume total, fréquence, régularité, intensité et progression.
- Relier les événements successifs pour identifier une évolution.
- Détecter les changements de comportement significatifs.
- Distinguer une performance exceptionnelle d'une progression répétée.
- Identifier les habitudes stables et les changements inhabituels.
- Repérer les contradictions entre plusieurs indicateurs.
- Reconnaître les limites d'interprétation lorsque l'historique est trop court.
- Exploiter les relations entre exercices, séances, jours et périodes si les données les permettent.
- Éviter de tirer une conclusion causale d'une simple corrélation.
- Repérer les analyses exactes mais trop triviales pour mériter une place dans les résultats.

Pour chaque amélioration envisagée, vérifie d'abord si les données nécessaires existent, si leur qualité est suffisante et si le résultat apporte réellement quelque chose à l'utilisateur.

Ne transforme pas chaque donnée disponible en analyse. La pertinence prime sur la quantité.

## 7. Déduplication et sélection des analyses

Analyse séparément les doublons techniques et les doublons sémantiques.

Deux analyses peuvent avoir des identifiants différents tout en exprimant exactement la même idée. À l'inverse, deux analyses qui concernent le même exercice peuvent apporter des informations différentes : progression du volume, amélioration d'une performance, fréquence de pratique ou changement de régularité.

Mets en place une déduplication fiable qui préserve ces différences.

Tu peux notamment envisager une clé de nouveauté stable, une famille d'analyses, un sujet, une période ou une justification commune, si cela correspond à la structure existante. Choisis le mécanisme après avoir inspecté le code et les cas réels.

Évite les solutions fondées uniquement sur la comparaison de chaînes de caractères ou sur des mots-clés si elles risquent de supprimer des analyses distinctes.

Améliore également la sélection finale : une analyse ne doit pas être retenue uniquement parce qu'elle dépasse un seuil ou possède un score élevé. Sa valeur informative, sa nouveauté, sa fiabilité et sa pertinence temporelle doivent compter lorsque le moteur dispose des informations nécessaires.

N'introduis pas un système de scoring complexe sans démontrer qu'il améliore les résultats. Préfère des règles compréhensibles, testables et faciles à faire évoluer.

## 8. Architecture : décide à partir du code, pas d'un plan théorique

Tu es libre de choisir les abstractions nécessaires. Tu n'es pas obligé d'adopter une architecture particulière si l'existant permet de résoudre les problèmes plus simplement.

En revanche, évite les erreurs suivantes :

- Créer un grand système de claims, de preuves ou de composition sans besoin concret démontré.
- Ajouter plusieurs couches d'abstraction qui ne servent qu'à transmettre les mêmes données.
- Réécrire le générateur entier alors qu'une amélioration ciblée suffit.
- Dupliquer les calculs sportifs ou les règles temporelles.
- Mélanger la génération des faits, leur interprétation, leur classement et leur présentation dans une même fonction toujours plus complexe.
- Introduire une dépendance payante, un service distant ou un modèle d'IA externe alors que ce n'est pas nécessaire.
- Faire dépendre le résultat d'un ordre d'exécution accidentel ou d'un comportement non déterministe.
- Modifier les structures de données persistées sans nécessité.

Si une séparation entre détection, justification, classement et rédaction est utile, implémente-la progressivement et seulement à la bonne échelle.

Documente brièvement les décisions structurantes directement dans le code ou dans une note technique adaptée au projet.

## 9. Ordre d'exécution : avance sans attendre mes validations intermédiaires

Travaille de manière autonome selon les étapes suivantes.

### Étape A — Audit et référence

- Termine l'inspection du moteur.
- Constitue la base de référence.
- Identifie et classe les problèmes constatés.
- Établis les tests nécessaires.
- Note les risques de régression.

### Étape B — Premières améliorations ciblées

Implémente les corrections les plus solides et les moins risquées, notamment lorsque les défauts sont démontrés :

- Gestion des dates et formulations temporelles.
- Déduplication des analyses véritablement redondantes.
- Identification cohérente des familles d'analyses.
- Correction des badges et catégories incohérents.
- Meilleure traçabilité des justifications.
- Élimination des règles manifestement fragiles ou contradictoires.

Cette liste est indicative, pas une obligation de modifier chaque point si le code montre qu'il fonctionne déjà.

### Étape C — Réévaluation des résultats

Exécute les mêmes scénarios avant et après les modifications.

Vérifie que les analyses problématiques sont corrigées, que les analyses utiles restent présentes et que les analyses distinctes ne sont pas supprimées par erreur.

Si un changement dégrade le résultat, corrige-le avant de poursuivre.

### Étape D — Améliorations plus profondes

Une fois les premiers résultats validés, continue à rechercher et implémenter les améliorations à plus forte valeur ajoutée qui sont suffisamment étayées par le code et les tests.

Tu peux faire évoluer l'architecture si les résultats montrent que les améliorations ciblées ne suffisent pas. Procède par étapes cohérentes, avec des tests après chaque modification significative.

Ne t'arrête pas automatiquement après une première petite série de corrections : poursuis le travail tant que tu peux identifier des améliorations concrètes, les implémenter et les vérifier raisonnablement.

En revanche, ne poursuis pas une refonte simplement pour la rendre plus ambitieuse.

### Étape E — Vérification finale

- Exécute les tests pertinents.
- Lance les vérifications de types, lint ou build disponibles dans le projet.
- Contrôle les régressions sur la base de référence.
- Vérifie le comportement des périodes et des historiques incomplets.
- Vérifie que les changements restent compatibles avec les données existantes.
- Inspecte les changements finaux et élimine les modifications inutiles.
- Vérifie que le résultat reste compréhensible et maintenable.

Si une vérification échoue, cherche la cause et corrige-la lorsqu'elle est dans le périmètre de ton intervention. Ne masque pas une erreur en affaiblissant les tests.

## 10. Contraintes de sécurité et de périmètre

- Ne supprime aucune donnée utilisateur.
- Ne modifie pas les données sportives sources pour faire passer un test.
- Ne change pas les calculs fondamentaux de progression, de volume ou de performance sans avoir identifié un défaut précis et démontré son impact.
- Ne lance aucune migration destructive.
- Ne modifie pas les fonctionnalités sans rapport avec le moteur d'analyse.
- Ne fais pas de refonte esthétique de l'interface.
- Ne modifie pas les autres sous-systèmes de Momentum Sport simplement parce qu'ils partagent des fichiers.
- Ne rajoute pas de dépendance externe sans nécessité démontrée.
- Préserve le comportement existant lorsqu'aucune amélioration fiable n'est possible.
- Utilise les conventions du projet et les outils de test déjà installés.
- N'annule pas et n'écrase pas les modifications préexistantes de l'utilisateur.
- Ne fais pas de commit, de push ou de déploiement sans demande explicite.

Si tu rencontres une ambiguïté technique, prends la décision la plus prudente et documente-la. Sollicite-moi uniquement si la décision exige réellement une préférence métier que le code et les objectifs ne permettent pas de déduire, ou si continuer risque de causer une perte de données ou un changement difficilement réversible.

## 11. Critères de réussite

Le travail ne sera pas considéré comme réussi simplement parce que le code est plus propre ou que les tests passent.

Il doit apporter des améliorations observables :

- Les formulations temporelles correspondent mieux aux événements réels.
- Les doublons sont réduits sans faire disparaître des informations distinctes.
- Les analyses retenues apportent davantage de valeur.
- Les conclusions sont mieux justifiées par les données.
- Les historiques incomplets et les périodes sans activité sont traités correctement.
- Les comportements existants importants sont préservés.
- Les résultats sont reproductibles et les changements maintenables.

Évalue les résultats sur la base de référence et distingue les améliorations démontrées des hypothèses qui restent à confirmer.

## 12. Compte rendu final

Quand tu as terminé le travail que tu peux raisonnablement effectuer de façon autonome, fournis un compte rendu concis mais concret contenant :

1. Les principaux défauts identifiés dans le moteur initial.
2. Les changements réellement implémentés, avec les fichiers concernés et leur rôle.
3. Les améliorations visibles dans les résultats avant/après.
4. Les tests exécutés et leurs résultats exacts.
5. Les régressions éventuelles, les problèmes non résolus et leurs causes.
6. Les limites de la validation, notamment si les données disponibles ne permettent pas de vérifier certains comportements.
7. Les prochaines améliorations qui auraient un bénéfice réel, classées par priorité, sans les présenter comme déjà réalisées.

Ne prétends pas avoir testé des scénarios que tu n'as pas exécutés. Ne confonds pas une compilation réussie avec une validation fonctionnelle.

**Consigne finale :** prends en charge l'ensemble du travail avec autonomie, rigueur et pragmatisme. Analyse avant de modifier, implémente au lieu de seulement recommander, mesure les résultats et corrige les défauts découverts. Mon objectif est d'obtenir un moteur d'analyse réellement plus intelligent, pas simplement un moteur plus complexe.