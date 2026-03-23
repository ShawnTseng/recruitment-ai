# RecruitmentAI — Development Roadmap

> **Current Status**: Sprint 4 fully complete. SWA Linked Backend configured (frontend-backend communication fix), Manager Dashboard KPI/System Parameters/Talent Pool all implemented. Plugin unit tests (Moq) done. PII middleware live.  
> **Next Goal**: Application Insights alert rules, Rate Limiting, Evaluation Background Job.

---

## ✅ Completed (v0.1 — MVP Scaffold)

| Item | Description |
|---|---|
| Azure Infrastructure | 7 Bicep modules, East Asia, OpenAI in Japan East |
| .NET 10 Backend | 5 projects, 10 entities, Repository pattern, 6 SK Plugin scaffolds |
| React + Vite Frontend | Dashboard, SWA backend proxy |
| CI/CD | GitHub Actions — deploy-api + deploy-web |
| EF Core Migration | InitialCreate generated |

---

## ✅ Completed (v0.2 — Sprint 1 + Sprint 2 Core)

### Backend
| Task | Description | Status |
|---|---|---|
| DTO Layer | `JobDescriptionDtos`, `CandidateDtos`, `QuestionnaireDtos`, `SubmissionDtos` | ✅ |
| Repository Extensions | `IQuestionnaireRepository`, `IRecruiterRepository`, `IEvaluationReportRepository` + implementations | ✅ |
| Semantic Kernel Integration | Register `Kernel` in Program.cs, connect to Azure OpenAI GPT-4o | ✅ |
| `JdParserPlugin` | Azure OpenAI parses JD → structured JSON (skills, experience level, responsibilities) | ✅ |
| `QaGeneratorPlugin` | Generate 5–8 English technical questions from JD analysis, support resume personalization | ✅ |
| `AnswerEvaluatorPlugin` | 3-dimension scoring (Technical Depth / Specificity / Relevance), red flag detection | ✅ |
| `ReportGeneratorPlugin` | Stage 1 evaluation report + Stage 2 interview guide | ✅ |
| `BusinessValuePlugin` | Calculate time savings, cost savings, efficiency gains | ✅ |
| `FeedbackLoopPlugin` | Analyze client feedback patterns, suggest Prompt improvements | ✅ |
| JD Upload API | `POST /api/job-descriptions` + `/upload`, Blob Storage integration, file validation | ✅ |
| JD Parse API | `POST /api/job-descriptions/{id}/parse` — trigger AI parsing | ✅ |
| Questionnaire API | `POST /api/questionnaires/generate`, `GET`, `PUT` | ✅ |
| Candidate API | `POST /api/candidates`, `GET`, resume upload | ✅ |
| Token API | `POST /api/candidates/{id}/tokens` — one-time short-lived token generation | ✅ |
| Submission API | `GET/POST /api/submissions/by-token/{token}` — no login required, token validation | ✅ |
| Evaluation API | `POST /api/evaluations/evaluate/{submissionId}` — trigger AI evaluation | ✅ |

### Frontend
| Task | Description | Status |
|---|---|---|
| API Client Service | Full TypeScript API client (`services/api.ts`) | ✅ |
| Navigation Update | Add Recruiter Portal link to header, active state indicator | ✅ |
| Recruiter Dashboard | `/recruiter` — JD list, create JD link | ✅ |
| JD Create Page | `/recruiter/jd/new` — supports text input and file upload | ✅ |
| JD Detail Page | `/recruiter/jd/:id` — show parsed results, skill tags, one-click questionnaire generation | ✅ |
| Candidate Management | `/recruiter/candidates` — add candidate, generate questionnaire link | ✅ |
| Candidate Answer Page | `/candidate/:token` — standalone layout, no login required, AI consent declaration | ✅ |

---

## 🚀 Sprint 3 — Stage 2 Interview Assist + CI/CD Fix

**Goal**: Interviewer uses AI-generated question guide for technical interviews. Fix automated deployment pipeline.

### CI/CD Fix
| Task | Description | Status |
|---|---|---|
| Fix App Service runtime reset issue | Add `az webapp config set` step in `deploy-api.yml` to ensure `linuxFxVersion=DOTNETCORE\|10.0` before each deployment | ✅ |
| Fix `deploy-api.yml` publish step | Remove `--no-build` flag inconsistency | ✅ |
| Fix `deploy-web.yml` SWA deployment path | Correct `app_location/output_location` params to avoid SWA action double-build | ✅ |
| Add `deploy-infra.yml` | Trigger infrastructure deployment on Bicep IaC changes | ✅ |
| Configure GitHub Secrets | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `SQL_ADMIN_PASSWORD`, `AZURE_STATIC_WEB_APPS_API_TOKEN` | ✅ |

### Backend
| Task | Description | Status |
|---|---|---|
| Fix EvaluationsController | Correctly load Submission→Questionnaire→JD full chain, eliminate null errors | ✅ |
| `IInterviewGuideRepository` | New interface + `InterviewGuideRepository` implementation | ✅ |
| `IClientFeedbackRepository` | New interface + `ClientFeedbackRepository` implementation | ✅ |
| `ICandidateSubmissionRepository.GetByIdWithChainAsync` | Load full Submission with Questionnaire→JD→InterviewGuide chain | ✅ |
| `TokenResponse` add `SubmissionId` | Recruiter can navigate directly to report page after getting token | ✅ |
| `InterviewsController` | `POST /api/interviews/generate/{submissionId}` (Stage 2 guide) + `GET /api/interviews/{submissionId}` | ✅ |
| `FeedbackController` | `POST /api/feedback` + `GET /api/feedback?recruiterId=` (client feedback API) | ✅ |
| `SubmissionsController` GET by candidateId | `GET /api/submissions?candidateId=` (Recruiter-side query) | ✅ |
| Azure Entra ID integration | Add `[Authorize]` to all endpoints (except candidate endpoints); `AddMicrosoftIdentityWebApiAuthentication` integration | ❌ Removed (MVP — no login required) |

