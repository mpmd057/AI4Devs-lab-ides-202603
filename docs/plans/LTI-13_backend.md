# Backend Implementation Plan: LTI-13 [API CANDIDATOS] Crear endpoint backend para registrar candidatos

## 1. Header

- **Ticket ID:** LTI-13
- **Title (Jira):** [API CANDIDATOS] Crear endpoint backend para registrar candidatos
- **Type:** Story (backend API endpoint + validation + persistence + error mapping)

## 2. Overview

This ticket implements candidate creation through a backend endpoint using DDD-aligned layering (Presentation, Application, Domain, Infrastructure) and the current Prisma schema for the Candidate aggregate. The implementation must validate required fields and payload shape, persist candidate plus optional nested records atomically, and return controlled/sanitized errors (no stack traces or internal details).

The API target is `POST /candidates` (as defined in `docs/api-spec.yml`) with success `201`, validation errors `400`, duplicate email conflict `409` (or equivalent project-standard client error), and sanitized `500` for unexpected failures.

## 3. Architecture Context

| Layer | Involvement |
|-------|-------------|
| **Presentation** | New candidate controller + route registration in Express app. |
| **Application** | New create-candidate service/use case + input validation orchestration. |
| **Domain** | Request/response contracts and domain errors for business/validation outcomes. |
| **Infrastructure** | Prisma repository for candidate create with nested writes and Prisma error translation. |

**Current codebase context**

- `backend/src/index.ts` currently contains only a root route and a generic 500 handler returning plain text.
- `backend/prisma/schema.prisma` already includes `Candidate`, `Education`, `WorkExperience`, and `Resume`.
- `backend/src/tests/candidate.prisma.integration.test.ts` already proves nested Prisma create and duplicate-email (`P2002`) at DB level.

**Files to create/update (planned)**

- `backend/src/index.ts` (wire JSON middleware, candidate routes, and shared error middleware).
- `backend/src/routes/candidateRoutes.ts`
- `backend/src/presentation/controllers/candidateController.ts`
- `backend/src/application/services/candidateService.ts`
- `backend/src/application/validator.ts` (or split candidate-specific validator module imported from here, preserving project convention).
- `backend/src/domain/errors/*.ts` (validation, duplicate email, internal error classes or equivalent centralized file).
- `backend/src/domain/types/candidate.ts` (request/response types; optional naming can be `candidate.types.ts`).
- `backend/src/infrastructure/repositories/candidateRepository.ts`
- `backend/src/middleware/errorHandler.ts` (if centralized middleware is preferred over inline error handling).
- `backend/src/tests/` new unit/integration tests for endpoint behavior.

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action:** Create and switch to backend-specific feature branch before coding.
- **Branch Naming (required):** `feature/LTI-13-backend`
- **Implementation Steps:**
  1. Checkout base branch (`main` or `develop` per team workflow).
  2. Pull latest changes: `git pull origin <base-branch>`.
  3. Create branch: `git checkout -b feature/LTI-13-backend`.
  4. Verify with `git branch`.
- **Notes:** Must be first step; follow `docs/backend-standards.mdc` Git workflow guidance.

---

### Step 1: Define candidate contracts and domain errors

- **Files:**  
  - `backend/src/domain/types/candidate.ts`  
  - `backend/src/domain/errors/candidateErrors.ts` (or existing shared error file if one already exists)
- **Action:** Create explicit types for create payload and response, and typed domain errors for deterministic HTTP mapping.
- **Function Signature (suggested):**
  - `type CreateCandidateInput = { firstName: string; lastName: string; email: string; phone?: string; address?: string; educations?: ...; workExperiences?: ...; cv?: ... }`
  - `class ValidationError extends Error { ... }`
  - `class DuplicateEmailError extends Error { ... }`
  - `class InternalServerError extends Error { ... }`
