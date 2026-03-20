# 04 — 第二階段：技術面試（Stage 2）

## 說明

第二階段由**台灣技術面試官**負責，形式為線上面試（視訊）。系統不取代面試，而是提供結構化的引導報告，協助面試官聚焦高價值問題。

---

## Technical Interview Guide

Stage 1 通過後，系統自動生成給台灣面試官的引導報告：

| 項目 | 內容 |
|---|---|
| **Candidate Summary** | 候選人背景摘要，來自履歷與 Stage 1 回答 |
| **Confirmed Strengths** | Stage 1 中驗證的技術優勢領域 |
| **Areas to Probe** | Stage 1 中回答模糊或邊界的技術面向，需深入確認 |
| **Suggested Interview Questions** | 依 Red Flags 自動生成的 3–5 道追問題目 |
| **JD Coverage Map** | 逐條 JD 要求：Confirmed / Needs Verification / Not Addressed |
| **Stage 1 AI Confidence Score** | AI 判斷回答為真實經驗的信心分數（0–100） |

報告可匯出為 **PDF**，於面試前寄送給面試官。

---

## 面試後評估報告（Stage 2 Evaluation Report）

技術面試結束後，面試官在系統中填寫結構化回饋表單，系統生成 **Stage 2 Report**：

| 項目 | 內容 |
|---|---|
| **Live Technical Assessment** | 面試中確認的技術深度與廣度 |
| **Stage 1 vs Stage 2 Calibration** | AI Stage 1 評估與實際面試結果比較（用於持續改善 AI 準確率） |
| **Cultural / Working Style Fit** | 面試官對候選人溝通能力、態度的主觀評估 |
| **Final Recommendation** | Hire / Pass to Client / Reject，附理由說明 |
| **Client-Facing Summary** | AI 依報告草稿生成的英文候選人摘要，供 Recruiter 向客戶呈現 |

---

## AI 準確率校準迴路

Stage 2 結果自動回饋至系統，用於持續改善 Stage 1 AI 的評估品質：

```mermaid
flowchart LR
    A["Stage 2 Outcome\nHire / Reject"] --> B["Compare with Stage 1 AI\nrecommendation"]
    B --> C{Match?}
    C -->|Yes| D["Confirm current rubric\nweights are effective"]
    C -->|No| E["Flag as calibration case\nfor Manager review"]
    E --> F["Adjust Rubric weights\nor Prompt version"]
    F --> G["Apply to future\nStage 1 evaluations"]
```

> 此迴路讓 AI 評估準確率隨時間持續提升。

---

## 客戶 Feedback 連結

候選人通過 Stage 2 並推薦給客戶後，Recruiter 從客戶處收集回饋並登錄系統：

- **Hired**：記錄客戶對候選人的正向評價，標記哪些 JD 要求確實是關鍵指標
- **Rejected at Client**：記錄拒絕原因（結構化標籤 + 自由文字），回饋至 Stage 1 評估標準調整

詳見 [05-manager-dashboard.md — 客戶 Feedback 管理](05-manager-dashboard.md)
