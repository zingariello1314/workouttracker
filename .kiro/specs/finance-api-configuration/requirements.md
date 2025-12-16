# Requirements Document - Configuration API Finance

## Introduction

Ce document définit les exigences pour résoudre le problème de configuration des API financières qui empêche l'ajout correct de positions dans le portefeuille boursier. Le système affiche actuellement un message de succès mais ne récupère pas les données de marché réelles, créant une expérience utilisateur confuse.

## Glossary

- **API_Service**: Service externe fournissant des données financières (Alpha Vantage, Finnhub, Polygon)
- **Portfolio_Position**: Une position d'investissement dans le portefeuille utilisateur
- **Market_Data**: Données de marché en temps réel (prix, variation, volume)
- **Fallback_Mode**: Mode de fonctionnement avec données par défaut quand les API sont indisponibles
- **Configuration_Wizard**: Interface guidée pour configurer les clés API

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux être informé clairement des problèmes de configuration API, afin de comprendre pourquoi mes positions n'affichent pas de données de marché réelles.

#### Acceptance Criteria

1. WHEN the system detects missing API keys THEN the system SHALL display a clear warning message before allowing position addition
2. WHEN a position is added without market data THEN the system SHALL show a distinct visual indicator that data is incomplete
3. WHEN API calls fail THEN the system SHALL log the specific error and display user-friendly feedback
4. WHEN the user attempts to add a position THEN the system SHALL validate API connectivity before processing
5. WHEN market data is unavailable THEN the system SHALL clearly indicate which data is estimated vs real

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux un assistant de configuration des API, afin de pouvoir facilement configurer les clés nécessaires pour obtenir des données de marché réelles.

#### Acceptance Criteria

1. WHEN the user accesses the finance section THEN the system SHALL detect missing API keys and offer configuration assistance
2. WHEN the configuration wizard is launched THEN the system SHALL provide step-by-step guidance for each API provider
3. WHEN API keys are entered THEN the system SHALL validate them with test calls before saving
4. WHEN configuration is complete THEN the system SHALL refresh existing positions with real market data
5. WHEN multiple API providers are available THEN the system SHALL allow priority configuration and fallback ordering

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que le système fonctionne en mode dégradé avec des données par défaut, afin de pouvoir utiliser le portefeuille même sans API externes.

#### Acceptance Criteria

1. WHEN no API keys are configured THEN the system SHALL operate in offline mode with manual price entry
2. WHEN in offline mode THEN the system SHALL allow manual price updates for positions
3. WHEN API services are temporarily unavailable THEN the system SHALL use cached data when available
4. WHEN displaying offline data THEN the system SHALL clearly mark data as "manual" or "estimated"
5. WHEN API connectivity is restored THEN the system SHALL automatically sync real market data

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux des données de marché fiables et à jour, afin de prendre des décisions d'investissement éclairées.

#### Acceptance Criteria

1. WHEN market data is fetched THEN the system SHALL prioritize the most reliable API source
2. WHEN primary API fails THEN the system SHALL automatically fallback to secondary sources
3. WHEN data is older than 15 minutes THEN the system SHALL attempt to refresh it
4. WHEN displaying market data THEN the system SHALL show the data source and last update time
5. WHEN rate limits are reached THEN the system SHALL implement intelligent caching and retry strategies

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux une interface claire pour gérer mes positions, afin de distinguer facilement les données réelles des données estimées.

#### Acceptance Criteria

1. WHEN viewing the portfolio THEN the system SHALL use distinct visual styles for real vs estimated data
2. WHEN a position has incomplete data THEN the system SHALL show a "refresh" or "configure API" action
3. WHEN hovering over data points THEN the system SHALL show tooltips indicating data source and freshness
4. WHEN data is being updated THEN the system SHALL show loading indicators for specific positions
5. WHEN errors occur THEN the system SHALL provide actionable error messages with resolution steps