# RecruitmentAI — Development Roadmap

> **當前狀態**: Sprint 3 全部完成。Azure Entra ID Auth 整合完畢（後端 `[Authorize]` + 前端 MSAL），CI/CD 自動部署流程已修復，Stage 2 面試指南 API 與前端頁面均已上線。  
> **下一目標**: Sprint 4 — Manager Dashboard + Talent Pool。

---

## ✅ 已完成 (v0.1 — MVP 骨架)

| 項目 | 說明 |
|---|---|
| Azure Infrastructure | 7 個 Bicep 模組，East Asia，OpenAI in Japan East |
| .NET 10 後端 | 5 個專案，10 個實體，Repository 模式，6 個 SK Plugin 骨架 |
| React + Vite 前端 | Dashboard，SWA 後端代理 |
| CI/CD | GitHub Actions — deploy-api + deploy-web |
| EF Core Migration | InitialCreate 已產生 |

---

## ✅ 已完成 (v0.2 — Sprint 1 + Sprint 2 核心)

### Backend
| Task | 說明 | 狀態 |
|---|---|---|
| DTO 層 | `JobDescriptionDtos`, `CandidateDtos`, `QuestionnaireDtos`, `SubmissionDtos` | ✅ |
| Repository 擴充 | `IQuestionnaireRepository`, `IRecruiterRepository`, `IEvaluationReportRepository` + 實作 | ✅ |
| Semantic Kernel 整合 | Program.cs 註冊 `Kernel`，連接 Azure OpenAI GPT-4o | ✅ |
| `JdParserPlugin` 實作 | Azure OpenAI 解析 JD → 結構化 JSON（技能、經驗等級、職責） | ✅ |
| `QaGeneratorPlugin` 實作 | 從 JD 分析產生 5-8 個英文技術問題，支援 Resume 個人化 | ✅ |
| `AnswerEvaluatorPlugin` 實作 | 3 維度評分 (Technical Depth / Specificity / Relevance)，紅旗偵測 | ✅ |
| `ReportGeneratorPlugin` 實作 | Stage 1 評估報告 + Stage 2 面試指南 | ✅ |
| `BusinessValuePlugin` 實作 | 計算節省時間、成本、效率增益 | ✅ |
| `FeedbackLoopPlugin` 實作 | 分析客戶反饋模式，建議 Prompt 改善 | ✅ |
| JD Upload API | `POST /api/job-descriptions` + `/upload`，Blob Storage 整合，檔案驗證 | ✅ |
| JD Parse API | `POST /api/job-descriptions/{id}/parse` — AI 解析觸發 | ✅ |
| Questionnaire API | `POST /api/questionnaires/generate`，`GET`，`PUT` | ✅ |
| Candidate API | `POST /api/candidates`，`GET`，Resume 上傳 | ✅ |
| Token API | `POST /api/candidates/{id}/tokens` — 一次性短效 token 產生 | ✅ |
| Submission API | `GET/POST /api/submissions/by-token/{token}` — 無需登入，token 驗證 | ✅ |
| Evaluation API | `POST /api/evaluations/evaluate/{submissionId}` — AI 評估觸發 | ✅ |

### Frontend
| Task | 說明 | 狀態 |
|---|---|---|
| API Client 服務 | 完整 TypeScript API client (`services/api.ts`) | ✅ |
| 導航更新 | Header 加入 Recruiter Portal 連結，active 狀態標記 | ✅ |
| Recruiter Dashboard | `/recruiter` — JD 列表、建立 JD 連結 | ✅ |
| JD 建立頁面 | `/recruiter/jd/new` — 支援文字輸入和檔案上傳 | ✅ |
| JD 詳細頁面 | `/recruiter/jd/:id` — 顯示解析結果、技能標籤、一鍵產生問卷 | ✅ |
| 候選人管理 | `/recruiter/candidates` — 新增候選人、產生問卷連結 | ✅ |
| 候選人作答頁面 | `/candidate/:token` — 獨立布局、無需登入、AI 同意聲明 | ✅ |

---

## 🚀 Sprint 3 — Stage 2 面試輔助 + CI/CD 修復

**目標**: Interviewer 使用 AI 產生的問題指引進行技術面試。修復自動部署流程。

### CI/CD 修復
| Task | 說明 | 狀態 |
|---|---|---|
| 修復 App Service 執行環境重設問題 | `deploy-api.yml` 加入 `az webapp config set` 步驟，確保每次部署前 `linuxFxVersion=DOTNETCORE\|10.0` | ✅ |
| 修復 `deploy-api.yml` publish 步驟 | 移除 `--no-build` 旗標不一致問題 | ✅ |
| 修復 `deploy-web.yml` SWA 部署路徑 | 修正 `app_location/output_location` 參數，避免 SWA action 重複建置 | ✅ |
| 新增 `deploy-infra.yml` | Bicep IaC 變更時觸發基礎設施部署 | ✅ |
| 設定 GitHub Secrets | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `SQL_ADMIN_PASSWORD`, `AZURE_STATIC_WEB_APPS_API_TOKEN` | ✅ |