- **Implementation Steps:**
  1. Encode request shape to match `CreateCandidateRequest` from `docs/api-spec.yml`.
  2. Encode response shape to match `CreateCandidateResponse` (minimum id + identity fields, optionally consistent extra fields if project standard expects).
  3. Define domain/application error classes used by service/controller (avoid exposing Prisma errors directly to controller).
  4. Include optional nested contracts for `educations`, `workExperiences`, and `cv`.
- **Dependencies:** TypeScript types only.
- **Implementation Notes:** Keep names and messages in English per base standards.

---

### Step 2: Implement validation logic for create payload

- **File:** `backend/src/application/validator.ts` (or a dedicated `candidateValidator.ts` exported through this module)
- **Action:** Add schema/imperative validation for required fields, email format, max lengths, and optional nested object structure.
- **Function Signature (suggested):**
  - `export function validateCreateCandidateInput(input: unknown): CreateCandidateInput`
- **Implementation Steps:**
  1. Validate body is an object.
  2. Validate required `firstName`, `lastName`, `email` are non-empty strings.
  3. Validate email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/` or project-standard helper).
  4. Enforce max lengths from Prisma/data-model:
     - `firstName`, `lastName` <= 100
     - `email` <= 255
     - `phone` <= 15
     - `address` <= 100
     - nested `education.title` <= 250, `education.institution` <= 100
     - nested `workExperience.description` <= 200
     - `cv.filePath` <= 500, `cv.fileType` <= 50
  5. Validate optional arrays (`educations`, `workExperiences`) are arrays; validate each item structure and date fields.
  6. Validate optional `cv` object structure.
  7. Throw `ValidationError` with sanitized message/details.
- **Dependencies:** Domain types + validation errors.
- **Implementation Notes:** Keep validation before service/repository execution to prevent DB-level avoidable failures.

---

### Step 3: Implement Prisma repository create with nested atomic write

- **File:** `backend/src/infrastructure/repositories/candidateRepository.ts`
- **Action:** Add repository function to create candidate and optional nested entities in one Prisma create call.
- **Function Signature (suggested):**
  - `export async function createCandidate(data: CreateCandidateInput): Promise<CreateCandidateResponse>`
- **Implementation Steps:**
  1. Map `cv` input to Prisma `resumes.create` (single-entry array/object based on implementation preference).
  2. Map `educations` and `workExperiences` arrays to nested `create`.
  3. Use `prisma.candidate.create({ data, include: ... })` when needed for response shaping.
  4. Catch Prisma known errors:
     - `P2002` on `email` -> throw `DuplicateEmailError`.
  5. Re-throw unknown errors as `InternalServerError` (or let service wrap them).
  6. Return response aligned with `CreateCandidateResponse`.
- **Dependencies:** `@prisma/client`, exported Prisma client instance, domain types/errors.
- **Implementation Notes:** Keep repository focused on persistence and Prisma translation only.

---

### Step 4: Implement application service (use case orchestration)

- **File:** `backend/src/application/services/candidateService.ts`
- **Action:** Add create-candidate use case that orchestrates validation + repository call.
- **Function Signature (suggested):**
  - `export async function createCandidate(input: unknown): Promise<CreateCandidateResponse>`
- **Implementation Steps:**
  1. Validate input via `validateCreateCandidateInput`.
  2. Delegate persistence to repository `createCandidate`.
  3. Return normalized response contract.
  4. Preserve typed domain errors and avoid leaking low-level exceptions.
- **Dependencies:** validator + repository + domain errors/types.
- **Implementation Notes:** Service must not contain Express request/response concerns.

---

### Step 5: Implement controller and route for `POST /candidates`

- **Files:**  
  - `backend/src/presentation/controllers/candidateController.ts`  
  - `backend/src/routes/candidateRoutes.ts`
- **Action:** Expose HTTP endpoint and delegate to service.
- **Function Signature (suggested):**
  - `export async function postCandidate(req: Request, res: Response, next: NextFunction): Promise<void>`
- **Implementation Steps:**
  1. Create route module with `router.post('/candidates', postCandidate)`.
  2. In controller, call service with `req.body`.
  3. Return `res.status(201).json(result)` on success.
  4. Forward errors to shared error middleware using `next(error)`.
- **Dependencies:** Express, service module.
- **Implementation Notes:** Controller stays thin; no Prisma calls here.

---

### Step 6: Replace generic error handling with sanitized JSON error middleware

- **Files:**  
  - `backend/src/middleware/errorHandler.ts` (new)  
  - `backend/src/index.ts` (wire middleware)
- **Action:** Standardize error responses and prevent stack trace leakage.
- **Function Signature (suggested):**
  - `export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void`
- **Implementation Steps:**
  1. Map `ValidationError` -> `400`.
  2. Map `DuplicateEmailError` -> `409` (or project-approved equivalent).
  3. Map unknown/internal -> `500` with generic message.
  4. Ensure response shape is consistent with `ErrorResponse` style used by project docs.
  5. Remove/replace current plain-text `Something broke!` handler and avoid returning stack traces.
- **Dependencies:** domain errors.
- **Implementation Notes:** Logging can include internal context, but response payload must remain sanitized.

---

### Step 7: Wire app bootstrapping for JSON and candidate routes

- **File:** `backend/src/index.ts`
- **Action:** Register middleware and routes in correct order.
- **Implementation Steps:**
  1. Add `app.use(express.json())`.
  2. Mount candidate routes (e.g., `app.use('/api', candidateRoutes)` or direct `/candidates` according to existing API base path strategy).
  3. Keep root health/home route as needed.
  4. Register error middleware last.
- **Dependencies:** Express app and new route/middleware modules.
- **Implementation Notes:** Ticket acceptance allows `POST /api/candidates` or equivalent; keep final path aligned to `docs/api-spec.yml` and team convention.

---

### Step 8: Add unit tests (validator/service/controller/error mapping)

- **Files (suggested):**
  - `backend/src/tests/validator.createCandidate.test.ts`
  - `backend/src/tests/candidateService.test.ts`
  - `backend/src/tests/candidateController.test.ts`
  - `backend/src/tests/errorHandler.test.ts`
- **Action:** Cover happy path and failure categories required by ticket.
- **Implementation Steps:**
  1. **Validator tests:** required fields, invalid email, max-length violations, malformed nested payloads.
  2. **Service tests:** valid orchestration, duplicate email propagation, unknown error propagation.
  3. **Controller tests:** 201 success, forwarding errors to middleware.
  4. **Error handler tests:** 400/409/500 mapping and sanitized response body.
- **Dependencies:** Jest + mocks.
- **Implementation Notes:** Follow AAA pattern and descriptive naming from backend standards.

---

### Step 9: Add/update integration test for endpoint behavior

- **File:** `backend/src/tests/candidate.api.integration.test.ts` (new) and/or extend `candidate.prisma.integration.test.ts`
- **Action:** Verify HTTP endpoint behavior against DB test flow (`npm run test:integration`).
- **Implementation Steps:**
  1. Test create candidate with required fields only -> 201 + persisted row.
  2. Test create with nested `educations`, `workExperiences`, `cv` -> 201 + child rows persisted.
  3. Test invalid email -> 400.
  4. Test missing required fields -> 400.
  5. Test duplicate email -> controlled conflict status and sanitized body.
  6. Test forced repository failure -> sanitized 500.
- **Dependencies:** test DB config + integration harness.
- **Implementation Notes:** Keep integration tests gated by `RUN_DB_INTEGRATION=true` per current project pattern.

---

### Step N+1: Update Technical Documentation

- **Action:** Review and update technical documentation according to implementation outcomes.
- **Implementation Steps:**
  1. **Review Changes:** Confirm final route path and exact error status mapping.
  2. **Identify Documentation Files:**
     - `docs/api-spec.yml` (if status codes or schema details differ from current spec text).
     - `docs/data-model.md` only if validation/business constraints are materially changed.
     - `docs/backend-standards.mdc` only if conventions/process changed (unlikely).
  3. **Update Documentation:** Keep all updates in English with existing style.
  4. **Verify Documentation:** Ensure docs match actual runtime behavior and tests.
  5. **Report Updates:** Mention changed docs in PR description.
- **References:** `docs/documentation-standards.mdc`.
- **Notes:** Mandatory before marking ticket done.

## 5. Implementation Order

1. Step 0: Create branch `feature/LTI-13-backend`.
2. Step 1: Add domain contracts and typed errors.
3. Step 2: Implement create-candidate validator.
4. Step 3: Implement Prisma repository create + error translation.
5. Step 4: Implement application service orchestration.
6. Step 5: Implement controller + candidate route.
7. Step 6: Implement shared sanitized error handler.
8. Step 7: Wire middleware/routes in `index.ts`.
9. Step 8: Add unit tests for validator/service/controller/error mapping.
10. Step 9: Add endpoint integration tests.
11. Step N+1: Update docs to reflect final behavior.

## 6. Testing Checklist

- [ ] `POST /candidates` (or project base path equivalent) returns `201` for valid minimal payload.
- [ ] Valid nested payload persists candidate + educations + work experiences + resume atomically.
- [ ] Missing `firstName`, `lastName`, or `email` returns `400`.
- [ ] Invalid email format returns `400`.
- [ ] Length constraint violations return `400`.
- [ ] Duplicate email returns controlled conflict (`409` or agreed client error mapping).
- [ ] Unexpected repository/runtime failures return sanitized `500` (no stack/internal details).
- [ ] `npm test` passes.
- [ ] `npm run test:integration` passes in DB-enabled environment.

## 7. Error Response Format

Use consistent JSON error payloads and never expose internals.

```json
{
  "message": "Validation failed",
  "error": "VALIDATION_ERROR"
}
```

**HTTP mapping**

- `400`: Validation failures (required fields, malformed payload, invalid email, nested schema errors).
- `409`: Duplicate email conflict (Prisma `P2002` on candidate email).
- `500`: Unexpected errors with generic/sanitized message.

## 8. Partial Update Support

Not applicable for this ticket (create-only endpoint). No partial update semantics are required.

## 9. Dependencies

- Existing runtime dependencies: `express`, `@prisma/client`, `dotenv`.
- Existing dev/test dependencies: `jest`, `ts-jest`, integration DB setup.
- Running PostgreSQL instance for integration tests.

No new external library is strictly required; implement with existing stack unless team prefers schema-validator library introduction in a separate ticket.

## 10. Notes

- Keep all code/comments/messages in English even if Jira content is multilingual.
- Respect layered boundaries: controller -> service -> repository; no Prisma in controller/service.
- Keep endpoint path consistent with current API contract (`/candidates`) and existing base path conventions.
- Preserve security posture: never return stack traces, SQL details, file paths, or Prisma internals to API clients.

## 11. Next Steps After Implementation

- Add remaining candidate endpoints (`GET /candidates`, `GET /candidates/{id}`, update flow) in subsequent tickets.
- Reuse the same validation/error middleware strategy for consistency across candidate module.
- Consider introducing centralized request validation utility if similar logic appears across new endpoints.

## 12. Implementation Verification

- [ ] Branch name is `feature/LTI-13-backend`.
- [ ] Endpoint is reachable and returns correct status codes for all acceptance paths.
- [ ] Input validation covers required, format, length, and nested shape constraints.
- [ ] Prisma duplicate-email is translated to controlled API conflict response.
- [ ] Error responses are sanitized and consistent.
- [ ] Unit and integration tests cover happy path + all required failure categories.
- [ ] Documentation reflects actual implemented behavior.
