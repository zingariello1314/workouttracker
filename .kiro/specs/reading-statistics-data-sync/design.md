# Design Document

## Overview

This design document outlines the solution for resolving the synchronization issue between recorded reading sessions and statistics display. The system will implement robust data validation, automatic correction mechanisms, real-time synchronization, and comprehensive diagnostic tools to ensure reading sessions are consistently reflected in statistics.

## Architecture

The solution follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Statistics UI Layer                      │
├─────────────────────────────────────────────────────────────┤
│                Statistics Calculation Layer                 │
├─────────────────────────────────────────────────────────────┤
│                 Data Validation Layer                       │
├─────────────────────────────────────────────────────────────┤
│                 Data Synchronization Layer                  │
├─────────────────────────────────────────────────────────────┤
│                    IndexedDB Storage                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Data Integrity First**: All data passes through validation before processing
2. **Graceful Degradation**: System continues to function with partial or corrupted data
3. **Real-time Synchronization**: Changes are immediately reflected in statistics
4. **Diagnostic Transparency**: Clear visibility into data processing and issues
5. **Automatic Recovery**: Self-healing mechanisms for common data problems

## Components and Interfaces

### 1. DataSyncManager

Central orchestrator for data synchronization between storage and statistics.

```typescript
interface DataSyncManager {
  syncReadingSessions(): Promise<SyncResult>
  validateAndRepairData(): Promise<RepairResult>
  subscribeToChanges(callback: (event: DataChangeEvent) => void): void
  unsubscribeFromChanges(callback: Function): void
}
```

### 2. SessionValidator

Validates and corrects reading session data structure and content.

```typescript
interface SessionValidator {
  validateSession(session: ReadingSession): ValidationResult
  repairSession(session: ReadingSession): ReadingSession
  validateAllSessions(sessions: ReadingSession[]): ValidationSummary
  generateSessionId(): string
  normalizeDateFormat(date: string): string
  convertNumericFields(session: ReadingSession): ReadingSession
}
```

### 3. StatisticsCalculator (Enhanced)

Enhanced version of existing calculator with robust error handling.

```typescript
interface StatisticsCalculator {
  calculateMetrics(sessions: ReadingSession[]): StatisticsMetrics
  calculateWithFallbacks(sessions: ReadingSession[]): StatisticsMetrics
  validateInputData(sessions: ReadingSession[]): boolean
  getCalculationErrors(): CalculationError[]
}
```

### 4. DiagnosticService

Provides comprehensive diagnostic and repair capabilities.

```typescript
interface DiagnosticService {
  runFullDiagnostic(): Promise<DiagnosticReport>
  identifyDataIssues(books: Book[]): DataIssue[]
  generateRepairPlan(issues: DataIssue[]): RepairPlan
  executeRepairPlan(plan: RepairPlan): Promise<RepairResult>
  createSampleData(): Promise<Book[]>
}
```

### 5. RealTimeSync

Manages real-time synchronization between data changes and UI updates.

```typescript
interface RealTimeSync {
  enableRealTimeSync(): void
  disableRealTimeSync(): void
  onDataChange(changeType: DataChangeType, data: any): void
  scheduleStatisticsUpdate(): void
  isUpdateInProgress(): boolean
}
```

## Data Models

### Enhanced ReadingSession

```typescript
interface ReadingSession {
  id: string                    // Required, auto-generated if missing
  date: string                  // YYYY-MM-DD format, validated and normalized
  pagesRead: number            // Converted from string if necessary
  durationMinutes: number      // Converted from string if necessary
  note?: string                // Optional
  bookId: string               // Required for association
  isValid: boolean             // Validation status
  validationErrors?: string[]  // List of validation issues
  correctedFields?: string[]   // Fields that were auto-corrected
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  correctedFields: string[]
  originalData: any
  correctedData: any
}
```

### DiagnosticReport

