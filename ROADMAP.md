# RecruitmentAI — Development Roadmap

> **當前狀態**: MVP 骨架已部署。Infrastructure、後端 API、前端 SPA 均在 Azure 上運行。  
> **下一目標**: Stage 1 核心篩選流程。

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

## 🚀 Sprint 1 — Stage 1 核心流程 (預計 2 週)

**目標**: Recruiter 可以上傳 JD，系統自動產生問卷，Candidate 可以填寫作答。

### Backend

| Task | 說明 | 難度 |
|---|---|---|
| `JdParserPlugin` 實作 | Azure OpenAI 解析 JD → 結構化 JSON | M |
| `QaGeneratorPlugin` 實作 | 從 JD 分析產生 10 個英文技術問題 | M |
| JD Upload API | `POST /api/job-descriptions`，上傳 PDF/DOCX 到 Blob Storage | S |
| EF Migration | 建立 Azure SQL schema（首次 `dotnet ef database update`） | S |
| Candidate Token API | `POST /api/candidates/{id}/tokens` — 一次性短效 token | M |
| Candidate Submission API | `POST /api/submissions/{token}` — 不需登入，token 驗證 | M |

### Frontend

| Task | 說明 | 難度 |
|---|---|---|
| Recruiter Portal | `/recruiter` — JD 管理、候選人列表 | M |
| JD Upload Form | 上傳 JD 檔案，觸發 QA 生成 | S |
| Candidate Questionnaire Page | `/candidate/:token` — 作答頁面，無需登入 | M |

### 前置作業

- **Azure Entra ID App Registration** — 為 Recruiter/Interviewer 登入建立 App Registration
- **EF Core Migration deploy** — 執行 `az webapp config appsettings set` 加入 DB connection string，或透過 Key Vault 取得
- **GitHub Secrets 設定** — `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_STATIC_WEB_APPS_API_TOKEN`

---

## 🔄 Sprint 2 — Stage 1 AI 評估 + 報告

**目標**: AI 自動評分作答，產生 Stage 1 評估報告。

| Task | 說明 |
|---|---|
| `AnswerEvaluatorPlugin` 實作 | GPT-4o 評分 3 個維度 (Technical Depth / Specificity / Relevance) |
| `ReportGeneratorPlugin` 實作 | 產生 Stage 1 PDF 報告 + Stage 2 Interview Guide |
| Evaluation Trigger | 作答提交後自動觸發評估（Background Job 或 Queue） |
| Report API | `GET /api/reports/{submissionId}` — 回傳評估結果 |
| Recruiter Dashboard | 顯示候選人評分、紅旗標記、快速通過/拒絕 |

---

## 🎯 Sprint 3 — Stage 2 面試輔助

**目標**: Interviewer 使用 AI 產生的問題指引進行技術面試。

| Task | 說明 |
|---|---|
| Stage 2 Interview Guide | 基於 Stage 1 報告產生個人化面試問題 |
| Calibration Loop | `FeedbackLoopPlugin` — Client 反饋 → 改進 Prompt |
| Interviewer Portal | `/interviewer/:submissionId` — 面試指南 + 即時評分記錄 |
| Live Note Taking | 面試中的即時筆記與 AI 建議追問 |

---

## 📊 Sprint 4 — Manager Dashboard + Talent Pool

**目標**: 商業價值量化、Analytics、人才庫管理。

| Task | 說明 |
|---|---|
| `BusinessValuePlugin` 實作 | 計算節省時間、品質指標 |
| Manager Dashboard | KPI 看板：篩選率、通過率、客戶滿意度 |
| System Parameter Management | 可調整 Rubric 權重、Prompt 版本管理 |
| Talent Pool | 歷史候選人 Profile，支援未來重新接觸 |

---

## 🔐 貫穿各 Sprint 的必做事項

| Task | 時機 |
|---|---|
| Azure Entra ID MSAL 整合 | Sprint 1 開始前 |
| SQL Migration 自動化 | Sprint 1 |
| Application Insights 告警設定 | Sprint 2 |
| Security Review (OWASP Top 10) | Sprint 2 結束前 |
| CI/CD secrets 設定 | Sprint 1 前置作業 |

---

## 🏗️ 技術債 (持續追蹤)

- [ ] Plugin 單元測試 — 每個 Plugin 至少 3 個測試 (happy path, empty input, adversarial)
- [ ] Integration tests with real Azure SQL
- [ ] Candidate PII logging prevention (Application Insights filter)
- [ ] Rate limiting on candidate submission endpoint
- [ ] File upload validation (MIME type + size limit)

---

## 立即下一步 (明天就可以開始)

1. **設定 GitHub Actions Secrets** — 在 GitHub repo 設定中加入 Azure credentials
2. **Azure Entra ID App Registration** — Microsoft Entra admin center 建立 App，設定 redirect URI
3. **第一次 EF Database Migration** — `az webapp config appsettings set` 加入 DB connection string，然後執行 migration
4. 開始 `JdParserPlugin` 實作 — 連接 Azure OpenAI GPT-4o
