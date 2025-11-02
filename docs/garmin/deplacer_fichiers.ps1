# Script pour organiser les fichiers markdown dans leurs dossiers respectifs

Set-Location "C:\Users\zinga\Desktop\workout tracker\docs\garmin"

Write-Host "=== Organisation des fichiers Garmin ===" -ForegroundColor Cyan
Write-Host ""

# Analyses
Write-Host "Déplacement des analyses..." -ForegroundColor Yellow
Move-Item -Force "ANALYSE_COMPLETE_ONGLET_GARMIN.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ANALYSE_COMPLETE_PROJET.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ANALYSE_ETAT_IMPLÉMENTATION.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ANALYSE_OPTIMISATION_ONGLET_GARMIN.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ANALYSE_OPTIMISATION_ONGLET_GARMIN_V2.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ANALYSE_PROFONDE_GARMIN.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "DIAGNOSTIC_BEST_DAY_EVER.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "DIAGNOSTIC_GARMIN_COMPLET.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "DIAGNOSTIC_GARMIN_PROBLEMES.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_DES_LIEUX_COMPLET.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_DES_LIEUX_GARMIN.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_DES_LIEUX_GARMIN_COMPLET.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_DES_LIEUX_GARMIN_COMPLET_V2.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_DES_LIEUX_GARMIN_PROBLEMES.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_DES_LIEUX_GARMIN_SYSTEME_COMPLET.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_DES_LIEUX_GRAPHIQUES.md" "analyses\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_MODULARISATION_GARMIN.md" "analyses\" -ErrorAction SilentlyContinue

# Plans
Write-Host "Déplacement des plans..." -ForegroundColor Yellow
Move-Item -Force "BILAN_COMPLET_ONGLET_GARMIN.md" "plans\" -ErrorAction SilentlyContinue
Move-Item -Force "CE_QUI_RESTE_FINAL.md" "plans\" -ErrorAction SilentlyContinue
Move-Item -Force "ETAT_RESTANT.md" "plans\" -ErrorAction SilentlyContinue
Move-Item -Force "LES_10_DERNIERS_PROBLEMES_CRITIQUES_MAJEURS.md" "plans\" -ErrorAction SilentlyContinue
Move-Item -Force "PLAN_ACTION_PRIORITAIRE.md" "plans\" -ErrorAction SilentlyContinue
Move-Item -Force "PLAN_FINAL_RESTANT.md" "plans\" -ErrorAction SilentlyContinue

# Résumés
Write-Host "Déplacement des résumés..." -ForegroundColor Yellow
Move-Item -Force "FINAL_OPTIMISATIONS_COMPLETEES.md" "resumes\" -ErrorAction SilentlyContinue
Move-Item -Force "IMPLÉMENTATION_100_POURCENT.md" "resumes\" -ErrorAction SilentlyContinue
Move-Item -Force "IMPLÉMENTATION_COMPLÉTÉE.md" "resumes\" -ErrorAction SilentlyContinue
Move-Item -Force "OPTIMISATIONS_FINALES_COMPLETEES.md" "resumes\" -ErrorAction SilentlyContinue
Move-Item -Force "RESUME_FINAL.md" "resumes\" -ErrorAction SilentlyContinue
Move-Item -Force "RESUME_OPTIMISATIONS_COMPLETEES.md" "resumes\" -ErrorAction SilentlyContinue
Move-Item -Force "RÉSUMÉ_FINAL_IMPLÉMENTATION.md" "resumes\" -ErrorAction SilentlyContinue
Move-Item -Force "RÉSUMÉ_IMPLÉMENTATION_FINALE.md" "resumes\" -ErrorAction SilentlyContinue
Move-Item -Force "SUITE_TRAVAIL_GARMIN.md" "resumes\" -ErrorAction SilentlyContinue

# Avancement
Write-Host "Déplacement des fichiers d'avancement..." -ForegroundColor Yellow
Move-Item -Force "AVANCEMENT_IMPLÉMENTATION.md" "avancement\" -ErrorAction SilentlyContinue

# Guides
Write-Host "Déplacement des guides..." -ForegroundColor Yellow
Move-Item -Force "GUIDE_TESTS.md" "guides\" -ErrorAction SilentlyContinue

# Phases
Write-Host "Déplacement des phases..." -ForegroundColor Yellow
Move-Item -Force "CORRECTIONS_GARMIN_ET_AMELIORATIONS.md" "phases\" -ErrorAction SilentlyContinue
Move-Item -Force "PHASE4_OPTIMISATIONS_SERVEUR.md" "phases\" -ErrorAction SilentlyContinue
Move-Item -Force "PHASE5_INTEGRATION_DETAILLEE.md" "phases\" -ErrorAction SilentlyContinue
Move-Item -Force "PHASE5.3_INTEGRATION_CALENDAR_DETAILLEE.md" "phases\" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Organisation terminée ! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Résumé par dossier :" -ForegroundColor Cyan
Write-Host "  analyses/: $(Get-ChildItem -Path 'analyses' -Filter '*.md' | Measure-Object | Select-Object -ExpandProperty Count) fichiers"
Write-Host "  plans/: $(Get-ChildItem -Path 'plans' -Filter '*.md' | Measure-Object | Select-Object -ExpandProperty Count) fichiers"
Write-Host "  resumes/: $(Get-ChildItem -Path 'resumes' -Filter '*.md' | Measure-Object | Select-Object -ExpandProperty Count) fichiers"
Write-Host "  avancement/: $(Get-ChildItem -Path 'avancement' -Filter '*.md' | Measure-Object | Select-Object -ExpandProperty Count) fichiers"
Write-Host "  guides/: $(Get-ChildItem -Path 'guides' -Filter '*.md' | Measure-Object | Select-Object -ExpandProperty Count) fichiers"
Write-Host "  phases/: $(Get-ChildItem -Path 'phases' -Filter '*.md' | Measure-Object | Select-Object -ExpandProperty Count) fichiers"

