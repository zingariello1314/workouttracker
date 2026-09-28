AUDIT ET ENRICHISSEMENT COMPLET DE LA BANQUE D'EXERCICES

Je veux enrichir la banque d'exercices existante de Momentum avec une grande quantité de médias déjà présents dans le projet.

⚠️ IMPORTANT : ne commence pas par modifier l'application.

La première étape doit être un audit complet et structuré des fichiers, de la banque d'exercices existante et des médias disponibles.

L'objectif est d'abord de comprendre précisément les correspondances possibles, puis seulement ensuite d'implémenter.

La banque d'exercices existe déjà et contient de nombreux exercices, avec leur propre modèle de carte et leur propre page détaillée. Il ne faut surtout pas repartir de zéro ni casser cette structure.

1. OBJECTIF GLOBAL

Je veux enrichir les exercices existants avec :

des GIFs / animations d'exercices ;
des vidéos pédagogiques individuelles ;
des routines/circuits vidéo ;
éventuellement de nouveaux exercices si un média correspond clairement à un exercice qui n'existe pas encore dans la banque.

Je veux maximiser la couverture tout en privilégiant la précision des associations.

Règle fondamentale :

Une association correcte vaut mieux que plusieurs associations approximatives.

Il ne faut jamais associer un média à un exercice uniquement parce que les noms se ressemblent vaguement.

2. STRUCTURE DES MÉDIAS

Dans le projet, il existe plusieurs sources distinctes.

A. videos muscles/

Ce dossier contient les vidéos pédagogiques principales.

Exemples de noms présents :

curl biceps.mp4
curl biceps poulie.mp4
développé couché barre.mp4
dips.mp4
squat barre.mp4
L-sit.mp4
rowing haltère debout.mp4
Reverse Hand Plank Lean.mp4
etc.

Il y a environ 150 vidéos en comptant les routines.

Ces vidéos doivent être considérées comme des vidéos d'exécution destinées à la page détaillée d'un exercice.

3. CAS PARTICULIER TRÈS IMPORTANT : gifs/

Il existe également une collection appelée :

gifs/

et plusieurs autres collections :

deuxieme dossier gif/
troisieme dossier gif/
quatrieme dossier gif/

C'est une subtilité importante.

Ces quatre dossiers constituent des collections de médias d'exercices indépendantes.

Ils ne doivent PAS être interprétés comme quatre versions d'un même dossier.

La structure est conceptuellement :

gifs/
deuxieme dossier gif/
troisieme dossier gif/
quatrieme dossier gif/

Chaque collection peut contenir :

des GIFs ;
des fichiers JSON décrivant les exercices/muscles/équipements/body parts ;
et, dans certains cas, des fichiers .mp4.
⚠️ Les MP4 présents dans une collection gifs

Dans deuxieme dossier gif, notamment, il existe aussi des fichiers .mp4.

Ces MP4 ne sont PAS des vidéos de videos muscles/.

Ils appartiennent à la collection gifs et doivent donc recevoir exactement le même traitement fonctionnel que les GIFs de cette collection :

média de représentation de l'exercice ;
affichage sur la carte de l'exercice avant clic ;
affichage dans la page détaillée ;
association au bon exercice ;
gestion des doublons ;
etc.

Ne jamais mélanger :

