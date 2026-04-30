# Backend Implementation Plan: LTI-11 [MODELO CANDIDATO] Definir estructura de datos del candidato

## 1. Header

- **Ticket ID:** LTI-11
- **Title (Jira):** [MODELO CANDIDATO] Definir estructura de datos del candidato
- **Type:** Story (data model / Prisma schema)

## 2. Overview

This ticket delivers a **PostgreSQL data model** for the recruitment **Candidate** aggregate using **Prisma**, aligned with `docs/data-model.md` and `docs/api-spec.yml`. The work is **schema and migration focused** (no REST handlers in scope unless explicitly extended). Architecture follows **DDD**: persistence is defined at the infrastructure boundary; future domain entities and services will map to these tables.

**Product decision (from Jira):** `email` uniquely identifies a candidate → **`@unique` on `email`** is mandatory.

**Scope boundary:** The conceptual model includes `Application` linking `Candidate` to `Position` and `InterviewStep`. Those parent tables **do not exist yet** in `schema.prisma`. **Recommended approach for LTI-11:** ship `Candidate`, `Education`, `WorkExperience`, and `Resume` only; add `Application` (and its FK targets) in a follow-up ticket once `Position` / `InterviewStep` (or minimal stubs) exist—avoids invalid FKs or nullable foreign keys that break referential integrity. If the team prefers strict parity with `data-model.md` ERD in one PR, they must either introduce minimal `Position` + `InterviewStep` models or agree an exception in the PR description.

## 3. Architecture Context

| Layer | Involvement |
|-------|-------------|
| **Domain** | Not implemented in this ticket; future `Candidate` class will reflect Prisma types. |
| **Application** | Not in scope (no services/controllers). |
| **Presentation** | Not in scope. |
| **Infrastructure** | **Primary:** `backend/prisma/schema.prisma`, generated client, migrations under `backend/prisma/migrations/`. |

**Referenced files**

- `backend/prisma/schema.prisma` — add models; keep existing `User` model.
- `backend/prisma/migrations/*` — new migration from `prisma migrate dev`.
- `docs/data-model.md` — align field names, lengths, relationships; add implementation note for `Application` deferral if chosen.
- `docs/api-spec.yml` — align `Resume` schema with persisted `uploadDate` (see Step N+1).

**Current state:** `backend/src/index.ts` exports `PrismaClient` usage inline; no layered `src/domain` tree yet. Tests live under `backend/src/tests/`.

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action:** Create and switch to a dedicated backend feature branch before any code changes.
- **Branch naming (required):** `feature/LTI-11-backend`  
  Use this suffix pattern so backend work does not collide with a generic `feature/LTI-11` branch.
- **Implementation steps:**
  1. Ensure you are on the correct base branch (`main` or `develop`, per team convention).
  2. `git pull origin <base-branch>`
  3. `git checkout -b feature/LTI-11-backend`
  4. `git branch` to verify.
- **Notes:** See `docs/backend-standards.mdc` → **Development Workflow** → **Git Workflow** (feature branches with `-backend` suffix).

---

### Step 1: Extend Prisma schema — `Candidate` and related models

- **File:** `backend/prisma/schema.prisma`
- **Action:** Add models for the candidate aggregate (and optional `@@map` for SQL table names).

**Suggested Prisma definitions (adjust only if product disagrees):**

```prisma
// Example structure — implement with exact @db lengths and @@map as needed

model Candidate {
  id        Int      @id @default(autoincrement())
  firstName String   @db.VarChar(100)
  lastName  String   @db.VarChar(100)
  email     String   @unique @db.VarChar(255)
  phone     String?  @db.VarChar(15)
  address   String?  @db.VarChar(100)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  educations       Education[]
  workExperiences  WorkExperience[]
  resumes          Resume[]

  @@map("candidates")
}

model Education {
  id           Int       @id @default(autoincrement())
  candidateId  Int
  institution  String    @db.VarChar(100)
  title        String    @db.VarChar(250)
  startDate    DateTime
  endDate      DateTime?

  candidate Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([candidateId])
  @@map("educations")
}

model WorkExperience {
  id          Int       @id @default(autoincrement())
  candidateId Int
  company     String    @db.VarChar(100)
  position    String    @db.VarChar(100)
  description String?   @db.VarChar(200)
  startDate   DateTime
  endDate     DateTime?

  candidate Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([candidateId])
  @@map("work_experiences")
}

model Resume {
  id          Int      @id @default(autoincrement())
  candidateId Int
  filePath    String   @db.VarChar(500)
  fileType    String   @db.VarChar(50)
  uploadDate  DateTime @default(now())

  candidate Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@index([candidateId])
  @@map("resumes")
}
```