### Frontend
| Task | Description | Status |
|---|---|---|
| `RecruiterReportView` | `/recruiter/report/:submissionId` — AI scores, Technical Fit table, red flag questions, one-click Stage 2 guide generation | ✅ |
| `InterviewerPortal` | `/interviewer/:submissionId` — interview guide display, live ★ rating, note recording, contextual good/red-flag answers | ✅ |
| `CandidateList` add report link | Show "View Report→" link for submitted submissions | ✅ |
| MSAL Auth integration | Azure Entra ID SSO for Recruiter/Interviewer | ❌ Removed (MVP — no login required) |

---

## ✅ Completed (v0.4 — Sprint 4 Three-Role UX + HTTP 500 Fix)

### Infrastructure / DevOps
| Task | Description | Status |
|---|---|---|
| Key Vault RBAC setup | App Service Managed Identity granted `Key Vault Secrets User` role | ✅ |
| Blob Storage RBAC setup | App Service Managed Identity granted `Storage Blob Data Contributor` role | ✅ |
| Key Vault Secrets | `ConnectionStrings--DefaultConnection` + `BlobStorage--Endpoint` stored in Key Vault | ✅ |
| Disable Easy Auth | Disable App Service platform-level auth to avoid 401 interception | ✅ |
| Cleanup junk files | Remove publish/, publish2/, deploy*.zip, latest-logs/; update .gitignore | ✅ |

### Backend
| Task | Description | Status |
|---|---|---|
| Auto-migrate on startup | `db.Database.Migrate()` runs in Program.cs startup | ✅ |
| BlobServiceClient null safety | Does not crash when not configured, uses fallback with clear error | ✅ |
| AzureBlobStorageService | CreateIfNotExistsAsync, nullable client | ✅ |

### Frontend
| Task | Description | Status |
|---|---|---|
| Three-role UX redesign | Recruiter (`/recruiter`) / Interviewer (`/interviewer`) / Manager (`/manager`) separate pages | ✅ |
| RecruiterDashboard integration | Tab switching: Job Descriptions / Candidates (with questionnaire dropdown + Send Link) / Client Feedback | ✅ |
| InterviewerLanding | `/interviewer` — list all submitted candidates + Stage 1 scores, enter interview guide | ✅ |
| Manager Dashboard | `/manager` — system status + KPI board + Client Feedback table | ✅ |
| Layout navigation update | Three-role top navigation: Recruiter / Interviewer / Manager | ✅ |
| api.ts completion | Add `interviewApi`, `feedbackApi`, fix `submitAnswers` | ✅ |

---

## ✅ Completed (v0.5 — Sprint 4 Fully Done)

**Goal**: Business value quantification, Analytics, Talent Pool management.

| Task | Description | Status |
|---|---|---|
| SWA Linked Backend | Add linkedBackends in infra/main.bicep, fix frontend-backend cloud communication | ✅ |
| Dynamic CORS | webAppSettings injected with SWA hostname by Bicep, no more hardcoding | ✅ |
| Manager Dashboard KPI | `GET /api/manager/stats`, complete recruitment funnel metrics | ✅ |
| System Parameter Management | `GET/PUT/DELETE /api/system-parameters`, visual management in frontend | ✅ |
| Talent Pool | `GET /api/talent-pool` skill/score search, `PATCH` update skill tags | ✅ |
| Candidate.SkillTags | New field + EF migration (auto-applied on startup) | ✅ |
| PII protection middleware | `PiiSanitizerMiddleware` filters token paths (AppInsights v3.0 compatible) | ✅ |
| Plugin unit tests | JdParser/QaGenerator/AnswerEvaluator 3 tests each (Moq mock SK) | ✅ |

---

## 🔐 Cross-Sprint Essentials

| Task | When | Status |
|---|---|---|
| Azure Entra ID MSAL integration | Sprint 3 | ❌ Removed (MVP — no login required) |
| SQL Migration automation | Sprint 1 | ✅ |
| Application Insights alert setup | Sprint 3 | ⬜ |
| Security Review (OWASP Top 10) | Before end of Sprint 3 | ⬜ |
| CI/CD test fix | Skip Plugin tests requiring Azure OpenAI to prevent CI failures | ✅ |
| File upload validation (MIME + size) | Sprint 1 | ✅ |

---

## 🏗️ Technical Debt (Ongoing)

- [x] Plugin unit tests — JdParser / QaGenerator / AnswerEvaluator 3 tests each (happy path, empty input, adversarial)
- [ ] Integration tests with real Azure SQL
- [x] Candidate PII logging prevention (PiiSanitizerMiddleware — token URL redaction)
- [ ] Rate limiting on candidate submission endpoint
- [x] File upload validation (MIME type + size limit)
- [x] EvaluationsController improvement — load full Submission→Questionnaire→JD chain
- [ ] Evaluation trigger moved to Background Job / Queue
- [ ] InterviewerPortal — write interview scores back to EvaluationReport Stage 2
- [x] `[Authorize]` applied to all non-candidate endpoints

---

## Immediate Next Steps

1. **Application Insights Alerts** — Set up Azure Monitor alert rules (API 5xx rate, dependency failures)
2. **Rate Limiting** — Add rate limiting to candidate submission endpoint to prevent abuse
3. **Evaluation Background Job** — Move evaluation trigger to Azure Service Bus / Background Service Queue
4. **InterviewerPortal** — Write interview scores back to EvaluationReport Stage 2
5. **AI vs. Human Agreement Rate** — Track consistency between AI recommendations and final decisions
