🏗️ ARCHITECTURE GLOBALE
Onglet principal : ENDURANCE
Menu latéral gauche avec 6 sections :

Boxe
Pompes
Natation
Corde à sauter
Course
Calendrier (vue d'ensemble heatmap)


📋 FONCTIONNALITÉS PAR SOUS-ONGLET
1. BOXE
Formulaire de session :

Date/heure
Durée (en minutes)
Notes optionnelles

Historique :

Liste chronologique de toutes les sessions
Filtres : par date, durée
Affichage : Date | Durée | Notes | Action (supprimer/modifier)

Pas de système de défis (activité trop libre)

2. POMPES
Zone rappel défis actifs (en haut) :

Affichage conditionnel : visible uniquement s'il y a des défis en cours
Format : "⚠️ Vous avez 3 défis à accomplir avant 00h : [liste avec liens cliquables]"
Disparaît automatiquement quand le défi est validé

Formulaire de session :

Date/heure
Nombre de pompes
Durée (minutes:secondes)
Notes optionnelles
Validation automatique : si correspond à un défi actif, coche le défi

Gestion des défis :

Bouton "Créer un défi"
Modal avec paramètres :

Nom du défi
Type : Ponctuel / Récurrent / Sur période
Si ponctuel : date/heure cible
Si récurrent : fréquence (quotidien matin/midi/soir, hebdomadaire...)
Si sur période : date début/fin
Objectif : nombre de pompes ET/OU durée maximale
Option : permettre plusieurs défis simultanés


Liste des défis actifs avec progression :

Barre de progression (ex: "Jour 5/30")
Statut : En cours / Complété / Échoué
Actions : Modifier / Supprimer / Marquer comme accompli



Historique :

Liste chronologique avec badge si la session a validé un défi
Filtres : date, nombre de pompes, défis validés
Stats rapides : Total pompes du mois, moyenne par session


3. NATATION
Zone rappel défis actifs (même logique que pompes)
Formulaire de session :

Date/heure
Type de nage : Crawl / Brasse / Dos / Papillon / Mixte
Détail des longueurs :

Interface pour ajouter plusieurs longueurs
Pour chaque : Distance (25m par défaut, modifiable) + Temps (mm:ss)
Bouton "Ajouter une longueur"
Calcul automatique : distance totale, temps total, allure moyenne


Notes optionnelles

Gestion des défis :

Types de défis possibles :

Distance à nager (ex: "Nager 500m en une session")
Temps cible sur distance (ex: "Faire 25m en moins de 30s d'ici 2 séances")
Temps total à nager (ex: "Nager 30 minutes dans la prochaine séance")
Combinaisons multiples possibles simultanément


Paramètres :

Type de nage concerné (ou tous)
Échéance : ponctuelle (date précise) / sur X séances / avant date
Objectif chiffré



Historique :

Affichage détaillé de chaque session
Expandable : clic pour voir le détail des longueurs
Filtres : date, type de nage, distance, défis validés
Stats : Distance totale, temps moyen au 25m par type de nage


4. CORDE À SAUTER
Zone rappel défis actifs
Formulaire de session :

Date/heure
Durée (minutes:secondes)
Type : Continue / Fractionné / Technique
Nombre de sauts (optionnel, si compteur)
Notes optionnelles
Plusieurs sessions par jour possible (marqueur AM/PM ou numérotation)

Gestion des défis :

Types :

Durée à atteindre (ex: "10 min sans s'arrêter")
Nombre de sauts (ex: "500 sauts en une session")
Fréquence (ex: "3 sessions par jour pendant 1 semaine")
Sessions consécutives (ex: "7 jours d'affilée")


Paramètres similaires aux pompes

Historique :

Regroupement par jour si plusieurs sessions
Filtres : date, durée, type
Stats : Total temps, sessions par semaine


5. COURSE
Zone rappel défis actifs
Formulaire de session :

Date/heure
Distance (km)
Durée (hh:mm:ss)
Calcul automatique : allure (min/km), vitesse (km/h)
Type : Endurance / Fractionné / Récupération / Tempo
Dénivelé (optionnel)
Notes optionnelles

Gestion des défis :

Types :

Distance cible (ex: "Courir 10km")
Temps sur distance (ex: "5km en moins de 25min")
Allure cible (ex: "Maintenir 5min/km sur 3km")
Volume hebdomadaire (ex: "20km par semaine")



Historique :

Vue détaillée avec toutes les métriques
Filtres : date, distance, type, allure
Stats : Distance totale, allure moyenne, meilleur temps sur distances standards


6. CALENDRIER (Vue d'ensemble)
Heatmap style GitHub :

Grille de 365 jours (année en cours)
Intensité de couleur basée sur le nombre d'activités
Légende : Aucune activité (gris clair) → Très actif (vert foncé)

Tooltip au survol :

Date
Nombre total d'activités
Liste succincte : "2 sessions de pompes, 1 natation"

Interaction au clic :

Modal ou panneau latéral s'ouvre
Affiche toutes les activités de ce jour
Format : Type d'activité | Durée/Distance | Heure
Chaque activité est cliquable → redirige vers le sous-onglet concerné et scroll jusqu'à la session dans l'historique (highlight temporaire)

Filtres :

Sélection de l'année
Filtrer par type d'activité (voir uniquement natation, ou pompes, etc.)
Vue mensuelle / annuelle


🎨 DESIGN & UX
Menu latéral :

Icônes pour chaque activité
Badge avec nombre de défis actifs par catégorie
Section active mise en évidence

Système de rappel unifié :

Bannière fixe en haut de chaque sous-onglet (sauf Boxe et Calendrier)
Couleur d'alerte douce (orange/jaune)
Liste des défis avec countdown si échéance proche
Disparition automatique + animation de validation

Défis :

Carte visuelle pour chaque défi
Barre de progression colorée
Tags : "Urgent" (< 24h), "En cours", "Nouveau"
Modal de création intuitive avec prévisualisation

Historique :

Table responsive avec alternance de couleurs
Icônes pour actions (modifier, supprimer)
Badge "Défi validé" pour les sessions concernées
Animation de suppression

Formulaires :

Validation en temps réel
Auto-complétion des champs répétitifs
Bouton "Enregistrer et créer une autre" pour sessions multiples


💾 STRUCTURE DES DONNÉES
Collections nécessaires :

boxing_sessions
pushups_sessions
swimming_sessions
jumprope_sessions
running_sessions
challenges (avec type d'activité associée)
challenge_completions (historique validation)

Champs communs :

id, date, time, notes, created_at

Défis :

activity_type, name, type, goal, deadline, status, progress


🔄 LOGIQUE DE VALIDATION DES DÉFIS
Vérification automatique :
Quand une session est enregistrée :

Récupère tous les défis actifs pour cette activité
Compare les métriques de la session avec les objectifs
Si match → marque le défi comme complété + notification visuelle
Met à jour la progression des défis sur période
Retire du rappel en haut de page

Types de validation :

Instantanée : session atteint directement l'objectif
Progressive : accumulation sur plusieurs sessions (ex: 100 pompes sur la semaine)
Conditionnelle : avec contraintes temporelles ou fréquence


📱 RESPONSIVE

Menu latéral devient hamburger sur mobile
Tables historique deviennent des cartes empilées
Heatmap adapté avec scroll horizontal
Formulaires en pleine largeur