**Implementation steps:**

1. Add `Candidate` with all acceptance fields and `createdAt` / `updatedAt`.
2. Add `Education`, `WorkExperience`, `Resume` with FK `candidateId` → `Candidate.id`.
3. Use **`onDelete: Cascade`** on child relations so deleting a candidate removes dependent rows (aligns with “candidate owns profile data”; revisit when `Application` exists—may require `Restrict` on application side later).
4. Use `@db.VarChar(n)` to mirror documented max lengths.
5. Keep `User` model unchanged unless a deliberate merge is approved.

**Dependencies:** None beyond Prisma.

**Implementation notes:**

- **Uniqueness:** `email` → `@unique` (satisfies AC and supports lookup by identifier).
- **“Máximo 3 educaciones”:** enforce in domain/API in later stories; optionally document DB-level options (trigger/check) as out of scope for LTI-11.
- **PII:** do not log `email`, `phone`, or `address` in plaintext in production logging (future middleware/services).
- **`Application`:** if deferred, do **not** add `applications` relation on `Candidate` in Prisma until `Application` model exists.

---

### Step 2: Generate and apply migration

- **Files:** `backend/prisma/migrations/<timestamp>_*/migration.sql` (generated)
- **Action:** Create a named migration and apply it against local/Docker PostgreSQL.

**Implementation steps:**

1. Ensure `DATABASE_URL` in `backend/.env` points at the dev database (e.g. Docker Compose Postgres).
2. From `backend/`: `npx prisma migrate dev --name add_candidate_aggregate`
3. Run `npx prisma generate` and confirm no client generation errors.
4. Inspect the generated SQL for FKs, cascades, and unique index on `email`.

**Dependencies:** Running Postgres instance.

**Implementation notes:** Use `prisma migrate deploy` in CI/staging per `docs/backend-standards.mdc`.

---

### Step 3: Automated verification (TDD-aligned)

- **Files (choose one consistent pattern):**
  - **Option A (recommended):** `backend/src/tests/candidate.prisma.integration.test.ts` — integration test against real DB (uses `DATABASE_URL`; isolate with transaction rollback or dedicated test DB).
  - **Option B:** Small script under `backend/scripts/` invoked from `npm run test:db` if the team prefers not to run integration tests in default `npm test`.

**Action:** Add at least one automated check proving the schema works.

**Function signatures (conceptual):**

- Test suite: `describe('Candidate Prisma schema', () => { ... })`
- No new exported application functions required for this ticket.

**Implementation steps:**

1. **Successful case:** `prisma.candidate.create` with nested `educations`, `workExperiences`, `resumes` (one row each); assert returned shape and relations.
2. **Uniqueness error:** second `create` with same `email` → expect Prisma error code **`P2002`** (unique constraint).
3. **Cascade (optional but valuable):** create candidate with children, `delete` candidate, assert children removed.

**Dependencies:** `@prisma/client`, Jest, `ts-jest`; ensure test teardown disconnects `prisma.$disconnect()`.

**Implementation notes:**

- Per `docs/base-standards.mdc`, prefer a failing test or explicit verification step before considering the migration final.
- If CI has no Postgres, gate integration tests with `describe.skip` + documented env var (e.g. `RUN_DB_INTEGRATION=true`) **only if** the team standard allows; otherwise ensure CI provides a DB service.

---

### Step 4: No routes or controllers (explicit non-scope)

- **Action:** Do **not** add `GET/POST /candidates` in this ticket unless the ticket scope is formally expanded. Jira states endpoints are reference-only for this story.

---

### Step N+1: Update technical documentation

