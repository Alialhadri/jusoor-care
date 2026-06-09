# Jusoor — Real Authentication & Secure Backend Plan

The demo login in this app is **front-end only** (role + name stored in the browser). It is perfect
for a controlled demo but provides **no real security**. To run a pilot with real physicians,
educators and coordinators, add a small backend. Here is a concrete, low-cost path.

## Why a backend is required
A static GitHub Pages site cannot:
- verify passwords securely (no server to check a hash),
- protect patient data behind a login (anyone can view page source),
- hold an API key safely (it would be exposed in the browser),
- keep an audit trail.

## Recommended architecture (pilot-grade)
1. **Identity provider** — use a managed auth service so you don't store raw passwords:
   - Options: **Microsoft Entra ID (Azure AD)** — ideal if the cluster already uses Microsoft 365;
     or **Auth0 / Supabase Auth / AWS Cognito**.
   - Roles via groups/claims: `physician`, `educator`, `coordinator`, `admin`.
   - Enforce **MFA** for clinical staff.
2. **Backend API** (Node/Express, .NET, or FastAPI) hosted on Azure/AWS in the **KSA region**
   (data residency). Responsibilities:
   - validate the auth token on every request,
   - serve patient data per role (least privilege),
   - **proxy all Claude calls** so the Anthropic key never reaches the browser,
   - write an **audit log** (who viewed/changed what, when).
3. **Database** — managed Postgres (Azure Database for PostgreSQL / AWS RDS) with encryption at rest;
   row-level security per centre/role. Replace the in-browser `PTS` array with API calls.
4. **Frontend** — keep this UI, but: redirect to login if no valid token; call the backend instead of
   `localStorage`; send the token on each request.

## Messaging & care-team threads
Move `teamMsgs` / referrals into the database with sender identity from the verified token, so the
physician/coordinator/educator communication is authenticated and audit-logged (not browser-local).

## Integration with Raqeem / NPHIES
The "Import from Raqeem" button is currently **simulated**. For a real pilot:
- integrate through the **NPHIES** FHIR APIs (Saudi national platform) on the backend,
- pull demographics/labs as a **nightly scheduled extract** first (Phase 1), then move to on-demand,
- run de-identification / consent checks server-side.
This keeps load off physicians/coordinators — data arrives pre-filled and verified.

## Compliance checklist (KSA)
- Data residency inside the Kingdom; align with **PDPL** (Personal Data Protection Law) and **NPHIES/SFDA** requirements.
- Encryption in transit (TLS) and at rest; secrets in a managed vault (Azure Key Vault / AWS Secrets Manager).
- Role-based access control + full audit logging; signed BAA-equivalent agreements with any cloud vendor.
- Clinical content (AI) is **decision-support only**, always human-reviewed before it reaches a chart.

## Suggested phasing
- **Phase 0 (now):** this demo — synthetic data, front-end role login, simulated Raqeem. For showcasing.
- **Phase 1:** managed auth + backend proxy for Claude + Postgres; nightly Raqeem extract; one PHC centre.
- **Phase 2:** real-time NPHIES, MFA, full audit, multi-centre rollout, RAG-grounded AI (see below).

## AI with RAG and minimal hallucination
- Model: **Claude 3.5 Sonnet** or **Claude Sonnet 4** via the backend proxy.
- **RAG**: embed a curated corpus (ADA Standards of Care, Saudi MoH/SFDA formulary, local protocols) in a
  vector store; retrieve top passages and require the model to **answer only from them, with citations**.
- Guardrails: low temperature, **JSON schema validation** of outputs, refuse-if-unsupported, and
  **human-in-the-loop** sign-off before any recommendation is actioned.
