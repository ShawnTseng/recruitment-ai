# RecruitmentAI — Development Roadmap

> **當前狀態**: Sprint 1 核心流程已完成。Recruiter 可上傳 JD、AI 解析並產生問卷，Candidate 可透過 Token 連結填寫作答，系統可觸發 AI 評估。  
> **下一目標**: Stage 2 面試輔助 + Auth 整合。

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

## 🚀 Sprint 3 — Stage 2 面試輔助 + Auth

**目標**: Interviewer 使用 AI 產生的問題指引進行技術面試。整合 Azure Entra ID 認證。

### Backend

| Task | 說明 | 難度 |
|---|---|---|
| Azure Entra ID 整合 | `[Authorize]` 加入所有 endpoint（候選人 endpoint 除外） | M |
| Stage 2 Interview Guide API | `POST /api/interviews/generate/{submissionId}` | M |
| Calibration Loop | `POST /api/feedback` — Client 反饋 API | S |
| InterviewGuide 自動產生 | 從 Stage 1 報告產生個人化面試問題 | M |

### Frontend

| Task | 說明 | 難度 |
|---|---|---|
| Interviewer Portal | `/interviewer/:submissionId` — 面試指南顯示 + 即時評分 | M |
| MSAL Auth 整合 | Azure Entra ID SSO for Recruiter/Interviewer | M |
| Recruiter 報告檢視 | 候選人評分、紅旗標記、快速通過/拒絕 | M |

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
| Azure Entra ID MSAL 整合 | Sprint 3 | ⬜ |
| SQL Migration 自動化 | Sprint 1 | ✅ |
| Application Insights 告警設定 | Sprint 3 | ⬜ |
| Security Review (OWASP Top 10) | Sprint 3 結束前 | ⬜ |
| CI/CD secrets 設定 | Sprint 1 前置作業 | ⬜ |
| 檔案上傳驗證 (MIME + 大小) | Sprint 1 | ✅ |

---

## 🏗️ 技術債 (持續追蹤)

- [ ] Plugin 單元測試 — 每個 Plugin 至少 3 個測試 (happy path, empty input, adversarial)
- [ ] Integration tests with real Azure SQL
- [ ] Candidate PII logging prevention (Application Insights filter)
- [ ] Rate limiting on candidate submission endpoint
- [x] File upload validation (MIME type + size limit)
- [ ] EvaluationsController 改善 — 載入完整 Submission→Questionnaire→JD 鏈
- [ ] Evaluation 觸發改用 Background Job / Queue

---

## 立即下一步

1. **設定 GitHub Actions Secrets** — 在 GitHub repo 設定中加入 Azure credentials
2. **Azure Entra ID App Registration** — 為 Recruiter/Interviewer 登入建立 App
3. **部署測試** — `dotnet publish` + CI/CD 推送到 Azure App Service
4. **Interviewer Portal** — 開始 Stage 2 面試輔助前端頁面
