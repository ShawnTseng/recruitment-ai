# 01 — 業務背景與使用者角色

## 公司核心業務

本公司核心業務為**協助企業（客戶）找到合適的工程師**。招募流程主要由印度端的招募人員推進，台灣端負責技術面試環節的支援。

本系統的目的：

- 提升篩選效率，讓招募人員在相同時間內處理更多候選人
- 降低因錯誤推薦造成的客戶滿意度損失
- 累積結構化候選人資料，建立長期差異化競爭優勢

---

## 使用者角色

| 角色 | 地點 | 主要職責 |
|---|---|---|
| **Recruiter（招募人員）** | 印度 | 蒐集履歷、上傳 JD、發送問卷、使用 AI Agent 評估候選人、安排各階段時程、向客戶收集 Feedback 並登錄系統 |
| **Technical Interviewer（技術面試官）** | 台灣 | 參考系統產出的 Technical Interview Guide，進行第二階段技術面試，填寫面試後評估報告 |
| **Manager（管理者）** | 台灣 / 遠端 | 監控整體招募數據與通過率、查看業務價值報表、調整系統參數與 Prompt 版本 |

---

## 多位招募人員架構

- 系統支援**多位 Recruiter 同時使用**，各自獨立維護自己的 JD、問卷範本與候選人資料
- 初期各 Recruiter 資料互相隔離，不可互見
- Manager 擁有跨所有 Recruiter 的全域報表可見性
- 架構設計需支援未來擴展為「共用問卷範本庫」或「跨 Recruiter 候選人可見性」

詳見 [02-core-design.md — 多 Recruiter 架構設計](02-core-design.md)

---

## 術語表

| 術語 | 說明 |
|---|---|
| **JD** | Job Description，職缺說明書。描述職位要求、技術棧與職責。 |
| **QA** | 本系統中指評估問卷（Questionnaire）。系統依 JD 自動生成。 |
| **Resume** | 候選人履歷，支援 `.docx` 或 `.pdf` 格式上傳。 |
| **Stage 1** | 書面問卷評估階段，由印度 Recruiter 推進。 |
| **Stage 2** | 技術面試階段，由台灣 Interviewer 執行。 |
| **Semantic Kernel (SK)** | Microsoft 開源的 AI 應用框架，用於協調 LLM 呼叫與插件。 |
| **Azure OpenAI** | Microsoft Azure 上的 OpenAI 服務，本系統使用 GPT-4o 模型。 |
| **ATS** | Applicant Tracking System（應徵者追蹤系統）。一種管理招募流程的商業軟體，如 Greenhouse、Workday、Lever。**本公司目前不使用任何 ATS；本系統即為主要的招募管理平台。** |
| **Feedback** | 客戶（企業端）對推薦人選的回覆。由 Recruiter 從客戶處收集後手動登錄至系統。 |
| **Talent Pool** | 人才庫。沉澱歷史候選人資料的長期儲存庫。 |
| **Rubric** | 評分標準。定義每個評估維度的評分依據。 |
| **Plugin** | Semantic Kernel 中的功能模組，每個 Plugin 封裝一個 AI 操作（如 JD 解析、問卷生成）。 |
