# GitHub Copilot Instructions

## Project Overview

This is an **AI-powered recruitment screening system** for a company whose core business is **matching engineers to enterprise clients**. The system automates candidate evaluation across two interview stages using Semantic Kernel and Azure OpenAI.

- **Stage 1**: Written questionnaire evaluation (India Recruiter-driven, async)
- **Stage 2**: Technical interview guidance (Taiwan Interviewer-driven, live)
- **Manager**: Analytics, client feedback management, system parameter tuning

## Tech Stack

- **Backend**: ASP.NET Core Web API (.NET 8+), Semantic Kernel
- **Frontend**: React + Vite (TypeScript) SPA
- **AI**: Azure OpenAI (GPT-4o) via Semantic Kernel Plugins
- **Database**: Azure SQL (Entity Framework Core)
- **File Storage**: Azure Blob Storage (JD / Resume uploads)
- **Auth**: Azure Entra ID (internal users), short-lived Token links (candidates — no login)
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
│   ├── api/                        # .NET 8 Solution
│   │   ├── RecruitmentAI.Api/      # Web API (Controllers, DI, Middleware)
│   │   ├── RecruitmentAI.Core/     # Domain Models, Interfaces, DTOs
│   │   ├── RecruitmentAI.Infrastructure/ # EF Core, Repositories, Blob Service
│   │   ├── RecruitmentAI.Plugins/  # Semantic Kernel Plugins
│   │   └── RecruitmentAI.Tests/    # xUnit Tests
│   └── web/                        # React + Vite (TypeScript) Frontend
├── docs/                           # Specification documents (read-only)
└── .github/                        # Copilot instructions & CI/CD workflows
```

## Domain Terminology

- **JD**: Job Description file uploaded by a Recruiter
- **QA**: AI-generated evaluation questionnaire based on the JD (all in English)
- **Stage 1**: Async written questionnaire screening
- **Stage 2**: Live technical interview (Taiwan team)
- **Recruiter**: India-based user who manages candidates and questionnaires; each has an isolated workspace
- **Candidate**: Applicant who submits written answers via a token link (no account needed)
- **Technical Interviewer**: Taiwan-based engineer who conducts Stage 2 interviews
- **Manager**: Oversees analytics, system parameters, and client feedback
- **Talent Pool**: Long-term candidate profile database for future re-engagement
- **Rubric**: Scoring criteria per question (Technical Depth / Specificity / Relevance)

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
- Multi-tenant isolation: always filter queries by `workspaceId` (Recruiter workspace)
- Use `[Authorize]` on all API endpoints except the candidate answer submission endpoint (which uses token validation)
- Access all secrets via `IConfiguration` backed by Azure Key Vault provider — never hardcode

## Security Rules

- Never log PII (candidate emails, names, phone numbers) to Application Insights
- Validate file uploads: check MIME type, file extension, and size limit before processing
- Candidate token links must be short-lived (configurable expiry) and single-use
- All API responses must not expose internal IDs, stack traces, or connection strings
- `workspace_id` isolation must be enforced at the repository layer, not just the controller layer

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