videos muscles/*.mp4

avec :

gifs/*.gif
deuxieme dossier gif/*.gif / *.mp4
troisieme dossier gif/*.gif
quatrieme dossier gif/*.gif

Le format du fichier ne suffit pas à déterminer sa fonction. C'est son dossier/source qui détermine son rôle.

4. LES COLLECTIONS GIF POSSÈDENT LEURS PROPRES JSON

Chaque collection possède ses propres fichiers de métadonnées, notamment :

bodyParts.json
equipments.json
exercises.json
muscles.json

Il faut considérer chaque collection comme un namespace indépendant.

Ne suppose pas que les IDs sont globalement uniques entre :

gifs
deuxieme dossier gif
troisieme dossier gif
quatrieme dossier gif

Avant de faire le moindre matching :

Phase d'audit obligatoire

Comparer les schémas JSON des différentes collections :

structure ;
clés ;
types ;
IDs ;
noms ;
relations ;
éventuelles différences de format.

Si les schémas sont identiques → utiliser un parseur commun.

S'ils diffèrent → créer des adaptateurs permettant de normaliser les données vers un format pivot commun.

5. NE PAS SE FIER UNIQUEMENT AUX NOMS DE FICHIERS

Les noms des médias sont parfois imparfaits.

Il existe notamment :

des noms français ;
des noms anglais ;
parfois d'autres formulations ;
des synonymes ;
des variantes de vocabulaire ;
des noms abrégés ;
des noms avec matériel ;
des noms sans matériel ;
des noms indiquant plusieurs variantes ;
des suffixes numériques.

Exemples :

curl biceps.mp4
curl biceps poulie.mp4
Cable Straight-Arm Pulldown.mp4
rowing haltère debout.mp4
Reverse Hand Plank Lean.mp4

Le matching doit donc utiliser plusieurs signaux.

À prendre en compte
nom du média ;
langue ;
synonymes FR/EN ;
nom normalisé ;
mouvement ;
groupe musculaire ;
partie du corps ;
équipement ;
position ;
variante ;
données des JSON ;
nom de l'exercice existant dans Momentum ;
éventuellement contexte des autres médias similaires.

Exemple :

Cable Straight-Arm Pulldown

ne doit pas être traité comme un exercice totalement différent simplement parce que le nom est en anglais.

6. LES SUFFIXES NUMÉRIQUES

Les fichiers peuvent également avoir des noms du type :

exercice 1
exercice 2
exercice 3

ou :

exercice 1
exercice 2
exercice 5

Il peut donc manquer des numéros.

⚠️ L'absence d'un numéro ne signifie PAS que le fichier est incorrect ou qu'il manque nécessairement un média.

Ne jamais déduire automatiquement :

1, 2, 5 → il manque forcément 3 et 4.

Les numéros doivent être considérés comme des suffixes de classement/identification, pas comme une séquence garantie.

7. CAS TRÈS IMPORTANT : "TOUTES LES VARIANTES"

Certains noms de fichiers indiquent explicitement qu'une vidéo concerne toutes les variantes.

Exemples :

curl barre ez toutes les variantes.mp4
développé couché haltères toutes les variantes.mp4
extension mollets debout toutes les variantes.mp4
pec fly à la poulie debout toutes les variantes.mp4
toutes les variantes de tractions australiennes...

Dans ce cas, il ne faut PAS créer une seule association.

Il faut rechercher dans la banque Momentum toutes les cartes d'exercices correspondant réellement à cette famille.

Par exemple :

Tractions australiennes
Tractions australiennes pronation
Tractions australiennes supination
Tractions australiennes variante X
...

Si la vidéo concerne effectivement toute la famille, elle doit être associée à toutes les variantes pertinentes existantes.

Mais attention :

"toutes les variantes" ne signifie pas "tous les exercices dont le nom contient un mot similaire".

Il faut vérifier que les exercices appartiennent réellement à la même famille biomécanique.

8. UNE VIDÉO PEUT CORRESPONDRE À PLUSIEURS EXERCICES

Inversement, certains médias peuvent naturellement correspondre à plusieurs cartes Momentum.

Il faut permettre une relation :

1 média → plusieurs exercices

lorsque c'est justifié.

Exemple :

vidéo "toutes les variantes de X"
        ↓
Exercice A
Exercice B
Exercice C
9. PLUSIEURS MÉDIAS POUR UN MÊME EXERCICE

Un exercice peut également avoir :

vidéo 1
vidéo 2
vidéo 3

Dans ce cas, ne pas remplacer une vidéo par une autre.

Conserver les différentes vidéos correctement associées.

Dans la page détaillée :

[ vidéo 1 ] [ vidéo 2 ]

et s'il y en a 3 :

[ vidéo 1 ] [ vidéo 2 ] [ vidéo 3 ]

etc.

La mise en page doit rester centrée et responsive.

Il faut éviter d'avoir :

vidéo
vidéo
vidéo

verticalement si plusieurs vidéos peuvent raisonnablement être affichées côte à côte.

10. APPROCHE HYBRIDE POUR LE MATCHING

Il y a environ :

~1 000 GIFs / médias issus des collections GIF
~150 vidéos, routines comprises

Donc il ne faut PAS demander à un LLM de juger naïvement plus de 1 000 fichiers un par un sans préparation.

Je veux une approche hybride.

Étape A — analyse automatisée

Créer un index de tous les médias avec au minimum :

{
  "mediaId": "...",
  "sourceCollection": "...",
  "relativePath": "...",
  "filename": "...",
  "extension": "...",
  "sha256": "...",
  "normalizedName": "...",
  "metadata": {}
}

mediaId doit être stable.

Il doit notamment intégrer la collection/source afin d'éviter les collisions d'ID.

Exemple :

{
  "mediaId": "gif_troisieme_ex042_a83f91c2",
  "sourceCollection": "troisieme dossier gif",
  "sha256": "..."
}

Le sha256 servira notamment à détecter les doublons exacts entre collections.

11. DÉDOUBLONNAGE

Les quatre collections GIF peuvent contenir beaucoup de recouvrement.

Deux fichiers peuvent :

avoir des noms différents ;
être dans deux collections différentes ;
avoir des IDs différents ;

tout en représentant le même exercice.

Il faut donc distinguer :

doublon physique

Même fichier :

sha256 identique
doublon conceptuel

Fichiers différents mais même exercice :

Curl biceps
Biceps curl
Curl haltères
...

Le premier doit être détecté automatiquement.

Le second doit être regroupé au niveau sémantique.

12. INDEX PIVOT

Ne pas matcher directement chaque collection contre Momentum séparément.

Construire d'abord un index pivot :

Collection 1
       ↓
normalisation
       ↓
Collection 2
       ↓
normalisation
       ↓
Collection 3
       ↓
normalisation
       ↓
Collection 4
       ↓
normalisation
       ↓
INDEX MÉDIA PIVOT
       ↓
MOMENTUM

L'index doit pouvoir regrouper :

exerciseName_normalized
→
[
  {
    collection,
    mediaId,
    sha256,
    name,
    muscle,
    equipment
  }
]

Cela permettra notamment de voir qu'un même exercice existe dans plusieurs collections.

13. SHORTLIST DES CANDIDATS

Pour chaque média, le script doit générer une shortlist de candidats Momentum plausibles.

Par exemple :

media:
curl biceps poulie.mp4

candidats:
1. Curl biceps poulie
2. Curl biceps à la poulie haute
3. Curl poulie basse

Puis seulement ensuite effectuer l'analyse sémantique.

Le système doit utiliser notamment :

matching lexical ;
normalisation ;
synonymes ;
FR/EN ;
équipement ;
muscles ;
variantes ;
métadonnées JSON.
14. NIVEAUX DE CONFIANCE

Définir des valeurs fermées.

Par exemple :

EXACT
HIGH_CONFIDENCE
PROBABLE
AMBIGUOUS
NO_MATCH

Avec des règles cohérentes.

EXACT

Nom + variante + équipement correspondent clairement.

HIGH_CONFIDENCE

Plusieurs signaux indépendants concordent.

PROBABLE

Correspondance plausible mais un élément reste incertain.

AMBIGUOUS

Plusieurs exercices restent possibles.

NO_MATCH

Aucune correspondance fiable.

⚠️ Ne jamais forcer un AMBIGUOUS vers un exercice simplement pour augmenter le taux de couverture.

15. RAPPORT D'AUDIT

Avant toute modification du code, produire un rapport structuré :

Média	Source	Candidat Momentum	Type	Confiance	Action
curl biceps.mp4	videos muscles	Curl biceps	individual	EXACT	associer
toutes variantes...	videos muscles	famille X	all_variants	HIGH	associer à la famille
xxx.gif	troisieme dossier	exercice X	individual	PROBABLE	vérifier
xxx.gif	gifs	—	—	NO_MATCH	ne rien faire

Et également produire un fichier JSON/CSV exploitable par la phase suivante.

16. ID ET TRAÇABILITÉ

Chaque média doit pouvoir être retrouvé ultérieurement.

Je veux pouvoir savoir :

ce média
→ venait de telle collection
→ avait tel chemin
→ avait tel hash
→ a été associé à tel exercice
→ avec tel niveau de confiance

Cela permettra de reprendre l'audit par lots sans recommencer tout le travail.

17. GIFS SUR LES CARTES DE LA BANQUE

Actuellement les cartes d'exercices utilisent notamment la vue anatomique du corps humain comme visuel principal.

Je veux que les GIFs prennent progressivement le relais.

Sur la carte :

Si un GIF/média existe

Afficher le média à la place de la vue anatomique actuelle.

S'il n'existe aucun média adapté

Conserver exactement le système actuel avec la vue anatomique.

Donc :

GIF disponible
→ GIF sur la carte

pas de GIF
→ vue anatomique actuelle

Il ne faut jamais laisser une carte vide simplement parce qu'aucun média n'a été trouvé.

18. GIF SUR LA PAGE DÉTAILLÉE

Quand l'utilisateur clique sur un exercice, on arrive sur la page détaillée actuelle.

Je veux conserver la structure actuelle de Momentum.

La page contient actuellement notamment :

titre ;
indice de charge ;
synthèse ;
exécution/consignes ;
ressentis ;
vue anatomique ;
muscles primaires/secondaires ;
etc.

Il faut ajouter les médias sans casser cette architecture.

19. ORDRE D'AFFICHAGE DES MÉDIAS

La règle souhaitée est :

Cas 1 — vidéo pédagogique disponible

Afficher :

TITRE
↓
VIDÉO(S) PÉDAGOGIQUE(S)
↓
GIF / ANIMATION
↓
contenu actuel de l'exercice

Si plusieurs vidéos :

[ Vidéo 1 ] [ Vidéo 2 ]

puis :

[ GIF ]

Le tout doit rester visuellement digeste et cohérent avec le design actuel.

Cas 2 — aucune vidéo pédagogique mais GIF disponible

Afficher :

TITRE
↓
GIF
↓
contenu actuel
Cas 3 — aucun média

Ne rien changer :

TITRE
↓
contenu actuel
20. COMPORTEMENT DES VIDÉOS PÉDAGOGIQUES

Pour les vidéos provenant de :

videos muscles/

une fois l'exercice ouvert :

chargement immédiat ;
lecture automatique ;
boucle automatique ;
lecture silencieuse si nécessaire pour permettre l'autoplay navigateur ;
possibilité de mettre pause ;
possibilité de reprendre ;
possibilité de passer en plein écran ;
contrôles accessibles ;
responsive ;
bonne taille d'affichage ;
pas de lecteur minuscule.

L'utilisateur doit pouvoir regarder immédiatement le mouvement sans devoir cliquer sur "Play".

Le plein écran doit rester disponible via les contrôles natifs/appropriés.

21. IMPORTANT : NE PAS CONFONDRE LES MP4 DES GIFS

Même si :

deuxieme dossier gif/
    exercice_x.mp4

contient un MP4, il doit être traité comme un média de collection GIF.

Donc :

videos muscles/exercice.mp4

→ vidéo pédagogique affichée prioritairement dans la page détaillée.

Alors que :

deuxieme dossier gif/exercice.mp4

→ média de collection GIF pouvant notamment remplacer le visuel de la carte.

Cette distinction doit être codée explicitement dans le modèle de données.

22. DOSSIER routines

Dans :

videos muscles/routines/

se trouvent des vidéos de routines/circuits.

Exemples :

routine abdos.mp4
routine biceps.mp4
routine triceps.mp4
routine épaules.mp4
routine haut du corps.mp4
routine étirement dos.mp4
...

⚠️ Ne pas essayer de déduire automatiquement tous les exercices contenus dans une routine uniquement à partir du nom du fichier.

Pour le moment, créer une nouvelle section dans la banque :

CIRCUITS

Cette section doit présenter les routines disponibles.

Chaque circuit possède :

nom ;
vidéo ;
éventuellement description ;
liste des exercices qu'il contient lorsque celle-ci aura été déterminée.
23. ÉVOLUTION PRÉVUE POUR LES ROUTINES

À terme, je veux pouvoir analyser chaque vidéo de routine pour déterminer précisément :

Routine Abdos
    ↓
Exercice A
Exercice B
Exercice C
Exercice D

Chaque exercice doit renvoyer vers sa fiche Momentum existante.

La fiche du circuit devra permettre :

Ajouter un exercice individuellement
Exercice A
[ Ajouter au programme ]
Ou ajouter tout le circuit
[ Ajouter le circuit à un jour du programme ]

Il faut donc concevoir les données de façon à permettre cette évolution.

Ne pas inventer la composition des routines à partir des noms des fichiers.

24. CRÉATION DE NOUVEAUX EXERCICES

Il existe un cas important.

Si un GIF ou une vidéo correspond clairement à un véritable exercice :

→ mais aucun exercice correspondant n'existe dans Momentum

alors il faut envisager de créer une nouvelle fiche exercice.

Mais uniquement après avoir vérifié qu'il ne s'agit pas :

d'un doublon ;
d'un synonyme d'un exercice existant ;
d'une variante déjà représentée ;
d'un même exercice sous un autre nom.
Règle absolue anti-doublon

Avant de créer :

Nouvel exercice

rechercher :

même mouvement
+
même variante
+
même équipement
+
même position

dans la banque existante.

S'il existe déjà → rattacher le média à l'exercice existant.

S'il n'existe réellement pas → créer une fiche selon exactement le même modèle que les cartes existantes.

25. NE PAS CRÉER DE FICHE POUR UN MÉDIA QUI N'EST PAS UN EXERCICE

Un média peut représenter :

une routine ;
un étirement générique ;
une séquence ;
une animation non exploitable comme exercice individuel ;
autre chose qu'un exercice identifiable.

Dans ce cas :

PAS DE NOUVELLE FICHE

Il faut d'abord identifier ce que représente réellement le média.

26. DESIGN DES NOUVELLES CARTES

Si un nouvel exercice doit réellement être créé, utiliser le modèle visuel et fonctionnel des cartes Momentum existantes.

La banque actuelle comporte notamment :

nom ;
difficulté ;
étoiles ;
indice de charge ;
bouton "Ajouter au programme" ;
tags ;
niveau ;
vue anatomique ;
muscles primaires ;
muscles secondaires ;
équipement ;
description.

Il ne faut donc pas créer un nouveau composant visuellement différent.

27. PRÉSERVER LES DONNÉES EXISTANTES

⚠️ Très important.

Ne pas :

supprimer les exercices existants ;
remplacer leurs données ;
modifier arbitrairement les muscles ;
modifier leurs coefficients ;
modifier les niveaux ;
casser le système de programme ;
casser le calendrier ;
casser le système de ressentis ;
casser la vue anatomique.

Le travail consiste à enrichir la banque.

28. PHASES DE TRAVAIL OBLIGATOIRES

Je veux que tu procèdes dans cet ordre.

PHASE 0 — INVENTAIRE

Scanner :

banque Momentum
videos muscles/
videos muscles/routines/
gifs/
deuxieme dossier gif/
troisieme dossier gif/
quatrieme dossier gif/

Compter :

exercices Momentum ;
GIFs ;
MP4 des collections GIF ;
vidéos pédagogiques ;
routines ;
JSON ;
doublons ;
extensions ;
fichiers potentiellement problématiques.
PHASE 1 — ANALYSE DES JSON

Comparer les :

bodyParts.json
equipments.json
exercises.json
muscles.json

des collections.

Documenter les différences éventuelles.

PHASE 2 — INDEXATION

Créer l'index média avec :

mediaId
sourceCollection
path
filename
extension
sha256
normalizedName
metadata
PHASE 3 — DÉDOUBLONNAGE

Identifier :

doublons physiques ;
doublons conceptuels ;
familles communes ;
variantes.
PHASE 4 — MATCHING

Générer les shortlists puis déterminer :

EXACT
HIGH_CONFIDENCE
PROBABLE
AMBIGUOUS
NO_MATCH

Ne pas forcer les cas ambigus.

PHASE 5 — RAPPORT

Avant toute modification importante du front-end, produire :

statistiques globales ;
correspondances ;
médias sans correspondance ;
exercices Momentum sans média ;
doublons ;
nouveaux exercices potentiels ;
cas ambigus ;
familles "toutes variantes".

Créer également un fichier machine-readable contenant les correspondances.

29. SEULEMENT ENSUITE : IMPLÉMENTATION

Une fois l'audit terminé, implémenter :

Banque
GIF → carte
Page exercice
vidéo(s)
↓
GIF
↓
contenu existant
Circuits
Banque
 ├── Exercices
 └── Circuits
Nouveaux exercices

Uniquement ceux réellement nécessaires.

30. OBJECTIF FINAL

À la fin, je veux obtenir une banque beaucoup plus riche :

CARTE EXERCICE
│
├── GIF / animation si disponible
│
└── sinon vue anatomique actuelle
        ↓
CLIC
        ↓
PAGE EXERCICE
│
├── Vidéo(s) pédagogique(s) si disponible(s)
│
├── GIF / animation
│
├── Synthèse
├── Consignes
├── Ressenti
├── Vue anatomique
└── Données existantes

Et :

BANQUE
│
├── EXERCICES
│
└── CIRCUITS
      │
      ├── vidéo
      ├── exercices du circuit
      ├── ajouter un exercice
      └── ajouter le circuit à un jour
31. PRIORITÉ ABSOLUE

Les priorités sont :

1. Ne rien casser dans Momentum.

2. Ne pas créer de doublons.

3. Ne pas faire de faux matching.

4. Utiliser au maximum les médias réellement exploitables.

5. Garder une traçabilité complète des associations.

6. Préserver la cohérence visuelle de la banque actuelle.

7. Prévoir une architecture suffisamment propre pour pouvoir ensuite enrichir progressivement les routines et les médias.

PREMIÈRE ACTION DEMANDÉE

Pour cette première exécution, ne modifie pas encore l'interface ni les données de production.

Commence uniquement par :

inspecter l'architecture Momentum ;
inspecter la banque d'exercices actuelle ;
inspecter videos muscles/ ;
inspecter videos muscles/routines/ ;
inspecter les quatre collections :
gifs
deuxieme dossier gif
troisieme dossier gif
quatrieme dossier gif
analyser leurs JSON ;
compter tous les médias ;
identifier les doublons ;
construire l'index ;
proposer les correspondances ;
signaler les ambiguïtés ;
signaler les nouveaux exercices potentiels.

Ne passe à l'implémentation qu'après avoir terminé cet audit et présenté clairement les résultats.

Et surtout, pour le rendu visuel

Les captures que je fournis montrent le rendu actuel réel de Momentum : la banque affiche actuellement les cartes avec la vue anatomique, et la page détaillée possède déjà sa structure avec synthèse, consignes, ressentis et vue anatomique.

Il faut partir de cette interface existante, pas créer une nouvelle UI.

Le but est de faire évoluer proprement cette interface pour que les médias s'intègrent naturellement dans le design actuel.

Dernier point important : avant d'écrire le code de matching, donne-moi d'abord les statistiques réelles que tu trouves. Je veux notamment connaître le nombre exact de fichiers par collection, le nombre de doublons, le nombre de médias dont le nom semble exploitable, et la structure réelle des JSON. Ne suppose pas ces valeurs à partir de mes estimations (~1 000 GIFs / ~150 vidéos).