# Signatures repositories — Phase 1 (gel minimal)

*Interfaces cibles : le desktop refactorera progressivement les hooks vers ces façades ; le mobile annexe n’implémentera que la partie **Remote** (HTTP) alignée sur les mêmes contrats.*

## WorkoutRepository

**Implémenté (desktop)** : `src/services/workout/WorkoutRepositoryPhase1.js` ; `createWorkoutRepository('local' | 'memory')` — `LocalWorkoutRepository` / `MemoryWorkoutRepository` via `workoutDbGateway` + `workoutContextGateway`. Branché depuis `useWorkoutData` et `useWorkoutContextStorage` (voir `src/services/workout/README.md`).

- `loadAggregate(scopeKey: string): Promise<WorkoutAggregate | null>`
- `saveAggregate(scopeKey: string, data: WorkoutAggregate, opts?: { clientMutationId?: string }): Promise<void>`
- `loadProgramContext(scopeKey: string): Promise<ProgramContextSnapshot | null>`
- `saveProgramContext(scopeKey: string, snapshot: ProgramContextSnapshot, opts?: { clientMutationId?: string }): Promise<void>`

*`scopeKey` = `main` | `user-<id>` | `anonymous` (voir ADR-000).*

## XpRepository

**Implémenté (desktop)** : `src/services/xp/XpRepositoryPhase1.js` — méthodes `loadByUserId`, `save` ; `createXpRepository('local' | 'memory')`.

- `loadByUserId(userId: string): Promise<XpSnapshot | null>` *(équivalent cible `getSnapshot`)*
- `save(snapshot: XpSnapshot & { userId: string }, opts?: { clientMutationId?: string }): Promise<void>` *(équivalent cible `saveSnapshot`)*
- *(Phase 2+)* `appendEvents(userId: string, events: XpFact[], opts?: { clientMutationId?: string }): Promise<void>`

## FinanceRepository

**Phase 1 (état actuel)** : la persistance locale finance est **découpée par domaine** via passerelles IndexedDB testées (`syntheseDbGateway`, `financeDbGateway`, `budgetDbGateway`, `investissementsDbGateway`, `planificateurDbGateway`) et la classe historique `SyntheseStorage` ; ce découpage couvre le besoin migration / isolation I/O avant cloud.

**À aligner plus tard** (Phase 2 ou refactor fin Phase 1) : une **façade unique** derrière la signature cible ci-dessous, pour rapprocher le desktop du contrat `Remote` + tests mémoire homogènes comme Workout / Livres.

- `getPortfolioState(userId: string): Promise<PortfolioState | null>`
- `appendTransaction(userId: string, tx: FinanceTransaction, opts?: { clientMutationId?: string }): Promise<void>`
- *(autres agrégats selon modules budget / planificateur — à découper en sous-interfaces si besoin)*

**À part** : `src/services/finance/financeRepository.js` — snapshot HTTP optionnel (`VITE_USE_REMOTE_API_FINANCE`) ; ce n’est pas l’impl locale IndexedDB Phase 1.

## BooksRepository

**Implémenté (desktop)** : `src/services/books/BooksRepositoryPhase1.js` — `loadAll()`, `saveMerged(books[])` (merge multi-utilisateur conservé) ; `createBooksRepository('local' | 'memory')`. L’API historique `getAllBooksFromIndexedDB` / `saveBooksToIndexedDB` délègue au repo.

- *(Cible fine-grain)* `listBooks(userId: string): Promise<BookRecord[]>`
- *(Cible fine-grain)* `getBook(userId: string, id: string): Promise<BookRecord | null>`
- *(Cible fine-grain)* `upsertBook(userId: string, book: BookRecord, opts?: { clientMutationId?: string }): Promise<void>`

---

Les types `WorkoutAggregate`, `ProgramContextSnapshot`, etc. seront les **mêmes** Zod/TS que le package **contrats** partagé (ADR-003).