### Backend
| Task | 說明 | 狀態 |
|---|---|---|
| 修復 EvaluationsController | 正確載入 Submission→Questionnaire→JD 完整鏈，消除 null 錯誤 | ✅ |
| `IInterviewGuideRepository` | 新介面 + `InterviewGuideRepository` 實作 | ✅ |
| `IClientFeedbackRepository` | 新介面 + `ClientFeedbackRepository` 實作 | ✅ |
| `ICandidateSubmissionRepository.GetByIdWithChainAsync` | 載入含 Questionnaire→JD→InterviewGuide 的完整 Submission | ✅ |
| `TokenResponse` 加入 `SubmissionId` | Recruiter 取得 Token 後可直接導向報告頁 | ✅ |
| `InterviewsController` | `POST /api/interviews/generate/{submissionId}` (Stage 2 指南) + `GET /api/interviews/{submissionId}` | ✅ |
| `FeedbackController` | `POST /api/feedback` + `GET /api/feedback?recruiterId=` (客戶反饋 API) | ✅ |
| `SubmissionsController` GET by candidateId | `GET /api/submissions?candidateId=` (Recruiter 側查詢) | ✅ |
| Azure Entra ID 整合 | `[Authorize]` 加入所有 endpoint（候選人 endpoint 除外）；`AddMicrosoftIdentityWebApiAuthentication` 整合 | ✅ |

### Frontend
| Task | 說明 | 狀態 |
|---|---|---|
| `RecruiterReportView` | `/recruiter/report/:submissionId` — AI 評分、Technical Fit 表格、紅旗問題、一鍵產生 Stage 2 指南 | ✅ |
| `InterviewerPortal` | `/interviewer/:submissionId` — 面試指南展示、即時 ★ 評分、Note 記錄、語境化 good/red-flag 答案 | ✅ |
| `CandidateList` 加入報告連結 | 已送出的 Submission 顯示「View Report→」連結 | ✅ |
| MSAL Auth 整合 | Azure Entra ID SSO for Recruiter/Interviewer；`@azure/msal-react` 整合、`AuthGuard`、token provider | ✅ |

---

## 📊 Sprint 4 — Manager Dashboard + Talent Pool

**目標**: 商業價值量化、Analytics、人才庫管理。

| Task | 說明 |
|---|---|
| Manager Dashboard | KPI 看板：篩選率、通過率、客戶滿意度 |
| System Parameter Management | 可調整 Rubric 權重、Prompt 版本管理 |
| Talent Pool | 歷史候選人 Profile，支援未來重新接觸 |

---

## 🔐 貫穿各 Sprint 的必做事項

| Task | 時機 | 狀態 |
|---|---|---|
| Azure Entra ID MSAL 整合 | Sprint 3 | ✅ |
| SQL Migration 自動化 | Sprint 1 | ✅ |
| Application Insights 告警設定 | Sprint 3 | ⬜ |
| Security Review (OWASP Top 10) | Sprint 3 結束前 | ⬜ |
| CI/CD secrets 設定 (GitHub Repo Settings) | Sprint 3 | ✅ |
| 檔案上傳驗證 (MIME + 大小) | Sprint 1 | ✅ |

---

## 🏗️ 技術債 (持續追蹤)

- [ ] Plugin 單元測試 — 每個 Plugin 至少 3 個測試 (happy path, empty input, adversarial)
- [ ] Integration tests with real Azure SQL
- [ ] Candidate PII logging prevention (Application Insights filter)
- [ ] Rate limiting on candidate submission endpoint
- [x] File upload validation (MIME type + size limit)
- [x] EvaluationsController 改善 — 載入完整 Submission→Questionnaire→JD 鏈
- [ ] Evaluation 觸發改用 Background Job / Queue
- [ ] InterviewerPortal — 面試分數回寫至 EvaluationReport Stage 2
- [x] `[Authorize]` 套用到所有非候選人 endpoint

---

## 立即下一步

1. **Manager Dashboard** — 開始 Sprint 4：KPI 看板（篩選率、通過率、客戶滿意度），`GET /api/manager/stats` API
2. **System Parameter Management** — Rubric 權重調整、Prompt 版本管理 UI
3. **Talent Pool** — 歷史候選人 Profile 頁面，支援未來重新接觸
4. **Application Insights 告警** — 設定異常偵測、PII 過濾排除 (候選人資料)
