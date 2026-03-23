# GitHub Copilot Instructions

## Project Overview

This is an **AI-powered recruitment screening system** for a company whose core business is **matching engineers to enterprise clients**. The system automates candidate evaluation across two interview stages using Semantic Kernel and Azure OpenAI.

- **Stage 1**: Written questionnaire evaluation (India Recruiter-driven, async)
- **Stage 2**: Technical interview guidance (Taiwan Interviewer-driven, live)
- **Manager**: Analytics, client feedback management, system parameter tuning

## Tech Stack

- **Backend**: ASP.NET Core Web API (.NET 10), Semantic Kernel
- **Frontend**: React + Vite (TypeScript) SPA
- **AI**: Azure OpenAI (GPT-4o) via Semantic Kernel Plugins
- **Database**: Azure SQL (Entity Framework Core)
- **File Storage**: Azure Blob Storage (JD / Resume / Interview Transcript uploads)
- **Auth**: Azure Entra ID (all internal users — Recruiter, Interviewer, Manager, Account Manager, Super Admin)
- **Hosting**: Azure App Service (API), Azure Static Web Apps (frontend)
- **IaC**: Bicep (modular, one module per Azure service)
- **Secrets**: Azure Key Vault (never hardcode secrets)
- **Monitoring**: Application Insights
- **CI/CD**: GitHub Actions

## Project Structure

```
├── infra/                          # Bicep IaC (one module per Azure service)
│   ├── main.bicep                  # Orchestrator
│   └── modules/                    # Individual resource modules
├── src/
│   ├── api/                        # .NET 10 Solution
│   │   ├── RecruitmentAI.Api/      # Web API (Controllers, DI, Middleware)
│   │   ├── RecruitmentAI.Core/     # Domain Models, Interfaces, DTOs
│   │   ├── RecruitmentAI.Infrastructure/ # EF Core, Repositories, Blob Service
│   │   ├── RecruitmentAI.Plugins/  # Semantic Kernel Plugins
│   │   └── RecruitmentAI.Tests/    # xUnit Tests
│   └── web/                        # React + Vite (TypeScript) Frontend
├── docs/                           # Specification documents (read-only)
└── .github/                        # Copilot instructions & CI/CD workflows
```

## Azure Resources

- **Static Web App**: `recai-web` (resource group: `rg-recruitment-ai`, region: East Asia)
- **SWA Deployment Token Secret**: GitHub Actions secret name = `AZURE_STATIC_WEB_APPS_API_TOKEN`
- To retrieve token: `az staticwebapp secrets list --name recai-web --resource-group rg-recruitment-ai --query "properties.apiKey" -o tsv`

## Domain Terminology

- **JD**: Job Description file uploaded by a Recruiter
- **QA**: AI-generated evaluation questionnaire based on the JD (all in English)
- **Stage 1**: Async written questionnaire screening (Recruiter collects answers, feeds to AI Agent)
- **Stage 2**: Live technical interview (Taiwan team); interview is recorded and transcript uploaded
- **Recruiter**: India-based user who manages candidates and questionnaires; each has an isolated workspace
- **Candidate**: Applicant whose answers are collected by Recruiter; candidates do NOT access this system
- **Technical Interviewer**: Taiwan-based engineer who conducts Stage 2 interviews
- **Account Manager**: Business person responsible for client relationship; can submit client feedback
- **Manager**: Oversees analytics, system parameters, and client feedback
- **Super Admin**: Full access to all features, pages, and workspaces
- **Talent Pool**: Long-term candidate profile database for future re-engagement
- **Rubric**: Scoring criteria per question (Technical Depth / Specificity / Relevance)
- **Client**: Enterprise client that a Recruiter creates JDs for; one Client has 1–N JDs; scoped to Recruiter workspace

## Semantic Kernel Plugins

All AI operations are encapsulated in SK plugins. Each plugin has one responsibility:

- `JdParserPlugin` — Parses JD to extract structured technical requirements
- `QaGeneratorPlugin` — Generates English questionnaire questions from JD analysis
- `AnswerEvaluatorPlugin` — Scores candidate answers against the Rubric, detects red flags
- `ReportGeneratorPlugin` — Generates Stage 1 Evaluation Report and Stage 2 Interview Guide
- `BusinessValuePlugin` — Calculates time-saving and quality metrics for Manager Dashboard
- `FeedbackLoopPlugin` — Analyzes client feedback patterns, suggests Prompt improvements

## Code Conventions

- Use `async/await` throughout; never use `.Result` or `.Wait()`
- Repository pattern for all data access; no direct `DbContext` usage in controllers
- Each SK Plugin is a separate class with a single `KernelFunction`-annotated method
- Multi-tenant isolation: always filter queries by `workspaceId` (Recruiter workspace); Super Admin bypasses this filter
- Use `[Authorize]` with Role-based access control on all API endpoints
- Access all secrets via `IConfiguration` backed by Azure Key Vault provider — never hardcode

## Auth & Identity Patterns

- JWT claims in use: `role`, `workspaceId`, `displayName`, `sub` (userId / AppUser.Id)
- Identity triangle: `AppUser.WorkspaceId == Recruiter.Id == Recruiter.WorkspaceId` — all three are the same GUID
- Controllers read `workspaceId` from JWT claims (`User.FindFirst("workspaceId")?.Value`); never accept it as a query/body param
- `ResolveRecruiterIdAsync()` pattern in controllers: look up Recruiter by workspaceId, auto-provision if missing (avoids FK violations on first use)
- Role-based nav in React: `roleNav` map in `Layout.tsx` defines visible nav per role; `RequireRole` component wraps all protected routes in `App.tsx`
- JD creation is text-only (`rawText` required); file upload intentionally removed

## Security Rules

- Never log PII (candidate emails, names, phone numbers) to Application Insights
- Validate file uploads: check MIME type, file extension, and size limit before processing
- All API responses must not expose internal IDs, stack traces, or connection strings
- `workspace_id` isolation must be enforced at the repository layer, not just the controller layer
- Super Admin role must be explicitly verified server-side; never trust client-provided role claims alone

## Testing Approach

- xUnit for all unit and integration tests
- Mock `Kernel` and `IChatCompletionService` for Plugin unit tests
- Integration tests use a real Azure SQL test database (not in-memory EF)
- Each Plugin must have at least: one happy path test, one edge case (empty input), one adversarial input test

## Specification Files

Key spec documents for reference during development:

- `docs/03-stage1-screening.md` — Stage 1 questionnaire flow and AI Agent
- `docs/04-stage2-interview.md` — Interview guide and calibration loop
- `docs/05-manager-dashboard.md` — Manager features and system parameters
- `docs/06-system-architecture.md` — Full architecture, DB schema, Azure services