```typescript
interface DiagnosticReport {
  timestamp: string
  totalBooks: number
  totalSessions: number
  validSessions: number
  invalidSessions: number
  dataIssues: DataIssue[]
  repairRecommendations: RepairRecommendation[]
  statisticsStatus: StatisticsStatus
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all identified properties, several can be consolidated:
- Properties about session validation (2.1-2.4) can be combined into comprehensive validation properties
- Properties about statistics calculation (4.1-4.4) can be unified into robust calculation properties  
- Properties about real-time sync (5.1-5.3) can be merged into comprehensive sync properties

### Core Properties

**Property 1: Session Detection and Processing**
*For any* collection of books with reading sessions, the Statistics_System should detect and process all sessions that have valid dates and quantifiable data (pages > 0 OR duration > 0)
**Validates: Requirements 1.1, 1.2**

**Property 2: Automatic Data Correction**
*For any* reading session with structural inconsistencies (missing IDs, invalid date formats, string numbers, missing fields), the Session_Validator should automatically correct these issues and return a valid session structure
**Validates: Requirements 1.4, 2.1, 2.2, 2.3, 2.4**

**Property 3: Data Persistence Round Trip**
*For any* corrected session data, persisting to IndexedDB_Store and then retrieving should return the same corrected values
**Validates: Requirements 2.5**

**Property 4: Diagnostic Completeness**
*For any* data structure with inconsistencies, running diagnostics should identify all issues and provide corresponding repair recommendations
**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

**Property 5: Robust Statistics Calculation**
*For any* collection of reading sessions (including those with missing values, invalid dates, or zero values), the Statistics_Calculator should return consistent data structures and handle errors gracefully without crashing
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

**Property 6: Real-time Synchronization**
*For any* data change operation (add, modify, delete sessions), the Statistics_System should immediately reflect the changes in calculated metrics without requiring manual refresh
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

**Property 7: Navigation Validation Trigger**
*For any* navigation to the statistics tab, the system should validate all existing sessions before calculating metrics
**Validates: Requirements 1.3**

## Error Handling

### Error Categories

1. **Data Structure Errors**: Missing fields, wrong types, invalid formats
2. **Calculation Errors**: Division by zero, invalid operations, null references
3. **Storage Errors**: IndexedDB failures, quota exceeded, corruption
4. **Synchronization Errors**: Event handling failures, update conflicts

### Error Recovery Strategies

1. **Graceful Degradation**: Continue with partial data when possible
2. **Automatic Correction**: Fix common issues automatically
3. **Fallback Values**: Provide sensible defaults for missing data
4. **User Notification**: Inform users of issues and resolution steps
5. **Diagnostic Logging**: Detailed logging for debugging

### Error Boundaries

- Statistics calculation wrapped in try-catch with fallback metrics
- Data validation with automatic repair attempts
- UI components with error boundaries to prevent crashes
- Storage operations with retry mechanisms

## Testing Strategy

### Dual Testing Approach

The system will use both unit testing and property-based testing for comprehensive coverage:

**Unit Testing Requirements:**
- Test specific error scenarios and edge cases
- Verify integration between components
- Test diagnostic tool functionality
- Validate repair mechanisms

**Property-Based Testing Requirements:**
- Use fast-check library for JavaScript property-based testing
- Configure each property test to run minimum 100 iterations
- Each property test tagged with format: **Feature: reading-statistics-data-sync, Property {number}: {property_text}**
- Each correctness property implemented by a single property-based test
- Property tests verify universal behaviors across all valid inputs

**Testing Focus Areas:**
1. Data validation and correction across various input formats
2. Statistics calculation robustness with corrupted/partial data
3. Real-time synchronization under various change scenarios
4. Diagnostic accuracy across different data issue types
5. Error handling and recovery mechanisms

### Test Data Generation

Property-based tests will generate:
- Sessions with various date formats (valid/invalid)
- Sessions with mixed data types (strings/numbers)
- Sessions with missing or null fields
- Books with different session configurations
- Corrupted data structures for robustness testing

The testing strategy ensures that the system handles the full spectrum of real-world data scenarios while maintaining correctness and reliability.