- **Action:** Keep docs consistent with the persisted model.

**Implementation steps:**

1. **`docs/data-model.md`**
   - Add a short **“Prisma implementation (LTI-11)”** subsection: table names (`candidates`, etc.), confirmation of `uploadDate` on `Resume`, audit fields on `Candidate`.
   - If `Application` is deferred: state that `applications` relation will be added when `Application` and referenced entities exist in Prisma.
2. **`docs/api-spec.yml`**
   - Extend **`Resume`** (and `CreateResumeResponse` if present) with `uploadDate` (`string`, `format: date-time`) so OpenAPI matches the database and `data-model.md`.
3. **`docs/backend-standards.mdc`** — update only if migration workflow or naming conventions change (unlikely).

**References:** `docs/documentation-standards.mdc` — technical docs in **English**.

**Notes:** Mandatory before marking the ticket done.

## 5. Implementation Order

1. Step 0: Create feature branch `feature/LTI-11-backend`
2. Step 1: Prisma schema (`Candidate`, `Education`, `WorkExperience`, `Resume`)
3. Step 2: Migration + `prisma generate`
4. Step 3: Automated verification (integration or agreed alternative)
5. Step N+1: Documentation (`data-model.md`, `api-spec.yml`)

## 6. Testing Checklist

- [ ] `npx prisma validate` succeeds
- [ ] `npx prisma migrate dev` applies cleanly on a fresh DB
- [ ] `npx prisma generate` succeeds
- [ ] Integration (or scripted) test: create candidate with nested rows succeeds
- [ ] Duplicate `email` insert fails with `P2002`
- [ ] (Optional) Cascade delete removes child rows
- [ ] Existing `npm test` still passes (update or scope tests if integration is opt-in)
- [ ] No plaintext PII in new log statements

## 7. Error Response Format

This ticket does **not** expose new HTTP endpoints. When future candidate APIs are implemented, use the project standard:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

**Prisma → HTTP mapping (for future CRUD):**

| Situation | HTTP | Code / notes |
|-----------|------|----------------|
| Validation / bad input | 400 | `VALIDATION_ERROR` |
| Candidate not found | 404 | `NOT_FOUND` |
| Duplicate email (`P2002` on `email`) | 409 | e.g. `CONFLICT` or `DUPLICATE_EMAIL` (align with API spec when added) |
| Unexpected DB / server failure | 500 | generic server error, no sensitive details |

## 8. Partial Update Support

**Not applicable** for LTI-11 (schema-only). Future `PATCH` candidate endpoints should document merge semantics per `docs/api-spec.yml` and validators.

## 9. Dependencies

- **PostgreSQL** (e.g. via project `docker-compose.yml`)
- **Prisma CLI** and `@prisma/client` (already in `backend/package.json`)
- **Node.js** for `prisma migrate` / Jest

## 10. Notes

- **Language:** User-facing ticket text may be Spanish; **code comments, migration names, and technical documentation** follow project rules (**English**).
- **Acceptance criteria mapping:** AC1–AC6 are satisfied by Prisma models + migration + docs + automated proof of uniqueness and nested create.
- **`User` vs `Candidate`:** separate concepts; do not merge without an explicit product decision.
- **Security:** Treat email, phone, and address as PII in future logging and API responses.

## 11. Next Steps After Implementation

- Implement candidate REST handlers and DDD layers (`src/domain`, `src/application`, `src/presentation`) in dependent stories.
- Add `Application` (and `Position`, `InterviewStep`, …) when recruitment flow schema is ticketed.
- Consider composite index `(lastName, firstName)` for list endpoints when implemented.

## 12. Implementation Verification

- [ ] Branch is `feature/LTI-11-backend`
- [ ] Schema matches `docs/data-model.md` field list and lengths for entities in scope
- [ ] `email` unique constraint present in SQL migration
- [ ] Documentation updated (`data-model.md`, `api-spec.yml` for `uploadDate`)
- [ ] Automated test(s) cover happy path + duplicate email
- [ ] No unrelated refactors in `backend/src/index.ts` unless required for test harness
- [ ] Code quality: `npm run build` / ESLint as per team CI
